import db from '@/lib/db';
import Link from 'next/link';
import { IconBrandApple, IconBrandAndroid, IconWorld } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function AppSelectionPage() {
  const appsRes = await db.query(`
    SELECT 
      a.*, 
      d.name as disease_name,
      u.full_name as medical_director_name,
      (SELECT COUNT(*) FROM content_modules m WHERE m.app_id = a.id AND m.deleted_at IS NULL) as module_count,
      (SELECT COUNT(*) FROM content_journeys j WHERE j.app_id = a.id AND j.deleted_at IS NULL) as journey_count
    FROM content_apps a 
    LEFT JOIN medical_diseases d ON a.disease_id = d.id 
    LEFT JOIN core_users u ON a.medical_director_id = u.id
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

                          {/* App Metrics & Details */}
                          <div className="mt-3 border-top pt-3">
                            <div className="row g-3">
                              {/* Modules & Journeys */}
                              <div className="col-6">
                                <div className="text-muted small" style={{ fontSize: '11px', fontWeight: 600 }}>İçerik Sayıları</div>
                                <div className="mt-1 d-flex flex-column gap-1">
                                  <span>
                                    <span className="badge bg-blue-lt me-1">{app.module_count || 0}</span> 
                                    <span className="text-muted small">Modül</span>
                                  </span>
                                  <span>
                                    <span className="badge bg-purple-lt me-1">{app.journey_count || 0}</span> 
                                    <span className="text-muted small">Akış</span>
                                  </span>
                                </div>
                              </div>
                              
                              {/* Sorumlu Hekim */}
                              <div className="col-6">
                                <div className="text-muted small" style={{ fontSize: '11px', fontWeight: 600 }}>Sorumlu Hekim</div>
                                <div className="mt-1 fw-medium text-dark text-truncate" style={{ fontSize: '13px' }} title={app.medical_director_name || 'Atanmamış'}>
                                  {app.medical_director_name || <span className="text-muted small italic">Atanmamış</span>}
                                </div>
                              </div>

                              {/* Platformlar */}
                              {app.supported_platforms && Array.isArray(app.supported_platforms) && app.supported_platforms.length > 0 && (
                                <div className="col-12 mt-2 pt-2 border-top-0">
                                  <div className="text-muted small mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>Desteklenen Platformlar</div>
                                  <div className="d-flex gap-2 align-items-center flex-wrap">
                                    {app.supported_platforms.map((plat: string) => {
                                      const label = plat === 'ios' ? 'iOS' : plat === 'android' ? 'Android' : plat === 'huawei' ? 'Huawei' : plat === 'web' ? 'Web' : plat;
                                      
                                      let logoSrc = '';
                                      if (plat === 'ios') {
                                        logoSrc = '/platform-logolar/2.png';
                                      } else if (plat === 'android') {
                                        logoSrc = '/platform-logolar/3.png';
                                      } else if (plat === 'huawei') {
                                        logoSrc = '/platform-logolar/1.png';
                                      }

                                      if (logoSrc) {
                                        return (
                                          <img 
                                            key={plat} 
                                            src={logoSrc} 
                                            alt={label} 
                                            title={label} 
                                            className="rounded border p-1 bg-white" 
                                            style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                                          />
                                        );
                                      }

                                      return (
                                        <span 
                                          key={plat} 
                                          title={label}
                                          className="rounded border p-1 bg-white d-inline-flex align-items-center justify-content-center text-muted"
                                          style={{ width: '28px', height: '28px' }}
                                        >
                                          <IconWorld size={16} />
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
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
