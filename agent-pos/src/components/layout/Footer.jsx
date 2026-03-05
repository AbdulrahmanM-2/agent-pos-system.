import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'

export default function Footer() {
  const { totals } = usePOS()

  return (
    <footer style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff',
      borderTop: '1px solid #e5e7eb',
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', gap: 28, fontSize: 13 }}>
        <span style={{ color: '#6b7280', fontWeight: 600 }}>Today's Transactions</span>
        <span>
          Airtime: <strong style={{ color: '#16a34a' }}>{formatTZS(totals.airtime)}</strong>
        </span>
        <span>
          Mobile Money: <strong style={{ color: '#1d4ed8' }}>{formatTZS(totals.mobile)}</strong>
        </span>
        <span>
          Banking: <strong style={{ color: '#d97706' }}>{formatTZS(totals.banking)}</strong>
        </span>
      </div>
      <button
        onClick={() => alert('Logged out!')}
        style={{
          padding: '8px 22px',
          background: '#1d4ed8',
          color: '#fff',
          border: 'none',
          borderRadius: 7,
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </footer>
  )
}
