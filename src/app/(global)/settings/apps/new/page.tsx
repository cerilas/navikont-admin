import db from '@/lib/db';
import Link from 'next/link';
import AppForm from './AppForm';

export default async function NewAppPage() {
  const diseasesRes = await db.query('SELECT id, name FROM medical_diseases ORDER BY name ASC');
  const diseases = diseasesRes.rows;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Yeni Uygulama Ekle
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href="/" className="btn btn-link">
                  İptal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Uygulama Bilgileri</h3>
                </div>
                {diseases.length === 0 ? (
                  <div className="card-body">
                    <div className="alert alert-warning">
                      Sistemde henüz bir "Hastalık" tanımlanmamış. Bir uygulama oluşturabilmek için önce bir hastalık eklemelisiniz.
                    </div>
                    <Link href="/settings/diseases" className="btn btn-primary">Hastalık Yönetimine Git</Link>
                  </div>
                ) : (
                  <AppForm diseases={diseases} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
