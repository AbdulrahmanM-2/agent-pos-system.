import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    if (token) {
      api.me()
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('pos_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { token, user } = await api.login({ username, password })
    localStorage.setItem('pos_token', token)
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('pos_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
