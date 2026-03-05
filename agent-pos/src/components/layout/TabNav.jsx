const TABS = [
  { id: 'Dashboard',           icon: '⊞' },
  { id: 'Transaction History', icon: '☰' },
  { id: 'Reports',             icon: '📊' },
]

export default function TabNav({ active, onChange }) {
  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 28px',
    }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '14px 22px',
              background: 'none',
              border: 'none',
              borderBottom: active === t.id ? '3px solid #1d4ed8' : '3px solid transparent',
              color: active === t.id ? '#1d4ed8' : '#6b7280',
              fontWeight: active === t.id ? 700 : 500,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.icon} {t.id}
          </button>
        ))}
      </div>
    </nav>
  )
}
