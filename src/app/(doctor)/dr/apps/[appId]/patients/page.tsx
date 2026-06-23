import db from '@/lib/db';
import Link from 'next/link';
import InvitePatientForm from '@/app/(app)/apps/[appId]/patients/InvitePatientForm';
import { getBaseUrl } from '@/lib/url';
import PatientsSearch from '@/app/(app)/apps/[appId]/patients/PatientsSearch';
import Pagination from '@/app/(app)/apps/[appId]/patients/Pagination';
import { getDoctors } from '@/app/actions/doctors';

export default async function PatientsPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ appId: string }>,
  searchParams: Promise<{ q?: string, page?: string }>
}) {
  const { appId } = await params;
  const { q, page } = await searchParams;

  const searchQuery = q || '';
  const currentPage = Number(page) || 1;
  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  // 1. Fetch app details
  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  const app = appRes.rows[0];

  if (!app) {
    return <div className="alert alert-danger m-3">Uygulama bulunamadı.</div>;
  }

  // 2. Fetch available journeys for the invite form
  const journeysRes = await db.query('SELECT id, name, is_default FROM content_journeys WHERE app_id = $1 AND deleted_at IS NULL', [appId]);
  const journeys = journeysRes.rows;

  // 2.5 Fetch active rules to see if conditional assignment is configured
  const rulesRes = await db.query(`
    SELECT id FROM core_rules 
    WHERE target_type = 'app' AND target_id = $1 AND rule_type = 'journey_assignment'
    LIMIT 1
  `, [appId]);
  const hasConditionalAssignment = rulesRes.rows.length > 0;

  // 2.6 Fetch doctors for assignment
  const doctors = await getDoctors();

  // 3. Count total patients for pagination
  let countQuery = `
    SELECT COUNT(*) 
    FROM patient_app_enrollments e
    JOIN core_users u ON e.patient_user_id = u.id
    WHERE e.app_id = $1
  `;
  const queryParams: any[] = [appId];

  if (searchQuery) {
    countQuery += ` AND (u.full_name ILIKE $2 OR u.email ILIKE $2)`;
    queryParams.push(`%${searchQuery}%`);
  }

  const countRes = await db.query(countQuery, queryParams);
  const totalItems = parseInt(countRes.rows[0].count, 10);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 4. Fetch paginated and filtered patients
  let patientsSql = `
    SELECT 
      e.id as enrollment_id,
      e.status,
      e.start_date,
      e.progress_percent,
      e.current_day,
      u.full_name,
      u.email,
      u.profile_image,
      j.name as journey_name
    FROM patient_app_enrollments e
    JOIN core_users u ON e.patient_user_id = u.id
    LEFT JOIN content_journeys j ON e.journey_id = j.id
    WHERE e.app_id = $1
  `;

  if (searchQuery) {
    patientsSql += ` AND (u.full_name ILIKE $2 OR u.email ILIKE $2)`;
  }

  patientsSql += ` ORDER BY e.created_at DESC LIMIT $${searchQuery ? 3 : 2} OFFSET $${searchQuery ? 4 : 3}`;
  
  const patientsParams = [...queryParams, itemsPerPage, offset];
  const patientsRes = await db.query(patientsSql, patientsParams);
  
  const patients = patientsRes.rows;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited': return <span className="badge bg-secondary text-secondary-fg">Davet Edildi</span>;
      case 'active': return <span className="badge bg-success text-success-fg">Aktif</span>;
      case 'paused': return <span className="badge bg-warning text-warning-fg">Donduruldu</span>;
      case 'completed': return <span className="badge bg-primary text-primary-fg">Tamamlandı</span>;
      case 'cancelled': return <span className="badge bg-danger text-danger-fg">İptal Edildi</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getProfileImageUrl = (img: string | null) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    if (img.startsWith('data:')) return img;
    if (img.startsWith('/uploads/')) return `${getBaseUrl()}${img}`;
    if (img.startsWith('/9j/')) return `data:image/jpeg;base64,${img}`;
    if (img.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${img}`;
    return `data:image/jpeg;base64,${img}`;
  };

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
                Hastalar
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <InvitePatientForm appId={appId} journeys={journeys} doctors={doctors} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h3 className="card-title m-0">Kayıtlı Hastalar ({totalItems})</h3>
              <div className="col-auto">
                <PatientsSearch />
              </div>
            </div>
            
            {patients.length === 0 ? (
              <div className="card-body text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-3" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4" /><path d="M15 19l2 2l4 -4" /></svg>
                {searchQuery ? (
                  <>
                    <h3 className="text-muted">Arama sonucunda hasta bulunamadı</h3>
                    <p className="text-secondary">"{searchQuery}" aramasıyla eşleşen herhangi bir hasta kaydı yok.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-muted">Bu uygulamaya henüz hasta eklenmemiş</h3>
                    <p className="text-secondary">Sağ üstteki butonu kullanarak hastalarınızı davet etmeye başlayabilirsiniz.</p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table card-table table-vcenter text-nowrap datatable">
                    <thead>
                      <tr>
                        <th>Hasta Adı Soyadı</th>
                        <th>E-posta</th>
                        <th>Atanan Akış (Journey)</th>
                        <th>Başlangıç Tarihi</th>
                        <th>Gün / İlerleme</th>
                        <th>Durum</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => (
                        <tr key={p.enrollment_id}>
                          <td>
                            <div className="d-flex py-1 align-items-center">
                              <span className="avatar me-2" style={{backgroundImage: `url(${getProfileImageUrl(p.profile_image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=random`})`}}></span>
                              <div className="flex-fill">
                                <div className="font-weight-medium">{p.full_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-secondary">
                            {p.email}
                          </td>
                          <td>
                            {p.journey_name || (
                              hasConditionalAssignment ? 
                              <span className="text-muted fst-italic">Koşullu atanacaktır</span> :
                              <span className="text-muted">Belirtilmemiş</span>
                            )}
                          </td>
                          <td>
                            {new Date(p.start_date).toLocaleDateString('tr-TR')}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <span>{p.current_day}. Gün</span>
                              <div className="progress" style={{width: '100px'}}>
                                <div className="progress-bar bg-primary" style={{width: `${p.progress_percent || 0}%`}} role="progressbar" aria-valuenow={p.progress_percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${p.progress_percent}% Complete`}>
                                  <span className="visually-hidden">{p.progress_percent}% Complete</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(p.status)}
                          </td>
                          <td className="text-end">
                            <Link href={`/dr/apps/${appId}/patients/${p.enrollment_id}`} className="btn btn-sm btn-outline-secondary">Detay</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="card-footer d-flex align-items-center">
                    <p className="m-0 text-secondary">
                      Toplam <span>{totalItems}</span> kayıttan <span>{offset + 1}</span> - <span>{Math.min(offset + itemsPerPage, totalItems)}</span> arası gösteriliyor.
                    </p>
                    <Pagination totalPages={totalPages} currentPage={currentPage} />
                  </div>
                )}
              </>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}
