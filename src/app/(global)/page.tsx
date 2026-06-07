import db from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AppSelectionPage() {
  const appsRes = await db.query(`
    SELECT a.*, d.name as disease_name 
    FROM content_apps a 
    LEFT JOIN medical_diseases d ON a.disease_id = d.id 
    ORDER BY a.created_at DESC
  `);
  const apps = appsRes.rows;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Uygulama Seçimi
              </h2>
              <div className="text-muted mt-1">
                Yönetmek istediğiniz DiGA uygulamasını seçin
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href="/settings/apps/new" className="btn btn-primary d-none d-sm-inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  Yeni Uygulama Ekle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards mt-3">
            {apps.length === 0 ? (
              <div className="col-12">
                <div className="empty" style={{ padding: '5rem 0', backgroundColor: 'transparent' }}>
                  <div className="empty-img mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-apps text-muted opacity-50" width="80" height="80" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M4 4h6v6h-6z" />
                      <path d="M14 4h6v6h-6z" />
                      <path d="M4 14h6v6h-6z" />
                      <path d="M14 14h6v6h-6z" />
                    </svg>
                  </div>
                  <p className="empty-title h3 font-weight-medium">Henüz bir uygulama bulunmuyor</p>
                  <p className="empty-subtitle text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    Sistemde oluşturulmuş hiçbir DiGA uygulaması yok. Yeni bir uygulama ekleyerek hemen başlayabilirsiniz.
                  </p>
                  <div className="empty-action mt-4">
                    <Link href="/settings/apps/new" className="btn btn-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                      İlk Uygulamayı Ekle
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              apps.map(app => (
                <div className="col-md-6 col-lg-4" key={app.id}>
                  <div className="card">
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col">
                          <h3 className="card-title mb-1">
                            <span className="me-2 fs-2">{app.icon_emoji || '📱'}</span>
                            <Link href={`/apps/${app.id}`} className="text-reset">{app.name}</Link>
                          </h3>
                          {app.motto && (
                            <div className="text-muted fw-bold mb-1">{app.motto}</div>
                          )}
                          <div className="text-muted small mb-2">
                            {app.short_description || `Hastalık: ${app.disease_name || 'Belirtilmemiş'}`}
                          </div>
                          <div className="mt-3">
                            <div className="row g-2 align-items-center">
                              <div className="col-auto">
                                {app.status === 'published' ? (
                                  <span className="status status-green">Yayında</span>
                                ) : (
                                  <span className="status status-orange">Taslak</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-flex">
                        <Link href={`/apps/${app.id}`} className="btn btn-primary ms-auto">
                          Yönet
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
