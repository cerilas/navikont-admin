'use server'

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function getAllActiveDiseases() {
  try {
    const res = await db.query('SELECT id, name FROM medical_diseases WHERE status = $1 ORDER BY name ASC', ['active']);
    return res.rows;
  } catch (err) {
    console.error('Error fetching active diseases:', err);
    return [];
  }
}

export async function createDisease(prevState: any, formData: FormData) {
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const icd_code = formData.get('icd_code')?.toString();
  const risk_level = formData.get('risk_level')?.toString() || 'low';
  const status = formData.get('status')?.toString() || 'draft';

  if (!name || !slug) {
    return { error: 'Lütfen zorunlu alanları (Ad ve Slug) doldurunuz.' };
  }

  // Check unique slug
  const checkRes = await db.query('SELECT id FROM medical_diseases WHERE slug = $1', [slug]);
  if (checkRes.rows.length > 0) {
    return { error: 'Bu slug daha önce kullanılmış. Lütfen benzersiz bir slug giriniz.' };
  }

  try {
    const newId = crypto.randomUUID();
    await db.query(`
      INSERT INTO medical_diseases (id, name, slug, icd_code, risk_level, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [newId, name, slug, icd_code || null, risk_level, status]);
  } catch (err: any) {
    console.error('Error creating disease:', err);
    return { error: 'Hastalık oluşturulurken bir hata meydana geldi.' };
  }

  redirect('/settings/diseases');
}

export async function updateDisease(diseaseId: string, prevState: any, formData: FormData) {
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const icd_code = formData.get('icd_code')?.toString();
  const risk_level = formData.get('risk_level')?.toString() || 'low';
  const status = formData.get('status')?.toString() || 'draft';

  if (!name || !slug) {
    return { error: 'Lütfen zorunlu alanları (Ad ve Slug) doldurunuz.' };
  }

  // Check unique slug excluding current diseaseId
  try {
    const checkRes = await db.query('SELECT id FROM medical_diseases WHERE slug = $1 AND id != $2', [slug, diseaseId]);
    if (checkRes.rows.length > 0) {
      return { error: 'Bu slug daha önce kullanılmış. Lütfen benzersiz bir slug giriniz.' };
    }

    await db.query(`
      UPDATE medical_diseases 
      SET name = $1, slug = $2, icd_code = $3, risk_level = $4, status = $5, updated_at = NOW()
      WHERE id = $6
    `, [name, slug, icd_code || null, risk_level, status, diseaseId]);
  } catch (err: any) {
    console.error('Error updating disease:', err);
    return { error: 'Hastalık güncellenirken bir hata meydana geldi: ' + err.message };
  }

  redirect('/settings/diseases');
}

export async function deleteDisease(diseaseId: string) {
  try {
    const checkApps = await db.query('SELECT id FROM content_apps WHERE disease_id = $1', [diseaseId]);
    if (checkApps.rows.length > 0) {
      return { error: 'Bu hastalığa ait uygulamalar bulunmaktadır. Hastalığı silebilmek için öncelikle ilişkili uygulamaları silmeli veya başka bir hastalığa atamalısınız.' };
    }

    await db.query('DELETE FROM medical_diseases WHERE id = $1', [diseaseId]);
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting disease:', err);
    return { error: 'Hastalık silinirken bir hata meydana geldi: ' + err.message };
  }
}

