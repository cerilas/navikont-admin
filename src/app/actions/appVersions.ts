'use server'

import db from '@/lib/db';
import crypto from 'crypto';

export async function getOrCreateDraftAppVersion(appId: string) {
  // Try to find a draft version
  const res = await db.query(`
    SELECT id FROM content_app_versions 
    WHERE app_id = $1 AND status = 'draft' 
    ORDER BY created_at DESC LIMIT 1
  `, [appId]);

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  // Create one if none exists
  const newId = crypto.randomUUID();
  await db.query(`
    INSERT INTO content_app_versions (id, app_id, version_number, version_name, status)
    VALUES ($1, $2, '1.0.0', 'İlk Versiyon', 'draft')
  `, [newId, appId]);

  return newId;
}
