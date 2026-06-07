import { query } from '@/lib/db';
import Link from 'next/link';

export default async function AppsPage() {
  let apps: any[] = [];
  
  try {
    const res = await query(`
      SELECT a.*, d.name as disease_name 
      FROM content_apps a
      LEFT JOIN medical_diseases d ON a.disease_id = d.id
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
              <h2 className="page-title">
                Uygulama Yönetimi
              </h2>
              <div className="text-muted mt-1">
                {apps.length} uygulama kayıtlı
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href="#" className="btn btn-primary d-none d-sm-inline-block">
                  Yeni Uygulama Ekle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card mt-3">
            <div className="table-responsive">
              <table className="table table-vcenter card-table">
                <thead>
                  <tr>
                    <th>Uygulama Adı</th>
                    <th>Hastalık</th>
                    <th>Süre (Gün)</th>
                    <th>Durum</th>
                    <th className="w-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {apps.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    apps.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="d-flex py-1 align-items-center">
                            <div className="flex-fill">
                              <div className="font-weight-medium">{a.name}</div>
                              <div className="text-muted"><a href="#" className="text-reset">{a.slug}</a></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {a.disease_name}
                        </td>
                        <td className="text-muted">
                          {a.default_duration_days || '-'}
                        </td>
                        <td className="text-muted">
                          {a.status === 'published' ? <span className="status status-green">Yayında</span> : 
                           a.status === 'draft' ? <span className="status status-orange">Taslak</span> : 
                           <span className="status">{a.status}</span>}
                        </td>
                        <td>
                          <Link href={`#`} className="btn btn-sm">Düzenle</Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
