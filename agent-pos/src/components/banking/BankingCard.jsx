import { useState } from 'react'
import Card from '../ui/Card'
import Label from '../ui/Label'
import Input from '../ui/Input'
import ActionBtn from '../ui/ActionBtn'
import Receipt from '../ui/Receipt'
import BankSelector from './BankSelector'
import { processBanking } from '../../services/bankingService'
import { usePOS } from '../../context/POSContext'
import { formatTZS } from '../../utils/formatters'
import { isValidAccount, isValidAmount, parseAmount } from '../../utils/validators'

export default function BankingCard() {
  const { addTransaction, showToast } = usePOS()
  const [txType, setTxType] = useState('Deposit')
  const [account, setAccount] = useState('12345678901')
  const [bank, setBank]       = useState('NMB')
  const [amount, setAmount]   = useState('20,000')
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!isValidAccount(account)) e.account = 'Enter a valid account number'
    if (!isValidAmount(amount))   e.amount  = 'Enter a valid amount'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const process = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await processBanking({ account, bank, amount: parseAmount(amount), type: txType })
      setReceipt({ ...res })
      addTransaction('banking', parseAmount(amount))
      showToast(`${txType} processed successfully`, '#d97706')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card color="#d97706" icon="🏦" title="Banking Services">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['Deposit', 'Withdraw'].map(t => (
          <button
            key={t}
            onClick={() => setTxType(t)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
              background: txType === t ? '#d97706' : '#fde68a',
              color: txType === t ? '#fff' : '#92400e',
              fontWeight: 700, fontSize: 13.5, cursor: 'pointer', transition: 'all .15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <Label>Account Number</Label>
      <Input value={account} onChange={e => setAccount(e.target.value)} placeholder="Account No." error={errors.account} />

      <Label style={{ marginTop: 12 }}>Bank</Label>
      <BankSelector value={bank} onChange={setBank} />

      <Label style={{ marginTop: 12 }}>Amount (TZS)</Label>
      <Input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" error={errors.amount} />

      <ActionBtn color="#d97706" loading={loading} onClick={process}>
        Process Transaction
      </ActionBtn>

      {receipt && (
        <Receipt lines={[
          ['Account', receipt.account],
          ['Bank',    receipt.bank],
          ['Type',    receipt.type,   receipt.type === 'Deposit' ? '#16a34a' : '#dc2626'],
          ['Amount',  formatTZS(receipt.amount)],
          ['Ref',     receipt.ref,    '#6b7280'],
        ]} />
      )}
    </Card>
  )
}
