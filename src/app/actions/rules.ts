'use server';

import db from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveOnboardingRules(
  appId: string, 
  questionnaireId: string | null, 
  assignments: { min: number, max: number, journeyId: string }[]
) {
  try {
    // 1. Delete old onboarding trigger rules
    await db.query(`
      DELETE FROM core_rules 
      WHERE target_type = 'app' 
      AND target_id = $1 
      AND rule_type IN ('onboarding_trigger', 'journey_assignment')
    `, [appId]);

    // 2. Insert new onboarding trigger
    if (questionnaireId) {
      await db.query(`
        INSERT INTO core_rules (id, name, rule_type, target_type, target_id, condition, actions)
        VALUES ($1, $2, 'onboarding_trigger', 'app', $3, $4, $5)
      `, [
        crypto.randomUUID(),
        'Onboarding Questionnaire Trigger',
        appId,
        JSON.stringify({ event: 'app_enrollment' }),
        JSON.stringify({ questionnaireId })
      ]);

      // 3. Insert journey assignments
      for (const rule of assignments) {
        if (!rule.journeyId) continue;
        
        await db.query(`
          INSERT INTO core_rules (id, name, rule_type, target_type, target_id, condition, actions)
          VALUES ($1, $2, 'journey_assignment', 'app', $3, $4, $5)
        `, [
          crypto.randomUUID(),
          `Journey Assignment (${rule.min}-${rule.max})`,
          appId,
          JSON.stringify({
            event: 'questionnaire_completed',
            questionnaireId: questionnaireId,
            scoreMin: rule.min,
            scoreMax: rule.max
          }),
          JSON.stringify({
            journeyId: rule.journeyId
          })
        ]);
      }
    }

    revalidatePath(`/apps/${appId}/rules`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving rules:', error);
    return { error: 'Kurallar kaydedilirken sistemsel bir hata oluştu: ' + error.message };
  }
}
