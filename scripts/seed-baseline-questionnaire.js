const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database for Baseline Questionnaire seeding.');

  try {
    // 1. Get the app_id
    const appRes = await client.query("SELECT id FROM content_apps WHERE name = 'NaviKont' LIMIT 1");
    if (appRes.rows.length === 0) throw new Error('App not found.');
    const appId = appRes.rows[0].id;

    // 2. Setup IDs
    const questionnaireId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    // 3. Create Questionnaire
    console.log('Creating Baseline Questionnaire...');
    await client.query(`
      INSERT INTO forms_questionnaires (id, app_id, name, description, questionnaire_type, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      questionnaireId, 
      appId, 
      'Başlangıç Değerlendirme Anketi', 
      'Tedaviye başlamadan önce hastanın mevcut durumunu ve şikayetlerinin şiddetini ölçmeyi sağlayan ilk değerlendirme anketidir.', 
      'baseline', 
      'published'
    ]);

    // 4. Create Questionnaire Version
    await client.query(`
      INSERT INTO forms_questionnaire_versions (id, questionnaire_id, version_number, title, status)
      VALUES ($1, $2, 1, 'Başlangıç Değerlendirme Anketi', 'published')
    `, [versionId, questionnaireId]);

    // 5. Define Questions
    const questions = [
      {
        question_type: 'single_choice',
        label: 'Cinsiyetiniz?',
        is_required: true,
        options: [
          { label: 'Kadın', score: 0 },
          { label: 'Erkek', score: 0 }
        ]
      },
      {
        question_type: 'text',
        label: 'Yaşınız?',
        is_required: true,
        options: []
      },
      {
        question_type: 'single_choice',
        label: 'Günde ortalama kaç kez idrara çıkıyorsunuz?',
        is_required: true,
        options: [
          { label: '1-4 kez', score: 0 },
          { label: '5-8 kez', score: 1 },
          { label: '9-12 kez', score: 2 },
          { label: "12'den fazla", score: 3 }
        ]
      },
      {
        question_type: 'single_choice',
        label: 'Gece uyuduktan sonra idrara çıkmak için kaç kez uyanıyorsunuz?',
        is_required: true,
        options: [
          { label: 'Hiç uyanmam', score: 0 },
          { label: '1 kez', score: 1 },
          { label: '2-3 kez', score: 2 },
          { label: '4 ve daha fazla', score: 3 }
        ]
      },
      {
        question_type: 'single_choice',
        label: 'Aniden sıkışma ve tuvalete yetişememe (idrar kaçırma) hissi yaşıyor musunuz?',
        is_required: true,
        options: [
          { label: 'Hayır', score: 0 },
          { label: 'Nadiren', score: 1 },
          { label: 'Bazen', score: 2 },
          { label: 'Sık sık', score: 3 }
        ]
      },
      {
        question_type: 'scale',
        label: 'Mesane şikayetleriniz günlük yaşantınızı 0 ile 10 arasında ne kadar olumsuz etkiliyor?',
        is_required: true,
        options: []
      }
    ];

    console.log('Inserting Questions...');
    // 6. Insert Questions and Options
    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const q = questions[qIndex];
      const qId = crypto.randomUUID();
      const qKey = `q_${qIndex}`;

      await client.query(`
        INSERT INTO forms_questions (id, questionnaire_version_id, question_key, question_type, label, description_html, is_required, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [qId, versionId, qKey, q.question_type, q.label, '', q.is_required, qIndex]);

      if (q.options.length > 0) {
        for (let oIndex = 0; oIndex < q.options.length; oIndex++) {
          const opt = q.options[oIndex];
          const optId = crypto.randomUUID();
          await client.query(`
            INSERT INTO forms_question_options (id, question_id, option_value, option_label, score, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [optId, qId, `opt_${oIndex}`, opt.label, opt.score, oIndex]);
        }
      }
    }

    console.log('✅ Baseline Questionnaire successfully seeded.');

  } catch (err) {
    console.error('Error during data seeding:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
