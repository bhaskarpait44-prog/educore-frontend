// src/components/ui/DateRangePicker.jsx
import { cn } from '@/utils/helpers'

const DateRangePicker = ({ fromDate, toDate, onFromChange, onToChange, className }) => (
  <div className={cn('flex items-center gap-2', className)}>
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        From
      </label>
      <input
        type="date"
        value={fromDate}
        max={toDate || undefined}
        onChange={e => onFromChange(e.target.value)}
        className="px-3 py-2 rounded-xl text-sm outline-none"
        style={{
          backgroundColor: 'var(--color-surface)',
          border         : '1.5px solid var(--color-border)',
          color          : 'var(--color-text-primary)',
        }}
        onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
        onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
      />
    </div>
    <span className="mt-5 text-sm" style={{ color: 'var(--color-text-muted)' }}>—</span>
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        To
      </label>
      <input
        type="date"
        value={toDate}
        min={fromDate || undefined}
        onChange={e => onToChange(e.target.value)}
        className="px-3 py-2 rounded-xl text-sm outline-none"
        style={{
          backgroundColor: 'var(--color-surface)',
          border         : '1.5px solid var(--color-border)',
          color          : 'var(--color-text-primary)',
        }}
        onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
        onBlur={e   => e.target.style.borderColor = 'var(--color-border)'}
      />
    </div>
  </div>
)

export default DateRangePicker