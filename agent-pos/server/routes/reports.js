const router = require('express').Router()
const { pool } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// GET /api/reports/summary - daily summary
router.get('/summary', requireAuth, async (req, res) => {
  const { date = new Date().toISOString().slice(0, 10), agent_id } = req.query
  const agentId = req.user.role === 'admin' ? agent_id : req.user.id
  const params = [date + ' 00:00:00', date + ' 23:59:59']
  const agentFilter = agentId ? `AND agent_id = $${params.push(agentId)}` : ''

  try {
    const { rows } = await pool.query(
      `SELECT
         type,
         COUNT(*) AS count,
         SUM(amount) AS volume,
         SUM(commission) AS commission
       FROM transactions
       WHERE created_at BETWEEN $1 AND $2
         AND status = 'success'
         ${agentFilter}
       GROUP BY type`,
      params
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/daily - last 30 days trend
router.get('/daily', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        DATE(created_at) AS date,
        type,
        COUNT(*) AS count,
        SUM(amount) AS volume,
        SUM(commission) AS commission
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status = 'success'
      GROUP BY DATE(created_at), type
      ORDER BY date DESC
    `)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/agents - agent performance
router.get('/agents', requireAuth, requireAdmin, async (req, res) => {
  const { date_from, date_to } = req.query
  const from = date_from || new Date().toISOString().slice(0, 10)
  const to   = date_to   || new Date().toISOString().slice(0, 10)
  try {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.username, u.full_name, u.is_active,
        COUNT(t.id) AS transactions,
        COALESCE(SUM(t.amount), 0) AS volume,
        COALESCE(SUM(t.commission), 0) AS commission,
        COALESCE(SUM(CASE WHEN t.type='airtime'       THEN t.amount END), 0) AS airtime_vol,
        COALESCE(SUM(CASE WHEN t.type='mobile_money'  THEN t.amount END), 0) AS mobile_vol,
        COALESCE(SUM(CASE WHEN t.type='banking'       THEN t.amount END), 0) AS banking_vol
      FROM users u
      LEFT JOIN transactions t ON t.agent_id = u.id
        AND t.created_at BETWEEN $1 AND $2
        AND t.status = 'success'
      WHERE u.role = 'cashier'
      GROUP BY u.id
      ORDER BY volume DESC
    `, [from + ' 00:00:00', to + ' 23:59:59'])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/audit-logs
router.get('/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  const { page = 1, limit = 50 } = req.query
  const offset = (page - 1) * limit
  try {
    const { rows } = await pool.query(
      `SELECT al.*, u.full_name, u.username
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    )
    const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM audit_logs')
    res.json({ logs: rows, total: +countRows[0].count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
