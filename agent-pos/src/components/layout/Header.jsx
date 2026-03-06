import { useState } from 'react'
import { usePOS } from '../../context/POSContext'
import { useAuth } from '../../context/AuthContext'
import { formatTZS } from '../../utils/formatters'

export default function Header() {
  const { totals, float } = usePOS()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const total = (totals?.airtime||0) + (totals?.mobile||0) + (totals?.banking||0)

  return (
    <header style={{ background:'#1e293b', padding:'0 28px', height:58, display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(0,0,0,.25)', position:'sticky', top:0, zIndex:100 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ background:'#3b82f6', color:'#fff', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:900 }}>P</span>
        <span style={{ color:'#fff', fontWeight:800, fontSize:16, letterSpacing:-.3 }}>Agent POS System</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:20 }}>
        <span style={{ color:'#94a3b8', fontSize:13 }}>Cashier: <strong style={{ color:'#fff' }}>{user?.full_name}</strong></span>
        <span style={{ background:'rgba(59,130,246,.15)', color:'#93c5fd', padding:'5px 14px', borderRadius:20, fontWeight:700, fontSize:13 }}>
          Today's Sales: <strong style={{ color:'#bfdbfe' }}>{formatTZS(total)}</strong>
        </span>
        <div style={{ position:'relative' }}>
          <button onClick={() => setOpen(o => !o)} style={{ width:36, height:36, borderRadius:'50%', background:'#334155', border:'none', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center' }}>👤</button>
          {open && (
            <div style={{ position:'absolute', top:44, right:0, background:'#fff', borderRadius:10, padding:8, minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,.15)', zIndex:200 }}>
              <p style={{ padding:'6px 12px', fontSize:13, color:'#374151', fontWeight:600 }}>{user?.full_name}</p>
              <p style={{ padding:'2px 12px 8px', fontSize:11, color:'#9ca3af' }}>@{user?.username}</p>
              <hr style={{ border:'none', borderTop:'1px solid #f3f4f6', margin:'4px 0' }} />
              <button onClick={logout} style={{ width:'100%', padding:'8px 12px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:6, fontWeight:700, fontSize:13, cursor:'pointer', textAlign:'left' }}>🚪 Logout</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
