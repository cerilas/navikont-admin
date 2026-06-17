const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database for Check-in data seeding.');

  try {
    // 1. Find all modules of type 'checkin'
    const checkinRes = await client.query(`
      SELECT mv.id as version_id, mv.content, m.id as module_id, m.name, m.app_id 
      FROM content_module_versions mv
      JOIN content_modules m ON mv.module_id = m.id
      JOIN content_module_types mt ON m.module_type_id = mt.id
      WHERE mt.code = 'checkin'
    `);

    for (const row of checkinRes.rows) {
      if (row.content) {
        const templateCode = row.content.checkinTemplateId || 'default_daily_checkin';
        const frequency = row.content.frequency || 'daily';
        
        console.log(`Processing module: ${row.name} with template code: ${templateCode}`);

        // 2. Check if a template with this name already exists
        const existingTemplateRes = await client.query(`
          SELECT id FROM forms_checkin_templates WHERE name = $1 AND app_id = $2
        `, [templateCode, row.app_id]);

        let templateId;

        if (existingTemplateRes.rows.length === 0) {
          // 3. Create a new checkin template
          templateId = crypto.randomUUID();
          await client.query(`
            INSERT INTO forms_checkin_templates (id, app_id, name, description, frequency, streak_enabled, status)
            VALUES ($1, $2, $3, $4, $5, true, 'published')
          `, [templateId, row.app_id, templateCode, `Otomatik oluşturulan checkin şablonu: ${row.name}`, frequency]);
          
          const versionId = crypto.randomUUID();
          await client.query(`
            INSERT INTO forms_checkin_template_versions (id, checkin_template_id, version_number, title, status)
            VALUES ($1, $2, 1, $3, 'published')
          `, [versionId, templateId, templateCode]);

          console.log(`✅ Created new Check-in Template: ${templateCode}`);
        } else {
          templateId = existingTemplateRes.rows[0].id;
          console.log(`ℹ️ Check-in Template already exists: ${templateCode}`);
        }

        // 4. Update the module version to ensure strictly typed JSON match for CheckinForm
        // Our CheckinForm expects checkinTemplateId and frequency
        const updatedContent = {
          checkinTemplateId: templateCode,
          frequency: frequency
        };

        await client.query('UPDATE content_module_versions SET content = $1 WHERE id = $2', [JSON.stringify(updatedContent), row.version_id]);
        console.log(`✅ Verified and aligned JSON schema for module: ${row.name}`);
      }
    }

  } catch (err) {
    console.error('Error during checkin data seeding:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
