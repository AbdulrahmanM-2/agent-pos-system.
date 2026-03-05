export default function Receipt({ lines }) {
  return (
    <div style={{ marginTop: 14, borderTop: '1.5px dashed #d1d5db', paddingTop: 12 }}>
      <p style={{
        fontWeight: 700, fontSize: 11, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
      }}>
        Receipt
      </p>
      {lines.map(([k, v, accent]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#6b7280' }}>{k}</span>
          <span style={{ fontWeight: 600, color: accent || '#111827' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}
