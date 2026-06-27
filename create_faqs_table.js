require('dotenv').config({ path: '/Users/deniz/Documents/navikont-admin-2/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS core_faqs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id UUID REFERENCES content_apps(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Insert a dummy FAQ for testing if none exist
      INSERT INTO core_faqs (app_id, question, answer, order_index, is_active)
      SELECT id, 'Sistem nasıl çalışır?', 'Sistem otomatik çalışır.', 1, true
      FROM content_apps LIMIT 1
      ON CONFLICT DO NOTHING;
    `);
    console.log("FAQ table created successfully.");
  } catch (err) {
    console.error("Error creating faqs table:", err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
