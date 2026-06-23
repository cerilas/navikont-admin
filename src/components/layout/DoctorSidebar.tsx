import Link from 'next/link';

export default function DoctorSidebar({ appId }: { appId?: string }) {
  const basePath = appId ? `/dr/apps/${appId}` : '';

  return (
    <aside className="navbar navbar-vertical navbar-expand-lg" data-bs-theme="light">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <h1 className="navbar-brand navbar-brand-autodark mt-2 mb-2 pe-3 d-flex align-items-center justify-content-center" style={{ width: '100%' }}>
          <Link href="/dr" className="text-decoration-none">
            <img src="/logo.png" alt="Cerilas DiGA Base Logo" style={{ maxHeight: '40px', width: 'auto', objectFit: 'contain' }} />
          </Link>
        </h1>
        <div className="collapse navbar-collapse" id="sidebar-menu">
          <ul className="navbar-nav pt-lg-3">
            <li className="nav-item">
              <Link className="nav-link" href="/dr">
                <span className="nav-link-icon d-md-none d-lg-inline-block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 11l-4 4l4 4m-4 -4h11a4 4 0 0 0 0 -8h-1" /></svg>
                </span>
                <span className="nav-link-title">Uygulamalara Dön</span>
              </Link>
            </li>
            
            {appId && (
              <>
                <li className="nav-item mt-3 mb-2 px-3">
                  <span className="text-muted text-uppercase fs-4 fw-bold">Doktor Portalı</span>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href={`${basePath}/patients`}>
                    <span className="nav-link-icon d-md-none d-lg-inline-block">
                      <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>
                    </span>
                    <span className="nav-link-title">Hastalarım</span>
                  </Link>
                </li>
              </>
            )}

          </ul>
        </div>
      </div>
    </aside>
  );
}
