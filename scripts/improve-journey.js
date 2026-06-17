const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database to improve Journey.');

  try {
    // 1. Get the app_id
    const appRes = await client.query("SELECT id FROM content_apps WHERE name = 'NaviKont' LIMIT 1");
    if (appRes.rows.length === 0) throw new Error('App not found.');
    const appId = appRes.rows[0].id;

    // 2. Get Draft App Version ID
    const verRes = await client.query("SELECT id FROM content_app_versions WHERE app_id = $1 AND status = 'draft' LIMIT 1", [appId]);
    if (verRes.rows.length === 0) throw new Error('Draft App Version not found.');
    const appVersionId = verRes.rows[0].id;

    // 3. Get Soru-Cevap Modülü Type ID
    const typeRes = await client.query("SELECT id FROM content_module_types WHERE name = 'Soru-Cevap Modülü' LIMIT 1");
    if (typeRes.rows.length === 0) throw new Error('Soru-Cevap Modülü type not found.');
    const moduleTypeId = typeRes.rows[0].id;

    // 4. Get Baseline Questionnaire ID
    const formRes = await client.query("SELECT id FROM forms_questionnaires WHERE app_id = $1 AND questionnaire_type = 'baseline' AND status != 'archived' LIMIT 1", [appId]);
    if (formRes.rows.length === 0) throw new Error('Baseline Questionnaire not found.');
    const baselineFormId = formRes.rows[0].id;

    // 5. Get Journey ID
    const journeyRes = await client.query("SELECT id FROM content_journeys WHERE app_id = $1 AND name = 'Aşırı Aktif Mesane 15 Günlük Tedavi Programı' LIMIT 1", [appId]);
    if (journeyRes.rows.length === 0) throw new Error('Journey not found.');
    const journeyId = journeyRes.rows[0].id;

    console.log('Creating Baseline Module...');
    // 6. Create Baseline Module
    const baselineModuleId = crypto.randomUUID();
    const baselineVersionId = crypto.randomUUID();
    
    await client.query(`
      INSERT INTO content_modules (id, app_id, module_type_id, name, internal_name, description, status)
      VALUES ($1, $2, $3, 'Başlangıç Klinik Değerlendirmesi', 'baseline_q_module', 'Tedavi başlangıcındaki durumunuzu ölçen anket.', 'published')
    `, [baselineModuleId, appId, moduleTypeId]);

    await client.query(`
      INSERT INTO content_module_versions (id, module_id, app_version_id, version_number, title, subtitle, content, status)
      VALUES ($1, $2, $3, 1, 'Başlangıç Klinik Değerlendirmesi', 'Profilinizi belirleyelim', $4, 'published')
    `, [baselineVersionId, baselineModuleId, appVersionId, JSON.stringify({ formId: baselineFormId })]);

    console.log('Creating Endline Module...');
    // 7. Create Endline Module
    const endlineModuleId = crypto.randomUUID();
    const endlineVersionId = crypto.randomUUID();
    
    await client.query(`
      INSERT INTO content_modules (id, app_id, module_type_id, name, internal_name, description, status)
      VALUES ($1, $2, $3, 'Program Sonu Klinik Değerlendirmesi', 'endline_q_module', '15 gün sonundaki durumunuzu ölçen anket.', 'published')
    `, [endlineModuleId, appId, moduleTypeId]);

    await client.query(`
      INSERT INTO content_module_versions (id, module_id, app_version_id, version_number, title, subtitle, content, status)
      VALUES ($1, $2, $3, 1, 'Program Sonu Klinik Değerlendirmesi', 'Gelişiminizi görelim', $4, 'published')
    `, [endlineVersionId, endlineModuleId, appVersionId, JSON.stringify({ formId: baselineFormId })]);

    console.log('Updating Journey Steps...');
    await client.query('BEGIN');

    // 8. Shift Day 1 orders by +1 to make room for Baseline safely
    await client.query(`
      UPDATE content_journey_steps 
      SET order_in_day = order_in_day + 1000 
      WHERE journey_id = $1 AND day_number = 1
    `, [journeyId]);

    await client.query(`
      UPDATE content_journey_steps 
      SET order_in_day = order_in_day - 999 
      WHERE journey_id = $1 AND day_number = 1 AND order_in_day > 1000
    `, [journeyId]);

    // 9. Insert Baseline Module at Day 1, Order 1
    await client.query(`
      INSERT INTO content_journey_steps (id, journey_id, module_id, day_number, order_in_day, is_required, delay_minutes)
      VALUES ($1, $2, $3, 1, 1, true, 0)
    `, [crypto.randomUUID(), journeyId, baselineModuleId]);

    // 10. Get max order for Day 15
    const maxRes = await client.query(`
      SELECT COALESCE(MAX(order_in_day), 0) + 1 as next_order 
      FROM content_journey_steps 
      WHERE journey_id = $1 AND day_number = 15
    `, [journeyId]);
    const nextOrder15 = maxRes.rows[0].next_order;

    // 11. Insert Endline Module at Day 15, Max Order + 1
    await client.query(`
      INSERT INTO content_journey_steps (id, journey_id, module_id, day_number, order_in_day, is_required, delay_minutes)
      VALUES ($1, $2, $3, 15, $4, true, 0)
    `, [crypto.randomUUID(), journeyId, endlineModuleId, nextOrder15]);

    await client.query('COMMIT');
    console.log('✅ Journey successfully improved with Baseline and Endline Questionnaires.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during data seeding:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
