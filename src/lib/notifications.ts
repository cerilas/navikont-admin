import db from './db';
import { sendMail, getHtmlEmailTemplate } from './mail';
import { sendSms } from './sms';

interface TriggerNotificationOptions {
  userId: string;
  appId: string;
  templateCode: string;
  variables: Record<string, string | number>;
}

/**
 * Replaces placeholders like {{key}} in a string template with values from variables object.
 */
function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
}

/**
 * Triggers a notification template, renders its variables, sends it via the configured channel (SMS/Mail),
 * and logs it into the patient_notifications database table.
 */
export async function triggerNotificationTemplate({
  userId,
  appId,
  templateCode,
  variables
}: TriggerNotificationOptions) {
  try {
    const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
    const appName = appRes.rows.length > 0 ? appRes.rows[0].name : 'DiGA Base';

    // 1. Fetch active template from DB
    const templateRes = await db.query(
      `SELECT id, channel, title_template, body_template 
       FROM content_notification_templates 
       WHERE app_id = $1 AND code = $2 AND is_active = true`,
      [appId, templateCode.trim().toLowerCase()]
    );

    if (templateRes.rows.length === 0) {
      console.warn(`[Notification] Active template with code '${templateCode}' not found for appId '${appId}'.`);
      return { success: false, error: 'Şablon bulunamadı veya pasif durumda.' };
    }

    const template = templateRes.rows[0];
    const channel = template.channel;
    
    // 2. Render templates with provided variables
    const renderedTitle = template.title_template ? renderTemplate(template.title_template, variables) : '';
    const renderedBody = renderTemplate(template.body_template, variables);

    // 3. Fetch user details (email and phone)
    const userRes = await db.query(
      'SELECT email, phone, full_name FROM core_users WHERE id = $1',
      [userId]
    );

    if (userRes.rows.length === 0) {
      console.warn(`[Notification] User with id '${userId}' not found.`);
      return { success: false, error: 'Kullanıcı bulunamadı.' };
    }

    const user = userRes.rows[0];
    let sendStatus: 'sent' | 'failed' | 'pending' = 'pending';
    let errorMessage = null;

    // 4. Send notification based on channel type
    if (channel === 'sms') {
      if (user.phone) {
        try {
          await sendSms({
            msg: renderedBody,
            no: user.phone
          });
          sendStatus = 'sent';
        } catch (err: any) {
          console.error(`[Notification] Failed to send SMS to ${user.phone}:`, err);
          sendStatus = 'failed';
          errorMessage = err.message;
        }
      } else {
        console.warn(`[Notification] User ${userId} does not have a phone number configured.`);
        sendStatus = 'failed';
        errorMessage = 'Telefon numarası tanımlı değil.';
      }
    } 
    else if (channel === 'email') {
      if (user.email) {
        try {
          await sendMail({
            to: user.email,
            subject: renderedTitle || 'Bildirim',
            html: getHtmlEmailTemplate(
              renderedTitle || 'Yeni Bildirim',
              `<p>${renderedBody}</p>`,
              undefined,
              undefined,
              appName
            )
          });
          sendStatus = 'sent';
        } catch (err: any) {
          console.error(`[Notification] Failed to send Email to ${user.email}:`, err);
          sendStatus = 'failed';
          errorMessage = err.message;
        }
      } else {
        console.warn(`[Notification] User ${userId} does not have an email configured.`);
        sendStatus = 'failed';
        errorMessage = 'E-posta adresi tanımlı değil.';
      }
    } 
    else if (channel === 'push' || channel === 'in_app') {
      // Push and in-app notifications are saved to database.
      // The patient's mobile application API will fetch pending/unread entries from patient_notifications.
      sendStatus = 'sent'; // Marked as sent to queue/ready to fetch
    }

    // 5. Log notification into patient_notifications table
    const notificationId = crypto.randomUUID();
    await db.query(
      `INSERT INTO patient_notifications 
       (id, user_id, app_id, channel, title, body, status, scheduled_at, sent_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)`,
      [
        notificationId,
        userId,
        appId,
        channel,
        renderedTitle || null,
        renderedBody,
        sendStatus,
        sendStatus === 'sent' ? new Date() : null,
        errorMessage ? JSON.stringify({ error: errorMessage }) : null
      ]
    );

    return { 
      success: sendStatus === 'sent', 
      notificationId, 
      channel, 
      status: sendStatus,
      error: errorMessage 
    };

  } catch (error: any) {
    console.error('[Notification] Error in triggerNotificationTemplate:', error);
    return { success: false, error: error.message };
  }
}
