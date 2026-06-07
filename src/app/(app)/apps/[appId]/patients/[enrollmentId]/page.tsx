import db from '@/lib/db';
import Link from 'next/link';
import PatientDetailClient from './PatientDetailClient';

export default async function PatientDetailPage({ params }: { params: Promise<{ appId: string, enrollmentId: string }> }) {
  const { appId, enrollmentId } = await params;

  const patientRes = await db.query(`
    SELECT 
      e.id as enrollment_id,
      e.status,
      e.start_date,
      e.created_at,
      e.progress_percent,
      e.current_day,
      e.journey_id,
      u.full_name,
      u.email,
      u.phone,
      u.id as user_id,
      j.name as journey_name,
      p.birth_date,
      p.gender,
      p.height_cm,
      p.weight_kg,
      p.blood_type
    FROM patient_app_enrollments e
    JOIN core_users u ON e.patient_user_id = u.id
    LEFT JOIN content_journeys j ON e.journey_id = j.id
    LEFT JOIN patient_profiles p ON p.user_id = u.id
    WHERE e.id = $1 AND e.app_id = $2
  `, [enrollmentId, appId]);

  const patient = patientRes.rows[0];

  const journeysRes = await db.query('SELECT id, name, is_default FROM content_journeys WHERE app_id = $1 AND deleted_at IS NULL ORDER BY name ASC', [appId]);
  const journeys = journeysRes.rows;

  if (!patient) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger">Hasta kaydı bulunamadı.</div>
          <Link href={`/apps/${appId}/patients`} className="btn btn-primary">Geri Dön</Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited': return <span className="badge bg-secondary-lt rounded-pill px-3 py-1 fs-5 fw-medium">Davet Edildi</span>;
      case 'active': return <span className="badge bg-success-lt rounded-pill px-3 py-1 fs-5 fw-medium text-success"><span className="badge bg-success badge-blink me-2"></span> Aktif</span>;
      case 'paused': return <span className="badge bg-warning-lt rounded-pill px-3 py-1 fs-5 fw-medium">Donduruldu</span>;
      case 'completed': return <span className="badge bg-primary-lt rounded-pill px-3 py-1 fs-5 fw-medium">Tamamlandı</span>;
      case 'cancelled': return <span className="badge bg-danger-lt rounded-pill px-3 py-1 fs-5 fw-medium">İptal Edildi</span>;
      default: return <span className="badge rounded-pill px-3 py-1 fs-5">{status}</span>;
    }
  };

  return (
    <>
      <div className="page-header d-print-none mt-4 mb-4">
        <div className="container-xl">
          <div className="row g-3 align-items-center">
            <div className="col-auto">
              <span className="avatar avatar-lg rounded-circle shadow-sm border" style={{backgroundImage: `url(https://ui-avatars.com/api/?name=${encodeURIComponent(patient.full_name)}&background=f1f5f9&color=475569&size=128)`}}></span>
            </div>
            <div className="col">
              <div className="page-pretitle text-uppercase text-muted fw-bold mb-1" style={{ letterSpacing: '1px' }}>
                HASTA PROFİLİ
              </div>
              <h2 className="page-title mb-0 d-flex align-items-center gap-3">
                <span className="fw-bolder fs-1 text-dark">{patient.full_name}</span>
                {getStatusBadge(patient.status)}
              </h2>
              <div className="text-secondary mt-2 d-flex align-items-center gap-2 fs-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon text-muted"><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z"></path><path d="M3 7l9 6l9 -6"></path></svg>
                {patient.email}
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/patients`} className="btn btn-outline-secondary d-flex align-items-center gap-2 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14l-4 -4l4 -4"></path><path d="M5 10h11a4 4 0 1 1 0 8h-1"></path></svg>
                  Hastalara Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row g-4">
            
            {/* Left Sidebar Info */}
            <div className="col-lg-3">
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">İlerleme Durumu</h3>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Bulunduğu Gün</span>
                      <span className="fw-bold">{patient.current_day}. Gün</span>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Genel Tamamlama</span>
                      <span className="fw-bold">{patient.progress_percent || 0}%</span>
                    </div>
                    <div className="progress progress-sm">
                      <div className="progress-bar bg-primary" style={{width: `${patient.progress_percent || 0}%`}} role="progressbar" aria-valuenow={patient.progress_percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${patient.progress_percent}% Complete`}>
                        <span className="visually-hidden">{patient.progress_percent}% Complete</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Content */}
            <div className="col-lg-9">
              <PatientDetailClient patient={patient} journeys={journeys} />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
