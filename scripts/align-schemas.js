const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database for schema alignment.');

  try {
    // We will query all module versions for the affected modules and update them
    
    // 1. TextForm: Yazılı İçerik Modülü
    const textRes = await client.query(`
      SELECT mv.id, mv.content, m.name 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      WHERE m.name = 'Aşırı Aktif Mesane Nedir?'
    `);
    for (const row of textRes.rows) {
      if (row.content && row.content.contentHtml) {
        row.content.html = row.content.contentHtml;
        row.content.readTime = row.content.readTime || 5;
        delete row.content.contentHtml;
        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(row.content), row.id]);
        console.log(`Aligned schema for: ${row.name}`);
      }
    }

    // 2. VideoForm: Video Modülü
    const videoRes = await client.query(`
      SELECT mv.id, mv.content, m.name 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      WHERE m.name = 'Pelvik Taban Kas Egzersizleri (Kegel)'
    `);
    for (const row of videoRes.rows) {
      if (row.content) {
        row.content.duration = row.content.duration || 5;
        row.content.interactions = row.content.interactions || "";
        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(row.content), row.id]);
        console.log(`Aligned schema for: ${row.name}`);
      }
    }

    // 3. BreathingForm: Nefes Egzersizi Modülü
    const breathingRes = await client.query(`
      SELECT mv.id, mv.content, m.name 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      WHERE m.name = 'Sıkışma Anında Rahatlama Nefesi'
    `);
    for (const row of breathingRes.rows) {
      if (row.content && row.content.inhaleTime) {
        row.content.inhaleDuration = row.content.inhaleTime;
        row.content.holdDuration = row.content.holdTime;
        row.content.exhaleDuration = row.content.exhaleTime;
        row.content.holdEmptyDuration = 0;
        row.content.instructions = row.content.instructionsHtml || row.content.instructions;
        
        delete row.content.inhaleTime;
        delete row.content.holdTime;
        delete row.content.exhaleTime;
        delete row.content.instructionsHtml;
        delete row.content.cycles; // Cycles are not part of UI
        
        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(row.content), row.id]);
        console.log(`Aligned schema for: ${row.name}`);
      }
    }

    // 4. QuizForm: Test / Quiz Modülü and Soru-Cevap Modülü
    const quizRes = await client.query(`
      SELECT mv.id, mv.content, m.name 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      WHERE m.name IN ('Aşırı Aktif Mesane Bilgi Testi', 'Tedavi Uyum Değerlendirmesi')
    `);
    for (const row of quizRes.rows) {
      if (row.content && row.content.questions) {
        row.content.questions = row.content.questions.map((q, index) => {
          return {
            id: `q_${Date.now()}_${index}`,
            text: q.question || q.text || '',
            type: 'single_choice',
            options: q.options || [],
            correctOptionIndex: q.correctAnswer !== undefined ? q.correctAnswer : (q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0),
            explanation: q.explanation || ''
          };
        });
        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(row.content), row.id]);
        console.log(`Aligned schema for: ${row.name}`);
      }
    }

    // 5. TaskForm: Görev Modülü
    const taskRes = await client.query(`
      SELECT mv.id, mv.content, m.name 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      WHERE m.name = 'Günü Tamamlama Görevleri'
    `);
    for (const row of taskRes.rows) {
      if (row.content && row.content.instructionsHtml) {
        row.content.instructions = row.content.instructionsHtml;
        delete row.content.instructionsHtml;
        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(row.content), row.id]);
        console.log(`Aligned schema for: ${row.name}`);
      }
    }

  } catch (err) {
    console.error('Error during schema alignment:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
