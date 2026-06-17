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

export async function updatePatientDay(enrollmentId: string, newDay: number) {
  try {
    await db.query(`UPDATE patient_app_enrollments SET current_day = $1, updated_at = NOW() WHERE id = $2`, [newDay, enrollmentId]);
    return { success: true };
  } catch (error) {
    console.error('Error updating patient day:', error);
    return { error: 'Gününüz güncellenirken bir hata oluştu.' };
  }
}

export async function getDetailedModuleAnswers(
  enrollmentId: string, 
  patientUserId: string, 
  moduleType: string, 
  completedAt: string,
  moduleVersionId?: string
) {
  try {
    if (!completedAt) return null;
    const targetDate = new Date(completedAt).toISOString().split('T')[0];
    
    // Attempt to extract template id from module version content if provided
    let templateId: string | null = null;
    if (moduleVersionId) {
      const mvRes = await db.query('SELECT content FROM content_module_versions WHERE id = $1', [moduleVersionId]);
      if (mvRes.rows.length > 0 && mvRes.rows[0].content) {
        if (moduleType === 'questionnaire' || moduleType === 'question_answer') {
          templateId = mvRes.rows[0].content.questionnaireId || mvRes.rows[0].content.formId;
        } else if (moduleType === 'checkin') {
          templateId = mvRes.rows[0].content.checkinTemplateId;
        }
      }
    }

    if (moduleType === 'questionnaire' || moduleType === 'question_answer') {
      let query = `
        SELECT r.id, r.total_score, r.risk_level, r.submitted_at
        FROM patient_questionnaire_responses r
        ${templateId ? 'JOIN forms_questionnaire_versions fqv ON fqv.id = r.questionnaire_version_id' : ''}
        WHERE r.enrollment_id = $1 AND r.patient_user_id = $2
          AND DATE(r.submitted_at AT TIME ZONE 'UTC') = $3
      `;
      let params: any[] = [enrollmentId, patientUserId, targetDate];
      if (templateId) {
        query += ` AND (fqv.questionnaire_id::text = $4 OR fqv.id::text = $4)`;
        params.push(templateId);
      }
      query += ` ORDER BY r.submitted_at DESC LIMIT 1`;
      
      const res = await db.query(query, params);

      if (res.rows.length === 0) return null;
      const responseId = res.rows[0].id;

      const answers = await db.query(`
        SELECT 
          a.answer_value, 
          a.score, 
          q.label as question_text, 
          q.question_type,
          COALESCE(o.option_label, fallback_o.option_label) as option_label
        FROM patient_questionnaire_answers a
        JOIN forms_questions q ON q.id = a.question_id
        JOIN forms_questionnaire_versions fqv ON fqv.id = q.questionnaire_version_id
        LEFT JOIN forms_question_options o ON o.question_id = q.id AND o.option_value = REPLACE(a.answer_value::text, '"', '')
        LEFT JOIN LATERAL (
          SELECT fo.option_label
          FROM forms_questions fq
          JOIN forms_question_options fo ON fo.question_id = fq.id
          WHERE fq.questionnaire_version_id IN (
            SELECT id FROM forms_questionnaire_versions WHERE questionnaire_id = fqv.questionnaire_id
          )
          AND fq.question_key = q.question_key
          AND fo.option_value = REPLACE(a.answer_value::text, '"', '')
          LIMIT 1
        ) fallback_o ON o.option_label IS NULL
        WHERE a.response_id = $1
        ORDER BY q.sort_order ASC
      `, [responseId]);

      return {
        summary: res.rows[0],
        answers: answers.rows
      };
    } else if (moduleType === 'checkin') {
      let query = `
        SELECT s.id, s.checkin_date, s.submitted_at, s.streak_day
        FROM patient_checkin_submissions s
        ${templateId ? 'JOIN forms_checkin_template_versions fctv ON fctv.id = s.checkin_template_version_id' : ''}
        WHERE s.enrollment_id = $1 AND s.patient_user_id = $2
          AND s.checkin_date = $3
      `;
      let params: any[] = [enrollmentId, patientUserId, targetDate];
      if (templateId) {
        query += ` AND (fctv.checkin_template_id::text = $4 OR fctv.id::text = $4)`;
        params.push(templateId);
      }
      query += ` ORDER BY s.submitted_at DESC LIMIT 1`;

      const res = await db.query(query, params);

      if (res.rows.length === 0) return null;
      const submissionId = res.rows[0].id;

      const values = await db.query(`
        SELECT v.value, v.numeric_value, v.text_value, v.boolean_value, f.label, f.field_type
        FROM patient_checkin_values v
        JOIN forms_checkin_fields f ON f.id = v.field_id
        WHERE v.submission_id = $1
        ORDER BY f.sort_order ASC
      `, [submissionId]);

      return {
        summary: res.rows[0],
        answers: values.rows
      };
    }
    
    return null;
  } catch (err) {
    console.error('Error fetching details:', err);
    return null;
  }
}

export async function deleteModuleProgress(
  logId: string,
  moduleType: string,
  completedAt: string,
  enrollmentId: string,
  patientUserId: string,
  moduleVersionId?: string
) {
  try {
    if (completedAt) {
      const targetDate = new Date(completedAt).toISOString().split('T')[0];
      
      let templateId: string | null = null;
      if (moduleVersionId) {
        const mvRes = await db.query('SELECT content FROM content_module_versions WHERE id = $1', [moduleVersionId]);
        if (mvRes.rows.length > 0 && mvRes.rows[0].content) {
          if (moduleType === 'questionnaire') {
            templateId = mvRes.rows[0].content.questionnaireId || mvRes.rows[0].content.formId;
          } else if (moduleType === 'checkin') {
            templateId = mvRes.rows[0].content.checkinTemplateId;
          }
        }
      }
      
      if (moduleType === 'questionnaire') {
        let query = `
          DELETE FROM patient_questionnaire_responses 
          WHERE enrollment_id = $1 AND patient_user_id = $2 AND DATE(submitted_at AT TIME ZONE 'UTC') = $3
        `;
        let params: any[] = [enrollmentId, patientUserId, targetDate];
        if (templateId) {
          query += ` AND questionnaire_version_id IN (SELECT id FROM forms_questionnaire_versions WHERE questionnaire_id::text = $4 OR id::text = $4)`;
          params.push(templateId);
        }
        await db.query(query, params);
      } else if (moduleType === 'checkin') {
        let query = `
          DELETE FROM patient_checkin_submissions
          WHERE enrollment_id = $1 AND patient_user_id = $2 AND checkin_date = $3
        `;
        let params: any[] = [enrollmentId, patientUserId, targetDate];
        if (templateId) {
          query += ` AND checkin_template_version_id IN (SELECT id FROM forms_checkin_template_versions WHERE checkin_template_id::text = $4 OR id::text = $4)`;
          params.push(templateId);
        }
        await db.query(query, params);
      }
    }
    
    // Always delete the progress log itself
    await db.query(`DELETE FROM patient_module_progress WHERE id = $1`, [logId]);

    // Recalculate progress_percent
    const enrollmentRes = await db.query(
      `SELECT journey_id, app_id FROM patient_app_enrollments WHERE id = $1`,
      [enrollmentId]
    );
    if (enrollmentRes.rows.length > 0) {
      const enrollment = enrollmentRes.rows[0];
      const totalStepsResult = await db.query(
        `SELECT COUNT(*) AS total FROM content_journey_steps WHERE journey_id = $1`,
        [enrollment.journey_id]
      );
      const completedResult = await db.query(
        `SELECT COUNT(*) AS completed FROM patient_module_progress
         WHERE enrollment_id = $1 AND patient_user_id = $2 AND app_id = $3 AND status = 'completed'`,
        [enrollmentId, patientUserId, enrollment.app_id]
      );
      const total = parseInt(totalStepsResult.rows[0].total) || 1;
      const completed = parseInt(completedResult.rows[0].completed) || 0;
      const newProgressPercent = Math.round((completed / total) * 100);

      await db.query(
        `UPDATE patient_app_enrollments SET progress_percent = $1, updated_at = NOW() WHERE id = $2`,
        [newProgressPercent, enrollmentId]
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting progress log:', error);
    return { error: 'Veri silinirken bir hata oluştu.' };
  }
}
