'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { sendPushNotification } from '@/lib/apn';

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

export async function sendNotificationToAll(appId: string, templateId: string, source: 'manual' | 'auto' = 'manual') {
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
        e.patient_user_id,
        e.id,
        e.app_id,
        $1 as channel,
        REPLACE(
          REPLACE(
            REPLACE(COALESCE($2::text, ''), '{{patient_name}}', COALESCE(pu.full_name, 'Hasta')),
            '{{doctor_name}}', COALESCE(du.full_name, 'Doktorunuz')
          ),
          '{{app_name}}', COALESCE(a.name, 'Uygulama')
        ) as title,
        REPLACE(
          REPLACE(
            REPLACE($3::text, '{{patient_name}}', COALESCE(pu.full_name, 'Hasta')),
            '{{doctor_name}}', COALESCE(du.full_name, 'Doktorunuz')
          ),
          '{{app_name}}', COALESCE(a.name, 'Uygulama')
        ) as body,
        'sent' as status,
        CURRENT_TIMESTAMP as sent_at,
        jsonb_build_object('template_id', $4::text, 'batch_id', $5::text, 'template_code', $6::text, 'source', $7::text)
      FROM patient_app_enrollments e
      LEFT JOIN core_users pu ON pu.id = e.patient_user_id
      LEFT JOIN core_users du ON du.id = e.doctor_user_id
      LEFT JOIN content_apps a ON a.id = e.app_id
      WHERE e.app_id = $8 AND e.status = 'active'
    `, [
      template.channel,
      template.title_template || null,
      template.body_template,
      templateId,
      batchId,
      template.code,
      source,
      appId
    ]);

    // 3. APNs Push Notification Send
    if (template.channel === 'push') {
      const tokensRes = await db.query(`
        SELECT 
          d.device_token,
          pu.full_name as patient_name,
          pu.preferred_language,
          du.full_name as doctor_name,
          a.name as app_name
        FROM patient_devices d
        JOIN patient_app_enrollments e ON e.patient_user_id = d.patient_user_id
        LEFT JOIN core_users pu ON pu.id = e.patient_user_id
        LEFT JOIN core_users du ON du.id = e.doctor_user_id
        LEFT JOIN content_apps a ON a.id = e.app_id
        WHERE e.app_id = $1 AND e.status = 'active' AND d.platform = 'ios'
      `, [appId]);

      if (tokensRes.rows.length > 0) {
        const bundleId = process.env.APN_BUNDLE_ID || 'com.cerilas.navikont.navikont';
        const baseTitle = template.title_template || 'Navikont Bildirim';
        const baseBody = template.body_template;

        // DEBUG check
        await db.query(`INSERT INTO temp_apn_logs (log_text) VALUES ($1)`, [
          `Env check: KEY=${!!process.env.APN_KEY}, KEY_ID=${!!process.env.APN_KEY_ID}, TEAM_ID=${!!process.env.APN_TEAM_ID}, USE_SANDBOX=${process.env.APN_USE_SANDBOX}, BUNDLE=${bundleId}`
        ]);

        // Fetch all translations for this template
        const transRes = await db.query(
          `SELECT language, field_name, translated_text FROM content_translations WHERE entity_type = 'content_notification_templates' AND entity_id = $1`,
          [templateId]
        );
        const translationsByLang: Record<string, Record<string, string>> = {};
        for (const r of transRes.rows) {
          if (!translationsByLang[r.language]) translationsByLang[r.language] = {};
          translationsByLang[r.language][r.field_name] = r.translated_text;
        }

        // Group tokens by customized payload content
        const payloadGroups = new Map<string, { title: string, body: string, tokens: string[] }>();

        for (const row of tokensRes.rows) {
          if (!row.device_token) continue;
          const pName = row.patient_name || 'Hasta';
          const dName = row.doctor_name || 'Doktorunuz';
          const aName = row.app_name || 'Uygulama';
          const lang = row.preferred_language || 'tr';

          let titleTpl = baseTitle;
          let bodyTpl = baseBody;

          if (lang !== 'tr' && translationsByLang[lang]) {
            titleTpl = translationsByLang[lang]['title_template'] || baseTitle;
            bodyTpl = translationsByLang[lang]['body_template'] || baseBody;
          }

          const personalizedTitle = titleTpl
            .replace(/\{\{patient_name\}\}/g, pName)
            .replace(/\{\{doctor_name\}\}/g, dName)
            .replace(/\{\{app_name\}\}/g, aName);

          const personalizedBody = bodyTpl
            .replace(/\{\{patient_name\}\}/g, pName)
            .replace(/\{\{doctor_name\}\}/g, dName)
            .replace(/\{\{app_name\}\}/g, aName);

          const groupKey = `${personalizedTitle}|||${personalizedBody}`;
          if (!payloadGroups.has(groupKey)) {
            payloadGroups.set(groupKey, { title: personalizedTitle, body: personalizedBody, tokens: [] });
          }
          payloadGroups.get(groupKey)!.tokens.push(row.device_token);
        }

        let totalSent = 0;
        let totalFailed = 0;
        let allFailures: any[] = [];

        try {
          for (const group of payloadGroups.values()) {
            const result = await sendPushNotification(group.tokens, group.title, group.body, bundleId);
            totalSent += result.sent;
            totalFailed += result.failed;
            if (result.failures && result.failures.length > 0) {
              allFailures = allFailures.concat(result.failures);
            } else if (result.error) {
              allFailures.push(result.error);
            }
          }

          console.log(`APNs Batch ${batchId} completed: Sent ${totalSent}, Failed ${totalFailed}`);
          
          if (totalFailed > 0 || allFailures.length > 0) {
            let errorText = '';
            try {
              errorText = JSON.stringify(allFailures);
            } catch(e) {
              errorText = String(allFailures);
            }
            await db.query(
              `UPDATE patient_notifications SET status = 'failed' WHERE metadata->>'batch_id' = $1`, 
              [batchId]
            );
            await db.query(`INSERT INTO temp_apn_logs (log_text) VALUES ($1)`, [`Batch ${batchId} Error: ` + errorText]);
          }
        } catch (err: any) {
          console.error(`APNs Batch ${batchId} failed:`, err);
          await db.query(
            `UPDATE patient_notifications SET status = 'failed' WHERE metadata->>'batch_id' = $1`, 
            [batchId]
          );
          await db.query(`INSERT INTO temp_apn_logs (log_text) VALUES ($1)`, [`Batch ${batchId} Exception: ` + String(err.message || err)]);
        }
      }
    }

    revalidatePath(`/apps/${appId}/notifications`);
    return { success: true, batchId };
  } catch (error: any) {
    console.error('Error sending notifications to all:', error);
    return { error: 'Bildirimler gönderilirken bir hata oluştu: ' + error.message };
  }
}

export async function getNotificationHistory(appId: string, page: number = 1, limit: number = 10) {
  try {
    const offset = (page - 1) * limit;

    // Get total count of distinct batches
    const countRes = await db.query(`
      SELECT COUNT(DISTINCT metadata->>'batch_id') as total
      FROM patient_notifications
      WHERE app_id = $1 AND metadata->>'batch_id' IS NOT NULL
    `, [appId]);
    
    const totalCount = parseInt(countRes.rows[0].total) || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const res = await db.query(`
      SELECT 
        metadata->>'batch_id' as batch_id,
        metadata->>'template_id' as template_id,
        metadata->>'template_code' as template_code,
        metadata->>'source' as source,
        channel,
        MAX(sent_at) as sent_at,
        COUNT(*) as total_sent,
        COUNT(read_at) as total_read,
        MAX(title) as sample_title,
        MAX(body) as sample_body
      FROM patient_notifications
      WHERE app_id = $1 AND metadata->>'batch_id' IS NOT NULL
      GROUP BY 
        metadata->>'batch_id',
        metadata->>'template_id',
        metadata->>'template_code',
        metadata->>'source',
        channel
      ORDER BY MAX(sent_at) DESC
      LIMIT $2 OFFSET $3
    `, [appId, limit, offset]);

    return { history: res.rows, totalPages, currentPage: page };
  } catch (error: any) {
    console.error('Error fetching notification history:', error);
    return { error: 'Geçmiş alınırken bir hata oluştu: ' + error.message };
  }
}

