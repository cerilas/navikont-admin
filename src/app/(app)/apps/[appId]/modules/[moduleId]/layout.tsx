import db from '@/lib/db';
import Link from 'next/link';
import ModuleTabs from './ModuleTabs';

export default async function ModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ appId: string, moduleId: string }>;
}) {
  const { appId, moduleId } = await params;

  const moduleRes = await db.query(`
    SELECT name FROM content_modules WHERE id = $1 AND app_id = $2
  `, [moduleId, appId]);
  
  const moduleData = moduleRes.rows[0];

  if (!moduleData) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger">Modül bulunamadı veya silinmiş.</div>
          <Link href={`/apps/${appId}/modules`} className="btn btn-primary">Geri Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">Modül Düzenle</div>
              <h2 className="page-title">{moduleData.name}</h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/modules`} className="btn btn-link">
                  Geri Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-header">
              <ModuleTabs appId={appId} moduleId={moduleId} />
            </div>
            <div className="card-body">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
