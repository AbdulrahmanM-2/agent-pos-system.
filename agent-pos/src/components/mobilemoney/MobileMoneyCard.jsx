import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Pill from '../ui/Pill'
import ServiceSelector from './ServiceSelector'
import TransactionStatus from './TransactionStatus'
import { processMobileMoney } from '../../services/mobileMoneyService'
import { usePOS } from '../../context/POSContext'
import { isValidPhone, isValidAmount, parseAmount } from '../../utils/validators'

const TABS = ['Send Money', 'Receive Money', 'Pay Bills']

export default function MobileMoneyCard() {
  const { addTransaction, showToast } = usePOS()
  const [tab, setTab]           = useState('Send Money')
  const [customer, setCustomer] = useState('255713456789')
  const [service, setService]   = useState('M-Pesa')
  const [amount, setAmount]     = useState('10,000')
  const [txStatus, setTxStatus] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const e = {}
    if (!isValidPhone(customer)) e.customer = 'Enter a valid 255XXXXXXXXX number'
    if (!isValidAmount(amount))  e.amount   = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const process = async () => {
    if (!validate()) return
    setLoading(true)
    setTxStatus({ ref: '…', status: 'Pending…' })
    try {
      const res = await processMobileMoney({
        customer, service, amount: parseAmount(amount), type: tab,
      })
      setTxStatus({ ref: res.ref, status: res.status })
      addTransaction('mobile', parseAmount(amount))
      showToast('Mobile Money processed', '#1d4ed8')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#1d4ed8" icon="💳" title="Mobile Money">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <Pill key={t} active={tab === t} color="#1d4ed8" onClick={() => setTab(t)}>{t}</Pill>
        ))}
      </div>

      <Label>Customer Number</Label>
      <Input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="255XXXXXXXXX" error={errors.customer} />

      <Label style={{ marginTop: 12 }}>Service</Label>
      <ServiceSelector value={service} onChange={setService} />

      <Label style={{ marginTop: 12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />

      <ActionBtn color="#1d4ed8" loading={loading} onClick={process}>
        Process Payment
      </ActionBtn>

      {txStatus && <TransactionStatus ref={txStatus.ref} status={txStatus.status} />}
    </Card>
  )
}
