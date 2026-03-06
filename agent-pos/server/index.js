require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// API routes
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/agents',       require('./routes/agents'))
app.use('/api/transactions', require('./routes/transactions'))
app.use('/api/reports',      require('./routes/reports'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

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
