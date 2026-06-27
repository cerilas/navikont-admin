import React from 'react';
import { query } from '@/lib/db';
import TranslationsClientPage from './TranslationsClientPage';

export default async function TranslationsPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = await params;

  // 1. Get app details and supported languages
  const appResult = await query(
    `SELECT name, supported_languages FROM content_apps WHERE id = $1`,
    [appId]
  );

  if (appResult.rows.length === 0) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger shadow-sm border-0 d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-alert-circle me-3" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
              <path d="M12 8v4"></path>
              <path d="M12 16h.01"></path>
            </svg>
            Uygulama bulunamadı.
          </div>
        </div>
      </div>
    );
  }

  const appData = appResult.rows[0];
  const supportedLanguages = appData.supported_languages || ['tr'];
  const targetLanguages = supportedLanguages.filter((l: string) => l !== 'tr');

  if (targetLanguages.length === 0) {
    return (
      <>
        <div className="page-header d-print-none mb-4">
          <div className="container-xl">
            <div className="row g-2 align-items-center">
              <div className="col">
                <h2 className="page-title text-primary font-weight-bold" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
                  Çeviri Yönetimi
                </h2>
              </div>
            </div>
          </div>
        </div>
        <div className="page-body">
          <div className="container-xl">
            <div className="alert alert-warning shadow-sm border-0 d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-language me-3" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M4 5h7"></path>
                <path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path>
                <path d="M5 9c2.106 -1.996 3.974 -4.01 4.5 -7"></path>
                <path d="M12 20l4 -9l4 9"></path>
                <path d="M19.1 18h-6.2"></path>
              </svg>
              <div>
                Bu uygulama için henüz çevrilecek <strong>hedef dil</strong> tanımlanmamış. Lütfen <strong>Uygulama Ayarları</strong> sayfasından desteklenen dilleri ekleyin. <em>(Türkçe varsayılan dildir ve çevrilmez)</em>.
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Fetch all translatable content
  
  // A. App Info
  const appInfo = {
    id: appId,
    name: appData.name,
    motto: '',
    short_description: '',
    long_description: ''
  };
  const appInfoDb = await query(`SELECT motto, short_description, long_description FROM content_apps WHERE id = $1`, [appId]);
  if(appInfoDb.rows.length > 0) {
    appInfo.motto = appInfoDb.rows[0].motto;
    appInfo.short_description = appInfoDb.rows[0].short_description;
    appInfo.long_description = appInfoDb.rows[0].long_description;
  }

  // B. Notifications
  const notifResult = await query(
    `SELECT id, code, title_template, body_template 
     FROM content_notification_templates 
     WHERE app_id = $1 AND is_active = true`,
    [appId]
  );
  const notifications = notifResult.rows;

  // C. Modules (Latest Versions)
  const modulesRes = await query(`
    SELECT DISTINCT ON (cm.id) 
      cmv.id, cmv.title, cmv.subtitle, cmv.content, cmt.code as module_type
    FROM content_modules cm
    JOIN content_module_versions cmv ON cmv.module_id = cm.id
    JOIN content_module_types cmt ON cmt.id = cm.module_type_id
    WHERE cm.app_id = $1 AND cm.deleted_at IS NULL
    ORDER BY cm.id, cmv.version_number DESC
  `, [appId]);
  const modules = modulesRes.rows;

  // D. Forms & Questionnaires (Latest Published Versions)
  const formsRes = await query(`
    SELECT DISTINCT ON (fq.id)
      fq.id as questionnaire_id, fqv.id as version_id, fqv.title, fqv.description_html
    FROM forms_questionnaires fq
    JOIN forms_questionnaire_versions fqv ON fqv.questionnaire_id = fq.id
    WHERE fq.app_id = $1 AND fqv.status = 'published'
    ORDER BY fq.id, fqv.version_number DESC
  `, [appId]);
  const forms = formsRes.rows;

  for (const f of forms) {
    const qRes = await query(
      `SELECT id, label, placeholder, description_html, question_type FROM forms_questions WHERE questionnaire_version_id = $1 ORDER BY sort_order ASC`,
      [f.version_id]
    );
    f.questions = qRes.rows;
    for (const q of f.questions) {
      if (['multiple_choice', 'single_choice', 'dropdown'].includes(q.question_type)) {
        const oRes = await query(
          `SELECT id, option_label as label FROM forms_question_options WHERE question_id = $1 ORDER BY sort_order ASC`,
          [q.id]
        );
        q.options = oRes.rows;
      } else {
        q.options = [];
      }
    }
  }

  // E. Check-in Templates
  const checkinsRes = await query(`
    SELECT DISTINCT ON (ct.id)
      ct.id as checkin_id, ctv.id as version_id, ctv.title, ctv.description_html as description
    FROM forms_checkin_templates ct
    JOIN forms_checkin_template_versions ctv ON ctv.checkin_template_id = ct.id
    WHERE ct.app_id = $1 AND ctv.status = 'published'
    ORDER BY ct.id, ctv.version_number DESC
  `, [appId]);
  const checkins = checkinsRes.rows;

  for (const c of checkins) {
    const fieldsRes = await query(
      `SELECT id, label, field_type FROM forms_checkin_fields WHERE checkin_template_version_id = $1 ORDER BY sort_order ASC`,
      [c.version_id]
    );
    c.fields = fieldsRes.rows;
  }

  // F. Consents
  const consentsRes = await query(`
    SELECT id, title, content_html
    FROM core_consent_documents
    WHERE status = 'published' AND is_required = true
    ORDER BY created_at ASC
  `);
  const consents = consentsRes.rows;

  // G. Diseases
  const diseasesRes = await query(`
    SELECT id, name
    FROM medical_diseases
    WHERE status = 'active'
    ORDER BY name ASC
  `);
  const diseases = diseasesRes.rows;

  // H. FAQs
  const faqsRes = await query(`
    SELECT id, question, answer
    FROM core_faqs
    WHERE app_id = $1
    ORDER BY order_index ASC
  `, [appId]);
  const faqs = faqsRes.rows;

  return (
    <TranslationsClientPage 
      appId={appId}
      appName={appData.name}
      targetLanguages={targetLanguages}
      appInfo={appInfo}
      notifications={notifications}
      modules={modules}
      forms={forms}
      checkins={checkins}
      consents={consents}
      diseases={diseases}
      faqs={faqs}
    />
  );
}
