// src/components/ui/Badge.jsx
import { cn } from '@/utils/helpers'

const VARIANTS = {
  blue   : { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  green  : { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  yellow : { bg: '#fefce8', color: '#a16207', border: '#fde68a' },
  grey   : { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  dark   : { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
  red    : { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

const DARK_VARIANTS = {
  blue   : { bg: '#1e3a5f', color: '#93c5fd', border: '#1e40af' },
  green  : { bg: '#14532d', color: '#86efac', border: '#166534' },
  yellow : { bg: '#422006', color: '#fcd34d', border: '#92400e' },
  grey   : { bg: '#1e293b', color: '#94a3b8', border: '#334155' },
  dark   : { bg: '#0f172a', color: '#64748b', border: '#1e293b' },
  red    : { bg: '#450a0a', color: '#fca5a5', border: '#991b1b' },
}

const Badge = ({ variant = 'grey', children, size = 'sm', dot = false, className }) => {
  const isDark = document.documentElement.classList.contains('dark')
  const style  = (isDark ? DARK_VARIANTS : VARIANTS)[variant] || VARIANTS.grey

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className,
      )}
      style={{
        backgroundColor : style.bg,
        color           : style.color,
        border          : `1px solid ${style.border}`,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: style.color }}
        />
      )}
      {children}
    </span>
  )
}

export default Badge