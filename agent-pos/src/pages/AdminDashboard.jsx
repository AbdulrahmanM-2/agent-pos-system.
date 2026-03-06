import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

const formatTZS = n => 'TZS ' + Number(n || 0).toLocaleString()
const formatDate = d => new Date(d).toLocaleDateString('en-TZ', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

function Badge({ color, children }) {
  return (
    <span style={{ background: color + '18', color, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
      {children}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontWeight:800, fontSize:17 }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#6b7280' }}>✕</button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:7, border:'1.5px solid #e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box' }

// ── AGENTS TAB ────────────────────────────────────────────────────────────────
function AgentsTab() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showTopup, setShowTopup] = useState(null)
  const [showEdit, setShowEdit]   = useState(null)
  const [form, setForm] = useState({ username:'', password:'', full_name:'', phone:'', email:'', comm_airtime:1, comm_mobile_money:1, comm_banking:0.5 })
  const [topupForm, setTopupForm] = useState({ service_type:'airtime', amount:'', note:'' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setAgents(await api.getAgents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createAgent = async () => {
    setSaving(true); setMsg('')
    try {
      await api.createAgent(form)
      setMsg('✓ Agent created successfully')
      setShowCreate(false)
      setForm({ username:'', password:'', full_name:'', phone:'', email:'', comm_airtime:1, comm_mobile_money:1, comm_banking:0.5 })
      load()
    } catch(e) { setMsg('✗ ' + e.message) }
    setSaving(false)
  }

  const updateAgent = async () => {
    setSaving(true); setMsg('')
    try {
      await api.updateAgent(showEdit.id, showEdit)
      setMsg('✓ Agent updated')
      setShowEdit(null)
      load()
    } catch(e) { setMsg('✗ ' + e.message) }
    setSaving(false)
  }

  const doTopup = async () => {
    setSaving(true); setMsg('')
    try {
      await api.topupFloat(showTopup.id, { ...topupForm, amount: +topupForm.amount })
      setMsg('✓ Float topped up')
      setShowTopup(null)
      setTopupForm({ service_type:'airtime', amount:'', note:'' })
      load()
    } catch(e) { setMsg('✗ ' + e.message) }
    setSaving(false)
  }

  const toggleAgent = async (agent) => {
    try {
      await api.updateAgent(agent.id, { ...agent, is_active: !agent.is_active })
      load()
    } catch(e) { alert(e.message) }
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>Agent Management</h2>
        <button onClick={() => setShowCreate(true)} style={{ padding:'9px 18px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontWeight:700, cursor:'pointer', fontSize:13 }}>
          + New Agent
        </button>
      </div>

      {msg && <div style={{ padding:'10px 14px', borderRadius:8, background: msg.startsWith('✓') ? '#f0fdf4' : '#fef2f2', color: msg.startsWith('✓') ? '#16a34a' : '#dc2626', marginBottom:16, fontSize:13, fontWeight:600 }}>{msg}</div>}

      {loading ? <p style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>Loading agents…</p> : (
        <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                {['Agent','Float (Air/MM/Bank)','Comm %','Transactions','Volume','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} style={{ borderBottom:'1px solid #f9fafb' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <p style={{ fontWeight:700, fontSize:14 }}>{a.full_name}</p>
                    <p style={{ fontSize:12, color:'#6b7280' }}>@{a.username}</p>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12 }}>
                    <div style={{ color:'#16a34a' }}>📱 {formatTZS(a.float_airtime)}</div>
                    <div style={{ color:'#1d4ed8' }}>💳 {formatTZS(a.float_mobile_money)}</div>
                    <div style={{ color:'#d97706' }}>🏦 {formatTZS(a.float_banking)}</div>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12 }}>
                    <div>{a.comm_airtime}%</div>
                    <div>{a.comm_mobile_money}%</div>
                    <div>{a.comm_banking}%</div>
                  </td>
                  <td style={{ padding:'12px 16px', fontWeight:700 }}>{a.total_transactions}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'#1d4ed8' }}>{formatTZS(a.total_volume)}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <Badge color={a.is_active ? '#16a34a' : '#dc2626'}>{a.is_active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => { setShowTopup(a); setTopupForm({ service_type:'airtime', amount:'', note:'' }) }} style={{ padding:'5px 10px', background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Topup</button>
                      <button onClick={() => setShowEdit({ ...a, comm_airtime:+a.comm_airtime, comm_mobile_money:+a.comm_mobile_money, comm_banking:+a.comm_banking })} style={{ padding:'5px 10px', background:'#eff6ff', color:'#1d4ed8', border:'1px solid #bfdbfe', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>Edit</button>
                      <button onClick={() => toggleAgent(a)} style={{ padding:'5px 10px', background: a.is_active ? '#fef2f2':'#f0fdf4', color: a.is_active ? '#dc2626':'#16a34a', border:`1px solid ${a.is_active ? '#fecaca':'#bbf7d0'}`, borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        {a.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {agents.length === 0 && <p style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>No agents yet. Create the first one.</p>}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create New Agent" onClose={() => setShowCreate(false)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="Full Name"><input style={inputStyle} value={form.full_name} onChange={e => setForm({...form, full_name:e.target.value})} placeholder="John Doe" /></Field>
            <Field label="Username"><input style={inputStyle} value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="johndoe" /></Field>
            <Field label="Password"><input type="password" style={inputStyle} value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Min 6 chars" /></Field>
            <Field label="Phone"><input style={inputStyle} value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="255712345678" /></Field>
          </div>
          <p style={{ fontSize:12, fontWeight:700, color:'#374151', margin:'12px 0 8px', textTransform:'uppercase', letterSpacing:.5 }}>Commission Rates (%)</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Field label="Airtime"><input type="number" step="0.1" style={inputStyle} value={form.comm_airtime} onChange={e => setForm({...form, comm_airtime:e.target.value})} /></Field>
            <Field label="Mobile Money"><input type="number" step="0.1" style={inputStyle} value={form.comm_mobile_money} onChange={e => setForm({...form, comm_mobile_money:e.target.value})} /></Field>
            <Field label="Banking"><input type="number" step="0.1" style={inputStyle} value={form.comm_banking} onChange={e => setForm({...form, comm_banking:e.target.value})} /></Field>
          </div>
          <button onClick={createAgent} disabled={saving} style={{ width:'100%', padding:'11px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:'pointer', marginTop:8 }}>
            {saving ? 'Creating…' : 'Create Agent'}
          </button>
        </Modal>
      )}

      {/* Topup Modal */}
      {showTopup && (
        <Modal title={`Top Up Float — ${showTopup.full_name}`} onClose={() => setShowTopup(null)}>
          <Field label="Service">
            <select style={inputStyle} value={topupForm.service_type} onChange={e => setTopupForm({...topupForm, service_type:e.target.value})}>
              <option value="airtime">📱 Airtime</option>
              <option value="mobile_money">💳 Mobile Money</option>
              <option value="banking">🏦 Banking</option>
            </select>
          </Field>
          <Field label="Amount (TZS)"><input type="number" style={inputStyle} value={topupForm.amount} onChange={e => setTopupForm({...topupForm, amount:e.target.value})} placeholder="50000" /></Field>
          <Field label="Note (optional)"><input style={inputStyle} value={topupForm.note} onChange={e => setTopupForm({...topupForm, note:e.target.value})} placeholder="Float refill" /></Field>
          <button onClick={doTopup} disabled={saving} style={{ width:'100%', padding:'11px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:'pointer', marginTop:8 }}>
            {saving ? 'Processing…' : 'Top Up Float'}
          </button>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <Modal title={`Edit Agent — ${showEdit.full_name}`} onClose={() => setShowEdit(null)}>
          <Field label="Full Name"><input style={inputStyle} value={showEdit.full_name} onChange={e => setShowEdit({...showEdit, full_name:e.target.value})} /></Field>
          <Field label="Phone"><input style={inputStyle} value={showEdit.phone || ''} onChange={e => setShowEdit({...showEdit, phone:e.target.value})} /></Field>
          <Field label="Email"><input style={inputStyle} value={showEdit.email || ''} onChange={e => setShowEdit({...showEdit, email:e.target.value})} /></Field>
          <p style={{ fontSize:12, fontWeight:700, color:'#374151', margin:'12px 0 8px', textTransform:'uppercase', letterSpacing:.5 }}>Commission Rates (%)</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <Field label="Airtime"><input type="number" step="0.1" style={inputStyle} value={showEdit.comm_airtime} onChange={e => setShowEdit({...showEdit, comm_airtime:+e.target.value})} /></Field>
            <Field label="Mobile Money"><input type="number" step="0.1" style={inputStyle} value={showEdit.comm_mobile_money} onChange={e => setShowEdit({...showEdit, comm_mobile_money:+e.target.value})} /></Field>
            <Field label="Banking"><input type="number" step="0.1" style={inputStyle} value={showEdit.comm_banking} onChange={e => setShowEdit({...showEdit, comm_banking:+e.target.value})} /></Field>
          </div>
          <button onClick={updateAgent} disabled={saving} style={{ width:'100%', padding:'11px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontWeight:800, fontSize:14, cursor:'pointer', marginTop:8 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </Modal>
      )}
    </div>
  )
}

// ── REPORTS TAB ───────────────────────────────────────────────────────────────
function AdminReportsTab() {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0,10))
  const [dateTo,   setDateTo]   = useState(new Date().toISOString().slice(0,10))
  const [perf, setPerf] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try { setPerf(await api.getAgentPerf({ date_from: dateFrom, date_to: dateTo })) }
    catch(e) { console.error(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display:'flex', gap:12, alignItems:'flex-end', marginBottom:20, flexWrap:'wrap' }}>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none' }} />
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid #e5e7eb', borderRadius:7, fontSize:13, outline:'none' }} />
        </div>
        <button onClick={load} style={{ padding:'8px 18px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:7, fontWeight:700, cursor:'pointer', fontSize:13 }}>Apply</button>
      </div>

      {loading ? <p style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>Loading…</p> : (
        <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                {['Agent','Transactions','Total Volume','Airtime','Mobile Money','Banking','Commission','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perf.map(a => (
                <tr key={a.id} style={{ borderBottom:'1px solid #f9fafb' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <p style={{ fontWeight:700, fontSize:14 }}>{a.full_name}</p>
                    <p style={{ fontSize:12, color:'#6b7280' }}>@{a.username}</p>
                  </td>
                  <td style={{ padding:'12px 16px', fontWeight:700 }}>{a.transactions}</td>
                  <td style={{ padding:'12px 16px', fontWeight:800, color:'#111827' }}>{formatTZS(a.volume)}</td>
                  <td style={{ padding:'12px 16px', color:'#16a34a', fontWeight:600 }}>{formatTZS(a.airtime_vol)}</td>
                  <td style={{ padding:'12px 16px', color:'#1d4ed8', fontWeight:600 }}>{formatTZS(a.mobile_vol)}</td>
                  <td style={{ padding:'12px 16px', color:'#d97706', fontWeight:600 }}>{formatTZS(a.banking_vol)}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'#7c3aed' }}>{formatTZS(a.commission)}</td>
                  <td style={{ padding:'12px 16px' }}><Badge color={a.is_active ? '#16a34a':'#dc2626'}>{a.is_active ? 'Active':'Inactive'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {perf.length === 0 && <p style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>No data for this period.</p>}
        </div>
      )}
    </div>
  )
}

// ── AUDIT LOGS TAB ────────────────────────────────────────────────────────────
function AuditLogsTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.getAuditLogs({ page, limit: 50 })
      .then(data => { setLogs(data.logs); setTotal(data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const actionColor = { LOGIN:'#1d4ed8', CREATE_AGENT:'#16a34a', UPDATE_AGENT:'#d97706', FLOAT_TOPUP:'#7c3aed', CHANGE_PASSWORD:'#f59e0b' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>Audit Logs</h2>
        <span style={{ fontSize:13, color:'#6b7280', background:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:600 }}>{total} total entries</span>
      </div>
      {loading ? <p style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>Loading…</p> : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {logs.map(log => (
            <div key={log.id} style={{ background:'#fff', borderRadius:10, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,.06)', border:'1px solid #f3f4f6' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Badge color={actionColor[log.action] || '#6b7280'}>{log.action}</Badge>
                <span style={{ fontSize:13, fontWeight:600 }}>{log.full_name || 'System'}</span>
                <span style={{ fontSize:12, color:'#9ca3af' }}>@{log.username}</span>
              </div>
              <span style={{ fontSize:12, color:'#9ca3af' }}>{formatDate(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── TRANSACTIONS TAB ──────────────────────────────────────────────────────────
function AllTransactionsTab() {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.getTransactions({ page, limit: 50 })
      .then(d => { setTxs(d.transactions); setTotal(d.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  const typeColor = { airtime:'#16a34a', mobile_money:'#1d4ed8', banking:'#d97706' }
  const typeIcon  = { airtime:'📱', mobile_money:'💳', banking:'🏦' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>All Transactions</h2>
        <span style={{ fontSize:13, color:'#6b7280', background:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:600 }}>{total} total</span>
      </div>
      {loading ? <p style={{ color:'#9ca3af', textAlign:'center', padding:40 }}>Loading…</p> : (
        <div style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.08)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e5e7eb' }}>
                {['Ref','Agent','Type','Details','Amount','Commission','Date','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txs.map(t => (
                <tr key={t.id} style={{ borderBottom:'1px solid #f9fafb' }}>
                  <td style={{ padding:'12px 16px', fontSize:12, fontFamily:'monospace', color:'#6b7280' }}>{t.reference}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, fontWeight:600 }}>{t.agent_name}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ background: typeColor[t.type]+'18', color: typeColor[t.type], fontSize:12, fontWeight:700, padding:'3px 8px', borderRadius:20 }}>
                      {typeIcon[t.type]} {t.type.replace('_',' ')}
                    </span>
                  </td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280' }}>{t.phone || t.account_number || t.service || '—'}</td>
                  <td style={{ padding:'12px 16px', fontWeight:800, color: typeColor[t.type] }}>{formatTZS(t.amount)}</td>
                  <td style={{ padding:'12px 16px', fontSize:13, color:'#7c3aed', fontWeight:600 }}>{formatTZS(t.commission)}</td>
                  <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af' }}>{formatDate(t.created_at)}</td>
                  <td style={{ padding:'12px 16px' }}><Badge color='#16a34a'>✓ {t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── MAIN ADMIN DASHBOARD ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('Agents')
  const [summary, setSummary] = useState([])

  useEffect(() => {
    api.getSummary({}).then(setSummary).catch(console.error)
  }, [])

  const getTotals = (type) => summary.find(s => s.type === type) || { count:0, volume:0, commission:0 }
  const air = getTotals('airtime'), mm = getTotals('mobile_money'), bk = getTotals('banking')
  const totalVol = +air.volume + +mm.volume + +bk.volume

  const TABS = ['Agents', 'Transactions', 'Reports', 'Audit Logs']

  return (
    <div style={{ minHeight:'100vh', background:'#f3f4f6' }}>
      {/* Header */}
      <header style={{ background:'#1e293b', padding:'0 28px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,.25)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ background:'#dc2626', color:'#fff', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900 }}>A</span>
          <span style={{ color:'#fff', fontWeight:800, fontSize:16 }}>Agent POS — Admin Panel</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'#94a3b8', fontSize:13 }}>👤 <strong style={{ color:'#fff' }}>{user.full_name}</strong></span>
          <button onClick={logout} style={{ padding:'6px 16px', background:'#dc262620', color:'#fca5a5', border:'1px solid #dc262640', borderRadius:7, fontWeight:700, fontSize:12, cursor:'pointer' }}>Logout</button>
        </div>
      </header>

      {/* Summary KPIs */}
      <div style={{ background:'#fff', padding:'16px 28px', borderBottom:'1px solid #e5e7eb', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        {[
          { label:'Today Airtime',       value: formatTZS(air.volume),   sub:`${air.count} txns`,   color:'#16a34a' },
          { label:'Today Mobile Money',  value: formatTZS(mm.volume),    sub:`${mm.count} txns`,    color:'#1d4ed8' },
          { label:'Today Banking',       value: formatTZS(bk.volume),    sub:`${bk.count} txns`,    color:'#d97706' },
          { label:'Total Today',         value: formatTZS(totalVol),     sub:`${+air.count + +mm.count + +bk.count} txns`, color:'#111827' },
        ].map(k => (
          <div key={k.label} style={{ padding:'12px 16px', background:'#f8fafc', borderRadius:10, border:'1px solid #f0f0f0' }}>
            <p style={{ fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{k.label}</p>
            <p style={{ fontSize:20, fontWeight:900, color:k.color, marginTop:2 }}>{k.value}</p>
            <p style={{ fontSize:12, color:'#9ca3af', marginTop:1 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <nav style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 28px' }}>
        <div style={{ display:'flex', gap:2 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'13px 20px', background:'none', border:'none', borderBottom: tab===t ? '3px solid #dc2626' : '3px solid transparent', color: tab===t ? '#dc2626':'#6b7280', fontWeight: tab===t ? 700:500, fontSize:14, cursor:'pointer', transition:'all .15s' }}>{t}</button>
          ))}
        </div>
      </nav>

      <main style={{ padding:'24px 28px 60px', maxWidth:1400, margin:'0 auto' }}>
        {tab === 'Agents'       && <AgentsTab />}
        {tab === 'Transactions' && <AllTransactionsTab />}
        {tab === 'Reports'      && <AdminReportsTab />}
        {tab === 'Audit Logs'   && <AuditLogsTab />}
      </main>
    </div>
  )
}
