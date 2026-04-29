import { formatCurrency } from '@/utils/helpers'

const CollectionChart = ({ items = [] }) => {
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No collection data yet.</p>
      ) : items.map((item) => {
        const percentage = total > 0 ? (Number(item.amount || 0) / total) * 100 : 0
        return (
          <div key={item.payment_mode || item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text-primary)' }}>{item.payment_mode || item.label}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{formatCurrency(item.amount || 0)} • {percentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ backgroundColor: '#ffedd5' }}>
              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: 'var(--color-brand)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CollectionChart
