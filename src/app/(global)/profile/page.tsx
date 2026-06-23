import ProfileClient from '@/components/profile/ProfileClient';
import { getProfile } from '@/app/actions/profile';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  const profile = await getProfile();
  
  if (!profile) {
    redirect('/login');
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                <Link href="/" className="text-muted">← Ana Sayfaya Dön</Link>
              </div>
              <h2 className="page-title mt-1">
                Profilim
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-12 col-md-8 mx-auto">
              <ProfileClient profile={profile} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
