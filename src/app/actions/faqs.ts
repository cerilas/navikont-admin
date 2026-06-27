'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getFaqs(appId: string) {
  try {
    const result = await db.query(
      'SELECT * FROM core_faqs WHERE app_id = $1 ORDER BY order_index ASC, created_at DESC',
      [appId]
    );
    return { success: true, data: result.rows };
  } catch (error) {
    console.error('Error fetching faqs:', error);
    return { success: false, error: 'SSS getirilirken bir hata oluştu.' };
  }
}

export async function createFaq(appId: string, data: { question: string; answer: string; order_index: number; is_active: boolean }) {
  try {
    const result = await db.query(
      `INSERT INTO core_faqs (app_id, question, answer, order_index, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [appId, data.question, data.answer, data.order_index, data.is_active]
    );
    revalidatePath(`/apps/${appId}/faqs`);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error creating faq:', error);
    return { success: false, error: 'SSS oluşturulurken bir hata oluştu.' };
  }
}

export async function updateFaq(id: string, appId: string, data: { question: string; answer: string; order_index: number; is_active: boolean }) {
  try {
    const result = await db.query(
      `UPDATE core_faqs
       SET question = $1, answer = $2, order_index = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5 AND app_id = $6 RETURNING *`,
      [data.question, data.answer, data.order_index, data.is_active, id, appId]
    );
    revalidatePath(`/apps/${appId}/faqs`);
    return { success: true, data: result.rows[0] };
  } catch (error) {
    console.error('Error updating faq:', error);
    return { success: false, error: 'SSS güncellenirken bir hata oluştu.' };
  }
}

export async function deleteFaq(id: string, appId: string) {
  try {
    await db.query('DELETE FROM core_faqs WHERE id = $1 AND app_id = $2', [id, appId]);
    revalidatePath(`/apps/${appId}/faqs`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting faq:', error);
    return { success: false, error: 'SSS silinirken bir hata oluştu.' };
  }
}
