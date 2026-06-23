import { getSupportRequests } from '@/app/actions/support';
import SupportRequestClient from './SupportRequestClient';

export const dynamic = 'force-dynamic';

export default async function SupportRequestsPage() {
  const requests = await getSupportRequests();

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Doktor Talepleri
              </h2>
              <div className="text-muted mt-1">
                Doktorlardan gelen destek ve iletişim mesajları
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="page-body">
        <div className="container-xl">
          <SupportRequestClient initialRequests={requests} />
        </div>
      </div>
    </>
  );
}
