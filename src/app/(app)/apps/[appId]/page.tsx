import db from '@/lib/db';
import AppDashboardClient from './AppDashboardClient';

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
  const modulesRes = await db.query('SELECT COUNT(*) FROM content_modules WHERE app_id = $1 AND deleted_at IS NULL', [appId]);
  const moduleCount = modulesRes.rows[0].count;

  // Fetch patients count
  const patientsRes = await db.query('SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = $1', [appId]);
  const patientCount = patientsRes.rows[0].count;

  // Fetch doctors count
  const doctorsRes = await db.query('SELECT COUNT(DISTINCT doctor_user_id) FROM patient_app_enrollments WHERE app_id = $1 AND doctor_user_id IS NOT NULL', [appId]);
  const doctorCount = doctorsRes.rows[0].count;

  // Fetch automation rules status
  const rulesRes = await db.query("SELECT COUNT(*) FROM core_rules WHERE target_type = $1 AND target_id = $2 AND rule_type = 'journey_assignment' AND is_active = true", ['app', appId]);
  const hasAutomation = parseInt(rulesRes.rows[0].count) > 0;

  // --- NEW STATS DATA FETCHING ---
  // 1. Enrollments over time (last 6 months)
  const enrollmentsOverTimeRes = await db.query(`
    SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
    FROM patient_app_enrollments
    WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month ASC
  `, [appId]);

  // 2. Top conditions
  const topConditionsRes = await db.query(`
    SELECT md.name, COUNT(*) as count
    FROM patient_diseases pd
    JOIN patient_app_enrollments pae ON pae.patient_user_id = pd.patient_user_id
    JOIN medical_diseases md ON md.id = pd.disease_id
    WHERE pae.app_id = $1
    GROUP BY md.name
    ORDER BY count DESC
    LIMIT 5
  `, [appId]);

  // 3. Activities: Notifications sent
  const notificationsRes = await db.query(`
    SELECT COUNT(*) FROM patient_notifications
    WHERE app_id = $1
  `, [appId]);

  // Activities: Questionnaires and Checkins
  const moduleProgressRes = await db.query(`
    SELECT cmt.code as type, COUNT(*) as count
    FROM patient_module_progress pmp
    JOIN content_module_versions cmv ON cmv.id = pmp.module_version_id
    JOIN content_modules cm ON cm.id = cmv.module_id
    JOIN content_module_types cmt ON cmt.id = cm.module_type_id
    WHERE pmp.app_id = $1
    GROUP BY cmt.code
  `, [appId]);

  let questionnaires = 0;
  let checkins = 0;
  
  for (const row of moduleProgressRes.rows) {
    if (row.type === 'questionnaire') questionnaires = parseInt(row.count, 10);
    if (row.type === 'checkin') checkins = parseInt(row.count, 10);
  }

  const stats = {
    enrollmentsOverTime: enrollmentsOverTimeRes.rows,
    topConditions: topConditionsRes.rows,
    activities: {
      notifications: notificationsRes.rows[0].count,
      questionnaires,
      checkins
    }
  };

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

          <AppDashboardClient stats={stats} />
        </div>
      </div>
    </>
  );
}
