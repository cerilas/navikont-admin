'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export interface FormOption {
  id?: string;
  option_label: string;
  score: number | string;
}

export interface CheckinField {
  id?: string;
  field_key?: string;
  field_type: string;
  label: string;
  unit?: string;
  is_required: boolean;
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

    // 2. Get latest version details
    const vRes = await db.query(`
      SELECT version_number, scoring_method, risk_rules FROM forms_questionnaire_versions
      WHERE questionnaire_id = $1
      ORDER BY version_number DESC LIMIT 1
    `, [questionnaireId]);

    const newVersionNumber = (vRes.rows[0]?.version_number || 0) + 1;
    const oldScoring = vRes.rows[0]?.scoring_method || null;
    const oldRisk = vRes.rows[0]?.risk_rules || null;
    const versionId = crypto.randomUUID();

    // 3. Create new version
    await db.query(`
      INSERT INTO forms_questionnaire_versions (id, questionnaire_id, version_number, title, description_html, scoring_method, risk_rules, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [versionId, questionnaireId, newVersionNumber, name, description, oldScoring ? JSON.stringify(oldScoring) : null, oldRisk ? JSON.stringify(oldRisk) : null, status]);

    // 4. Archive old versions
    await db.query(`
      UPDATE forms_questionnaire_versions
      SET status = 'archived'
      WHERE questionnaire_id = $1 AND id != $2
    `, [questionnaireId, versionId]);

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
  status: string,
  fields: CheckinField[] = []
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

    let versionId: string | null = null;
    if (vRes.rows.length > 0) {
      versionId = vRes.rows[0].id;
      await db.query(`
        UPDATE forms_checkin_template_versions
        SET title = $1
        WHERE id = $2
      `, [name, versionId]);
    }

    if (versionId) {
      // Delete existing fields for this version
      await db.query(`DELETE FROM forms_checkin_fields WHERE checkin_template_version_id = $1`, [versionId]);
      
      // Insert new fields
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const fieldKey = field.field_key || `field_${i}`;
        await db.query(`
          INSERT INTO forms_checkin_fields (id, checkin_template_version_id, field_key, field_type, label, unit, is_required, sort_order)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          crypto.randomUUID(),
          versionId,
          fieldKey,
          field.field_type,
          field.label,
          field.unit || null,
          field.is_required,
          i
        ]);
      }
    }

    revalidatePath(`/apps/${appId}/forms`);
    revalidatePath(`/apps/${appId}/forms/checkin/${checkinId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving checkin template:', error);
    return { error: 'Check-in kaydedilirken bir hata oluştu: ' + error.message };
  }
}

export async function getCheckinTemplates(appId: string) {
  try {
    const res = await db.query(`
      SELECT id, name, status 
      FROM forms_checkin_templates 
      WHERE app_id = $1 AND status != 'archived'
      ORDER BY created_at DESC
    `, [appId]);
    return { success: true, templates: res.rows };
  } catch (error: any) {
    console.error('Error fetching checkin templates:', error);
    return { error: 'Check-in şablonları getirilemedi.' };
  }
}

export async function deleteCheckinTemplate(appId: string, checkinId: string, force: boolean = false) {
  try {
    if (!force) {
      // Check if it's used in any journeys
      const usageRes = await db.query(`
        SELECT DISTINCT cj.name
        FROM content_journey_steps cjs
        JOIN content_module_versions cmv ON cmv.module_id = cjs.module_id
        JOIN content_journeys cj ON cj.id = cjs.journey_id
        WHERE cmv.content->>'checkinTemplateId' = $1
          OR cmv.content->>'checkinTemplateId' = $2
      `, [checkinId, String(checkinId)]);
      
      if (usageRes.rows.length > 0) {
        return {
          inUse: true,
          usages: usageRes.rows.map(r => r.name)
        };
      }
    }

    // Force delete or no usages found. We just mark it as 'archived'.
    await db.query(`
      UPDATE forms_checkin_templates 
      SET status = 'archived'
      WHERE id = $1 AND app_id = $2
    `, [checkinId, appId]);

    revalidatePath(`/apps/${appId}/forms`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting checkin template:', error);
    return { error: 'Check-in silinirken bir hata oluştu.' };
  }
}
