import { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const POSContext = createContext(null)
const init = { transactions: [], totals: { airtime: 0, mobile: 0, banking: 0 }, float: {}, toast: null }

function reducer(s, a) {
  switch(a.type) {
    case 'SET_FLOAT': return { ...s, float: a.p }
    case 'ADD_TX': {
      const { txType, amount } = a.p
      return { ...s, transactions: [...s.transactions, a.p], totals: { ...s.totals, [txType]: s.totals[txType] + amount }, float: { ...s.float, [txType]: Math.max(0,(s.float[txType]||0)-amount) } }
    }
    case 'TOAST': return { ...s, toast: a.p }
    default: return s
  }
}

export function POSProvider({ children }) {
  const { user } = useAuth()
  const [st, dispatch] = useReducer(reducer, init)

  useEffect(() => {
    if (user) {
      api.getMyFloat().then(rows => {
        const f = {}
        rows.forEach(r => { f[r.service_type === 'mobile_money' ? 'mobile' : r.service_type] = +r.balance })
        dispatch({ type: 'SET_FLOAT', p: f })
      }).catch(console.error)
    }
  }, [user])

  const submitTransaction = async (type, payload) => {
    const backendType = type === 'mobile' ? 'mobile_money' : type
    const res = await api.createTransaction({ ...payload, type: backendType, amount: payload.amount })
    dispatch({ type: 'ADD_TX', p: { type, txType: type, amount: payload.amount, time: new Date().toLocaleTimeString(), id: res.transaction.id } })
    return res
  }

  const showToast = (msg, color) => {
    dispatch({ type: 'TOAST', p: msg ? { msg, color } : null })
    if (msg) setTimeout(() => dispatch({ type: 'TOAST', p: null }), 2800)
  }

  return (
    <POSContext.Provider value={{ ...st, cashier: user?.full_name, submitTransaction, showToast }}>
      {children}
    </POSContext.Provider>
  )
}

export const usePOS = () => useContext(POSContext)
