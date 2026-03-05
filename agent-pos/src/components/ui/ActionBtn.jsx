export default function ActionBtn({ color, loading, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%',
        padding: '11px 0',
        marginTop: 16,
        background: (loading || disabled) ? '#d1d5db' : color,
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        fontWeight: 800,
        fontSize: 14.5,
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        transition: 'all .15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading ? (
        <>
          <span style={{
            width: 15, height: 15, borderRadius: '50%',
            border: '2.5px solid rgba(255,255,255,.35)',
            borderTop: '2.5px solid #fff',
            display: 'inline-block',
            animation: 'spin .7s linear infinite',
          }} />
          Processing…
        </>
      ) : children}
    </button>
  )
}
