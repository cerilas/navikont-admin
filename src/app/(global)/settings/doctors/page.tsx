import { getDoctors } from '@/app/actions/doctors';
import Link from 'next/link';
import CreateDoctorModal from './CreateDoctorModal';
import EditDoctorModal from './EditDoctorModal';

export default async function DoctorsPage() {
  const doctors = await getDoctors();

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Doktor Yönetimi
              </h2>
              <div className="text-muted mt-1">
                {doctors.length} doktor kayıtlı
              </div>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <a href="#" className="btn btn-primary d-none d-sm-inline-block" data-bs-toggle="modal" data-bs-target="#modal-create-doctor">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg>
                  Yeni Doktor Ekle
                </a>
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
                    <th>Doktor Adı</th>
                    <th>E-posta</th>
                    <th>Telefon</th>
                    <th>Durum</th>
                    <th className="w-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted">Kayıt bulunamadı.</td>
                    </tr>
                  ) : (
                    doctors.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div className="d-flex py-1 align-items-center">
                            <span className="avatar me-2 bg-blue-lt">{d.full_name.charAt(0)}</span>
                            <div className="flex-fill">
                              <div className="font-weight-medium">{d.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">
                          {d.email}
                        </td>
                        <td className="text-muted">
                          {d.phone || '-'}
                        </td>
                        <td className="text-muted">
                          {d.status === 'active' ? <span className="status status-green">Aktif</span> : <span className="status">{d.status}</span>}
                        </td>
                        <td>
                          <a href="#" className="btn btn-sm" data-bs-toggle="modal" data-bs-target={`#modal-edit-doctor-${d.id}`}>
                            Yönet
                          </a>
                          <EditDoctorModal doctor={d} />
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

      <CreateDoctorModal />
    </>
  );
}
