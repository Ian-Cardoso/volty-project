import pkg from 'pg';
const { Pool } = pkg;

(async function(){
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'volty',
    password: process.env.DB_PASSWORD || '1504',
    port: process.env.DB_PORT || 5432,
  });

  try {
    const r = await pool.query("SELECT id, code, valid_from, valid_until, is_active, discount_type, discount_value FROM coupons WHERE code='INDEFINIDO'");
    console.log('coupon rows:', r.rows);
  } catch(e){
    console.error(e);
  } finally {
    await pool.end();
  }
})();
