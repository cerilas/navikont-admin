import Link from 'next/link';
import DiseaseForm from './DiseaseForm';

export default function NewDiseasePage() {
  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Yeni Hastalık Ekle
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
                  <h3 className="card-title">Hastalık Bilgileri</h3>
                </div>
                <DiseaseForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
