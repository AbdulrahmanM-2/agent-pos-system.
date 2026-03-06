import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { formatTZS } from '../utils/formatters'
import { TYPE_META } from '../utils/constants'

export default function TransactionHistory() {
  const [txs, setTxs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal]     = useState(0)

  useEffect(() => {
    api.getTransactions({ limit:100 })
      .then(d => { setTxs(d.transactions); setTotal(d.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const typeColor = { airtime:'#16a34a', mobile_money:'#1d4ed8', banking:'#d97706' }
  const typeIcon  = { airtime:'📱', mobile_money:'💳', banking:'🏦' }
  const typeLabel = { airtime:'Airtime', mobile_money:'Mobile Money', banking:'Banking' }

  return (
    <div style={{ animation:'fadeUp .3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>Transaction History</h2>
        <span style={{ fontSize:13, color:'#6b7280', background:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:600 }}>{total} transactions</span>
      </div>
      {loading ? <p style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>Loading…</p> :
       txs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:'#9ca3af' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
          <p style={{ fontSize:15, fontWeight:500 }}>No transactions yet today.</p>
        </div>
      ) : txs.map(tx => {
        const c = typeColor[tx.type] || '#6b7280'
        return (
          <div key={tx.id} style={{ background:'#fff', borderRadius:10, padding:'14px 18px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,.07)', border:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ width:40, height:40, borderRadius:'50%', background:c+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{typeIcon[tx.type]||'💰'}</span>
              <div>
                <p style={{ fontWeight:700, fontSize:14 }}>{typeLabel[tx.type] || tx.type}</p>
                <p style={{ fontSize:11, color:'#9ca3af', marginTop:1, fontFamily:'monospace' }}>{tx.reference}</p>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontWeight:800, fontSize:15, color:c }}>{formatTZS(tx.amount)}</p>
              <span style={{ fontSize:11, fontWeight:600, background:c+'18', color:c, padding:'2px 8px', borderRadius:20 }}>✓ Success</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
