import { getSetting } from '@/app/actions/settings';
import SupportSettingsClient from './SupportSettingsClient';

export default async function SupportSettingsPage() {
  const supportEmail = await getSetting('support_email', '');

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Destek Ayarları
              </h2>
              <div className="text-muted mt-1">
                Sistemden gönderilen bildirim ve destek e-postalarının yönetimi
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">E-posta Ayarları</h3>
            </div>
            <div className="card-body">
              <SupportSettingsClient initialEmail={supportEmail} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
