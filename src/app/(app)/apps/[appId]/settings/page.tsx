import db from '@/lib/db';
import AppSettingsForm from './AppSettingsForm';

export default async function AppSettingsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const appRes = await db.query('SELECT * FROM content_apps WHERE id = $1', [appId]);
  const app = appRes.rows[0];

  if (!app) {
    return <div className="alert alert-danger m-3">Uygulama bulunamadı.</div>;
  }

  const diseasesRes = await db.query('SELECT id, name FROM medical_diseases ORDER BY name ASC');
  const diseases = diseasesRes.rows;

  const doctorsRes = await db.query('SELECT id, full_name FROM core_users WHERE user_type = $1 ORDER BY full_name ASC', ['doctor']);
  const doctors = doctorsRes.rows;

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
                Uygulama Temel Ayarları
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-12">
              <AppSettingsForm app={app} diseases={diseases} doctors={doctors} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
