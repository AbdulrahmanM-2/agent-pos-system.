const router = require('express').Router()
const { pool } = require('../db')
const { requireAuth } = require('../middleware/auth')

// POST /api/transactions - create transaction
router.post('/', requireAuth, async (req, res) => {
  const { type, sub_type, phone, account_number, network, bank, service, amount, note } = req.body
  if (!type || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Type and positive amount required' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get commission rate
    const serviceType = type === 'mobile_money' ? 'mobile_money' : type
    const { rows: rateRows } = await client.query(
      'SELECT rate_percent FROM commission_rates WHERE agent_id=$1 AND service_type=$2',
      [req.user.id, serviceType]
    )
    const rate = rateRows[0]?.rate_percent || 0
    const commission = (amount * rate) / 100

    // Check float balance
    const { rows: floatRows } = await client.query(
      'SELECT balance FROM float_balances WHERE agent_id=$1 AND service_type=$2',
      [req.user.id, serviceType]
    )
    const float = floatRows[0]?.balance || 0
    if (float < amount) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: `Insufficient float balance. Available: TZS ${float.toLocaleString()}` })
    }

    // Deduct float
    await client.query(
      'UPDATE float_balances SET balance = balance - $1, updated_at=NOW() WHERE agent_id=$2 AND service_type=$3',
      [amount, req.user.id, serviceType]
    )

    // Generate reference
    const prefix = type === 'airtime' ? 'AT' : type === 'mobile_money' ? 'MM' : 'BK'
    const ref = prefix + Date.now() + Math.floor(Math.random() * 1000)

    const { rows } = await client.query(
      `INSERT INTO transactions
        (agent_id, type, sub_type, phone, account_number, network, bank, service, amount, commission, reference, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [req.user.id, type, sub_type, phone, account_number, network, bank, service, amount, commission, ref, note]
    )

    await client.query('COMMIT')
    res.status(201).json({ transaction: rows[0], commission, reference: ref })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

// GET /api/transactions - list transactions (admin sees all, cashier sees own)
router.get('/', requireAuth, async (req, res) => {
  const { page = 1, limit = 50, type, date_from, date_to, agent_id } = req.query
  const offset = (page - 1) * limit
  const params = []
  const conditions = []

  if (req.user.role !== 'admin') {
    conditions.push(`t.agent_id = $${params.push(req.user.id)}`)
  } else if (agent_id) {
    conditions.push(`t.agent_id = $${params.push(agent_id)}`)
  }
  if (type) conditions.push(`t.type = $${params.push(type)}`)
  if (date_from) conditions.push(`t.created_at >= $${params.push(date_from)}`)
  if (date_to) conditions.push(`t.created_at <= $${params.push(date_to + ' 23:59:59')}`)

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.full_name AS agent_name
       FROM transactions t
       JOIN users u ON u.id = t.agent_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT $${params.push(limit)} OFFSET $${params.push(offset)}`,
      params
    )
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM transactions t ${where}`,
      params.slice(0, -2)
    )
    res.json({ transactions: rows, total: +countRows[0].count, page: +page, limit: +limit })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/transactions/my-float - get own float balances
router.get('/my-float', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT service_type, balance FROM float_balances WHERE agent_id = $1',
      [req.user.id]
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
