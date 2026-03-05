import { BANKS } from '../../utils/constants'

export default function BankSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '9px 12px',
        borderRadius: 7,
        border: '1.5px solid #e5e7eb',
        fontSize: 14,
        background: '#fff',
        color: '#111827',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {BANKS.map(b => <option key={b}>{b}</option>)}
    </select>
  )
}
