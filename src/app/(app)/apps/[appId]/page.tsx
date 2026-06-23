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

  // ── Summary counts ──
  const modulesRes = await db.query('SELECT COUNT(*) FROM content_modules WHERE app_id = $1 AND deleted_at IS NULL', [appId]);
  const moduleCount = modulesRes.rows[0].count;

  const patientsRes = await db.query('SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = $1', [appId]);
  const totalPatients = parseInt(patientsRes.rows[0].count, 10);

  const activePatientsRes = await db.query("SELECT COUNT(*) FROM patient_app_enrollments WHERE app_id = $1 AND status = 'active'", [appId]);
  const activePatients = parseInt(activePatientsRes.rows[0].count, 10);

  const doctorsRes = await db.query('SELECT COUNT(DISTINCT doctor_user_id) FROM patient_app_enrollments WHERE app_id = $1 AND doctor_user_id IS NOT NULL', [appId]);
  const doctorCount = doctorsRes.rows[0].count;

  const rulesRes = await db.query("SELECT COUNT(*) FROM core_rules WHERE target_type = $1 AND target_id = $2 AND rule_type = 'journey_assignment' AND is_active = true", ['app', appId]);
  const hasAutomation = parseInt(rulesRes.rows[0].count) > 0;

  // ── Enrollments over time (last 12 months) ──
  const enrollmentsOverTimeRes = await db.query(`
    SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
    FROM patient_app_enrollments
    WHERE app_id = $1 AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month ASC
  `, [appId]);

  // ── Top conditions / diseases ──
  const topConditionsRes = await db.query(`
    SELECT md.name, COUNT(*) as count
    FROM patient_diseases pd
    JOIN patient_app_enrollments pae ON pae.patient_user_id = pd.patient_user_id
    JOIN medical_diseases md ON md.id = pd.disease_id
    WHERE pae.app_id = $1
    GROUP BY md.name
    ORDER BY count DESC
    LIMIT 8
  `, [appId]);

  // ── Notification stats by status ──
  const notificationStatsRes = await db.query(`
    SELECT status, COUNT(*) as count
    FROM patient_notifications
    WHERE app_id = $1
    GROUP BY status
  `, [appId]);

  // ── Modules by type ──
  const modulesByTypeRes = await db.query(`
    SELECT cmt.name, cmt.code, COUNT(*) as count
    FROM content_modules cm
    JOIN content_module_types cmt ON cmt.id = cm.module_type_id
    WHERE cm.app_id = $1 AND cm.deleted_at IS NULL
    GROUP BY cmt.name, cmt.code
    ORDER BY count DESC
  `, [appId]);

  // ── Checkin submissions ──
  const checkinRes = await db.query(`
    SELECT COUNT(*) FROM patient_checkin_submissions pcs
    JOIN patient_app_enrollments pae ON pae.id = pcs.enrollment_id
    WHERE pae.app_id = $1
  `, [appId]);
  const checkinCount = parseInt(checkinRes.rows[0].count, 10);

  // ── Questionnaire responses ──
  const questionnaireRes = await db.query(`
    SELECT COUNT(*) FROM patient_questionnaire_responses pqr
    JOIN patient_app_enrollments pae ON pae.id = pqr.enrollment_id
    WHERE pae.app_id = $1
  `, [appId]);
  const questionnaireCount = parseInt(questionnaireRes.rows[0].count, 10);

  // ── Journey step count ──
  const journeyStepRes = await db.query(`
    SELECT COUNT(*) FROM content_journey_steps cjs
    JOIN content_journeys cj ON cj.id = cjs.journey_id
    WHERE cj.app_id = $1
  `, [appId]);
  const journeyStepCount = parseInt(journeyStepRes.rows[0].count, 10);

  // ── Recently active patients (last 7 days) ──
  const recentlyActiveRes = await db.query(`
    SELECT COUNT(*) FROM patient_app_enrollments
    WHERE app_id = $1 AND last_active_at >= NOW() - INTERVAL '7 days'
  `, [appId]);
  const recentlyActive = parseInt(recentlyActiveRes.rows[0].count, 10);

  const stats = {
    enrollmentsOverTime: enrollmentsOverTimeRes.rows,
    topConditions: topConditionsRes.rows,
    notificationStats: notificationStatsRes.rows,
    modulesByType: modulesByTypeRes.rows,
    checkinCount,
    questionnaireCount,
    journeyStepCount,
    activePatients,
    totalPatients,
    recentlyActive,
  };

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                {app.name} — İstatistikler
              </h2>
              <div className="text-muted mt-1">
                Uygulamanın genel performansı ve hasta etkileşim verileri
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          {/* Top-level summary cards */}
          <div className="row row-deck row-cards">
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
                  <div className="h1 mb-3">{totalPatients}</div>
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

          {/* Charts & detailed stats */}
          <AppDashboardClient stats={stats} />
        </div>
      </div>
    </>
  );
}
