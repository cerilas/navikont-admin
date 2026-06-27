require('dotenv').config({ path: '/Users/deniz/Documents/navikont-admin-2/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'core_faqs';");
    console.log(res.rows);
  } catch(e) { console.error(e); }
  finally { pool.end(); }
}
check();
