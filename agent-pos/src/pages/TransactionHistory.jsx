import { usePOS } from '../context/POSContext'
import { formatTZS } from '../utils/formatters'
import { TYPE_META } from '../utils/constants'

export default function TransactionHistory() {
  const { transactions } = usePOS()

  return (
    <div style={{ animation: 'fadeUp .3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Transaction History</h2>
        <span style={{ fontSize: 13, color: '#6b7280', background: '#fff', padding: '5px 12px', borderRadius: 20, fontWeight: 600 }}>
          {transactions.length} transactions
        </span>
      </div>

      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 15, fontWeight: 500 }}>No transactions yet today.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...transactions].reverse().map((tx, i) => {
            const meta = TYPE_META[tx.type]
            return (
              <div key={tx.id || i} style={{
                background: '#fff', borderRadius: 10, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f3f4f6',
                animation: 'fadeUp .2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: meta.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {meta.icon}
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{meta.label}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{tx.time}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: meta.color }}>{formatTZS(tx.amount)}</p>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: meta.color + '18', color: meta.color,
                    padding: '2px 8px', borderRadius: 20,
                  }}>
                    ✓ Success
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
