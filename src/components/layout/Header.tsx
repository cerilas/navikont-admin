import Link from 'next/link';
import { IconBell, IconUserCircle } from '@tabler/icons-react';
import { logout } from '@/app/actions/auth';
import { getSession } from '@/lib/auth';

export default async function Header({ hideLogo = false }: { hideLogo?: boolean } = {}) {
  const session = await getSession();
  return (
    <header className="navbar navbar-expand-md d-none d-lg-flex d-print-none">
      <div className="container-xl">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu">
          <span className="navbar-toggler-icon"></span>
        </button>
        {!hideLogo && (
          <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <Link href="/">
              <img src="/logo.png" alt="Cerilas DiGA Base Logo" style={{ maxHeight: '35px', width: 'auto', objectFit: 'contain' }} />
            </Link>
          </h1>
        )}
        <div className="navbar-nav flex-row order-md-last">

          <div className="nav-item dropdown">
            <a href="#" className="nav-link d-flex lh-1 text-reset p-0" data-bs-toggle="dropdown" aria-label="Open user menu">
              <span 
                className={`avatar avatar-sm border-0 ${session?.avatar_url ? '' : 'bg-transparent text-muted'}`}
                style={session?.avatar_url ? { backgroundImage: `url(${session.avatar_url})` } : {}}
              >
                {!session?.avatar_url && <IconUserCircle size={32} stroke={1.5} />}
              </span>
              <div className="d-none d-xl-block ps-2">
                <div>{session?.full_name || 'Kullanıcı'}</div>
                <div className="mt-1 small text-muted">
                  {session?.user_type === 'doctor' ? 'Doktor' : (session?.user_type === 'super_admin' ? 'Süper Admin' : 'Admin')}
                </div>
              </div>
            </a>
            <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
              <Link href={session?.user_type === 'doctor' ? "/dr/profile" : "/profile"} className="dropdown-item">Profilim</Link>
              {session?.user_type !== 'doctor' && (
                <>
                  <Link href="/settings/diseases" className="dropdown-item">Hastalık Yönetimi</Link>
                  <Link href="/settings/doctors" className="dropdown-item">Doktor Yönetimi</Link>
                </>
              )}
              <div className="dropdown-divider"></div>
              <form action={logout}>
                <button type="submit" className="dropdown-item">Çıkış Yap</button>
              </form>
            </div>
          </div>
        </div>
        <div className="collapse navbar-collapse" id="navbar-menu">
          <div className="ms-md-auto py-2 py-md-0 me-md-4">
          </div>
        </div>
      </div>
    </header>
  );
}
