'use server'

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createApp(prevState: any, formData: FormData) {
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const disease_id = formData.get('disease_id')?.toString();
  const short_description = formData.get('short_description')?.toString();

  if (!name || !slug || !disease_id) {
    return { error: 'Lütfen zorunlu alanları (Ad, Slug, Hastalık) doldurunuz.' };
  }

  // Check if slug is unique
  const checkRes = await db.query('SELECT id FROM content_apps WHERE slug = $1', [slug]);
  if (checkRes.rows.length > 0) {
    return { error: 'Bu slug daha önce kullanılmış. Lütfen benzersiz bir slug giriniz.' };
  }

  try {
    const newId = crypto.randomUUID();
    const insertRes = await db.query(`
      INSERT INTO content_apps (id, name, slug, disease_id, short_description, status)
      VALUES ($1, $2, $3, $4, $5, 'draft')
      RETURNING id
    `, [newId, name, slug, disease_id, short_description || null]);

    // Will redirect to the newly created app dashboard
    const newAppId = insertRes.rows[0].id;
    // We cannot redirect inside try/catch block because redirect throws an error that Next.js catches
  } catch (err: any) {
    console.error('Error creating app:', err);
    return { error: 'Uygulama oluşturulurken bir hata meydana geldi.' };
  }

  redirect('/');
}

export async function updateAppBasicInfo(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const name = formData.get('name')?.toString();
  const icon_emoji = formData.get('icon_emoji')?.toString();
  const motto = formData.get('motto')?.toString();
  const short_description = formData.get('short_description')?.toString();
  const long_description = formData.get('long_description')?.toString();
  const disease_id = formData.get('disease_id')?.toString();
  const medical_director_id = formData.get('medical_director_id')?.toString();
  const supported_platforms_str = formData.get('supported_platforms')?.toString();

  if (!appId || !name) {
    return { error: 'Lütfen zorunlu alanları (Ad) doldurunuz.' };
  }

  try {
    await db.query(`
      UPDATE content_apps 
      SET 
        name = $1, 
        icon_emoji = $2, 
        motto = $3, 
        short_description = $4, 
        long_description = $5,
        disease_id = $6,
        medical_director_id = $7,
        supported_platforms = $8,
        updated_at = NOW()
      WHERE id = $9
    `, [
      name, 
      icon_emoji || null, 
      motto || null, 
      short_description || null, 
      long_description || null, 
      disease_id || null, 
      medical_director_id || null, 
      supported_platforms_str || null,
      appId
    ]);

    return { success: true, message: 'Uygulama bilgileri güncellendi.' };
  } catch (err: any) {
    console.error('Error updating app info:', err);
    return { error: 'Uygulama bilgileri güncellenirken bir hata oluştu.' };
  }
}
