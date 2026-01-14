import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'volty',
  password: '1504',
  port: 5432
})

export default pool
