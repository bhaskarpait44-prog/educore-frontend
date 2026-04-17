// src/components/ui/EmptyState.jsx
import { cn } from '@/utils/helpers'

const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl',
      className,
    )}
    style={{
      backgroundColor : 'var(--color-surface)',
      border          : '1px solid var(--color-border)',
    }}
  >
    {Icon && (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--color-surface-raised)' }}
      >
        <Icon size={24} style={{ color: 'var(--color-text-muted)' }} />
      </div>
    )}
    <h3
      className="text-base font-semibold mb-1"
      style={{ color: 'var(--color-text-primary)' }}
    >
      {title}
    </h3>
    {description && (
      <p
        className="text-sm max-w-xs mb-5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {description}
      </p>
    )}
    {action}
  </div>
)

export default EmptyState