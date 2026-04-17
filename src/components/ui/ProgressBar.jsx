// src/components/ui/ProgressBar.jsx
import { cn } from '@/utils/helpers'

const ProgressBar = ({ value, max = 100, showLabel = true, size = 'md', className }) => {
  const pct     = Math.min(100, Math.max(0, (value / max) * 100))
  const color   = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold" style={{ color }}>
            {pct.toFixed(1)}%
          </span>
          {pct < 75 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
            >
              Below 75%
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full rounded-full overflow-hidden', heights[size])}
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default ProgressBar