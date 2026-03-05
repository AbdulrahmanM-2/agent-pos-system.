import { NETWORKS } from '../../utils/constants'

export default function NetworkSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {NETWORKS.map(n => (
        <button
          key={n.id}
          onClick={() => onChange(n.id)}
          style={{
            padding: '6px 12px',
            borderRadius: 20,
            border: value === n.id ? `2px solid ${n.color}` : '1.5px solid #e5e7eb',
            background: value === n.id ? n.bg : '#fff',
            color: n.color,
            fontWeight: 700,
            fontSize: 12.5,
            cursor: 'pointer',
            transition: 'all .15s',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, display: 'inline-block' }} />
          {n.name}
        </button>
      ))}
    </div>
  )
}
