import db from '@/lib/db';
import Link from 'next/link';
import CreateFormButton from './CreateFormButton';
import CreateCheckinButton from './CreateCheckinButton';
import DeleteCheckinButton from './DeleteCheckinButton';

export default async function FormsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  // 1. Fetch app name
  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  if (appRes.rows.length === 0) return <div className="alert alert-danger m-3">App not found</div>;
  const app = appRes.rows[0];

  // 2. Fetch questionnaires
  const formsRes = await db.query(`
    SELECT id, name, description, questionnaire_type, status, created_at, updated_at 
    FROM forms_questionnaires 
    WHERE app_id = $1 AND status != 'archived'
    ORDER BY created_at DESC
  `, [appId]);
  
  const forms = formsRes.rows;

  // 3. Fetch checkins
  const checkinsRes = await db.query(`
    SELECT id, name, description, frequency, status, created_at, updated_at 
    FROM forms_checkin_templates 
    WHERE app_id = $1 AND status != 'archived'
    ORDER BY created_at DESC
  `, [appId]);
  
  const checkins = checkinsRes.rows;

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
                Anketler ve Ölçekler
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <CreateCheckinButton appId={appId} />
                <CreateFormButton appId={appId} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Kayıtlı Formlar ({forms.length})</h3>
            </div>
            
            {forms.length === 0 ? (
              <div className="card-body text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-3" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" /><path d="M9 9h1" /><path d="M9 13h6" /><path d="M9 17h6" /></svg>
                <h3 className="text-muted">Henüz hiç anket oluşturulmamış</h3>
                <p className="text-secondary">Sağ üstteki "Yeni Anket Oluştur" butonuna tıklayarak ilk formunuzu tasarlamaya başlayın.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Form Adı</th>
                      <th>Tür</th>
                      <th>Durum</th>
                      <th>Son Güncelleme</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {forms.map(form => (
                      <tr key={form.id}>
                        <td>
                          <div className="font-weight-medium">{form.name}</div>
                          <div className="text-secondary small text-truncate" style={{maxWidth: '300px'}}>{form.description}</div>
                        </td>
                        <td className="text-secondary">
                          {form.questionnaire_type === 'assessment' ? 'Değerlendirme (Ölçek)' : form.questionnaire_type}
                        </td>
                        <td>
                          {form.status === 'draft' && <span className="badge bg-secondary text-secondary-fg">Taslak</span>}
                          {form.status === 'published' && <span className="badge bg-success text-success-fg">Yayında</span>}
                        </td>
                        <td className="text-secondary">
                          {new Date(form.updated_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="text-end">
                          <Link href={`/apps/${appId}/forms/${form.id}`} className="btn btn-sm btn-outline-primary">Düzenle</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <h3 className="card-title">Kayıtlı Check-in Şablonları ({checkins.length})</h3>
            </div>
            
            {checkins.length === 0 ? (
              <div className="card-body text-center py-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon text-muted mb-3" width="48" height="48" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 11l3 3l8 -8" /><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" /></svg>
                <h3 className="text-muted">Henüz hiç check-in oluşturulmamış</h3>
                <p className="text-secondary">Sağ üstteki "Yeni Check-in Oluştur" butonuna tıklayarak yeni bir check-in üretin.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table card-table table-vcenter text-nowrap datatable">
                  <thead>
                    <tr>
                      <th>Check-in Kodu / Adı</th>
                      <th>Sıklık</th>
                      <th>Durum</th>
                      <th>Son Güncelleme</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.map(checkin => (
                      <tr key={checkin.id}>
                        <td>
                          <div className="font-weight-medium">{checkin.name}</div>
                          <div className="text-secondary small text-truncate" style={{maxWidth: '300px'}}>{checkin.description}</div>
                        </td>
                        <td className="text-secondary">
                          {checkin.frequency === 'daily' ? 'Günlük' : checkin.frequency === 'weekly' ? 'Haftalık' : 'Özel'}
                        </td>
                        <td>
                          {checkin.status === 'draft' && <span className="badge bg-secondary text-secondary-fg">Taslak</span>}
                          {checkin.status === 'published' && <span className="badge bg-success text-success-fg">Yayında</span>}
                        </td>
                        <td className="text-secondary">
                          {new Date(checkin.updated_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="text-end">
                          <Link href={`/apps/${appId}/forms/checkin/${checkin.id}`} className="btn btn-sm btn-outline-primary">Düzenle</Link>
                          <DeleteCheckinButton appId={appId} checkinId={checkin.id} />
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
