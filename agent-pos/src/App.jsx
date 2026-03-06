import { AuthProvider, useAuth } from './context/AuthContext'
import { POSProvider, usePOS } from './context/POSContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import Dashboard from './pages/Dashboard'
import TransactionHistory from './pages/TransactionHistory'
import Reports from './pages/Reports'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import Footer from './components/layout/Footer'
import Toast from './components/ui/Toast'
import { useState } from 'react'

function CashierApp() {
  const [tab, setTab] = useState('Dashboard')
  const { toast, showToast } = usePOS()
  const pages = { Dashboard: <Dashboard />, 'Transaction History': <TransactionHistory />, Reports: <Reports /> }
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {toast && <Toast msg={toast.msg} color={toast.color} onDone={() => showToast(null)} />}
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <main style={{ padding: '24px 28px 80px', maxWidth: 1280, margin: '0 auto' }}>{pages[tab]}</main>
      <Footer />
    </div>
  )
}

function AppInner() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f3f4f6' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'4px solid #e5e7eb', borderTop:'4px solid #1d4ed8', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#6b7280', fontSize:14 }}>Loading…</p>
      </div>
    </div>
  )
  if (!user) return <Login />
  if (user.role === 'admin') return <AdminDashboard />
  return <POSProvider><CashierApp /></POSProvider>
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>
}
