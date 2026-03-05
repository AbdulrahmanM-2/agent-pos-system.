export default function Label({ children, style }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5, ...style }}>
      {children}
    </p>
  )
}
