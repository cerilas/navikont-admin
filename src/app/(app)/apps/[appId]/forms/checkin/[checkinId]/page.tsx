import db from '@/lib/db';
import Link from 'next/link';
import CheckinClient from './CheckinClient';

export default async function CheckinDetailPage({ params }: { params: Promise<{ appId: string, checkinId: string }> }) {
  const { appId, checkinId } = await params;

  // 1. Fetch checkin template
  const res = await db.query(`
    SELECT id, name, description, frequency, streak_enabled, status 
    FROM forms_checkin_templates 
    WHERE id = $1 AND app_id = $2
  `, [checkinId, appId]);

  if (res.rows.length === 0) return <div className="alert alert-danger m-3">Check-in bulunamadı</div>;
  const checkin = res.rows[0];

  // 2. Fetch latest version to get fields
  const vRes = await db.query(`
    SELECT id FROM forms_checkin_template_versions
    WHERE checkin_template_id = $1
    ORDER BY version_number DESC LIMIT 1
  `, [checkin.id]);

  let fields = [];
  if (vRes.rows.length > 0) {
    const versionId = vRes.rows[0].id;
    const fRes = await db.query(`
      SELECT id, field_key, field_type, label, unit, is_required
      FROM forms_checkin_fields
      WHERE checkin_template_version_id = $1
      ORDER BY sort_order ASC
    `, [versionId]);
    fields = fRes.rows;
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                <Link href={`/apps/${appId}/forms`} className="text-muted d-inline-flex align-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon me-1" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
                  Geri Dön
                </Link>
              </div>
              <h2 className="page-title">
                Check-in Düzenle: {checkin.name}
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="d-flex gap-2">
                {checkin.status === 'draft' && <span className="badge bg-secondary text-secondary-fg fs-5">Taslak</span>}
                {checkin.status === 'published' && <span className="badge bg-success text-success-fg fs-5">Yayında</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <CheckinClient appId={appId} checkin={checkin} initialFields={fields} />
        </div>
      </div>
    </>
  );
}
