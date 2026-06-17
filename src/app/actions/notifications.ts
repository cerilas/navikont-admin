'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface NotificationTemplateInput {
  id?: string;
  code: string;
  channel: 'push' | 'sms' | 'email' | 'in_app';
  title_template?: string;
  body_template: string;
  variables: string[];
  is_active: boolean;
}

export async function saveNotificationTemplate(appId: string, input: NotificationTemplateInput) {
  const { id, code, channel, title_template, body_template, variables, is_active } = input;

  if (!code || !code.trim()) {
    return { error: 'Lütfen benzersiz bir şablon kodu giriniz.' };
  }
  if (!channel) {
    return { error: 'Lütfen bir gönderim kanalı seçiniz.' };
  }
  if (!body_template || !body_template.trim()) {
    return { error: 'Lütfen bildirim gövde şablonunu giriniz.' };
  }

  const cleanCode = code.trim().toLowerCase();
  const cleanVariables = JSON.stringify(variables.map(v => v.trim()).filter(Boolean));

  try {
    // Check for uniqueness of (appId, code, channel) excluding current id
    if (id) {
      const checkRes = await db.query(
        'SELECT id FROM content_notification_templates WHERE app_id = $1 AND code = $2 AND channel = $3 AND id != $4',
        [appId, cleanCode, channel, id]
      );
      if (checkRes.rows.length > 0) {
        return { error: `Bu uygulama için '${cleanCode}' kodu ile '${channel}' kanalında zaten bir şablon bulunuyor.` };
      }

      // Update
      await db.query(`
        UPDATE content_notification_templates
        SET 
          code = $1,
          channel = $2,
          title_template = $3,
          body_template = $4,
          variables = $5,
          is_active = $6
        WHERE id = $7 AND app_id = $8
      `, [
        cleanCode,
        channel,
        title_template?.trim() || null,
        body_template.trim(),
        cleanVariables,
        is_active,
        id,
        appId
      ]);
    } else {
      const checkRes = await db.query(
        'SELECT id FROM content_notification_templates WHERE app_id = $1 AND code = $2 AND channel = $3',
        [appId, cleanCode, channel]
      );
      if (checkRes.rows.length > 0) {
        return { error: `Bu uygulama için '${cleanCode}' kodu ile '${channel}' kanalında zaten bir şablon bulunuyor.` };
      }

      // Insert
      const newId = crypto.randomUUID();
      await db.query(`
        INSERT INTO content_notification_templates (id, app_id, code, channel, title_template, body_template, variables, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        newId,
        appId,
        cleanCode,
        channel,
        title_template?.trim() || null,
        body_template.trim(),
        cleanVariables,
        is_active
      ]);
    }

    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving notification template:', error);
    return { error: 'Şablon kaydedilirken sunucu hatası oluştu: ' + error.message };
  }
}

export async function deleteNotificationTemplate(appId: string, templateId: string) {
  try {
    await db.query(
      'DELETE FROM content_notification_templates WHERE id = $1 AND app_id = $2',
      [templateId, appId]
    );

    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting notification template:', error);
    return { error: 'Şablon silinirken bir hata oluştu: ' + error.message };
  }
}

export async function toggleNotificationTemplateStatus(appId: string, templateId: string, isActive: boolean) {
  try {
    await db.query(
      'UPDATE content_notification_templates SET is_active = $1 WHERE id = $2 AND app_id = $3',
      [isActive, templateId, appId]
    );

    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling notification template status:', error);
    return { error: 'Şablon durumu güncellenirken bir hata oluştu: ' + error.message };
  }
}

export async function sendNotificationToAll(appId: string, templateId: string) {
  try {
    // 1. Get template details
    const templateRes = await db.query(
      'SELECT code, channel, title_template, body_template FROM content_notification_templates WHERE id = $1 AND app_id = $2',
      [templateId, appId]
    );

    if (templateRes.rows.length === 0) {
      return { error: 'Şablon bulunamadı.' };
    }

    const template = templateRes.rows[0];
    const batchId = crypto.randomUUID();

    // 2. Insert into patient_notifications from patient_app_enrollments
    await db.query(`
      INSERT INTO patient_notifications (
        id, user_id, enrollment_id, app_id, channel, title, body, status, sent_at, metadata
      )
      SELECT 
        gen_random_uuid(),
        user_id,
        id,
        app_id,
        $1 as channel,
        $2 as title,
        $3 as body,
        'sent' as status,
        CURRENT_TIMESTAMP as sent_at,
        jsonb_build_object('template_id', $4::text, 'batch_id', $5::text, 'template_code', $6::text)
      FROM patient_app_enrollments
      WHERE app_id = $7
    `, [
      template.channel,
      template.title_template || null,
      template.body_template,
      templateId,
      batchId,
      template.code,
      appId
    ]);

    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true, batchId };
  } catch (error: any) {
    console.error('Error sending notifications to all:', error);
    return { error: 'Bildirimler gönderilirken bir hata oluştu: ' + error.message };
  }
}

export async function getNotificationHistory(appId: string) {
  try {
    const res = await db.query(`
      SELECT 
        metadata->>'batch_id' as batch_id,
        metadata->>'template_id' as template_id,
        metadata->>'template_code' as template_code,
        channel,
        MAX(sent_at) as sent_at,
        COUNT(*) as total_sent,
        COUNT(read_at) as total_read
      FROM patient_notifications
      WHERE app_id = $1 AND metadata->>'batch_id' IS NOT NULL
      GROUP BY 
        metadata->>'batch_id',
        metadata->>'template_id',
        metadata->>'template_code',
        channel
      ORDER BY MAX(sent_at) DESC
    `, [appId]);

    return { history: res.rows };
  } catch (error: any) {
    console.error('Error fetching notification history:', error);
    return { error: 'Geçmiş alınırken bir hata oluştu: ' + error.message };
  }
}

