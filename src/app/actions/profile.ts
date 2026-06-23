'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getProfile() {
  try {
    const session = await getSession();
    if (!session) return null;

    const res = await db.query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.user_type, u.avatar_url,
             dp.institution, dp.specialty, dp.address, dp.age
      FROM core_users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_user_id
      WHERE u.id = $1
    `, [session.id]);

    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return null;
  }
}

export async function updateProfile(prevState: any, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Oturum bulunamadı.' };

    const full_name = formData.get('full_name')?.toString();
    const email = formData.get('email')?.toString();
    const phone = formData.get('phone')?.toString() || null;
    const avatar_url = formData.get('avatar_url')?.toString() || null;
    
    if (!full_name || !email) {
      return { error: 'Ad Soyad ve E-posta alanları zorunludur.' };
    }

    // Check if email is used by another user
    const emailCheck = await db.query('SELECT id FROM core_users WHERE email = $1 AND id != $2', [email, session.id]);
    if (emailCheck.rows.length > 0) {
      return { error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.' };
    }

    // Update core user
    await db.query(`
      UPDATE core_users 
      SET full_name = $1, email = $2, phone = $3, avatar_url = $4, updated_at = NOW()
      WHERE id = $5
    `, [full_name, email, phone, avatar_url, session.id]);

    // If doctor, update doctor profile
    if (session.user_type === 'doctor') {
      const institution = formData.get('institution')?.toString() || null;
      const specialty = formData.get('specialty')?.toString() || null;
      const address = formData.get('address')?.toString() || null;
      const ageStr = formData.get('age')?.toString();
      const age = ageStr ? parseInt(ageStr, 10) : null;

      await db.query(`
        INSERT INTO doctor_profiles (doctor_user_id, institution, specialty, address, age, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (doctor_user_id) 
        DO UPDATE SET institution = $2, specialty = $3, address = $4, age = $5, updated_at = NOW()
      `, [session.id, institution, specialty, address, age]);
    }

    // Refresh session to reflect new full_name and avatar_url
    const { encrypt } = await import('@/lib/auth');
    const { cookies } = await import('next/headers');
    const newSession = await encrypt({
      id: session.id,
      email: email,
      full_name: full_name,
      user_type: session.user_type,
      avatar_url: avatar_url
    });
    
    const cookieStore = await cookies();
    cookieStore.set('session', newSession, { 
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
      httpOnly: true, 
      sameSite: 'lax', 
      path: '/' 
    });

    revalidatePath('/profile');
    revalidatePath('/dr/profile');
    return { success: true, message: 'Profil başarıyla güncellendi.' };
  } catch (err: any) {
    console.error('Error updating profile:', err);
    return { error: 'Profil güncellenirken bir hata oluştu.' };
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Oturum bulunamadı.' };

    const current_password = formData.get('current_password')?.toString();
    const new_password = formData.get('new_password')?.toString();
    const confirm_password = formData.get('confirm_password')?.toString();

    if (!current_password || !new_password || !confirm_password) {
      return { error: 'Lütfen tüm şifre alanlarını doldurun.' };
    }

    if (new_password !== confirm_password) {
      return { error: 'Yeni şifreler birbiriyle eşleşmiyor.' };
    }

    if (new_password.length < 6) {
      return { error: 'Yeni şifreniz en az 6 karakter olmalıdır.' };
    }

    // Verify current password
    const userRes = await db.query('SELECT password_hash FROM core_users WHERE id = $1', [session.id]);
    if (userRes.rows.length === 0) return { error: 'Kullanıcı bulunamadı.' };

    const user = userRes.rows[0];
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) {
      return { error: 'Mevcut şifrenizi yanlış girdiniz.' };
    }

    // Update password
    const new_password_hash = await bcrypt.hash(new_password, 10);
    await db.query(`
      UPDATE core_users 
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `, [new_password_hash, session.id]);

    return { success: true, message: 'Şifreniz başarıyla güncellendi.' };
  } catch (err: any) {
    console.error('Error updating password:', err);
    return { error: 'Şifre güncellenirken bir hata oluştu.' };
  }
}
