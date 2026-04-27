// src/components/ui/ValueDiff.jsx
// Renders old/new values with consistent red/green color coding
import { ArrowRight } from 'lucide-react'
import { cn } from '@/utils/helpers'

export const OldValue = ({ value, className }) => {
  if (value === null || value === undefined || value === '') {
    return <span className={cn('text-xs italic', className)} style={{ color: '#94a3b8' }}>empty</span>
  }
  return (
    <span
      className={cn('inline-block px-2 py-0.5 rounded text-xs font-mono', className)}
      style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
    >
      {String(value)}
    </span>
  )
}

export const NewValue = ({ value, className }) => {
  if (value === null || value === undefined || value === '') {
    return <span className={cn('text-xs italic', className)} style={{ color: '#94a3b8' }}>empty</span>
  }
  return (
    <span
      className={cn('inline-block px-2 py-0.5 rounded text-xs font-mono', className)}
      style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
    >
      {String(value)}
    </span>
  )
}

export const ValueDiff = ({ oldValue, newValue, inline = false }) => (
  <div className={cn('flex items-center gap-2 flex-wrap', inline && 'inline-flex')}>
    <OldValue value={oldValue} />
    <ArrowRight size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
    <NewValue value={newValue} />
  </div>
)

export default ValueDiff