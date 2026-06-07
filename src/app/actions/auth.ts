'use server'

import db from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';
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

    // Fetch app name if appId is provided
    let appName = 'DiGA Platformu';
    if (appId) {
      const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
      if (appRes.rows.length > 0) {
        appName = appRes.rows[0].name;
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
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Merhaba ${user.full_name},</h2>
        <p><strong>${appName}</strong> uygulaması için hesabınızın şifresini belirlemek veya sıfırlamak için aşağıdaki butona tıklayın.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #206bc4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Şifremi Belirle
          </a>
        </div>
        <p>Eğer butona tıklayamıyorsanız, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
        <p style="color: #666; word-break: break-all;">${resetLink}</p>
        <p style="margin-top: 40px; font-size: 12px; color: #999;">Bu bağlantı 24 saat boyunca geçerlidir. Bu işlemi siz talep etmediyseniz bu e-postayı dikkate almayınız.</p>
      </div>
    `;

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

    // Fetch app name if appId is provided
    let appName = 'DiGA Platformu';
    if (appId) {
      const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
      if (appRes.rows.length > 0) {
        appName = appRes.rows[0].name;
      }
    }

    // Generate a shorter token (16 bytes = 32 hex chars) to save SMS space
    const token = crypto.randomBytes(16).toString('hex');
    
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
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
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

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(`
      UPDATE core_users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
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
