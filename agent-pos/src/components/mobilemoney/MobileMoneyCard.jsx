import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Pill from '../ui/Pill'
import ServiceSelector from './ServiceSelector'
import TransactionStatus from './TransactionStatus'
import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'
import { isValidPhone, isValidAmount, parseAmount } from '../../utils/validators'

const TABS = ['Send Money', 'Receive Money', 'Pay Bills']

export default function MobileMoneyCard() {
  const { submitTransaction, showToast, float } = usePOS()
  const [tab, setTab]           = useState('Send Money')
  const [customer, setCustomer] = useState('')
  const [service, setService]   = useState('M-Pesa')
  const [amount, setAmount]     = useState('')
  const [txSt, setTxSt]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})
  const availableFloat = float?.mobile || 0

  const process = async () => {
    const e = {}
    if (!isValidPhone(customer)) e.customer = 'Enter a valid 255XXXXXXXXX number'
    if (!isValidAmount(amount))  e.amount   = 'Enter a valid amount'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    setTxSt({ ref: '…', status: 'Pending…' })
    try {
      const res = await submitTransaction('mobile', { phone: customer, service, amount: parseAmount(amount), sub_type: tab.toLowerCase().replace(' ','_') })
      setTxSt({ ref: res.reference, status: 'Success' })
      showToast('Mobile Money processed', '#1d4ed8')
      setAmount('')
    } catch(err) {
      setTxSt({ ref:'—', status:'Failed' })
      setErrors({ amount: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#1d4ed8" icon="💳" title="Mobile Money">
      <div style={{ fontSize:11, color:'#6b7280', background:'#eff6ff', padding:'5px 10px', borderRadius:6, marginBottom:10, fontWeight:600 }}>
        Float: <span style={{ color:'#1d4ed8' }}>{formatTZS(availableFloat)}</span>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        {TABS.map(t => <Pill key={t} active={tab===t} color="#1d4ed8" onClick={() => setTab(t)}>{t}</Pill>)}
      </div>
      <Label>Customer Number</Label>
      <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="255XXXXXXXXX" error={errors.customer} />
      <Label style={{ marginTop:12 }}>Service</Label>
      <ServiceSelector value={service} onChange={setService} />
      <Label style={{ marginTop:12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />
      <ActionBtn color="#1d4ed8" loading={loading} onClick={process}>Process Payment</ActionBtn>
      {txSt && <TransactionStatus ref={txSt.ref} status={txSt.status} />}
    </Card>
  )
}
