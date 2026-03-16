import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

(async function() {
  // SECURITY: Database credentials must come from environment variables
  // DO NOT use hardcoded defaults in production
  if (!process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('❌ Error: DB_USER and DB_PASSWORD environment variables are required');
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
  }

  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'volty',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });

  try {
    const res = await pool.query('SELECT id, name, email FROM users');
    console.log('Users:', res.rows);
    const res2 = await pool.query("SELECT id, name, email FROM users WHERE email ILIKE '%felipe%'");
    console.log('Matching Felipe:', res2.rows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();