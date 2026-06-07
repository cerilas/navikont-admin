import db from '@/lib/db';
import Link from 'next/link';
import FormBuilderClient from './FormBuilderClient';

export default async function FormEditorPage({ params }: { params: Promise<{ appId: string, formId: string }> }) {
  const { appId, formId } = await params;

  // 1. Fetch form
  const formRes = await db.query(`
    SELECT id, name, description, status 
    FROM forms_questionnaires 
    WHERE id = $1 AND app_id = $2
  `, [formId, appId]);

  if (formRes.rows.length === 0) {
    return <div className="alert alert-danger m-3">Anket bulunamadı.</div>;
  }
  const form = formRes.rows[0];

  // 2. Fetch latest version
  const vRes = await db.query(`
    SELECT id, version_number, status 
    FROM forms_questionnaire_versions
    WHERE questionnaire_id = $1
    ORDER BY version_number DESC LIMIT 1
  `, [formId]);

  if (vRes.rows.length === 0) {
    return <div className="alert alert-danger m-3">Anket versiyonu bulunamadı.</div>;
  }
  const versionId = vRes.rows[0].id;

  // 3. Fetch questions
  const qRes = await db.query(`
    SELECT id, question_key, question_type, label, description_html, is_required, sort_order
    FROM forms_questions
    WHERE questionnaire_version_id = $1
    ORDER BY sort_order ASC
  `, [versionId]);
  
  const dbQuestions = qRes.rows;

  // 4. Fetch options for these questions
  let optionsMap: Record<string, any[]> = {};
  if (dbQuestions.length > 0) {
    const questionIds = dbQuestions.map(q => q.id);
    // Since node-postgres doesn't natively support array passing for IN easily without ANY, we use ANY:
    const optRes = await db.query(`
      SELECT id, question_id, option_label, score, sort_order
      FROM forms_question_options
      WHERE question_id = ANY($1)
      ORDER BY sort_order ASC
    `, [questionIds]);

    for (const opt of optRes.rows) {
      if (!optionsMap[opt.question_id]) {
        optionsMap[opt.question_id] = [];
      }
      optionsMap[opt.question_id].push({
        id: opt.id,
        option_label: opt.option_label,
        score: Number(opt.score)
      });
    }
  }

  // Map to client format
  const initialQuestions = dbQuestions.map(q => ({
    id: q.id,
    question_type: q.question_type,
    label: q.label,
    description_html: q.description_html,
    is_required: q.is_required,
    options: optionsMap[q.id] || []
  }));

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                <Link href={`/apps/${appId}/forms`} className="text-secondary d-flex align-items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
                  Anketlere Dön
                </Link>
              </div>
              <h2 className="page-title mt-2">
                Anket Düzenleyici
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <FormBuilderClient 
            appId={appId}
            formId={formId}
            initialName={form.name}
            initialDescription={form.description}
            initialQuestions={initialQuestions}
          />
        </div>
      </div>
    </>
  );
}
