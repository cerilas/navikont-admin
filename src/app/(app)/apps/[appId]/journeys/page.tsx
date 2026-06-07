import db from '@/lib/db';
import Link from 'next/link';
import DeleteJourneyForm from './DeleteJourneyForm';

export default async function JourneysPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  const appName = appRes.rows[0]?.name || 'Uygulama';

  const journeysRes = await db.query(`
    SELECT j.*, 
           (SELECT COUNT(*) FROM content_journey_steps s WHERE s.journey_id = j.id) as step_count
    FROM content_journeys j
    WHERE j.app_id = $1 AND j.deleted_at IS NULL
    ORDER BY j.is_default DESC, j.created_at DESC
  `, [appId]);
  
  const journeys = journeysRes.rows;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                {appName}
              </div>
              <h2 className="page-title">
                Akış Yönetimi
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/journeys/new`} className="btn btn-primary d-none d-sm-inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  Yeni Akış Ekle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card mt-3">
            {journeys.length === 0 ? (
              <div className="empty" style={{ padding: '4rem 0', backgroundColor: 'transparent' }}>
                <div className="empty-img mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-git-merge text-muted opacity-50" width="80" height="80" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M7 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M7 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M17 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M7 8l0 8" />
                    <path d="M7 8a4 4 0 0 0 4 4h4" />
                  </svg>
                </div>
                <p className="empty-title h3 font-weight-medium">Henüz bir akış oluşturulmamış</p>
                <p className="empty-subtitle text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  Hastaların uygulamanızda gün gün hangi modülleri deneyimleyeceğini belirleyen bir akış (journey) oluşturun.
                </p>
                <div className="empty-action mt-4">
                  <Link href={`/apps/${appId}/journeys/new`} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                    İlk Akışı Oluştur
                  </Link>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Akış Adı</th>
                      <th>Tanım</th>
                      <th>Adım Sayısı</th>
                      <th>Durum</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeys.map(j => (
                      <tr key={j.id}>
                        <td>
                          <div className="d-flex py-1 align-items-center">
                            <div className="flex-fill">
                              <div className="font-weight-medium">
                                {j.name}
                                {j.is_default && <span className="badge bg-green-lt ms-2">Varsayılan</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">
                          {j.description || '-'}
                        </td>
                        <td className="text-muted">
                          {j.step_count} Adım
                        </td>
                        <td className="text-muted">
                          {j.status === 'active' ? <span className="status status-green">Aktif</span> : <span className="status status-orange">Taslak</span>}
                        </td>
                        <td>
                          <div className="d-flex">
                            <Link href={`/apps/${appId}/journeys/${j.id}`} className="btn btn-sm btn-primary">Tasarla</Link>
                            {!j.is_default && <DeleteJourneyForm appId={appId} journeyId={j.id} />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
