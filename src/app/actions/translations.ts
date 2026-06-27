'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface TranslationInput {
  fieldName: string;
  translatedText: string;
}

export interface BatchTranslationInput {
  entityId: string;
  fieldName: string;
  translatedText: string;
}

export async function getTranslations(entityType: string, entityId: string, language: string) {
  if (!language || language === 'tr') return {};
  
  try {
    const result = await query(
      `SELECT field_name, translated_text 
       FROM content_translations 
       WHERE entity_type = $1 AND entity_id = $2 AND language = $3`,
      [entityType, entityId, language]
    );

    const map: Record<string, string> = {};
    for (const row of result.rows) {
      map[row.field_name] = row.translated_text;
    }
    return map;
  } catch (error) {
    console.error('getTranslations error:', error);
    return {};
  }
}

export async function getTranslationsBatch(entityType: string, entityIds: string[], language: string) {
  if (!language || language === 'tr' || entityIds.length === 0) return {};
  
  try {
    // Generate $1, $2, $3 etc for IN clause
    const placeholders = entityIds.map((_, i) => `$${i + 3}`).join(', ');
    
    const result = await query(
      `SELECT entity_id, field_name, translated_text 
       FROM content_translations 
       WHERE entity_type = $1 AND language = $2 AND entity_id IN (${placeholders})`,
      [entityType, language, ...entityIds]
    );

    const map: Record<string, string> = {};
    for (const row of result.rows) {
      map[`${row.entity_id}:::${row.field_name}`] = row.translated_text;
    }
    return map;
  } catch (error) {
    console.error('getTranslationsBatch error:', error);
    return {};
  }
}

export async function saveTranslations(
  appId: string,
  entityType: string, 
  entityId: string, 
  language: string, 
  translations: TranslationInput[]
) {
  if (!language || language === 'tr') {
    throw new Error('Cannot translate default language (tr)');
  }

  try {
    // We use a transaction to safely upsert translations
    await query('BEGIN');

    for (const trans of translations) {
      if (!trans.translatedText) {
        // If empty, delete the translation
        await query(
          `DELETE FROM content_translations 
           WHERE entity_type = $1 AND entity_id = $2 AND field_name = $3 AND language = $4`,
          [entityType, entityId, trans.fieldName, language]
        );
      } else {
        // Upsert
        await query(
          `INSERT INTO content_translations (entity_type, entity_id, field_name, language, translated_text, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (entity_type, entity_id, field_name, language) 
           DO UPDATE SET translated_text = EXCLUDED.translated_text, updated_at = NOW()`,
          [entityType, entityId, trans.fieldName, language, trans.translatedText]
        );
      }
    }

    await query('COMMIT');
    revalidatePath(`/apps/${appId}/translations`);
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('saveTranslations error:', error);
    return { success: false, error: error.message };
  }
}

export async function saveTranslationsBatch(
  appId: string,
  entityType: string, 
  language: string, 
  translations: BatchTranslationInput[]
) {
  if (!language || language === 'tr') {
    throw new Error('Cannot translate default language (tr)');
  }

  try {
    await query('BEGIN');

    for (const trans of translations) {
      if (!trans.translatedText) {
        await query(
          `DELETE FROM content_translations 
           WHERE entity_type = $1 AND entity_id = $2 AND field_name = $3 AND language = $4`,
          [entityType, trans.entityId, trans.fieldName, language]
        );
      } else {
        await query(
          `INSERT INTO content_translations (entity_type, entity_id, field_name, language, translated_text, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (entity_type, entity_id, field_name, language) 
           DO UPDATE SET translated_text = EXCLUDED.translated_text, updated_at = NOW()`,
          [entityType, trans.entityId, trans.fieldName, language, trans.translatedText]
        );
      }
    }

    await query('COMMIT');
    revalidatePath(`/apps/${appId}/translations`);
    return { success: true };
  } catch (error: any) {
    await query('ROLLBACK');
    console.error('saveTranslationsBatch error:', error);
    return { success: false, error: error.message };
  }
}
