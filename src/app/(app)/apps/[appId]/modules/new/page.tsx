import db from '@/lib/db';
import Link from 'next/link';
import ModuleForm from './ModuleForm';

export default async function NewModulePage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  const typesRes = await db.query('SELECT id, name, description FROM content_module_types ORDER BY name ASC');
  const moduleTypes = typesRes.rows;

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <h2 className="page-title">
                Yeni Modül Ekle
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/modules`} className="btn btn-link">
                  İptal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <div className="row row-cards">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Modül Bilgileri</h3>
                </div>
                {moduleTypes.length === 0 ? (
                  <div className="card-body">
                    <div className="alert alert-danger">
                      Sistemde tanımlı modül tipi bulunamadı. Lütfen teknik ekiple iletişime geçin.
                    </div>
                  </div>
                ) : (
                  <ModuleForm appId={appId} moduleTypes={moduleTypes} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
