require('dotenv').config({ path: '/Users/deniz/Documents/Navikont/backend/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const crypto = require('crypto');

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find modules with embedded questions
    const res = await client.query(`
      SELECT cm.id as module_id, cm.app_id, cm.name, cmt.code as type_code, cmv.id as version_id, cmv.content 
      FROM content_modules cm
      JOIN content_module_types cmt ON cmt.id = cm.module_type_id
      JOIN content_module_versions cmv ON cmv.module_id = cm.id
      WHERE cmv.content::text LIKE '%questions%' AND cmv.content::text NOT LIKE '%formId%'
    `);

    for (const row of res.rows) {
      console.log(`Migrating ${row.name}...`);
      const content = row.content;
      if (!content.questions || !Array.isArray(content.questions)) continue;

      const questionnaireId = crypto.randomUUID();
      const versionId = crypto.randomUUID();
      const appId = row.app_id;

      // Determine type
      const isQuiz = row.type_code === 'quiz';
      const qType = isQuiz ? 'quiz' : 'assessment';

      // Insert questionnaire
      await client.query(`
        INSERT INTO forms_questionnaires (id, app_id, name, description, questionnaire_type, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [questionnaireId, appId, row.name, '', qType, 'published']);

      // Insert version
      await client.query(`
        INSERT INTO forms_questionnaire_versions (id, questionnaire_id, version_number, title, description_html, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [versionId, questionnaireId, 1, row.name, '', 'published']);

      // Insert questions
      for (let i = 0; i < content.questions.length; i++) {
        const q = content.questions[i];
        const qId = crypto.randomUUID();

        // In the embedded JSON, type is 'single_choice' or 'multiple_choice'
        const questionType = q.type || 'single_choice';

        await client.query(`
          INSERT INTO forms_questions (id, questionnaire_version_id, question_key, question_type, label, sort_order, is_required)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [qId, versionId, `q_${i}`, questionType, q.text, i, true]);

        // Insert options
        if (q.options && Array.isArray(q.options)) {
          for (let j = 0; j < q.options.length; j++) {
            const optLabel = q.options[j];
            const optId = crypto.randomUUID();
            
            // Score logic for quiz: 1 if correct, 0 otherwise
            let score = 0;
            if (isQuiz && q.correctOptionIndex === j) {
              score = 1;
            }

            await client.query(`
              INSERT INTO forms_question_options (id, question_id, option_value, option_label, sort_order, score)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [optId, qId, `opt_${j}`, optLabel, j, score]);
          }
        }
      }

      // Update module version content
      const newContent = { ...content };
      delete newContent.questions;
      newContent.formId = questionnaireId;

      await client.query(`
        UPDATE content_module_versions
        SET content = $1
        WHERE id = $2
      `, [JSON.stringify(newContent), row.version_id]);

      console.log(`Successfully migrated ${row.name} to formId: ${questionnaireId}`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
