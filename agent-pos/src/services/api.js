const BASE = '/api'

function getToken() {
  return localStorage.getItem('pos_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  // Auth
  login:          (body) => request('POST', '/auth/login', body),
  me:             ()     => request('GET',  '/auth/me'),
  changePassword: (body) => request('POST', '/auth/change-password', body),

  // Transactions
  createTransaction: (body) => request('POST', '/transactions', body),
  getTransactions:   (q)    => request('GET',  '/transactions?' + new URLSearchParams(q)),
  getMyFloat:        ()     => request('GET',  '/transactions/my-float'),

  // Agents (admin)
  getAgents:      ()        => request('GET',  '/agents'),
  createAgent:    (body)    => request('POST', '/agents', body),
  updateAgent:    (id, body)=> request('PUT',  `/agents/${id}`, body),
  topupFloat:     (id, body)=> request('POST', `/agents/${id}/topup`, body),
  getFloatHistory:(id)      => request('GET',  `/agents/${id}/float-history`),

  // Reports
  getSummary:  (q) => request('GET', '/reports/summary?'  + new URLSearchParams(q)),
  getDaily:    ()  => request('GET', '/reports/daily'),
  getAgentPerf:(q) => request('GET', '/reports/agents?'   + new URLSearchParams(q)),
  getAuditLogs:(q) => request('GET', '/reports/audit-logs?' + new URLSearchParams(q)),
}
