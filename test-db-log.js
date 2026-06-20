const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:sKCBeqpAXLrEjZXwRoezFtDRYQLIsvPb@acela.proxy.rlwy.net:42498/railway' });
pool.query("SELECT id, status, metadata FROM patient_notifications ORDER BY created_at DESC LIMIT 5").then(res => { console.log(JSON.stringify(res.rows, null, 2)); pool.end(); });
