'use server'

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createDisease(prevState: any, formData: FormData) {
  const name = formData.get('name')?.toString();
  const slug = formData.get('slug')?.toString();
  const icd_code = formData.get('icd_code')?.toString();

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
      INSERT INTO medical_diseases (id, name, slug, icd_code, status)
      VALUES ($1, $2, $3, $4, 'active')
    `, [newId, name, slug, icd_code || null]);
  } catch (err: any) {
    console.error('Error creating disease:', err);
    return { error: 'Hastalık oluşturulurken bir hata meydana geldi.' };
  }

  redirect('/settings/diseases');
}
