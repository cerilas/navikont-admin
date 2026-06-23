'use server';

import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { getSetting } from './settings';
import { revalidatePath } from 'next/cache';

export async function createSupportRequest(prevState: any, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.user_type !== 'doctor') {
      return { success: false, error: 'Sadece doktorlar destek talebi oluşturabilir.' };
    }

    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    if (!subject || !message) {
      return { success: false, error: 'Lütfen konu ve mesaj alanlarını doldurunuz.' };
    }

    // Save to DB
    await db.query(`
      INSERT INTO doctor_support_requests (doctor_user_id, subject, message, status)
      VALUES ($1, $2, $3, 'new')
    `, [session.id, subject, message]);

    // Send Email
    const targetEmail = await getSetting('support_email', '');
    if (targetEmail) {
      // Fetch doctor info for the email
      const docRes = await db.query('SELECT full_name, email FROM core_users WHERE id = $1', [session.id]);
      const doc = docRes.rows[0];

      const emailHtml = `
        <h3>Yeni Doktor Destek Talebi</h3>
        <p><strong>Doktor:</strong> ${doc.full_name} (${doc.email})</p>
        <p><strong>Konu:</strong> ${subject}</p>
        <hr />
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `;

      await sendMail({ to: targetEmail, subject: `Destek Talebi: ${subject}`, html: emailHtml });
    }

    revalidatePath('/support-requests');

    return { success: true, message: 'Destek talebiniz başarıyla iletildi.' };
  } catch (error) {
    console.error('Error creating support request:', error);
    return { success: false, error: 'Destek talebi iletilirken bir hata oluştu.' };
  }
}

export async function resolveSupportRequest(id: string) {
  try {
    await db.query(`UPDATE doctor_support_requests SET status = 'resolved' WHERE id = $1`, [id]);
    revalidatePath('/support-requests');
    return { success: true };
  } catch (error) {
    console.error('Error resolving support request:', error);
    return { success: false, error: 'Talep durumu güncellenirken hata oluştu.' };
  }
}

export async function getSupportRequests() {
  try {
    const res = await db.query(`
      SELECT r.id, r.subject, r.message, r.status, r.created_at, u.full_name as doctor_name, u.email as doctor_email
      FROM doctor_support_requests r
      JOIN core_users u ON r.doctor_user_id = u.id
      ORDER BY r.created_at DESC
    `);
    return res.rows;
  } catch (error) {
    console.error('Error getting support requests:', error);
    return [];
  }
}
