'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface FormOption {
  id?: string;
  option_label: string;
  score: number | string;
}

export interface FormQuestion {
  id?: string;
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'scale';
  label: string;
  description_html?: string;
  is_required: boolean;
  options: FormOption[];
}

export async function createQuestionnaire(appId: string) {
  try {
    const questionnaireId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // 1. Create questionnaire
    await db.query(`
      INSERT INTO forms_questionnaires (id, app_id, name, description, questionnaire_type, status)
      VALUES ($1, $2, 'Yeni Anket', '', 'assessment', 'draft')
    `, [questionnaireId, appId]);

    // 2. Create initial version
    await db.query(`
      INSERT INTO forms_questionnaire_versions (id, questionnaire_id, version_number, title, status)
      VALUES ($1, $2, 1, 'Yeni Anket', 'draft')
    `, [versionId, questionnaireId]);

    revalidatePath(`/apps/${appId}/forms`);
    return { success: true, questionnaireId };
  } catch (error: any) {
    console.error('Error creating questionnaire:', error);
    return { error: 'Anket oluşturulurken bir hata oluştu.' };
  }
}

export async function deleteQuestionnaire(appId: string, questionnaireId: string) {
  try {
    await db.query(`
      UPDATE forms_questionnaires 
      SET status = 'archived'
      WHERE id = $1 AND app_id = $2
    `, [questionnaireId, appId]);
    
    revalidatePath(`/apps/${appId}/forms`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting questionnaire:', error);
    return { error: 'Anket silinirken bir hata oluştu.' };
  }
}

export async function saveQuestionnaire(
  appId: string,
  questionnaireId: string,
  name: string,
  description: string,
  questions: FormQuestion[],
  status: string
) {
  try {
    // 1. Update questionnaire root
    await db.query(`
      UPDATE forms_questionnaires 
      SET name = $1, description = $2, status = $3, updated_at = NOW()
      WHERE id = $4 AND app_id = $5
    `, [name, description, status, questionnaireId, appId]);

    // 2. Get latest version
    const vRes = await db.query(`
      SELECT id FROM forms_questionnaire_versions
      WHERE questionnaire_id = $1
      ORDER BY version_number DESC LIMIT 1
    `, [questionnaireId]);

    if (vRes.rows.length === 0) {
      return { error: 'Anket versiyonu bulunamadı.' };
    }
    const versionId = vRes.rows[0].id;

    // 3. Update version details
    await db.query(`
      UPDATE forms_questionnaire_versions
      SET title = $1, description_html = $2, status = $3
      WHERE id = $4
    `, [name, description, status, versionId]);

    // 4. Delete existing questions and options for this version to cleanly recreate them
    // (PostgreSQL CASCADE on delete usually handles options, but we explicitly delete questions.
    // Wait, the schema does not show ON DELETE CASCADE in the markdown for questions. 
    // Let's delete options first)
    await db.query(`
      DELETE FROM forms_question_options 
      WHERE question_id IN (
        SELECT id FROM forms_questions WHERE questionnaire_version_id = $1
      )
    `, [versionId]);
    
    await db.query(`
      DELETE FROM forms_questions WHERE questionnaire_version_id = $1
    `, [versionId]);

    // 5. Insert new questions and options
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const q = questions[qIndex];
      const qk = `q_${qIndex}`;
      const newQId = crypto.randomUUID();
      
      await db.query(`
        INSERT INTO forms_questions (id, questionnaire_version_id, question_key, question_type, label, description_html, is_required, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newQId, versionId, qk, q.question_type, q.label, q.description_html || '', q.is_required, qIndex]);

      if ((q.question_type === 'single_choice' || q.question_type === 'multiple_choice') && q.options) {
        for (let optIndex = 0; optIndex < q.options.length; optIndex++) {
          const opt = q.options[optIndex];
          const optId = crypto.randomUUID();
          await db.query(`
            INSERT INTO forms_question_options (id, question_id, option_value, option_label, score, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [optId, newQId, `opt_${optIndex}`, opt.option_label, parseFloat(opt.score as string) || 0, optIndex]);
        }
      }
    }

    revalidatePath(`/apps/${appId}/forms`);
    revalidatePath(`/apps/${appId}/forms/${questionnaireId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving questionnaire:', error);
    return { error: 'Anket kaydedilirken bir hata oluştu: ' + error.message };
  }
}

export async function createCheckinTemplate(appId: string) {
  try {
    const templateId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // 1. Create template
    await db.query(`
      INSERT INTO forms_checkin_templates (id, app_id, name, description, frequency, streak_enabled, status)
      VALUES ($1, $2, 'Yeni Check-in', '', 'daily', true, 'draft')
    `, [templateId, appId]);

    // 2. Create initial version
    await db.query(`
      INSERT INTO forms_checkin_template_versions (id, checkin_template_id, version_number, title, status)
      VALUES ($1, $2, 1, 'Yeni Check-in', 'draft')
    `, [versionId, templateId]);

    revalidatePath(`/apps/${appId}/forms`);
    return { success: true, checkinId: templateId };
  } catch (error: any) {
    console.error('Error creating checkin template:', error);
    return { error: 'Check-in oluşturulurken bir hata oluştu.' };
  }
}

export async function saveCheckinTemplate(
  appId: string,
  checkinId: string,
  name: string,
  description: string,
  frequency: string,
  streakEnabled: boolean,
  status: string
) {
  try {
    // 1. Update template
    await db.query(`
      UPDATE forms_checkin_templates 
      SET name = $1, description = $2, frequency = $3, streak_enabled = $4, status = $5, updated_at = NOW()
      WHERE id = $6 AND app_id = $7
    `, [name, description, frequency, streakEnabled, status, checkinId, appId]);

    // 2. Update latest version title
    const vRes = await db.query(`
      SELECT id FROM forms_checkin_template_versions
      WHERE checkin_template_id = $1
      ORDER BY version_number DESC LIMIT 1
    `, [checkinId]);

    if (vRes.rows.length > 0) {
      await db.query(`
        UPDATE forms_checkin_template_versions
        SET title = $1
        WHERE id = $2
      `, [name, vRes.rows[0].id]);
    }

    revalidatePath(`/apps/${appId}/forms`);
    revalidatePath(`/apps/${appId}/forms/checkin/${checkinId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving checkin template:', error);
    return { error: 'Check-in kaydedilirken bir hata oluştu: ' + error.message };
  }
}
