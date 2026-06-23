'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendMail, getHtmlEmailTemplate } from '@/lib/mail';
import { getBaseUrl } from '@/lib/url';
import { sendSms } from '@/lib/sms';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function getDoctors() {
  try {
    const res = await db.query(`
      SELECT id, full_name, email, phone, status, created_at, last_login_at
      FROM core_users
      WHERE user_type = 'doctor'
      ORDER BY full_name ASC
    `);
    return res.rows;
  } catch (err: any) {
    console.error('Error fetching doctors:', err);
    return [];
  }
}

export async function getDoctorsPaginated(page: number = 1, limit: number = 20, search: string = '') {
  try {
    const offset = (page - 1) * limit;
    let queryText = `
      SELECT id, full_name, email, phone, status, created_at, last_login_at
      FROM core_users
      WHERE user_type = 'doctor'
    `;
    let countQueryText = `
      SELECT COUNT(*) as total
      FROM core_users
      WHERE user_type = 'doctor'
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      const searchClause = ` AND (full_name ILIKE $1 OR email ILIKE $1) `;
      queryText += searchClause;
      countQueryText += searchClause;
    }

    queryText += ` ORDER BY full_name ASC `;
    
    // Add pagination
    const paginationParamsStart = params.length + 1;
    queryText += ` LIMIT $${paginationParamsStart} OFFSET $${paginationParamsStart + 1} `;
    
    const countRes = await db.query(countQueryText, params);
    const totalCount = parseInt(countRes.rows[0].total);

    const res = await db.query(queryText, [...params, limit, offset]);

    // Fetch app assignments
    const doctorIds = res.rows.map(d => d.id);
    if (doctorIds.length > 0) {
      const appsRes = await db.query(`
        SELECT da.doctor_user_id, a.id, a.name 
        FROM doctor_apps da 
        JOIN content_apps a ON da.app_id = a.id 
        WHERE da.doctor_user_id = ANY($1)
      `, [doctorIds]);
      
      const appsByDoctor = appsRes.rows.reduce((acc: any, row: any) => {
        if (!acc[row.doctor_user_id]) acc[row.doctor_user_id] = [];
        acc[row.doctor_user_id].push({ id: row.id, name: row.name });
        return acc;
      }, {});

      res.rows.forEach(d => {
        d.assigned_apps = appsByDoctor[d.id] || [];
        d.app_ids = (appsByDoctor[d.id] || []).map((a: any) => a.id);
      });
    }
    
    return {
      doctors: res.rows,
      totalCount
    };
  } catch (err: any) {
    console.error('Error fetching doctors:', err);
    return { doctors: [], totalCount: 0 };
  }
}

export async function createDoctor(prevState: any, formData: FormData) {
  const full_name = formData.get('full_name')?.toString();
  const email = formData.get('email')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const app_id = formData.get('app_id')?.toString();

  if (!full_name || !email) {
    return { error: 'Lütfen Ad Soyad ve E-posta alanlarını doldurun.' };
  }

  try {
    // Check email
    const emailCheck = await db.query('SELECT id FROM core_users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return { error: 'Bu e-posta adresi sistemde zaten kayıtlı.' };
    }

    const id = crypto.randomUUID();
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const password_hash = await bcrypt.hash(tempPassword, 10);
    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.query(`
      INSERT INTO core_users (id, full_name, email, phone, password_hash, user_type, status, reset_token, reset_token_expires)
      VALUES ($1, $2, $3, $4, $5, 'doctor', 'active', $6, $7)
    `, [id, full_name, email, phone, password_hash, reset_token, reset_token_expires]);

    if (app_id) {
      await db.query(`INSERT INTO doctor_apps (doctor_user_id, app_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, app_id]);
    }

    // Send Welcome Email
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${reset_token}`;
    
    // Fetch system app name
    let appName = 'DiGA Base';
    const anyAppRes = await db.query('SELECT name FROM content_apps LIMIT 1');
    if (anyAppRes.rows.length > 0) {
      appName = anyAppRes.rows[0].name;
    }

    await sendMail({
      to: email,
      subject: `${appName} - Doktor Hesabınız Oluşturuldu`,
      html: getHtmlEmailTemplate(
        `Sayın Dr. ${full_name}`,
        `<p>${appName} sisteminde doktor hesabınız başarıyla oluşturulmuştur.</p>
         <p>Hesabınıza erişmek ve kendi şifrenizi belirlemek için lütfen aşağıdaki bağlantıya tıklayın:</p>
         <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;"><em>Bu bağlantı 24 saat boyunca geçerlidir.</em></p>`,
        'Şifremi Belirle',
        resetLink,
        appName
      )
    });

    revalidatePath('/settings/doctors');
    return { success: true, message: 'Doktor başarıyla eklendi ve şifre oluşturma e-postası gönderildi.' };
  } catch (err: any) {
    console.error('Error creating doctor:', err);
    return { error: 'Doktor eklenirken bir hata oluştu: ' + err.message };
  }
}

export async function updateDoctor(prevState: any, formData: FormData) {
  const id = formData.get('id')?.toString();
  const full_name = formData.get('full_name')?.toString();
  const email = formData.get('email')?.toString();
  const phone = formData.get('phone')?.toString() || null;
  const status = formData.get('status')?.toString();
  const app_id = formData.get('app_id')?.toString();

  if (!id || !full_name || !email) {
    return { error: 'Lütfen Ad Soyad ve E-posta alanlarını doldurun.' };
  }

  try {
    const emailCheck = await db.query('SELECT id FROM core_users WHERE email = $1 AND id != $2', [email, id]);
    if (emailCheck.rows.length > 0) {
      return { error: 'Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.' };
    }

    await db.query(`
      UPDATE core_users 
      SET full_name = $1, email = $2, phone = $3, status = $4, updated_at = NOW()
      WHERE id = $5 AND user_type = 'doctor'
    `, [full_name, email, phone, status || 'active', id]);

    await db.query(`DELETE FROM doctor_apps WHERE doctor_user_id = $1`, [id]);
    if (app_id) {
      await db.query(`INSERT INTO doctor_apps (doctor_user_id, app_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, app_id]);
    }

    revalidatePath('/settings/doctors');
    return { success: true, message: 'Doktor bilgileri başarıyla güncellendi.' };
  } catch (err: any) {
    console.error('Error updating doctor:', err);
    return { error: 'Doktor güncellenirken bir hata oluştu.' };
  }
}

export async function sendPasswordReset(doctorId: string) {
  try {
    const userRes = await db.query('SELECT full_name, email FROM core_users WHERE id = $1 AND user_type = $2', [doctorId, 'doctor']);
    if (userRes.rows.length === 0) {
      return { error: 'Doktor bulunamadı.' };
    }

    const { full_name, email } = userRes.rows[0];
    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(`
      UPDATE core_users
      SET reset_token = $1, reset_token_expires = $2
      WHERE id = $3
    `, [reset_token, reset_token_expires, doctorId]);

    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${reset_token}`;
    
    // Fetch doctor's app or first app name
    let appName = 'DiGA Base';
    const appRes = await db.query('SELECT name FROM content_apps WHERE medical_director_id = $1 LIMIT 1', [doctorId]);
    if (appRes.rows.length > 0) {
      appName = appRes.rows[0].name;
    } else {
      const anyAppRes = await db.query('SELECT name FROM content_apps LIMIT 1');
      if (anyAppRes.rows.length > 0) {
        appName = anyAppRes.rows[0].name;
      }
    }

    await sendMail({
      to: email,
      subject: `${appName} - Şifre Sıfırlama`,
      html: getHtmlEmailTemplate(
        `Sayın Dr. ${full_name}`,
        `<p>Hesabınız için şifre sıfırlama talebinde bulunuldu.</p>
         <p>Yeni şifrenizi belirlemek için lütfen aşağıdaki butona tıklayın:</p>
         <p style="margin-top: 16px; font-size: 13px; color: #94a3b8;"><em>Bu bağlantı 24 saat boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu e-postayı dikkate almayınız.</em></p>`,
        'Şifremi Sıfırla',
        resetLink,
        appName
      )
    });

    return { success: true, message: 'Şifre sıfırlama e-postası başarıyla gönderildi.' };
  } catch (err: any) {
    console.error('Error sending reset mail:', err);
    return { error: 'E-posta gönderilirken bir hata oluştu.' };
  }
}

export async function sendPasswordResetSMS(doctorId: string) {
  try {
    const userRes = await db.query('SELECT full_name, phone FROM core_users WHERE id = $1 AND user_type = $2', [doctorId, 'doctor']);
    if (userRes.rows.length === 0) {
      return { error: 'Doktor bulunamadı.' };
    }

    const { full_name, phone } = userRes.rows[0];
    
    if (!phone) {
      return { error: 'Bu doktorun kayıtlı bir telefon numarası bulunmuyor. Lütfen önce doktoru düzenleyip telefon ekleyin.' };
    }

    const reset_token = crypto.randomBytes(8).toString('hex'); // 8 bytes = 16 hex chars (saves space for SMS)
    const reset_token_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(`
      UPDATE core_users
      SET reset_token = $1, reset_token_expires = $2
      WHERE id = $3
    `, [reset_token, reset_token_expires, doctorId]);

    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${reset_token}`;
    const displayName = full_name.startsWith('Dr.') ? full_name : `Dr. ${full_name}`;
    
    // Fetch doctor's app or first app name
    let appName = 'DiGA Base';
    const appRes = await db.query('SELECT name FROM content_apps WHERE medical_director_id = $1 LIMIT 1', [doctorId]);
    if (appRes.rows.length > 0) {
      appName = appRes.rows[0].name;
    } else {
      const anyAppRes = await db.query('SELECT name FROM content_apps LIMIT 1');
      if (anyAppRes.rows.length > 0) {
        appName = anyAppRes.rows[0].name;
      }
    }

    await sendSms({
      no: phone,
      msg: `Sayın ${displayName}, ${appName} şifre belirleme bağlantısı: ${resetLink}`
    });

    return { success: true, message: "Şifre sıfırlama SMS'i başarıyla gönderildi." };
  } catch (err: any) {
    console.error('Error sending reset SMS:', err);
    return { error: 'SMS gönderilirken bir hata oluştu.' };
  }
}
