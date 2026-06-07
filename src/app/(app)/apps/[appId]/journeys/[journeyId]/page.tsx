import db from '@/lib/db';
import Link from 'next/link';
import JourneyBuilderClient from './JourneyBuilderClient';

export default async function JourneyBuilderPage({ params }: { params: Promise<{ appId: string, journeyId: string }> }) {
  const { appId, journeyId } = await params;

  // Fetch Journey
  const journeyRes = await db.query('SELECT * FROM content_journeys WHERE id = $1 AND app_id = $2', [journeyId, appId]);
  const journey = journeyRes.rows[0];

  if (!journey) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger">Akış bulunamadı.</div>
          <Link href={`/apps/${appId}/journeys`} className="btn btn-primary">Geri Dön</Link>
        </div>
      </div>
    );
  }

  // Fetch steps
  const stepsRes = await db.query(`
    SELECT s.*, m.name as module_name, t.name as module_type_name
    FROM content_journey_steps s
    JOIN content_modules m ON s.module_id = m.id
    LEFT JOIN content_module_types t ON m.module_type_id = t.id
    WHERE s.journey_id = $1
    ORDER BY s.day_number ASC, s.order_in_day ASC
  `, [journeyId]);
  const initialSteps = stepsRes.rows;

  // Fetch all modules to populate the dropdowns
  const modulesRes = await db.query(`
    SELECT m.id, m.name, t.name as type_name 
    FROM content_modules m
    LEFT JOIN content_module_types t ON m.module_type_id = t.id
    WHERE m.app_id = $1 AND m.deleted_at IS NULL AND m.status != 'archived'
    ORDER BY m.name ASC
  `, [appId]);
  const modules = modulesRes.rows;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                Akış Tasarımcısı
              </div>
              <h2 className="page-title">
                {journey.name} {journey.is_default && <span className="badge bg-green-lt ms-2">Varsayılan</span>}
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/journeys/${journeyId}/settings`} className="btn btn-outline-primary d-none d-md-inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
                  Akış Ayarları
                </Link>
                <Link href={`/apps/${appId}/journeys`} className="btn btn-link">
                  Geri Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row mb-3">
            <div className="col-12">
              <div className="alert alert-info">
                Hastaların her gün tamamlaması gereken görevleri (modülleri) buradan gün gün atayabilirsiniz. Eklenen görevler otomatik olarak kaydedilir.
              </div>
            </div>
          </div>
          
          <JourneyBuilderClient journey={journey} initialSteps={initialSteps} modules={modules} />
        </div>
      </div>
    </>
  );
}
