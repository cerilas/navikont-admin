import db from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DoctorRootPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  
  if (!sessionCookie) redirect('/login');
  
  let session;
  try {
    session = await decrypt(sessionCookie);
  } catch (e) {
    redirect('/login');
  }

  // Double check authorization
  if (session.user_type !== 'doctor') {
    redirect('/');
  }

  // Fetch apps assigned to this doctor
  const appsRes = await db.query(`
    SELECT a.id, a.name, a.icon_emoji, a.short_description, d.name as disease_name
    FROM content_apps a
    JOIN doctor_apps da ON a.id = da.app_id
    LEFT JOIN medical_diseases d ON a.disease_id = d.id
    WHERE da.doctor_user_id = $1 AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `, [session.id]);

  const apps = appsRes.rows;

  // Auto redirect if exactly one app
  if (apps.length === 1) {
    redirect(`/dr/apps/${apps[0].id}/patients`);
  }

  return (
    <div className="page">
      <Header hideLogo={true} />
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title">
                  Doktor Portalı
                </h2>
                <div className="text-muted mt-1">
                  Lütfen hastalarını görüntülemek istediğiniz uygulamayı seçin
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-stethoscope text-muted opacity-50" width="80" height="80" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M6 4h-1a2 2 0 0 0 -2 2v3.5h0a5.5 5.5 0 0 0 11 0v-3.5a2 2 0 0 0 -2 -2h-1" />
                        <path d="M8 15a6 6 0 1 0 12 0v-3" />
                        <path d="M11 3v2" />
                        <path d="M6 3v2" />
                        <circle cx="20" cy="10" r="2" />
                      </svg>
                    </div>
                    <p className="empty-title h3 font-weight-medium">Size atanmış bir uygulama bulunmuyor</p>
                    <p className="empty-subtitle text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                      Henüz hiçbir DiGA uygulaması için yetkilendirilmemişsiniz. Lütfen sistem yöneticinizle iletişime geçin.
                    </p>
                  </div>
                </div>
              ) : (
                apps.map(app => (
                  <div className="col-md-6 col-lg-4" key={app.id}>
                    <div className="card h-100 app-card status-published">
                      <div className="card-body d-flex flex-column">
                        <div className="d-flex align-items-start gap-3 mb-3">
                          <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{app.icon_emoji || '📱'}</div>
                          <div className="flex-fill overflow-hidden">
                            <h3 className="card-title mb-1 text-truncate">
                              <Link href={`/dr/apps/${app.id}/patients`} className="text-reset">{app.name}</Link>
                            </h3>
                            <div className="text-muted small">
                              {app.short_description || `Hastalık: ${app.disease_name || 'Belirtilmemiş'}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer p-2 bg-transparent border-top-0">
                        <Link href={`/dr/apps/${app.id}/patients`} className="btn btn-primary w-100">
                          Hastaları Görüntüle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    Copyright &copy; 2026
                    <a href="." className="link-secondary ms-1">Navikont</a>.
                    All rights reserved.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
