import { query } from '@/lib/db';
import Link from 'next/link';

export default async function DiseasesPage() {
  let diseases: any[] = [];
  
  try {
    const res = await query('SELECT * FROM medical_diseases ORDER BY created_at DESC');
    diseases = res.rows;
  } catch (e) {
    console.error('Error fetching diseases:', e);
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Hastalık Yönetimi
              </h2>
              <div className="text-muted mt-1">
                {diseases.length} hastalık kayıtlı
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href="/settings/diseases/new" className="btn btn-primary d-none d-sm-inline-block">
                  Yeni Hastalık Ekle
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
                    <th>Hastalık Adı</th>
                    <th>ICD Kodu</th>
                    <th>Risk Seviyesi</th>
                    <th>Durum</th>
                    <th className="w-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {diseases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    diseases.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="d-flex py-1 align-items-center">
                            <div className="flex-fill">
                              <div className="font-weight-medium">{d.name}</div>
                              <div className="text-muted"><a href="#" className="text-reset">{d.slug}</a></div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {d.icd_code || '-'}
                        </td>
                        <td className="text-muted">
                          {d.risk_level === 'high' ? <span className="badge bg-red-lt">Yüksek</span> : d.risk_level === 'medium' ? <span className="badge bg-orange-lt">Orta</span> : <span className="badge bg-green-lt">Düşük</span>}
                        </td>
                        <td className="text-muted">
                          {d.status === 'active' ? <span className="status status-green">Aktif</span> : <span className="status">{d.status}</span>}
                        </td>
                        <td>
                          <Link href={`/settings/diseases/${d.id}`} className="btn btn-sm">Düzenle</Link>
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
