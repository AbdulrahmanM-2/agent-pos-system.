#!/bin/sh
npm install
npm run build
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query(\`
  CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, full_name VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL, phone VARCHAR(20), email VARCHAR(100), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS float_balances (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, balance NUMERIC(15,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type));
  CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), type VARCHAR(30) NOT NULL, sub_type VARCHAR(50), phone VARCHAR(20), account_number VARCHAR(50), network VARCHAR(30), bank VARCHAR(50), service VARCHAR(30), amount NUMERIC(15,2) NOT NULL, commission NUMERIC(15,2) DEFAULT 0, reference VARCHAR(50) UNIQUE, status VARCHAR(20) DEFAULT 'success', note TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), action VARCHAR(100) NOT NULL, entity VARCHAR(50), entity_id INTEGER, old_value JSONB, new_value JSONB, ip_address VARCHAR(45), created_at TIMESTAMPTZ DEFAULT NOW());
  CREATE TABLE IF NOT EXISTS commission_rates (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, rate_percent NUMERIC(5,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type));
  CREATE TABLE IF NOT EXISTS float_topups (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), admin_id INTEGER REFERENCES users(id), service_type VARCHAR(30) NOT NULL, amount NUMERIC(15,2) NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
  INSERT INTO users (username, password, full_name, role) VALUES ('admin','\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.','System Administrator','admin') ON CONFLICT (username) DO NOTHING;
\`).then(() => { console.log('DB ready'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(0); });
"
```

**Commit → Railway redeploys → tables created during build → login immediately.**
```
https://agent-pos-system-production.up.railway.app
Username: admin
Password: Admin@1234
