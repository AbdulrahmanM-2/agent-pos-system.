import { useEffect } from 'react'

export default function Toast({ msg, color, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      background: color, color: '#fff',
      padding: '12px 22px', borderRadius: 10,
      fontWeight: 600, fontSize: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,.2)',
      animation: 'slideIn .25s ease',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      ✓ {msg}
    </div>
  )
}
