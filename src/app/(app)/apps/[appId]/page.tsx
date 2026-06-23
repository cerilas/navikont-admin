import db from '@/lib/db';

export default async function AppDashboardPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  // Fetch app details
  const appRes = await db.query('SELECT * FROM content_apps WHERE id = $1', [appId]);
  const app = appRes.rows[0];

  if (!app) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger">Uygulama bulunamadı.</div>
        </div>
      </div>
    );
  }

  // Fetch modules count
  const modulesRes = await db.query('SELECT COUNT(*) FROM content_modules WHERE app_id = $1', [appId]);
  const moduleCount = modulesRes.rows[0].count;

  // Fetch patients count
  const patientsRes = await db.query('SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = $1', [appId]);
  const patientCount = patientsRes.rows[0].count;

  // Fetch doctors count
  const doctorsRes = await db.query('SELECT COUNT(DISTINCT doctor_user_id) FROM patient_app_enrollments WHERE app_id = $1 AND doctor_user_id IS NOT NULL', [appId]);
  const doctorCount = doctorsRes.rows[0].count;

  // Fetch automation rules status
  const rulesRes = await db.query('SELECT COUNT(*) FROM core_rules WHERE target_type = $1 AND target_id = $2 AND rule_type = $3 AND is_active = true', ['app', appId, 'onboarding_trigger']);
  const hasAutomation = parseInt(rulesRes.rows[0].count) > 0;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                {app.name} Ana Paneli
              </h2>
              <div className="text-muted mt-1">
                Versiyon: {app.current_version_id || 'Taslak'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-deck row-cards mt-3">
            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Toplam Modül</div>
                  </div>
                  <div className="h1 mb-3">{moduleCount}</div>
                  <div className="d-flex mb-2">
                    <div>Eğitim modülleri ve içerikler</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Kayıtlı Hasta</div>
                  </div>
                  <div className="h1 mb-3">{patientCount}</div>
                  <div className="d-flex mb-2">
                    <div>Bu uygulamayı kullanan hastalar</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Aktif Doktor</div>
                  </div>
                  <div className="h1 mb-3">{doctorCount}</div>
                  <div className="d-flex mb-2">
                    <div>Bu uygulamaya hasta atayanlar</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="subheader">Otomasyon Durumu</div>
                  </div>
                  <div className="h3 mb-3 mt-1">
                    {hasAutomation ? (
                      <span className="badge bg-green text-green-fg">Aktif</span>
                    ) : (
                      <span className="badge bg-secondary text-secondary-fg">Pasif</span>
                    )}
                  </div>
                  <div className="d-flex mb-2">
                    <div className="text-muted small">Anket skoruna göre otomatik atama kuralları</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
