import Link from 'next/link';
import JourneyForm from './JourneyForm';

export default async function NewJourneyPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Yeni Akış Ekle
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/journeys`} className="btn btn-link">
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
                  <h3 className="card-title">Akış Bilgileri</h3>
                </div>
                <JourneyForm appId={appId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
