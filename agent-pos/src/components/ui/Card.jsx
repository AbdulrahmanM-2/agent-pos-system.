export default function Card({ color, icon, title, children }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,.09)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid #f0f0f0',
    }}>
      <div style={{
        background: color,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ padding: '18px 20px', flex: 1 }}>{children}</div>
    </div>
  )
}
