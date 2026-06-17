import db from '@/lib/db';
import NotificationsClient from './NotificationsClient';
import { getNotificationHistory } from '@/app/actions/notifications';

export default async function NotificationsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  // 1. Fetch app name
  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  if (appRes.rows.length === 0) {
    return <div className="alert alert-danger m-3">Uygulama bulunamadı</div>;
  }
  const app = appRes.rows[0];

  // 2. Fetch existing notification templates
  const templatesRes = await db.query(
    `SELECT id, code, channel, title_template, body_template, variables, is_active 
     FROM content_notification_templates 
     WHERE app_id = $1 
     ORDER BY created_at DESC`,
    [appId]
  );
  
  const initialTemplates = templatesRes.rows.map(row => ({
    id: row.id,
    code: row.code,
    channel: row.channel,
    title_template: row.title_template || '',
    body_template: row.body_template,
    variables: Array.isArray(row.variables) ? row.variables : JSON.parse(row.variables || '[]'),
    is_active: row.is_active
  }));

  // 3. Fetch Notification History
  const historyRes = await getNotificationHistory(appId);
  const initialHistory = historyRes.history || [];

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                {app.name}
              </div>
              <h2 className="page-title">
                Bildirim Yönetimi
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <NotificationsClient 
            appId={appId}
            initialTemplates={initialTemplates}
            initialHistory={initialHistory}
          />
        </div>
      </div>
    </>
  );
}
