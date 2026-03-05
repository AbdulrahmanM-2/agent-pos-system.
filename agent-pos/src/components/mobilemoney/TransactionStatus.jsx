export default function TransactionStatus({ ref: txRef, status }) {
  const success = status?.toLowerCase().includes('success')
  return (
    <div style={{ marginTop: 14, borderTop: '1.5px dashed #d1d5db', paddingTop: 12 }}>
      <p style={{
        fontWeight: 700, fontSize: 11, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
      }}>
        Transaction Status
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: '#6b7280' }}>Ref</span>
        <span style={{ fontWeight: 600 }}>{txRef}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: '#6b7280' }}>Status</span>
        <span style={{
          fontWeight: 700,
          color: success ? '#16a34a' : '#f59e0b',
        }}>
          {success ? '✓ ' : ''}{status}
        </span>
      </div>
    </div>
  )
}
