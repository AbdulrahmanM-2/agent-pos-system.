import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Receipt from '../ui/Receipt'
import BankSelector from './BankSelector'
import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'
import { isValidAccount, isValidAmount, parseAmount } from '../../utils/validators'

export default function BankingCard() {
  const { submitTransaction, showToast, float } = usePOS()
  const [txType, setTxType]   = useState('Deposit')
  const [account, setAccount] = useState('')
  const [bank, setBank]       = useState('NMB')
  const [amount, setAmount]   = useState('')
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})
  const availableFloat = float?.banking || 0

  const process = async () => {
    const e = {}
    if (!isValidAccount(account)) e.account = 'Enter a valid account number'
    if (!isValidAmount(amount))   e.amount  = 'Enter a valid amount'
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    try {
      const amt = parseAmount(amount)
      const res = await submitTransaction('banking', { account_number: account, bank, amount: amt, sub_type: txType.toLowerCase() })
      setReceipt({ account, bank, amount: amt, type: txType, ref: res.reference })
      showToast(`${txType} processed successfully`, '#d97706')
      setAmount('')
    } catch(err) {
      setErrors({ amount: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#d97706" icon="🏦" title="Banking Services">
      <div style={{ fontSize:11, color:'#6b7280', background:'#fffbeb', padding:'5px 10px', borderRadius:6, marginBottom:10, fontWeight:600 }}>
        Float: <span style={{ color:'#d97706' }}>{formatTZS(availableFloat)}</span>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {['Deposit','Withdraw'].map(t => (
          <button key={t} onClick={() => setTxType(t)} style={{ flex:1, padding:'8px 0', borderRadius:7, border:'none', background: txType===t ? '#d97706':'#fde68a', color: txType===t ? '#fff':'#92400e', fontWeight:700, fontSize:13.5, cursor:'pointer', transition:'all .15s' }}>{t}</button>
        ))}
      </div>
      <Label>Account Number</Label>
      <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="Account No." error={errors.account} />
      <Label style={{ marginTop:12 }}>Bank</Label>
      <BankSelector value={bank} onChange={setBank} />
      <Label style={{ marginTop:12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />
      <ActionBtn color="#d97706" loading={loading} onClick={process}>Process Transaction</ActionBtn>
      {receipt && <Receipt lines={[['Account',receipt.account],['Bank',receipt.bank],['Type',receipt.type,receipt.type==='Deposit'?'#16a34a':'#dc2626'],['Amount',formatTZS(receipt.amount)],['Ref',receipt.ref,'#9ca3af']]} />}
    </Card>
  )
}
