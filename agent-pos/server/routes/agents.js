const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { auditLog } = require('../middleware/audit')

// GET /api/agents - list all agents
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.username, u.full_name, u.role, u.phone, u.email, u.is_active, u.created_at,
        COALESCE(fb_air.balance, 0)  AS float_airtime,
        COALESCE(fb_mm.balance,  0)  AS float_mobile_money,
        COALESCE(fb_bk.balance,  0)  AS float_banking,
        COALESCE(cr_air.rate_percent, 0) AS comm_airtime,
        COALESCE(cr_mm.rate_percent,  0) AS comm_mobile_money,
        COALESCE(cr_bk.rate_percent,  0) AS comm_banking,
        COUNT(t.id)                  AS total_transactions,
        COALESCE(SUM(t.amount), 0)   AS total_volume,
        COALESCE(SUM(t.commission),0) AS total_commission
      FROM users u
      LEFT JOIN float_balances fb_air ON fb_air.agent_id = u.id AND fb_air.service_type = 'airtime'
      LEFT JOIN float_balances fb_mm  ON fb_mm.agent_id  = u.id AND fb_mm.service_type  = 'mobile_money'
      LEFT JOIN float_balances fb_bk  ON fb_bk.agent_id  = u.id AND fb_bk.service_type  = 'banking'
      LEFT JOIN commission_rates cr_air ON cr_air.agent_id = u.id AND cr_air.service_type = 'airtime'
      LEFT JOIN commission_rates cr_mm  ON cr_mm.agent_id  = u.id AND cr_mm.service_type  = 'mobile_money'
      LEFT JOIN commission_rates cr_bk  ON cr_bk.agent_id  = u.id AND cr_bk.service_type  = 'banking'
      LEFT JOIN transactions t ON t.agent_id = u.id
      WHERE u.role = 'cashier'
      GROUP BY u.id, fb_air.balance, fb_mm.balance, fb_bk.balance, cr_air.rate_percent, cr_mm.rate_percent, cr_bk.rate_percent
      ORDER BY u.created_at DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/agents - create agent
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, full_name, phone, email, comm_airtime, comm_mobile_money, comm_banking } = req.body
  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Username, password and full name are required' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hashed = await bcrypt.hash(password, 10)
    const { rows } = await client.query(
      `INSERT INTO users (username, password, full_name, role, phone, email)
       VALUES ($1, $2, $3, 'cashier', $4, $5) RETURNING *`,
      [username.toLowerCase().trim(), hashed, full_name, phone || null, email || null]
    )
    const agent = rows[0]

    // Init float balances
    for (const type of ['airtime', 'mobile_money', 'banking']) {
      await client.query(
        'INSERT INTO float_balances (agent_id, service_type, balance) VALUES ($1, $2, 0)',
        [agent.id, type]
      )
    }

    // Set commission rates
    const rates = { airtime: comm_airtime || 0, mobile_money: comm_mobile_money || 0, banking: comm_banking || 0 }
    for (const [type, rate] of Object.entries(rates)) {
      await client.query(
        'INSERT INTO commission_rates (agent_id, service_type, rate_percent) VALUES ($1, $2, $3)',
        [agent.id, type, rate]
      )
    }

    await client.query('COMMIT')
    await auditLog({ userId: req.user.id, action: 'CREATE_AGENT', entity: 'users', entityId: agent.id, newValue: { username, full_name }, ip: req.ip })
    res.status(201).json({ message: 'Agent created', agent: { id: agent.id, username: agent.username, full_name: agent.full_name } })
  } catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') return res.status(409).json({ error: 'Username already exists' })
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// PUT /api/agents/:id - update agent
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { full_name, phone, email, is_active, comm_airtime, comm_mobile_money, comm_banking } = req.body
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows: before } = await client.query('SELECT * FROM users WHERE id = $1', [req.params.id])
    if (!before[0]) return res.status(404).json({ error: 'Agent not found' })

    await client.query(
      'UPDATE users SET full_name=$1, phone=$2, email=$3, is_active=$4, updated_at=NOW() WHERE id=$5',
      [full_name, phone, email, is_active, req.params.id]
    )

    const rates = { airtime: comm_airtime, mobile_money: comm_mobile_money, banking: comm_banking }
    for (const [type, rate] of Object.entries(rates)) {
      if (rate !== undefined) {
        await client.query(
          `INSERT INTO commission_rates (agent_id, service_type, rate_percent)
           VALUES ($1, $2, $3)
           ON CONFLICT (agent_id, service_type) DO UPDATE SET rate_percent=$3, updated_at=NOW()`,
          [req.params.id, type, rate]
        )
      }
    }

    await client.query('COMMIT')
    await auditLog({ userId: req.user.id, action: 'UPDATE_AGENT', entity: 'users', entityId: +req.params.id, oldValue: before[0], newValue: req.body, ip: req.ip })
    res.json({ message: 'Agent updated' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// POST /api/agents/:id/topup - float top-up
router.post('/:id/topup', requireAuth, requireAdmin, async (req, res) => {
  const { service_type, amount, note } = req.body
  if (!service_type || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Service type and positive amount required' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO float_balances (agent_id, service_type, balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (agent_id, service_type) DO UPDATE
       SET balance = float_balances.balance + $3, updated_at = NOW()`,
      [req.params.id, service_type, amount]
    )
    await client.query(
      'INSERT INTO float_topups (agent_id, admin_id, service_type, amount, note) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, req.user.id, service_type, amount, note || null]
    )
    await client.query('COMMIT')
    await auditLog({ userId: req.user.id, action: 'FLOAT_TOPUP', entity: 'float_balances', entityId: +req.params.id, newValue: { service_type, amount }, ip: req.ip })
    res.json({ message: 'Float topped up successfully' })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// GET /api/agents/:id/float-history
router.get('/:id/float-history', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ft.*, u.full_name AS admin_name
       FROM float_topups ft
       JOIN users u ON u.id = ft.admin_id
       WHERE ft.agent_id = $1
       ORDER BY ft.created_at DESC LIMIT 50`,
      [req.params.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
