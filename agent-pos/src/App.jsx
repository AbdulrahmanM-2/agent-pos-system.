import { useState } from 'react'
import { POSProvider, usePOS } from './context/POSContext'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import Footer from './components/layout/Footer'
import Toast from './components/ui/Toast'
import Dashboard from './pages/Dashboard'
import TransactionHistory from './pages/TransactionHistory'
import Reports from './pages/Reports'

function Inner() {
  const [tab, setTab] = useState('Dashboard')
  const { toast, showToast } = usePOS()

  const PAGE = {
    'Dashboard':            <Dashboard />,
    'Transaction History':  <TransactionHistory />,
    'Reports':              <Reports />,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {toast && (
        <Toast msg={toast.msg} color={toast.color} onDone={() => showToast(null)} />
      )}
      <Header />
      <TabNav active={tab} onChange={setTab} />
      <main style={{
        padding: '24px 28px 80px',
        maxWidth: 1280,
        margin: '0 auto',
      }}>
        {PAGE[tab]}
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <POSProvider>
      <Inner />
    </POSProvider>
  )
}
