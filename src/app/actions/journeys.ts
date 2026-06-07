'use server'

import db from '@/lib/db';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

export async function createJourney(prevState: any, formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const name = formData.get('name')?.toString();
  const description = formData.get('description')?.toString();
  const isDefault = formData.get('is_default') === 'on';

  if (!appId || !name) {
    return { error: 'Lütfen zorunlu alanları (Ad) doldurunuz.' };
  }

  try {
    const newId = crypto.randomUUID();

    // If this is set as default, we should probably unset other defaults for this app
    if (isDefault) {
      await db.query(`UPDATE content_journeys SET is_default = false WHERE app_id = $1`, [appId]);
    }

    await db.query(`
      INSERT INTO content_journeys (id, app_id, name, description, is_default, status)
      VALUES ($1, $2, $3, $4, $5, 'draft')
    `, [newId, appId, name, description || null, isDefault]);
  } catch (err: any) {
    console.error('Error creating journey:', err);
    return { error: 'Akış oluşturulurken sistemsel bir hata meydana geldi.' };
  }

  redirect(`/apps/${appId}/journeys`);
}

export async function deleteJourney(formData: FormData) {
  const appId = formData.get('appId')?.toString();
  const journeyId = formData.get('journeyId')?.toString();

  if (!appId || !journeyId) return;

  try {
    await db.query(`
      UPDATE content_journeys 
      SET deleted_at = now()
      WHERE id = $1 AND app_id = $2
    `, [journeyId, appId]);
  } catch (err: any) {
    console.error('Error deleting journey:', err);
  }

  redirect(`/apps/${appId}/journeys`);
}

// Action to add a module to a specific day in the journey
export async function addJourneyStep(prevState: any, formData: FormData) {
  const journeyId = formData.get('journeyId')?.toString();
  const moduleId = formData.get('moduleId')?.toString();
  const dayNumber = parseInt(formData.get('dayNumber')?.toString() || '1');
  const delayMinutes = parseInt(formData.get('delayMinutes')?.toString() || '0');
  const isRequired = formData.get('isRequired') === 'on';

  if (!journeyId || !moduleId || isNaN(dayNumber)) {
    return { error: 'Eksik veri gönderildi.' };
  }

  try {
    const newId = crypto.randomUUID();
    
    // Find the next order_in_day
    const orderRes = await db.query(`
      SELECT COALESCE(MAX(order_in_day), 0) + 1 as next_order 
      FROM content_journey_steps 
      WHERE journey_id = $1 AND day_number = $2
    `, [journeyId, dayNumber]);
    const nextOrder = orderRes.rows[0].next_order;

    await db.query(`
      INSERT INTO content_journey_steps (id, journey_id, module_id, day_number, order_in_day, is_required, delay_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [newId, journeyId, moduleId, dayNumber, nextOrder, isRequired, delayMinutes]);

    return { success: true };
  } catch (err: any) {
    console.error('Error adding step:', err);
    return { error: 'Modül gün akışına eklenirken hata oluştu.' };
  }
}

// Action to remove a step from a journey
export async function removeJourneyStep(formData: FormData) {
  const stepId = formData.get('stepId')?.toString();

  if (!stepId) return;

  try {
    await db.query(`DELETE FROM content_journey_steps WHERE id = $1`, [stepId]);
  } catch (err: any) {
    console.error('Error removing step:', err);
  }
}

export async function updateJourneyDuration(journeyId: string, durationDays: number) {
  try {
    await db.query(`UPDATE content_journeys SET duration_days = $1 WHERE id = $2`, [durationDays, journeyId]);
    return { success: true };
  } catch(err) {
    console.error('Error updating duration:', err);
    return { error: 'Süre güncellenirken hata oluştu.' };
  }
}

export async function updateJourney(prevState: any, formData: FormData) {
  const journeyId = formData.get('journeyId')?.toString();
  const name = formData.get('name')?.toString();
  const description = formData.get('description')?.toString();
  const isDefault = formData.get('isDefault') === 'true';

  if (!journeyId || !name) return { error: 'Gerekli alanlar eksik' };

  try {
    // If setting to default, unset others first
    if (isDefault) {
      const appIdRes = await db.query('SELECT app_id FROM content_journeys WHERE id = $1', [journeyId]);
      if (appIdRes.rows.length > 0) {
        await db.query('UPDATE content_journeys SET is_default = false WHERE app_id = $1', [appIdRes.rows[0].app_id]);
      }
    }

    await db.query(
      `UPDATE content_journeys SET name = $1, description = $2, is_default = $3, updated_at = NOW() WHERE id = $4`,
      [name, description, isDefault, journeyId]
    );
    return { success: true, message: 'Akış ayarları güncellendi.' };
  } catch(err) {
    console.error(err);
    return { error: 'Güncelleme hatası.' };
  }
}

export async function hardDeleteJourney(formData: FormData) {
  const journeyId = formData.get('journeyId')?.toString();
  if (!journeyId) return { error: 'Geçersiz ID' };

  try {
    // 1. Delete all steps related to this journey
    await db.query(`DELETE FROM content_journey_steps WHERE journey_id = $1`, [journeyId]);
    // 2. Delete the journey
    await db.query(`DELETE FROM content_journeys WHERE id = $1`, [journeyId]);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Silme işlemi başarısız.' };
  }
}
