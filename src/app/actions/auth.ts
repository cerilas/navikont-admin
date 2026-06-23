'use server'

import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendMail, getHtmlEmailTemplate } from '@/lib/mail';
import { getBaseUrl } from '@/lib/url';
import { sendSms } from '@/lib/sms';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function sendPasswordResetEmail(userId: string, appId?: string) {
  try {
    const userRes = await db.query('SELECT email, full_name FROM core_users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return { error: 'Kullanıcı bulunamadı.' };
    }
    const user = userRes.rows[0];

    // Fetch app name
    let appName = 'DiGA Base';
    if (appId) {
      const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
      if (appRes.rows.length > 0) {
        appName = appRes.rows[0].name;
      }
    } else {
      // Look up patient enrollment
      const enrollRes = await db.query('SELECT app_id FROM patient_app_enrollments WHERE patient_user_id = $1 LIMIT 1', [userId]);
      if (enrollRes.rows.length > 0) {
        const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [enrollRes.rows[0].app_id]);
        if (appRes.rows.length > 0) {
          appName = appRes.rows[0].name;
        }
      } else {
        // Fallback to first app
        const anyAppRes = await db.query('SELECT name FROM content_apps LIMIT 1');
        if (anyAppRes.rows.length > 0) {
          appName = anyAppRes.rows[0].name;
        }
      }
    }

    // Generate random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiration to 24 hours from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Save token in DB
    await db.query(`
      UPDATE core_users 
      SET reset_token = $1, reset_token_expires = $2
      WHERE id = $3
    `, [token, expires.toISOString(), userId]);

    // Construct reset link
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const htmlContent = getHtmlEmailTemplate(
      `Merhaba ${user.full_name}`,
      `<p><strong>${appName}</strong> uygulaması için hesabınızın şifresini belirlemek veya sıfırlamak için aşağıdaki butona tıklayın.</p>
       <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;"><em>Bu bağlantı 24 saat boyunca geçerlidir. Bu işlemi siz talep etmediyseniz bu e-postayı dikkate almayınız.</em></p>`,
      'Şifremi Belirle',
      resetLink
    );

    // Send the email
    await sendMail({
      to: user.email,
      subject: `${appName} - Şifre Belirleme`,
      html: htmlContent
    });

    return { success: true, message: 'Şifre sıfırlama bağlantısı hastanın e-posta adresine gönderildi.' };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { error: 'E-posta gönderilirken sistemsel bir hata oluştu.' };
  }
}

export async function sendPasswordResetSMS(userId: string, appId?: string) {
  try {
    const userRes = await db.query('SELECT phone, full_name FROM core_users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return { error: 'Kullanıcı bulunamadı.' };
    }
    const user = userRes.rows[0];

    if (!user.phone) {
      return { error: 'Hastanın kayıtlı bir telefon numarası bulunmamaktadır. Lütfen önce hastayı düzenleyerek telefon numarasını girin.' };
    }

    // Fetch app name
    let appName = 'DiGA Base';
    if (appId) {
      const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
      if (appRes.rows.length > 0) {
        appName = appRes.rows[0].name;
      }
    } else {
      // Look up patient enrollment
      const enrollRes = await db.query('SELECT app_id FROM patient_app_enrollments WHERE patient_user_id = $1 LIMIT 1', [userId]);
      if (enrollRes.rows.length > 0) {
        const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [enrollRes.rows[0].app_id]);
        if (appRes.rows.length > 0) {
          appName = appRes.rows[0].name;
        }
      } else {
        // Fallback to first app
        const anyAppRes = await db.query('SELECT name FROM content_apps LIMIT 1');
        if (anyAppRes.rows.length > 0) {
          appName = anyAppRes.rows[0].name;
        }
      }
    }

    // Generate a shorter token (8 bytes = 16 hex chars) to save SMS space
    const token = crypto.randomBytes(8).toString('hex');
    
    // Set expiration to 24 hours from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    // Save token in DB
    await db.query(`
      UPDATE core_users 
      SET reset_token = $1, reset_token_expires = $2
      WHERE id = $3
    `, [token, expires.toISOString(), userId]);

    // Construct reset link
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const smsContent = `${appName} şifre belirleme linkiniz: ${resetLink}`;

    // Send the SMS
    await sendSms({
      no: user.phone,
      msg: smsContent
    });

    return { success: true, message: 'Şifre sıfırlama bağlantısı hastanın telefon numarasına SMS olarak gönderildi.' };
  } catch (error) {
    console.error('Password reset SMS error:', error);
    return { error: 'SMS gönderilirken sistemsel bir hata oluştu.' };
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const token = formData.get('token')?.toString();
  const password = formData.get('password')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!token) return { error: 'Geçersiz veya eksik token.' };
  if (!password) return { error: 'Şifre zorunludur.' };
  if (password !== confirmPassword) return { error: 'Şifreler birbiriyle eşleşmiyor.' };
  if (password.length < 6) return { error: 'Şifre en az 6 karakter olmalıdır.' };

  try {
    // Verify token
    const userRes = await db.query(`
      SELECT id, reset_token_expires 
      FROM core_users 
      WHERE reset_token = $1
    `, [token]);

    if (userRes.rows.length === 0) {
      return { error: 'Geçersiz veya kullanılmış sıfırlama bağlantısı.' };
    }

    const user = userRes.rows[0];
    
    if (new Date() > new Date(user.reset_token_expires)) {
      return { error: 'Bu sıfırlama bağlantısının süresi dolmuş.' };
    }

    // Update password and set status to active
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(`
      UPDATE core_users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, status = 'active', updated_at = NOW()
      WHERE id = $2
    `, [hashedPassword, user.id]);

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: 'Şifre güncellenirken bir hata oluştu.' };
  }
}

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) return { error: 'E-posta ve şifre zorunludur.' };

  try {
    const res = await db.query('SELECT id, password_hash, full_name, user_type FROM core_users WHERE email = $1', [email]);
    if (res.rows.length === 0) return { error: 'Geçersiz e-posta veya şifre.' };
    
    const user = res.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return { error: 'Geçersiz e-posta veya şifre.' };

    if (user.user_type === 'patient') {
      return { error: 'Bu panele giriş yetkiniz bulunmuyor. Hastalar sadece mobil uygulamayı kullanabilir.' };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ id: user.id, email, full_name: user.full_name, user_type: user.user_type });
    
    const cookieStore = await cookies();
    cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' });
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Giriş yapılırken bir hata oluştu.' };
  }

  redirect('/');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/login');
}
