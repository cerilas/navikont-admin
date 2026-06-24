import db from '@/lib/db';
import Link from 'next/link';
import { IconBrandApple, IconBrandAndroid, IconWorld } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function AppSelectionPage() {
  const appsRes = await db.query(`
    SELECT 
      a.*, 
      to_json(COALESCE(a.supported_languages, ARRAY['tr']::text[])) as supported_languages,
      COALESCE(a.supported_platforms, '[]'::jsonb) as supported_platforms,
      d.name as disease_name,
      u.full_name as medical_director_name,
      (SELECT COUNT(*) FROM content_modules m WHERE m.app_id = a.id AND m.deleted_at IS NULL) as module_count,
      (SELECT COUNT(*) FROM content_journeys j WHERE j.app_id = a.id AND j.deleted_at IS NULL) as journey_count,
      (SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = a.id) as patient_count,
      (SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = a.id AND status = 'active') as active_patient_count,
      (SELECT COUNT(DISTINCT doctor_user_id) FROM patient_app_enrollments WHERE app_id = a.id AND doctor_user_id IS NOT NULL) as doctor_count
    FROM content_apps a 
    LEFT JOIN medical_diseases d ON a.disease_id = d.id 
    LEFT JOIN core_users u ON a.medical_director_id = u.id
    ORDER BY patient_count DESC, a.created_at DESC
  `);
  const apps = appsRes.rows;

  const LANG_LABELS: Record<string, { label: string; flag: string }> = {
    tr: { label: 'Türkçe', flag: '🇹🇷' },
    en: { label: 'İngilizce', flag: '🇬🇧' },
    de: { label: 'Almanca', flag: '🇩🇪' },
  };

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

      <style dangerouslySetInnerHTML={{__html: `
        .app-card {
          transition: all 0.2s ease-in-out;
          border-top: 3px solid transparent;
        }
        .app-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
        }
        .app-card.status-published { border-top-color: #2fb344; }
        .app-card.status-draft { border-top-color: #f59f00; }
        .stat-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          height: 100%;
          border: 1px solid #f1f3f5;
        }
        .stat-value { font-size: 1.25rem; font-weight: 700; line-height: 1.2; margin-bottom: 2px; }
        .stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; color: #6c7a89; font-weight: 600; }
      `}} />

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
                  <div className={`card h-100 app-card status-${app.status}`}>
                    <div className="card-body d-flex flex-column">
                      
                      {/* Header */}
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div 
                          className="bg-light border shadow-sm flex-shrink-0" 
                          style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '12px',
                            backgroundImage: app.logo_url ? `url(${app.logo_url})` : 'url(/placeholder-app.svg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                        <div className="flex-fill overflow-hidden">
                          <h3 className="card-title mb-1 text-truncate">
                            <Link href={`/apps/${app.id}`} className="text-reset">{app.name}</Link>
                          </h3>
                          <div className="text-muted small">
                            {app.short_description || `Hastalık: ${app.disease_name || 'Belirtilmemiş'}`}
                          </div>
                          {app.motto && (
                            <div className="text-secondary small mt-1 fst-italic text-truncate">&ldquo;{app.motto}&rdquo;</div>
                          )}
                        </div>
                      </div>

                      {/* Flex spacer to push metrics to bottom */}
                      <div className="flex-grow-1"></div>

                      {/* Stats Grid */}
                      <div className="row g-2 mt-3">
                        <div className="col-4">
                          <div className="stat-box" style={{ backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }}>
                            <div className="stat-value text-primary">{app.patient_count || 0}</div>
                            <div className="stat-label">Hasta</div>
                            {app.active_patient_count > 0 && <div style={{fontSize: '10px', color: '#0ea5e9'}}>{app.active_patient_count} aktif</div>}
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="stat-box" style={{ backgroundColor: '#fdf4ff', borderColor: '#fae8ff' }}>
                            <div className="stat-value text-purple">{app.doctor_count || 0}</div>
                            <div className="stat-label">Doktor</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="stat-box" style={{ backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}>
                            <div className="stat-value text-success">{app.module_count || 0}</div>
                            <div className="stat-label">Modül</div>
                            {app.journey_count > 0 && <div style={{fontSize: '10px', color: '#22c55e'}}>{app.journey_count} akış</div>}
                          </div>
                        </div>
                      </div>

                      {/* Sorumlu Hekim & Durum */}
                      <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                        <div>
                          <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>Sorumlu Hekim</div>
                          <div className="text-dark small fw-medium text-truncate" style={{ maxWidth: '140px' }} title={app.medical_director_name || 'Atanmamış'}>
                            {app.medical_director_name || <span className="text-muted italic">Atanmamış</span>}
                          </div>
                        </div>
                        <div>
                          {app.status === 'published' ? (
                            <span className="badge bg-green-lt">Yayında</span>
                          ) : (
                            <span className="badge bg-orange-lt">Taslak</span>
                          )}
                        </div>
                      </div>

                      {/* Platforms & Languages */}
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        
                        {/* Languages */}
                        <div className="d-flex gap-1">
                          {app.supported_languages && Array.isArray(app.supported_languages) && app.supported_languages.map((lang: string) => {
                            const info = LANG_LABELS[lang];
                            return info ? (
                              <span key={lang} className="badge bg-light text-dark border p-1" title={info.label} style={{ fontSize: '1.1rem', lineHeight: 1 }}>
                                {info.flag}
                              </span>
                            ) : null;
                          })}
                        </div>

                        {/* Platforms */}
                        <div className="d-flex gap-1">
                          {app.supported_platforms && Array.isArray(app.supported_platforms) && app.supported_platforms.map((plat: string) => {
                            let logoSrc = '';
                            if (plat === 'ios') logoSrc = '/platform-logolar/2.png';
                            else if (plat === 'android') logoSrc = '/platform-logolar/3.png';
                            else if (plat === 'huawei') logoSrc = '/platform-logolar/1.png';
                            
                            return logoSrc ? (
                              <img 
                                key={plat} 
                                src={logoSrc} 
                                alt={plat} 
                                title={plat} 
                                className="rounded border bg-white" 
                                style={{ width: '22px', height: '22px', objectFit: 'contain', padding: '2px' }} 
                              />
                            ) : null;
                          })}
                        </div>

                      </div>
                    </div>

                    <div className="card-footer p-2 bg-transparent border-top-0">
                      <Link href={`/apps/${app.id}`} className="btn btn-primary w-100">
                        Paneli Aç
                      </Link>
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
