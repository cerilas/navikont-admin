import db from '@/lib/db';
import RulesClient from './RulesClient';

export default async function RulesPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  // 1. Fetch app name
  const appRes = await db.query('SELECT name FROM content_apps WHERE id = $1', [appId]);
  if (appRes.rows.length === 0) return <div className="alert alert-danger m-3">App not found</div>;
  const app = appRes.rows[0];

  // 2. Fetch all questionnaires
  const qRes = await db.query("SELECT id, name as title FROM forms_questionnaires WHERE app_id = $1 AND status != 'archived'", [appId]);
  const questionnaires = qRes.rows;

  // 3. Fetch all journeys
  const jRes = await db.query('SELECT id, name FROM content_journeys WHERE app_id = $1 AND deleted_at IS NULL', [appId]);
  const journeys = jRes.rows;

  // 4. Fetch existing rules for this app
  const rulesRes = await db.query(`
    SELECT id, rule_type, condition, actions 
    FROM core_rules 
    WHERE target_type = 'app' 
    AND target_id = $1 
    AND rule_type IN ('onboarding_trigger', 'journey_assignment')
  `, [appId]);

  let initialQuestionnaireId = null;
  const initialAssignments: { min: number, max: number, journeyId: string }[] = [];

  for (const rule of rulesRes.rows) {
    if (rule.rule_type === 'onboarding_trigger') {
      initialQuestionnaireId = rule.actions?.questionnaireId || null;
    } else if (rule.rule_type === 'journey_assignment') {
      initialAssignments.push({
        min: rule.condition?.scoreMin || 0,
        max: rule.condition?.scoreMax || 0,
        journeyId: rule.actions?.journeyId || ''
      });
    }
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                {app.name}
              </div>
              <h2 className="page-title">
                Otomasyon ve Kurallar
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <RulesClient 
            appId={appId}
            questionnaires={questionnaires}
            journeys={journeys}
            initialQuestionnaireId={initialQuestionnaireId}
            initialAssignments={initialAssignments}
          />
        </div>
      </div>
    </>
  );
}
