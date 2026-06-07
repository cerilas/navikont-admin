import db from '@/lib/db';
import Link from 'next/link';
import DeleteModuleForm from './DeleteModuleForm';

export default async function ModulesPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  const appName = appRes.rows[0]?.name || 'Uygulama';

  const modulesRes = await db.query(`
    SELECT m.*, t.name as type_name
    FROM content_modules m
    LEFT JOIN content_module_types t ON m.module_type_id = t.id
    WHERE m.app_id = $1 AND m.deleted_at IS NULL
    ORDER BY m.created_at DESC
  `, [appId]);
  
  const modules = modulesRes.rows;

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
                Modül Kütüphanesi
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/modules/new`} className="btn btn-primary d-none d-sm-inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  Yeni Modül Ekle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card mt-3">
            {modules.length === 0 ? (
              <div className="empty" style={{ padding: '4rem 0', backgroundColor: 'transparent' }}>
                <div className="empty-img mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-books text-muted opacity-50" width="80" height="80" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M5 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
                    <path d="M9 4m0 1a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1z" />
                    <path d="M5 8h4" />
                    <path d="M9 16h4" />
                    <path d="M13.803 4.56l2.184 -.53c.562 -.135 1.133 .19 1.282 .732l3.695 13.418a1.02 1.02 0 0 1 -.634 1.219l-.133 .041l-2.184 .53c-.562 .135 -1.133 -.19 -1.282 -.732l-3.695 -13.418a1.02 1.02 0 0 1 .634 -1.219l.133 -.041z" />
                    <path d="M14 9l4 -1" />
                    <path d="M16 16l3.923 -.98" />
                  </svg>
                </div>
                <p className="empty-title h3 font-weight-medium">Kütüphaneniz şu an boş</p>
                <p className="empty-subtitle text-muted" style={{ maxWidth: '400px', margin: '0 auto' }}>
                  Uygulamanız için içerik (Video, Anket, HTML Metin) oluşturmak için yeni bir modül ekleyin.
                </p>
                <div className="empty-action mt-4">
                  <Link href={`/apps/${appId}/modules/new`} className="btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                    İlk Modülü Ekle
                  </Link>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-vcenter card-table">
                  <thead>
                    <tr>
                      <th>Modül Adı</th>
                      <th>Modül Tipi</th>
                      <th>Durum</th>
                      <th>Eklenme Tarihi</th>
                      <th className="w-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map(m => (
                      <tr key={m.id}>
                        <td>
                          <div className="d-flex py-1 align-items-center">
                            <div className="flex-fill">
                              <div className="font-weight-medium">{m.name}</div>
                              <div className="text-muted"><small>{m.internal_name || '-'}</small></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-blue-lt">{m.type_name || 'Bilinmiyor'}</span>
                        </td>
                        <td className="text-muted">
                          {m.status === 'published' ? <span className="status status-green">Yayında</span> : <span className="status status-orange">Taslak</span>}
                        </td>
                        <td className="text-muted">
                          {new Date(m.created_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td>
                          <div className="d-flex">
                            <Link href={`/apps/${appId}/modules/${m.id}`} className="btn btn-sm">Düzenle</Link>
                            <DeleteModuleForm appId={appId} moduleId={m.id} />
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
