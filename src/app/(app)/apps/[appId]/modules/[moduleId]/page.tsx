import db from '@/lib/db';
import EditModuleForm from './EditModuleForm';

export default async function EditModulePage({ params }: { params: Promise<{ appId: string, moduleId: string }> }) {
  const { appId, moduleId } = await params;

  // Fetch the module details
  const moduleRes = await db.query(`
    SELECT m.*, t.name as type_name, t.description as type_desc 
    FROM content_modules m
    LEFT JOIN content_module_types t ON m.module_type_id = t.id
    WHERE m.id = $1 AND m.app_id = $2
  `, [moduleId, appId]);
  
  const moduleData = moduleRes.rows[0];

  // Fetch all module types
  const typesRes = await db.query('SELECT id, name, description FROM content_module_types ORDER BY name ASC');
  const moduleTypes = typesRes.rows;

  return (
    <div className="row">
      <div className="col-md-8">
        <EditModuleForm appId={appId} moduleData={moduleData} moduleTypes={moduleTypes} />
      </div>
    </div>
  );
}
