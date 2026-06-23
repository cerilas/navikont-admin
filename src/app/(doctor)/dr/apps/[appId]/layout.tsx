import DoctorSidebar from "@/components/layout/DoctorSidebar";
import Header from "@/components/layout/Header";

export default async function DoctorAppLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ appId: string }>;
}>) {
  const { appId } = await params;

  return (
    <div className="page">
      <DoctorSidebar appId={appId} />
      <Header hideLogo={true} />
      <div className="page-wrapper">
        {children}
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
