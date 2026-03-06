const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error', err)
})

async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  try {
    await pool.query(schema)
    console.log('✅ Database schema initialized')
  } catch (err) {
    console.error('❌ DB init error:', err.message)
  }
}

module.exports = { pool, initDB }
