export default function Pill({ active, color, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 14px',
        borderRadius: 6,
        border: active ? 'none' : '1.5px solid #d1d5db',
        background: active ? color : '#fff',
        color: active ? '#fff' : '#374151',
        fontWeight: active ? 700 : 500,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}
