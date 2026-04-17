// src/components/ui/Button.jsx
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/helpers'

const VARIANTS = {
  primary  : 'text-white',
  secondary: '',
  danger   : 'text-white',
  ghost    : '',
  outline  : '',
}

const Button = ({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  disabled  = false,
  icon      : Icon,
  iconRight,
  onClick,
  type      = 'button',
  className,
  fullWidth,
  ...props
}) => {
  const isDisabled = disabled || loading

  const sizeClasses = {
    xs : 'px-2.5 py-1.5 text-xs gap-1.5 rounded-lg',
    sm : 'px-3 py-2 text-xs gap-1.5 rounded-xl',
    md : 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg : 'px-5 py-3 text-sm gap-2 rounded-xl',
  }

  const getStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor : isDisabled ? 'var(--color-brand)' : 'var(--color-brand)',
          opacity         : isDisabled ? 0.65 : 1,
          color           : '#fff',
        }
      case 'secondary':
        return {
          backgroundColor : 'var(--color-surface-raised)',
          color           : 'var(--color-text-primary)',
          border          : '1px solid var(--color-border)',
        }
      case 'danger':
        return {
          backgroundColor : '#dc2626',
          color           : '#fff',
          opacity         : isDisabled ? 0.65 : 1,
        }
      case 'ghost':
        return {
          backgroundColor : 'transparent',
          color           : 'var(--color-text-secondary)',
        }
      case 'outline':
        return {
          backgroundColor : 'transparent',
          color           : 'var(--color-brand)',
          border          : '1.5px solid var(--color-brand)',
        }
    }
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        sizeClasses[size] || sizeClasses.md,
        isDisabled ? 'cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]',
        fullWidth && 'w-full',
        VARIANTS[variant],
        className,
      )}
      style={getStyles()}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'xs' || size === 'sm' ? 13 : 15} className="animate-spin shrink-0" />
      ) : Icon ? (
        <Icon size={size === 'xs' || size === 'sm' ? 13 : 15} className="shrink-0" />
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="shrink-0">{iconRight}</span>
      )}
    </button>
  )
}

export default Button