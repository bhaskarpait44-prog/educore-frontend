// src/components/ui/StatCard.jsx
import { cn } from '@/utils/helpers'

const StatCard = ({ label, value, sub, icon: Icon, color = 'var(--color-brand)', className }) => (
  <div
    className={cn('p-5 rounded-2xl flex items-start gap-4', className)}
    style={{
      backgroundColor : 'var(--color-surface)',
      border          : '1px solid var(--color-border)',
    }}
  >
    {Icon && (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs mb-0.5 uppercase tracking-wide font-medium"
        style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
      <p className="text-xl font-bold truncate" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>
      )}
    </div>
  </div>
)

export default StatCard