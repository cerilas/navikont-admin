import DoctorSupportForm from './DoctorSupportForm';
import Header from "@/components/layout/Header";
import DoctorSidebar from "@/components/layout/DoctorSidebar";

export default function DoctorSupportPage() {
  return (
    <div className="page">
      <DoctorSidebar />
      <Header hideLogo={true} />
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title">
                  Destek & İletişim
                </h2>
                <div className="text-muted mt-1">
                  Herhangi bir teknik problem veya sorunuz için bizimle iletişime geçebilirsiniz.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="page-body">
          <div className="container-xl">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Destek Talebi Oluştur</h3>
              </div>
              <div className="card-body">
                <DoctorSupportForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
