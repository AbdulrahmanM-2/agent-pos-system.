import { createContext, useContext, useReducer } from 'react'
import { formatTime } from '../utils/formatters'

const POSContext = createContext(null)

const initialState = {
  cashier: 'Sarah',
  transactions: [],
  totals: { airtime: 50000, mobile: 200000, banking: 100000 },
  toast: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TX': {
      const { txType, amount } = action.payload
      return {
        ...state,
        transactions: [
          ...state.transactions,
          { type: txType, amount, time: formatTime(), id: Date.now() },
        ],
        totals: { ...state.totals, [txType]: state.totals[txType] + amount },
      }
    }
    case 'SET_TOAST':
      return { ...state, toast: action.payload }
    case 'CLEAR_TOAST':
      return { ...state, toast: null }
    default:
      return state
  }
}

export function POSProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const addTransaction = (txType, amount) => {
    dispatch({ type: 'ADD_TX', payload: { txType, amount } })
  }

  const showToast = (msg, color) => {
    dispatch({ type: 'SET_TOAST', payload: { msg, color } })
    setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2800)
  }

  return (
    <POSContext.Provider value={{ ...state, addTransaction, showToast }}>
      {children}
    </POSContext.Provider>
  )
}

export const usePOS = () => useContext(POSContext)
