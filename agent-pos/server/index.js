require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { pool, initDB } = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
// Health check
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, full_name VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL, phone VARCHAR(20), email VARCHAR(100), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE IF NOT EXISTS float_balances (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, balance NUMERIC(15,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type)); CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), type VARCHAR(30) NOT NULL, sub_type VARCHAR(50), phone VARCHAR(20), account_number VARCHAR(50), network VARCHAR(30), bank VARCHAR(50), service VARCHAR(30), amount NUMERIC(15,2) NOT NULL, commission NUMERIC(15,2) DEFAULT 0, reference VARCHAR(50) UNIQUE, status VARCHAR(20) DEFAULT 'success', note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), action VARCHAR(100) NOT NULL, entity VARCHAR(50), entity_id INTEGER, old_value JSONB, new_value JSONB, ip_address VARCHAR(45), created_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE IF NOT EXISTS commission_rates (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, rate_percent NUMERIC(5,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type)); CREATE TABLE IF NOT EXISTS float_topups (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), admin_id INTEGER REFERENCES users(id), service_type VARCHAR(30) NOT NULL, amount NUMERIC(15,2) NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()); INSERT INTO users (username, password, full_name, role) VALUES ('admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.','System Administrator','admin') ON CONFLICT (username) DO NOTHING;`)
    res.send('<h2>✅ Done! <a href="/">Login here</a> — admin / Admin@1234</h2>')
  } catch(e) { res.status(500).send('❌ ' + e.message) }
})
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// ONE-TIME SETUP — visit this URL in browser to create all tables
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin','cashier')),
        phone VARCHAR(20), email VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS float_balances (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(30) NOT NULL,
        balance NUMERIC(15,2) DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agent_id, service_type)
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id),
        type VARCHAR(30) NOT NULL,
        sub_type VARCHAR(50), phone VARCHAR(20),
        account_number VARCHAR(50), network VARCHAR(30),
        bank VARCHAR(50), service VARCHAR(30),
        amount NUMERIC(15,2) NOT NULL,
        commission NUMERIC(15,2) DEFAULT 0,
        reference VARCHAR(50) UNIQUE,
        status VARCHAR(20) DEFAULT 'success',
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity VARCHAR(50), entity_id INTEGER,
        old_value JSONB, new_value JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS commission_rates (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_type VARCHAR(30) NOT NULL,
        rate_percent NUMERIC(5,2) DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(agent_id, service_type)
      );
      CREATE TABLE IF NOT EXISTS float_topups (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES users(id),
        admin_id INTEGER REFERENCES users(id),
        service_type VARCHAR(30) NOT NULL,
        amount NUMERIC(15,2) NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_agent   ON transactions(agent_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created   ON audit_logs(created_at DESC);
      INSERT INTO users (username, password, full_name, role)
      VALUES ('admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.','System Administrator','admin')
      ON CONFLICT (username) DO NOTHING;
    `)
    res.send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#f0fdf4;text-align:center">
        <div style="max-width:400px;margin:0 auto;background:#fff;padding:40px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)">
          <div style="font-size:56px;margin-bottom:16px">✅</div>
          <h2 style="color:#16a34a;margin-bottom:8px">Setup Complete!</h2>
          <p style="color:#6b7280;margin-bottom:24px">All 6 tables created successfully.</p>
          <p style="background:#f8fafc;padding:16px;border-radius:8px;text-align:left;font-size:14px">
            <strong>Username:</strong> admin<br>
            <strong>Password:</strong> Admin@1234
          </p>
          <a href="/" style="display:block;margin-top:20px;padding:12px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">
            Go to Login →
          </a>
        </div>
      </body></html>
    `)
  } catch(err) {
    res.status(500).send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#fef2f2;text-align:center">
        <div style="max-width:500px;margin:0 auto;background:#fff;padding:40px;border-radius:16px">
          <div style="font-size:56px;margin-bottom:16px">❌</div>
          <h2 style="color:#dc2626">Setup Failed</h2>
          <pre style="background:#f8fafc;padding:16px;border-radius:8px;text-align:left;font-size:12px;overflow:auto">${err.message}</pre>
        </div>
      </body></html>
    `)
  }
})

// API routes
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/agents',       require('./routes/agents'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/reports',      require('./routes/reports'))

// Serve React frontend
const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

async function start() {
  await initDB()
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start:', err)
  process.exit(1)
})
