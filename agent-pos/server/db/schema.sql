-- ============================================================
-- Agent POS System - PostgreSQL Schema
-- ============================================================

-- USERS (admin + cashiers/agents)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(50) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
  phone       VARCHAR(20),
  email       VARCHAR(100),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- FLOAT BALANCES (per agent per service)
CREATE TABLE IF NOT EXISTS float_balances (
  id            SERIAL PRIMARY KEY,
  agent_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_type  VARCHAR(30) NOT NULL CHECK (service_type IN ('airtime', 'mobile_money', 'banking')),
  balance       NUMERIC(15,2) DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, service_type)
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id              SERIAL PRIMARY KEY,
  agent_id        INTEGER REFERENCES users(id),
  type            VARCHAR(30) NOT NULL CHECK (type IN ('airtime', 'mobile_money', 'banking')),
  sub_type        VARCHAR(50),  -- send_money, receive_money, pay_bills, deposit, withdraw
  phone           VARCHAR(20),
  account_number  VARCHAR(50),
  network         VARCHAR(30),
  bank            VARCHAR(50),
  service         VARCHAR(30),
  amount          NUMERIC(15,2) NOT NULL,
  commission      NUMERIC(15,2) DEFAULT 0,
  reference       VARCHAR(50) UNIQUE,
  status          VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success','failed','pending','reversed')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  action      VARCHAR(100) NOT NULL,
  entity      VARCHAR(50),
  entity_id   INTEGER,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- COMMISSION RATES (per agent per service type)
CREATE TABLE IF NOT EXISTS commission_rates (
  id            SERIAL PRIMARY KEY,
  agent_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  service_type  VARCHAR(30) NOT NULL,
  rate_percent  NUMERIC(5,2) DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, service_type)
);

-- FLOAT TOPUP HISTORY
CREATE TABLE IF NOT EXISTS float_topups (
  id            SERIAL PRIMARY KEY,
  agent_id      INTEGER REFERENCES users(id),
  admin_id      INTEGER REFERENCES users(id),
  service_type  VARCHAR(30) NOT NULL,
  amount        NUMERIC(15,2) NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_transactions_agent    ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created  ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at DESC);

-- DEFAULT ADMIN USER (password: Admin@1234)
INSERT INTO users (username, password, full_name, role)
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'System Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;
