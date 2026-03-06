const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { pool } = require('../db')
const { signToken, requireAuth } = require('../middleware/auth')
const { auditLog } = require('../middleware/audit')

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase().trim()]
    )
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    if (!user.is_active) return res.status(403).json({ error: 'Account is disabled' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken({ id: user.id, role: user.role })
    await auditLog({ userId: user.id, action: 'LOGIN', entity: 'users', entityId: user.id, ip: req.ip })

    res.json({
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Both fields required' })
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id])
    const valid = await bcrypt.compare(current_password, rows[0].password)
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' })

    const hashed = await bcrypt.hash(new_password, 10)
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.user.id])
    await auditLog({ userId: req.user.id, action: 'CHANGE_PASSWORD', entity: 'users', entityId: req.user.id, ip: req.ip })
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
