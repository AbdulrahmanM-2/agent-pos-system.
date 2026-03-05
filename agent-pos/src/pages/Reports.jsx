import { usePOS } from '../context/POSContext'
import { formatTZS, formatDate } from '../utils/formatters'
import { TYPE_META } from '../utils/constants'

export default function Reports() {
  const { totals, transactions } = usePOS()
  const total = totals.airtime + totals.mobile + totals.banking || 1

  const items = [
    { key: 'airtime', ...TYPE_META.airtime, value: totals.airtime },
    { key: 'mobile',  ...TYPE_META.mobile,  value: totals.mobile  },
    { key: 'banking', ...TYPE_META.banking, value: totals.banking },
  ]

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Daily Report</h2>
        <span style={{ fontSize: 13, color: '#6b7280', background: '#fff', padding: '5px 12px', borderRadius: 20, fontWeight: 600 }}>
          📅 {formatDate()}
        </span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {items.map(it => {
          const pct = ((it.value / total) * 100).toFixed(0)
          return (
            <div key={it.key} style={{
              background: '#fff', borderRadius: 12, padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,.08)',
              border: `2px solid ${it.color}20`,
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{it.icon}</div>
              <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>
                {it.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 900, color: it.color, marginTop: 4 }}>
                {formatTZS(it.value)}
              </p>
              <div style={{ marginTop: 10, height: 6, background: '#f3f4f6', borderRadius: 3 }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: it.color,
                  width: `${pct}%`,
                  transition: 'width .8s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5, fontWeight: 600 }}>
                {pct}% of total
              </p>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#111827' }}>Total Sales Today</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{transactions.length} transactions processed</p>
        </div>
        <p style={{ fontWeight: 900, fontSize: 26, color: '#111827' }}>
          {formatTZS(totals.airtime + totals.mobile + totals.banking)}
        </p>
      </div>

      {/* Breakdown table */}
      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', fontWeight: 700, fontSize: 14, color: '#374151' }}>
          Breakdown by Service
        </div>
        {items.map((it, idx) => (
          <div key={it.key} style={{
            padding: '14px 20px',
            borderBottom: idx < items.length - 1 ? '1px solid #f9fafb' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32, height: 32, borderRadius: '50%',
                background: it.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15,
              }}>{it.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{it.label}</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: it.color }}>{formatTZS(it.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
