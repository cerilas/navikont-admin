import db from '@/lib/db';
import ContentFormClient from './ContentFormClient';

export default async function ModuleContentPage({ params }: { params: Promise<{ appId: string, moduleId: string }> }) {
  const { appId, moduleId } = await params;

  // Fetch module and type
  const moduleRes = await db.query(`
    SELECT m.*, t.name as type_name
    FROM content_modules m
    LEFT JOIN content_module_types t ON m.module_type_id = t.id
    WHERE m.id = $1 AND m.app_id = $2
  `, [moduleId, appId]);
  
  const moduleData = moduleRes.rows[0];

  if (!moduleData) return null;

  // Fetch latest version (prefer draft, fallback to published/other)
  const versionRes = await db.query(`
    SELECT * FROM content_module_versions
    WHERE module_id = $1
    ORDER BY CASE WHEN status = 'draft' THEN 1 ELSE 2 END, created_at DESC LIMIT 1
  `, [moduleId]);

  const latestVersion = versionRes.rows[0] || null;

  return (
    <ContentFormClient 
      appId={appId} 
      moduleId={moduleId} 
      moduleType={moduleData.type_name} 
      existingVersion={latestVersion} 
    />
  );
}
