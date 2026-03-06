import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { formatTZS, formatDate } from '../utils/formatters'

export default function Reports() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSummary({}).then(setSummary).catch(console.error).finally(() => setLoading(false))
  }, [])

  const get = type => summary.find(s => s.type === type) || { count:0, volume:0, commission:0 }
  const air = get('airtime'), mm = get('mobile_money'), bk = get('banking')
  const totalVol = +air.volume + +mm.volume + +bk.volume || 1

  const items = [
    { label:'Airtime',      color:'#16a34a', icon:'📱', ...air,  value:+air.volume },
    { label:'Mobile Money', color:'#1d4ed8', icon:'💳', ...mm,   value:+mm.volume  },
    { label:'Banking',      color:'#d97706', icon:'🏦', ...bk,   value:+bk.volume  },
  ]

  return (
    <div style={{ animation:'fadeUp .3s ease' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <h2 style={{ fontSize:18, fontWeight:800 }}>Daily Report</h2>
        <span style={{ fontSize:13, color:'#6b7280', background:'#fff', padding:'5px 14px', borderRadius:20, fontWeight:600 }}>📅 {formatDate()}</span>
      </div>
      {loading ? <p style={{ textAlign:'center', padding:60, color:'#9ca3af' }}>Loading…</p> : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            {items.map(it => (
              <div key={it.label} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,.08)', border:`2px solid ${it.color}20` }}>
                <div style={{ fontSize:28, marginBottom:8 }}>{it.icon}</div>
                <p style={{ fontSize:11, color:'#6b7280', fontWeight:600, textTransform:'uppercase', letterSpacing:.5 }}>{it.label}</p>
                <p style={{ fontSize:22, fontWeight:900, color:it.color, marginTop:4 }}>{formatTZS(it.value)}</p>
                <div style={{ marginTop:10, height:6, background:'#f3f4f6', borderRadius:3 }}>
                  <div style={{ height:6, borderRadius:3, background:it.color, width:`${((it.value/totalVol)*100).toFixed(0)}%`, transition:'width .8s ease' }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                  <p style={{ fontSize:11, color:'#9ca3af', fontWeight:600 }}>{it.count} txns</p>
                  <p style={{ fontSize:11, color:'#7c3aed', fontWeight:600 }}>Comm: {formatTZS(it.commission)}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'#fff', borderRadius:12, padding:'20px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontWeight:700, fontSize:16 }}>Total Sales Today</p>
              <p style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>Commission earned: <strong style={{ color:'#7c3aed' }}>{formatTZS(+air.commission + +mm.commission + +bk.commission)}</strong></p>
            </div>
            <p style={{ fontWeight:900, fontSize:26 }}>{formatTZS(+air.volume + +mm.volume + +bk.volume)}</p>
          </div>
        </>
      )}
    </div>
  )
}
