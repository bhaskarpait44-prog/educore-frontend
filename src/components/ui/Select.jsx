// src/components/ui/Select.jsx
import { forwardRef } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/helpers'

const Select = forwardRef(({
  label, error, hint, options = [],
  placeholder = 'Select…', containerClassName,
  ...props
}, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && (
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
        {props.required && <span className="ml-1" style={{ color: '#dc2626' }}>*</span>}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className="w-full pl-4 pr-9 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface)',
          border  : `1.5px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
          color   : 'var(--color-text-primary)',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'var(--color-brand)' }}
        onBlur={e  => { if (!error) e.target.style.borderColor = 'var(--color-border)' }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
      />
    </div>
    {error && (
      <p className="flex items-center gap-1 text-xs" style={{ color: '#dc2626' }}>
        <AlertCircle size={11} />{error}
      </p>
    )}
    {hint && !error && (
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
    )}
  </div>
))
Select.displayName = 'Select'
export default Select