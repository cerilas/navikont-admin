const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'patient_app_enrollments';
    `);
    console.log(res.rows);
  } catch (err) {
    console.error('Error fetching schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
