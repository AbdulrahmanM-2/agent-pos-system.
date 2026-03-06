import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f3f4f6',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 4px 32px rgba(0,0,0,.1)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#1d4ed8', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px',
          }}>💳</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>Agent POS System</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Sign in to your account</p>
        </div>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #1d4ed8'}
              onBlur={e  => e.target.style.border = '1.5px solid #e5e7eb'}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #1d4ed8'}
              onBlur={e  => e.target.style.border = '1.5px solid #e5e7eb'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: '#dc2626', fontWeight: 500,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#93c5fd' : '#1d4ed8',
              color: '#fff', border: 'none', borderRadius: 8,
              fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? (
              <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.3)', borderTop: '2.5px solid #fff', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Signing in…</>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>
          Default admin: <strong>admin</strong> / <strong>Admin@1234</strong>
        </p>
      </div>
    </div>
  )
}
