import db from '@/lib/db';
import Link from 'next/link';
import EditDiseaseForm from './EditDiseaseForm';

export default async function EditDiseasePage({ params }: { params: Promise<{ diseaseId: string }> }) {
  const { diseaseId } = await params;

  // Fetch disease details
  const res = await db.query('SELECT * FROM medical_diseases WHERE id = $1', [diseaseId]);
  if (res.rows.length === 0) {
    return <div className="alert alert-danger m-3">Hastalık bulunamadı.</div>;
  }
  const disease = res.rows[0];

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Hastalığı Düzenle
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href="/settings/diseases" className="btn btn-link">
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
                  <h3 className="card-title">Hastalık Bilgileri: {disease.name}</h3>
                </div>
                <EditDiseaseForm disease={disease} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
