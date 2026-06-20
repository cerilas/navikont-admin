require('dotenv').config({ path: '/Users/deniz/Documents/Navikont/backend/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`SELECT id, full_name, LENGTH(profile_image) as len, SUBSTRING(profile_image, 1, 50) as prefix FROM core_users WHERE profile_image IS NOT NULL LIMIT 5`);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
