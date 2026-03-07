require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

const JWT_SECRET = process.env.JWT_SECRET || 'posapp-secret-2024'
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

async function auth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' })
  try {
    const p = jwt.verify(h.slice(7), JWT_SECRET)
    const { rows } = await pool.query('SELECT id,username,full_name,role,is_active FROM users WHERE id=$1', [p.id])
    if (!rows[0] || !rows[0].is_active) return res.status(401).json({ error: 'User inactive' })
    req.user = rows[0]; next()
  } catch { return res.status(401).json({ error: 'Invalid token' }) }
}

function admin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' })
  next()
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))
app.get('/api/reset-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs')
    const hash = await bcrypt.hash('Admin@1234', 10)
    await pool.query('UPDATE users SET password=$1 WHERE username=$2', [hash, 'admin'])
    res.send('<html><body style="padding:40px;font-family:sans-serif"><h2 style="color:green">✅ Admin password reset!</h2><p>Username: <b>admin</b><br>Password: <b>Admin@1234</b></p><a href="/">Go to Login</a></body></html>')
  } catch(e) { res.status(500).send('Error: ' + e.message) }
})
app.get('/api/setup', async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL, full_name VARCHAR(100) NOT NULL, role VARCHAR(20) NOT NULL, phone VARCHAR(20), email VARCHAR(100), is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS float_balances (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, balance NUMERIC(15,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type))`)
    await pool.query(`CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), type VARCHAR(30) NOT NULL, sub_type VARCHAR(50), phone VARCHAR(20), account_number VARCHAR(50), network VARCHAR(30), bank VARCHAR(50), service VARCHAR(30), amount NUMERIC(15,2) NOT NULL, commission NUMERIC(15,2) DEFAULT 0, reference VARCHAR(50) UNIQUE, status VARCHAR(20) DEFAULT 'success', note TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), action VARCHAR(100) NOT NULL, entity VARCHAR(50), entity_id INTEGER, old_value JSONB, new_value JSONB, ip_address VARCHAR(45), created_at TIMESTAMPTZ DEFAULT NOW())`)
    await pool.query(`CREATE TABLE IF NOT EXISTS commission_rates (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id) ON DELETE CASCADE, service_type VARCHAR(30) NOT NULL, rate_percent NUMERIC(5,2) DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(agent_id, service_type))`)
    await pool.query(`CREATE TABLE IF NOT EXISTS float_topups (id SERIAL PRIMARY KEY, agent_id INTEGER REFERENCES users(id), admin_id INTEGER REFERENCES users(id), service_type VARCHAR(30) NOT NULL, amount NUMERIC(15,2) NOT NULL, note TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`)
    await pool.query(`INSERT INTO users (username,password,full_name,role) VALUES ('admin','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.','System Administrator','admin') ON CONFLICT (username) DO NOTHING`)
    res.send('<html><body style="font-family:sans-serif;background:#f0fdf4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="background:#fff;padding:40px;border-radius:16px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.1);max-width:400px;width:100%"><div style="font-size:60px">✅</div><h2 style="color:#16a34a">Tables Created!</h2><p style="background:#f8fafc;padding:16px;border-radius:8px">Username: <b>admin</b><br>Password: <b>Admin@1234</b></p><a href="/" style="display:block;margin-top:20px;padding:13px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Go to Login</a></div></body></html>')
  } catch (e) {
    res.status(500).send('<html><body style="padding:40px"><h2 style="color:red">Error</h2><pre>' + e.message + '</pre></body></html>')
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username=$1', [username.toLowerCase().trim()])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (!user.is_active) return res.status(403).json({ error: 'Account disabled' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ token, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }))

app.post('/api/auth/change-password', auth, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' })
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id=$1', [req.user.id])
    const valid = await bcrypt.compare(current_password, rows[0].password)
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' })
    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password=$1,updated_at=NOW() WHERE id=$2', [hashed, req.user.id])
    res.json({ message: 'Password updated' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/transactions/my-float', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT service_type,balance FROM float_balances WHERE agent_id=$1', [req.user.id])
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/transactions', auth, async (req, res) => {
  const { type, sub_type, phone, account_number, network, bank, service, amount, note } = req.body
  if (!type || !amount || amount <= 0) return res.status(400).json({ error: 'Type and amount required' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const serviceType = type
    const { rows: rateRows } = await client.query('SELECT rate_percent FROM commission_rates WHERE agent_id=$1 AND service_type=$2', [req.user.id, serviceType])
    const commission = ((amount * (rateRows[0]?.rate_percent || 0)) / 100)
    const { rows: floatRows } = await client.query('SELECT balance FROM float_balances WHERE agent_id=$1 AND service_type=$2', [req.user.id, serviceType])
    const float = floatRows[0]?.balance || 0
    if (float < amount) { await client.query('ROLLBACK'); return res.status(400).json({ error: `Insufficient float. Available: TZS ${float}` }) }
    await client.query('UPDATE float_balances SET balance=balance-$1,updated_at=NOW() WHERE agent_id=$2 AND service_type=$3', [amount, req.user.id, serviceType])
    const ref = (type==='airtime'?'AT':type==='mobile_money'?'MM':'BK') + Date.now() + Math.floor(Math.random()*1000)
    const { rows } = await client.query(`INSERT INTO transactions (agent_id,type,sub_type,phone,account_number,network,bank,service,amount,commission,reference,note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [req.user.id,type,sub_type,phone,account_number,network,bank,service,amount,commission,ref,note])
    await client.query('COMMIT')
    res.status(201).json({ transaction: rows[0], commission, reference: ref })
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }) }
  finally { client.release() }
})

app.get('/api/transactions', auth, async (req, res) => {
  const { page=1, limit=50, type, agent_id } = req.query
  const offset = (page-1)*limit; const params = []; const conditions = []
  if (req.user.role!=='admin') conditions.push(`t.agent_id=$${params.push(req.user.id)}`)
  else if (agent_id) conditions.push(`t.agent_id=$${params.push(agent_id)}`)
  if (type) conditions.push(`t.type=$${params.push(type)}`)
  const where = conditions.length ? 'WHERE '+conditions.join(' AND ') : ''
  try {
    const { rows } = await pool.query(`SELECT t.*,u.full_name AS agent_name FROM transactions t JOIN users u ON u.id=t.agent_id ${where} ORDER BY t.created_at DESC LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`, params)
    const { rows: c } = await pool.query(`SELECT COUNT(*) FROM transactions t ${where}`, params.slice(0,-2))
    res.json({ transactions: rows, total: +c[0].count, page: +page })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/agents', auth, admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT u.id,u.username,u.full_name,u.role,u.phone,u.email,u.is_active,u.created_at, COALESCE(fa.balance,0) AS float_airtime,COALESCE(fm.balance,0) AS float_mobile_money,COALESCE(fb.balance,0) AS float_banking, COALESCE(ca.rate_percent,0) AS comm_airtime,COALESCE(cm.rate_percent,0) AS comm_mobile_money,COALESCE(cb.rate_percent,0) AS comm_banking, COUNT(t.id) AS total_transactions,COALESCE(SUM(t.amount),0) AS total_volume,COALESCE(SUM(t.commission),0) AS total_commission FROM users u LEFT JOIN float_balances fa ON fa.agent_id=u.id AND fa.service_type='airtime' LEFT JOIN float_balances fm ON fm.agent_id=u.id AND fm.service_type='mobile_money' LEFT JOIN float_balances fb ON fb.agent_id=u.id AND fb.service_type='banking' LEFT JOIN commission_rates ca ON ca.agent_id=u.id AND ca.service_type='airtime' LEFT JOIN commission_rates cm ON cm.agent_id=u.id AND cm.service_type='mobile_money' LEFT JOIN commission_rates cb ON cb.agent_id=u.id AND cb.service_type='banking' LEFT JOIN transactions t ON t.agent_id=u.id WHERE u.role='cashier' GROUP BY u.id,fa.balance,fm.balance,fb.balance,ca.rate_percent,cm.rate_percent,cb.rate_percent ORDER BY u.created_at DESC`)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.post('/api/agents', auth, admin, async (req, res) => {
  const { username, password, full_name, phone, email, comm_airtime=1, comm_mobile_money=1, comm_banking=0.5 } = req.body
  if (!username||!password||!full_name) return res.status(400).json({ error: 'Username, password and name required' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hashed = await bcrypt.hash(password, 10)
    const { rows } = await client.query(`INSERT INTO users (username,password,full_name,role,phone,email) VALUES ($1,$2,$3,'cashier',$4,$5) RETURNING *`, [username.toLowerCase().trim(),hashed,full_name,phone||null,email||null])
    const agent = rows[0]
    for (const type of ['airtime','mobile_money','banking']) await client.query('INSERT INTO float_balances (agent_id,service_type,balance) VALUES ($1,$2,0)', [agent.id,type])
    for (const [type,rate] of [['airtime',comm_airtime],['mobile_money',comm_mobile_money],['banking',comm_banking]]) await client.query('INSERT INTO commission_rates (agent_id,service_type,rate_percent) VALUES ($1,$2,$3)', [agent.id,type,rate])
    await client.query('COMMIT')
    res.status(201).json({ message: 'Agent created', agent: { id: agent.id, username: agent.username } })
  } catch (e) { await client.query('ROLLBACK'); if (e.code==='23505') return res.status(409).json({ error: 'Username exists' }); res.status(500).json({ error: e.message }) }
  finally { client.release() }
})

app.put('/api/agents/:id', auth, admin, async (req, res) => {
  const { full_name, phone, email, is_active, comm_airtime, comm_mobile_money, comm_banking } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE users SET full_name=$1,phone=$2,email=$3,is_active=$4,updated_at=NOW() WHERE id=$5', [full_name,phone,email,is_active,req.params.id])
    for (const [type,rate] of [['airtime',comm_airtime],['mobile_money',comm_mobile_money],['banking',comm_banking]]) {
      if (rate!==undefined) await client.query(`INSERT INTO commission_rates (agent_id,service_type,rate_percent) VALUES ($1,$2,$3) ON CONFLICT (agent_id,service_type) DO UPDATE SET rate_percent=$3,updated_at=NOW()`, [req.params.id,type,rate])
    }
    await client.query('COMMIT'); res.json({ message: 'Agent updated' })
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }) }
  finally { client.release() }
})

app.post('/api/agents/:id/topup', auth, admin, async (req, res) => {
  const { service_type, amount, note } = req.body
  if (!service_type||!amount||amount<=0) return res.status(400).json({ error: 'Service type and amount required' })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`INSERT INTO float_balances (agent_id,service_type,balance) VALUES ($1,$2,$3) ON CONFLICT (agent_id,service_type) DO UPDATE SET balance=float_balances.balance+$3,updated_at=NOW()`, [req.params.id,service_type,amount])
    await client.query('INSERT INTO float_topups (agent_id,admin_id,service_type,amount,note) VALUES ($1,$2,$3,$4,$5)', [req.params.id,req.user.id,service_type,amount,note||null])
    await client.query('COMMIT'); res.json({ message: 'Float topped up' })
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }) }
  finally { client.release() }
})

app.get('/api/reports/summary', auth, async (req, res) => {
  const { date=new Date().toISOString().slice(0,10) } = req.query
  const agentId = req.user.role==='admin' ? req.query.agent_id : req.user.id
  const params = [date+' 00:00:00', date+' 23:59:59']
  const agentFilter = agentId ? `AND agent_id=$${params.push(agentId)}` : ''
  try {
    const { rows } = await pool.query(`SELECT type,COUNT(*) AS count,SUM(amount) AS volume,SUM(commission) AS commission FROM transactions WHERE created_at BETWEEN $1 AND $2 AND status='success' ${agentFilter} GROUP BY type`, params)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/reports/agents', auth, admin, async (req, res) => {
  const { date_from=new Date().toISOString().slice(0,10), date_to=new Date().toISOString().slice(0,10) } = req.query
  try {
    const { rows } = await pool.query(`SELECT u.id,u.username,u.full_name,u.is_active,COUNT(t.id) AS transactions,COALESCE(SUM(t.amount),0) AS volume,COALESCE(SUM(t.commission),0) AS commission,COALESCE(SUM(CASE WHEN t.type='airtime' THEN t.amount END),0) AS airtime_vol,COALESCE(SUM(CASE WHEN t.type='mobile_money' THEN t.amount END),0) AS mobile_vol,COALESCE(SUM(CASE WHEN t.type='banking' THEN t.amount END),0) AS banking_vol FROM users u LEFT JOIN transactions t ON t.agent_id=u.id AND t.created_at BETWEEN $1 AND $2 AND t.status='success' WHERE u.role='cashier' GROUP BY u.id ORDER BY volume DESC`, [date_from+' 00:00:00',date_to+' 23:59:59'])
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/reports/audit-logs', auth, admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT al.*,u.full_name,u.username FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.created_at DESC LIMIT 100`)
    res.json({ logs: rows, total: rows.length })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

app.get('/api/reports/daily', auth, admin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT DATE(created_at) AS date,type,COUNT(*) AS count,SUM(amount) AS volume,SUM(commission) AS commission FROM transactions WHERE created_at>=NOW()-INTERVAL '30 days' AND status='success' GROUP BY DATE(created_at),type ORDER BY date DESC`)
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))
app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')))

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`))
