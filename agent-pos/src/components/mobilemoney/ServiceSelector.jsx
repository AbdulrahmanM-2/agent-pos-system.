import Pill from '../ui/Pill'
import { MM_SERVICES } from '../../utils/constants'

export default function ServiceSelector({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {MM_SERVICES.map(s => (
        <Pill key={s} active={value === s} color="#1d4ed8" onClick={() => onChange(s)}>
          {s}
        </Pill>
      ))}
    </div>
  )
}
