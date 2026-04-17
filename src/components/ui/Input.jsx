// src/components/ui/Input.jsx
import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon  : Icon,
  suffix,
  className,
  containerClassName,
  ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
          {props.required && (
            <span className="ml-1" style={{ color: '#dc2626' }}>*</span>
          )}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Icon size={15} />
          </div>
        )}

        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl text-sm outline-none transition-all',
            'placeholder:opacity-40',
            Icon   ? 'pl-9'  : 'pl-4',
            suffix ? 'pr-10' : 'pr-4',
            'py-2.5',
            className,
          )}
          style={{
            backgroundColor : 'var(--color-surface)',
            border          : `1.5px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
            color           : 'var(--color-text-primary)',
            boxShadow       : error ? '0 0 0 3px #fecaca40' : 'none',
          }}
          onFocus={e => {
            if (!error) {
              e.target.style.borderColor = 'var(--color-brand)'
              e.target.style.boxShadow   = '0 0 0 3px #2563eb20'
            }
          }}
          onBlur={e => {
            if (!error) {
              e.target.style.borderColor = 'var(--color-border)'
              e.target.style.boxShadow   = 'none'
            }
          }}
          {...props}
        />

        {suffix && (
          <div
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs" style={{ color: '#dc2626' }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
export default Input