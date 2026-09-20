const { Pool } = require('pg');

const useSsl = process.env.PGSSL === 'true' || /neon\.tech|render\.com/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

module.exports = pool;
