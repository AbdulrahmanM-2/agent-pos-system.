import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Receipt from '../ui/Receipt'
import NetworkSelector from './NetworkSelector'
import { sendAirtime } from '../../services/airtimeService'
import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'
import { isValidPhone, isValidAmount, parseAmount } from '../../utils/validators'
import { NETWORKS } from '../../utils/constants'

export default function AirtimeCard() {
  const { addTransaction, showToast } = usePOS()
  const [phone, setPhone]   = useState('255712345678')
  const [net, setNet]       = useState('vodacom')
  const [amount, setAmount] = useState('5,000')
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!isValidPhone(phone))   e.phone  = 'Enter a valid 255XXXXXXXXX number'
    if (!isValidAmount(amount)) e.amount = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const send = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await sendAirtime({ phone, network: net, amount: parseAmount(amount) })
      const network = NETWORKS.find(n => n.id === net)
      setReceipt({ ...res, networkName: network.name, networkColor: network.color })
      addTransaction('airtime', parseAmount(amount))
      showToast('Airtime sent successfully', '#16a34a')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#16a34a" icon="📱" title="Airtime Recharge">
      <Label>Phone Number</Label>
      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="255XXXXXXXXX" error={errors.phone} />

      <Label style={{ marginTop: 12 }}>Network</Label>
      <NetworkSelector value={net} onChange={setNet} />

      <Label style={{ marginTop: 12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />

      <ActionBtn color="#16a34a" loading={loading} onClick={send}>
        Send Airtime
      </ActionBtn>

      {receipt && (
        <Receipt lines={[
          ['Phone',   receipt.phone],
          ['Network', receipt.networkName, receipt.networkColor],
          ['Amount',  formatTZS(receipt.amount)],
          ['Ref',     receipt.ref, '#6b7280'],
        ]} />
      )}
    </Card>
  )
}
