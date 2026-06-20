import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendNotificationToAll } from '@/app/actions/notifications';

// This endpoint allows cron-job.org to trigger a notification template for all active patients.
// Usage: GET /api/webhooks/trigger-notification?appId=...&code=...&secret=...

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const appId = searchParams.get('appId');
  const code = searchParams.get('code');
  const secret = searchParams.get('secret');

  // 1. Verify Secret
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing secret' }, { status: 401 });
  }

  if (!appId || !code) {
    return NextResponse.json({ error: 'Missing appId or code parameters' }, { status: 400 });
  }

  try {
    // 2. Find the template by code and appId
    const templateRes = await db.query(
      'SELECT id, channel, title_template, body_template, is_active FROM content_notification_templates WHERE app_id = $1 AND code = $2',
      [appId, code]
    );

    if (templateRes.rows.length === 0) {
      return NextResponse.json({ error: `Template not found for code '${code}'` }, { status: 404 });
    }

    const template = templateRes.rows[0];

    // Check if template is active
    if (!template.is_active) {
      return NextResponse.json({ error: `Template '${code}' is not active` }, { status: 400 });
    }

    const templateId = template.id;

    // 3. Insert notifications and send Push via sendNotificationToAll
    const result = await sendNotificationToAll(appId, templateId, 'auto');

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully triggered notifications for template '${code}'`,
      batchId: result.batchId
    });
    
  } catch (error: any) {
    console.error('Error triggering cron notification:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
