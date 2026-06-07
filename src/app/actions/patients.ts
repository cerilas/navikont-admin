'use server'

import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function invitePatientToApp(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const journeyId = formData.get('journeyId')?.toString();
  const fullName = formData.get('fullName')?.toString();
  const email = formData.get('email')?.toString();

  if (!appId || !fullName || !email) {
    return { error: 'Lütfen zorunlu alanları doldurun (Ad Soyad, E-posta).' };
  }

  try {
    // 1. Get the latest app_version_id for this app
    const versionRes = await db.query(`
      SELECT id FROM content_app_versions WHERE app_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [appId]);
    
    if (versionRes.rows.length === 0) {
      return { error: 'Bu uygulama için yayınlanmış bir versiyon bulunamadı.' };
    }
    const appVersionId = versionRes.rows[0].id;

    // 2. Check if user exists in core_users
    const userRes = await db.query(`SELECT id FROM core_users WHERE email = $1`, [email]);
    let patientUserId = '';

    if (userRes.rows.length > 0) {
      patientUserId = userRes.rows[0].id;
    } else {
      // Create new user
      patientUserId = crypto.randomUUID();
      // Generate a random temp password hash since they are invited
      const tempHash = await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10);
      
      await db.query(`
        INSERT INTO core_users (id, email, full_name, user_type, status, password_hash)
        VALUES ($1, $2, $3, 'patient', 'invited', $4)
      `, [patientUserId, email, fullName, tempHash]);
    }

    // 3. Check if patient is already enrolled in this app
    const checkEnrollment = await db.query(`
      SELECT id FROM patient_app_enrollments 
      WHERE patient_user_id = $1 AND app_id = $2 AND status IN ('invited', 'active', 'paused')
    `, [patientUserId, appId]);

    if (checkEnrollment.rows.length > 0) {
      return { error: 'Bu hasta zaten bu uygulamaya kayıtlı veya davet edilmiş.' };
    }

    // 4. Create enrollment
    const enrollmentId = crypto.randomUUID();
    await db.query(`
      INSERT INTO patient_app_enrollments 
      (id, patient_user_id, app_id, app_version_id, journey_id, status, start_date)
      VALUES ($1, $2, $3, $4, $5, 'invited', CURRENT_DATE)
    `, [enrollmentId, patientUserId, appId, appVersionId, journeyId || null]);

    return { success: true, message: 'Hasta başarıyla davet edildi.' };
  } catch (err: any) {
    console.error('Error inviting patient:', err);
    return { error: 'Hasta eklenirken bir hata oluştu.' };
  }
}

export async function updateEnrollmentStatus(enrollmentId: string, status: string) {
  try {
    await db.query(`UPDATE patient_app_enrollments SET status = $1, updated_at = NOW() WHERE id = $2`, [status, enrollmentId]);
    return { success: true };
  } catch (err: any) {
    console.error('Error updating status:', err);
    return { error: 'Durum güncellenirken bir hata oluştu.' };
  }
}

export async function updatePatientProfile(prevState: any, formData: FormData) {
  const userId = formData.get('user_id')?.toString();
  const enrollmentId = formData.get('enrollment_id')?.toString();
  
  if (!userId || !enrollmentId) return { error: 'Gerekli ID bilgileri eksik.' };

  // Core Users data
  const fullName = formData.get('full_name')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  
  // Enrollment data
  const journeyId = formData.get('journey_id')?.toString() || null;
  const startDate = formData.get('start_date')?.toString();

  // Profile data
  const birthDate = formData.get('birth_date')?.toString() || null;
  const gender = formData.get('gender')?.toString() || null;
  const heightCm = formData.get('height_cm') ? parseFloat(formData.get('height_cm') as string) : null;
  const weightKg = formData.get('weight_kg') ? parseFloat(formData.get('weight_kg') as string) : null;
  const bloodType = formData.get('blood_type')?.toString() || null;

  if (!fullName || !startDate) {
    return { error: 'Lütfen zorunlu alanları (Ad Soyad, Başlangıç Tarihi) doldurun.' };
  }

  try {
    await db.query('BEGIN');

    // 1. Update core_users
    await db.query(`
      UPDATE core_users 
      SET full_name = $1, phone = $2, updated_at = NOW() 
      WHERE id = $3
    `, [fullName, phone, userId]);

    // 2. Update patient_app_enrollments
    await db.query(`
      UPDATE patient_app_enrollments 
      SET journey_id = $1, start_date = $2, updated_at = NOW() 
      WHERE id = $3
    `, [journeyId, startDate, enrollmentId]);

    // 3. Upsert patient_profiles
    const profileRes = await db.query(`SELECT id FROM patient_profiles WHERE user_id = $1`, [userId]);
    
    if (profileRes.rows.length > 0) {
      await db.query(`
        UPDATE patient_profiles 
        SET birth_date = $1, gender = $2, height_cm = $3, weight_kg = $4, blood_type = $5, updated_at = NOW()
        WHERE user_id = $6
      `, [birthDate, gender, heightCm, weightKg, bloodType, userId]);
    } else {
      await db.query(`
        INSERT INTO patient_profiles (id, user_id, birth_date, gender, height_cm, weight_kg, blood_type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
      `, [userId, birthDate, gender, heightCm, weightKg, bloodType]);
    }

    await db.query('COMMIT');
    return { success: true };
  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('Error updating patient profile:', err);
    return { error: 'Profil güncellenirken bir hata oluştu.' };
  }
}

export async function deletePatientEnrollment(enrollmentId: string, appId: string) {
  try {
    await db.query('DELETE FROM patient_app_enrollments WHERE id = $1 AND app_id = $2', [enrollmentId, appId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting patient enrollment:', error);
    return { error: 'Hasta silinirken bir hata oluştu.' };
  }
}
