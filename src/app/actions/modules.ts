'use server'

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createModule(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const name = formData.get('name')?.toString();
  const internalName = formData.get('internal_name')?.toString();
  const moduleTypeId = formData.get('module_type_id')?.toString();
  const description = formData.get('description')?.toString();

  if (!appId || !name || !moduleTypeId) {
    return { error: 'Lütfen zorunlu alanları (Ad ve Modül Tipi) doldurunuz.' };
  }

  try {
    const newId = crypto.randomUUID();
    await db.query(`
      INSERT INTO content_modules (id, app_id, module_type_id, name, internal_name, description, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft')
    `, [newId, appId, moduleTypeId, name, internalName || null, description || null]);
  } catch (err: any) {
    console.error('Error creating module:', err);
    return { error: 'Modül oluşturulurken sistemsel bir hata meydana geldi.' };
  }

  redirect(`/apps/${appId}/modules`);
}

export async function updateModule(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const moduleId = formData.get('moduleId')?.toString();
  const name = formData.get('name')?.toString();
  const internalName = formData.get('internal_name')?.toString();
  const moduleTypeId = formData.get('module_type_id')?.toString();
  const description = formData.get('description')?.toString();

  if (!appId || !moduleId || !name || !moduleTypeId) {
    return { error: 'Lütfen zorunlu alanları (Ad ve Modül Tipi) doldurunuz.' };
  }

  try {
    await db.query(`
      UPDATE content_modules 
      SET name = $1, internal_name = $2, description = $3, module_type_id = $4, updated_at = now()
      WHERE id = $5 AND app_id = $6
    `, [name, internalName || null, description || null, moduleTypeId, moduleId, appId]);
  } catch (err: any) {
    console.error('Error updating module:', err);
    return { error: 'Modül güncellenirken sistemsel bir hata meydana geldi.' };
  }

  redirect(`/apps/${appId}/modules`);
}

export async function deleteModule(formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const moduleId = formData.get('moduleId')?.toString();

  if (!appId || !moduleId) return;

  try {
    await db.query(`
      UPDATE content_modules 
      SET deleted_at = now()
      WHERE id = $1 AND app_id = $2
    `, [moduleId, appId]);
  } catch (err: any) {
    console.error('Error deleting module:', err);
  }

  redirect(`/apps/${appId}/modules`);
}

export async function saveModuleContent(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const moduleId = formData.get('moduleId')?.toString();
  const title = formData.get('title')?.toString();
  const subtitle = formData.get('subtitle')?.toString();
  const contentStr = formData.get('content')?.toString();

  if (!appId || !moduleId || !title || !contentStr) {
    return { error: 'Zorunlu alanları doldurunuz.' };
  }

  let contentObj = {};
  try {
    contentObj = JSON.parse(contentStr);
  } catch(e) {
    return { error: 'Geçersiz içerik formatı (JSON hatası).' };
  }

  try {
    const { getOrCreateDraftAppVersion } = await import('@/app/actions/appVersions');
    const appVersionId = await getOrCreateDraftAppVersion(appId);

    // Check if a draft version for this module already exists
    const existingRes = await db.query(`
      SELECT id FROM content_module_versions
      WHERE module_id = $1 AND app_version_id = $2 AND status = 'draft'
    `, [moduleId, appVersionId]);

    if (existingRes.rows.length > 0) {
      // Update
      const versionId = existingRes.rows[0].id;
      await db.query(`
        UPDATE content_module_versions
        SET title = $1, subtitle = $2, content = $3, updated_at = now()
        WHERE id = $4
      `, [title, subtitle || null, contentObj, versionId]);
    } else {
      // Get next version number
      const numRes = await db.query(`
        SELECT COALESCE(MAX(version_number), 0) + 1 as next_v 
        FROM content_module_versions WHERE module_id = $1
      `, [moduleId]);
      const nextV = numRes.rows[0].next_v;

      const newId = crypto.randomUUID();
      await db.query(`
        INSERT INTO content_module_versions (id, module_id, app_version_id, version_number, title, subtitle, content, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
      `, [newId, moduleId, appVersionId, nextV, title, subtitle || null, contentObj]);
    }

    return { success: true, message: 'İçerik başarıyla kaydedildi.' };
  } catch (err: any) {
    console.error('Error saving content:', err);
    return { error: 'İçerik kaydedilirken veritabanı hatası oluştu.' };
  }
}
