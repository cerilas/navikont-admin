import { query } from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const LANG_LABELS: Record<string, { label: string; flag: string }> = {
  tr: { label: 'Türkçe', flag: '🇹🇷' },
  en: { label: 'İngilizce', flag: '🇬🇧' },
  de: { label: 'Almanca', flag: '🇩🇪' },
};

export default async function AppsPage() {
  let apps: any[] = [];

  try {
    const res = await query(`
      SELECT 
        a.id, a.name, a.slug, a.status, a.icon_emoji, a.motto, a.disease_id,
        a.default_duration_days, a.deleted_at,
        d.name as disease_name,
        to_json(COALESCE(a.supported_languages, ARRAY['tr']::text[])) as supported_languages,
        to_json(COALESCE(a.supported_platforms, ARRAY[]::text[])) as supported_platforms,
        (SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = a.id) as patient_count,
        (SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = a.id AND status = 'active') as active_patient_count,
        (SELECT COUNT(DISTINCT doctor_user_id) FROM patient_app_enrollments WHERE app_id = a.id AND doctor_user_id IS NOT NULL) as doctor_count,
        (SELECT COUNT(*) FROM content_journeys cj WHERE cj.app_id = a.id AND cj.deleted_at IS NULL) as journey_count
      FROM content_apps a
      LEFT JOIN medical_diseases d ON a.disease_id = d.id
      WHERE a.deleted_at IS NULL
      ORDER BY a.created_at DESC
    `);
    apps = res.rows;
  } catch (e) {
    console.error('Error fetching apps:', e);
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">Uygulama Yönetimi</h2>
              <div className="text-muted mt-1">{apps.length} uygulama kayıtlı</div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <Link href="/settings/apps/new" className="btn btn-primary d-none d-sm-inline-block">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                Yeni Uygulama
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          {apps.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📱</div>
              <p className="empty-title">Henüz uygulama yok</p>
              <p className="empty-subtitle text-muted">İlk uygulamanızı oluşturun.</p>
              <div className="empty-action">
                <Link href="/settings/apps/new" className="btn btn-primary">Uygulama Oluştur</Link>
              </div>
            </div>
          ) : (
            <div className="row row-cards">
              {apps.map((app: any) => {
                const langs: string[] = app.supported_languages || ['tr'];
                const isPublished = app.status === 'published';
                return (
                  <div key={app.id} className="col-md-6 col-xl-4">
                    <div className="card h-100" style={{ transition: 'box-shadow .15s', borderTop: isPublished ? '3px solid #2fb344' : '3px solid #f59f00' }}>
                      <div className="card-body">
                        {/* Header */}
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div className="fs-1 lh-1" style={{ fontSize: '2.5rem' }}>{app.icon_emoji || '📱'}</div>
                          <div className="flex-fill overflow-hidden">
                            <div className="d-flex align-items-center gap-2">
                              <h3 className="card-title mb-0 text-truncate">{app.name}</h3>
                              <span className={`badge ${isPublished ? 'bg-success-lt text-success' : 'bg-warning-lt text-warning'}`}>
                                {isPublished ? 'Yayında' : 'Taslak'}
                              </span>
                            </div>
                            <div className="text-muted small mt-1">{app.disease_name || 'Hastalık belirtilmemiş'}</div>
                            {app.motto && <div className="text-secondary small mt-1 fst-italic">&ldquo;{app.motto}&rdquo;</div>}
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="row g-2 mb-3">
                          <div className="col-4 text-center">
                            <div className="p-2 rounded-2" style={{ background: '#f0f9ff' }}>
                              <div className="fw-bold fs-4 text-primary">{app.patient_count || 0}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Kayıtlı Hasta</div>
                            </div>
                          </div>
                          <div className="col-4 text-center">
                            <div className="p-2 rounded-2" style={{ background: '#f0fdf4' }}>
                              <div className="fw-bold fs-4 text-success">{app.active_patient_count || 0}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Aktif Hasta</div>
                            </div>
                          </div>
                          <div className="col-4 text-center">
                            <div className="p-2 rounded-2" style={{ background: '#fdf4ff' }}>
                              <div className="fw-bold fs-4 text-purple">{app.doctor_count || 0}</div>
                              <div className="text-muted" style={{ fontSize: '0.72rem' }}>Kayıtlı Dr.</div>
                            </div>
                          </div>
                        </div>

                        {/* Journey & Duration */}
                        <div className="d-flex gap-3 mb-3 text-muted small">
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"/><path d="M12 7v5l3 3"/></svg>
                            {app.default_duration_days || '?'} gün
                          </span>
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1"><path d="M3 5m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/><path d="M7 15v-6l2 2l2 -2v6"/><path d="M14 13v-4"/><path d="M17 13v-4"/></svg>
                            {app.journey_count || 0} akış
                          </span>
                        </div>

                        {/* Languages */}
                        <div className="d-flex align-items-center gap-1 flex-wrap">
                          {langs.map(lang => {
                            const info = LANG_LABELS[lang];
                            return info ? (
                              <span key={lang} className="badge bg-light text-dark border" title={info.label}>
                                {info.flag} {info.label}
                              </span>
                            ) : (
                              <span key={lang} className="badge bg-light text-dark border">{lang}</span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="card-footer d-flex gap-2">
                        <Link href={`/apps/${app.id}`} className="btn btn-sm btn-primary flex-fill">
                          Yönet
                        </Link>
                        <Link href={`/apps/${app.id}/settings`} className="btn btn-sm btn-outline-secondary">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94-1.543.826-3.31 2.37-2.37c1 .608 2.296.07 2.572-1.065z"/><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
