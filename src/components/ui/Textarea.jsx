// src/components/ui/Textarea.jsx
import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'

const Textarea = forwardRef(({ label, error, hint, rows = 3, containerClassName, ...props }, ref) => (
  <div className={cn('flex flex-col gap-1.5', containerClassName)}>
    {label && (
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
        {props.required && <span className="ml-1" style={{ color: '#dc2626' }}>*</span>}
      </label>
    )}
    <textarea
      ref={ref} rows={rows}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none placeholder:opacity-40"
      style={{
        backgroundColor: 'var(--color-surface)',
        border : `1.5px solid ${error ? '#dc2626' : 'var(--color-border)'}`,
        color  : 'var(--color-text-primary)',
      }}
      onFocus={e => { if (!error) { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px #2563eb20' }}}
      onBlur={e  => { if (!error) { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}}
      {...props}
    />
    {error && (
      <p className="flex items-center gap-1 text-xs" style={{ color: '#dc2626' }}>
        <AlertCircle size={11} />{error}
      </p>
    )}
    {hint && !error && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
  </div>
))
Textarea.displayName = 'Textarea'
export default Textarea