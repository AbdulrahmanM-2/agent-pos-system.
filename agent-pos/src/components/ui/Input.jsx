export default function Input({ value, onChange, placeholder, error }) {
  return (
    <div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 7,
          border: `1.5px solid ${error ? '#dc2626' : '#e5e7eb'}`,
          fontSize: 14,
          color: '#111827',
          outline: 'none',
          transition: 'border .15s',
        }}
        onFocus={e => e.target.style.border = '1.5px solid #6b7280'}
        onBlur={e => e.target.style.border = `1.5px solid ${error ? '#dc2626' : '#e5e7eb'}`}
      />
      {error && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{error}</p>}
    </div>
  )
}
