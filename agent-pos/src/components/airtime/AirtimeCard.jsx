import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Receipt from '../ui/Receipt'
import NetworkSelector from './NetworkSelector'
import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'
import { isValidPhone, isValidAmount, parseAmount } from '../../utils/validators'
import { NETWORKS } from '../../utils/constants'

export default function AirtimeCard() {
  const { submitTransaction, showToast, float } = usePOS()
  const [phone, setPhone]   = useState('')
  const [net, setNet]       = useState('vodacom')
  const [amount, setAmount] = useState('')
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const availableFloat = float?.airtime || 0

  const send = async () => {
    const e = {}
    if (!isValidPhone(phone)) e.phone  = 'Enter a valid 255XXXXXXXXX number'
    if (!isValidAmount(amount)) e.amount = 'Enter a valid amount'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    try {
      const n = NETWORKS.find(x => x.id === net)
      const amt = parseAmount(amount)
      const res = await submitTransaction('airtime', { phone, network: n.name, amount: amt, sub_type: 'airtime_recharge' })
      setReceipt({ phone, networkName: n.name, networkColor: n.color, amount: amt, ref: res.reference })
      showToast('Airtime sent successfully', '#16a34a')
      setAmount('')
    } catch(err) {
      setErrors({ amount: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#16a34a" icon="📱" title="Airtime Recharge">
      <div style={{ fontSize:11, color:'#6b7280', background:'#f0fdf4', padding:'5px 10px', borderRadius:6, marginBottom:12, fontWeight:600 }}>
        Float: <span style={{ color:'#16a34a' }}>{formatTZS(availableFloat)}</span>
      </div>
      <Label>Phone Number</Label>
      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="255XXXXXXXXX" error={errors.phone} />
      <Label style={{ marginTop:12 }}>Network</Label>
      <NetworkSelector value={net} onChange={setNet} />
      <Label style={{ marginTop:12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />
      <ActionBtn color="#16a34a" loading={loading} onClick={send}>Send Airtime</ActionBtn>
      {receipt && <Receipt lines={[['Phone',receipt.phone],['Network',receipt.networkName,receipt.networkColor],['Amount',formatTZS(receipt.amount)],['Ref',receipt.ref,'#9ca3af']]} />}
    </Card>
  )
}
