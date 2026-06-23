import ProfileClient from '@/components/profile/ProfileClient';
import { getProfile } from '@/app/actions/profile';
import { redirect } from 'next/navigation';
import Header from "@/components/layout/Header";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DoctorProfilePage() {
  const profile = await getProfile();
  
  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="page">
      <Header hideLogo={true} />
      <div className="page-wrapper">
        <div className="page-header d-print-none">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <div className="page-pretitle">
                  <Link href="/dr" className="text-muted">← Ana Sayfaya Dön</Link>
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

        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    Copyright &copy; 2026
                    <a href="." className="link-secondary ms-1">Navikont</a>.
                    All rights reserved.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
