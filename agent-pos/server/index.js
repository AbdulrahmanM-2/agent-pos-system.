require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() })
})

// Setup - creates all tables and admin user
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS float_balances (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(30) NOT NULL,
        balance NUMERIC(15,2) DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agent_id, service_type)
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id),
        type VARCHAR(30) NOT NULL,
        sub_type VARCHAR(50),
        phone VARCHAR(20),
        account_number VARCHAR(50),
        network VARCHAR(30),
        bank VARCHAR(50),
        service VARCHAR(30),
        amount NUMERIC(15,2) NOT NULL,
        commission NUMERIC(15,2) DEFAULT 0,
        reference VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'success',
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(50),
        entity_id INTEGER,
        old_value JSONB,
        new_value JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS commission_rates (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(30) NOT NULL,
        rate_percent NUMERIC(5,2) DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agent_id, service_type)
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS float_topups (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id),
        admin_id INTEGER REFERENCES users(id),
        service_type VARCHAR(30) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    await pool.query(`
      INSERT INTO users (username, password, full_name, role)
      VALUES (
        'admin',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
        'System Administrator',
        'admin'
      ) ON CONFLICT (username) DO NOTHING
    `)
    res.send(`
      <html>
      <body style="font-family:sans-serif;background:#f0fdf4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:400px;width:100%">
          <div style="font-size:60px;margin-bottom:16px">✅</div>
          <h2 style="color:#16a34a;margin:0 0 8px">Tables Created!</h2>
          <p style="color:#6b7280;margin:0 0 24px">Database is ready to use.</p>
          <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:20px;text-align:left">
            <p style="margin:0 0 6px;font-size:14px"><b>Username:</b> admin</p>
            <p style="margin:0;font-size:14px"><b>Password:</b> Admin@1234</p>
          </div>
          <a href="/" style="display:block;padding:13px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">
            Go to Login →
          </a>
        </div>
      </body>
      </html>
    `)
  } catch (err) {
    res.status(500).send(`
      <html>
      <body style="font-family:sans-serif;background:#fef2f2;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:500px;width:100%">
          <div style="font-size:60px;margin-bottom:16px">❌</div>
          <h2 style="color:#dc2626;margin:0 0 16px">Error</h2>
          <pre style="background:#f8fafc;padding:16px;border-radius:8px;text-align:left;font-size:12px;overflow:auto;white-space:pre-wrap">${err.message}</pre>
        </div>
      </body>
      </html>
    `)
  }
})

// API routes
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/agents',       require('./routes/agents'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/reports',      require('./routes/reports'))

// Serve React frontend - MUST be last
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
