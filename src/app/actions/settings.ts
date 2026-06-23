'use server';

import db from '@/lib/db';

export async function getSetting(key: string, defaultValue: string = '') {
  try {
    const res = await db.query('SELECT value FROM core_settings WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error getting setting ${key}:`, err);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string) {
  try {
    await db.query(`
      INSERT INTO core_settings (key, value, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
    `, [key, value]);
    return { success: true };
  } catch (err) {
    console.error(`Error setting setting ${key}:`, err);
    return { success: false, error: 'Ayar kaydedilirken bir hata oluştu.' };
  }
}
