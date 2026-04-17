// src/components/ui/ToastContainer.jsx

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import useUiStore from '@/store/uiStore'
import { cn } from '@/utils/helpers'

const TOAST_STYLES = {
  success: {
    icon  : CheckCircle,
    color : 'var(--color-success)',
    bg    : '#f0fdf4',
    darkBg: '#14532d',
  },
  error: {
    icon  : XCircle,
    color : 'var(--color-danger)',
    bg    : '#fef2f2',
    darkBg: '#450a0a',
  },
  warning: {
    icon  : AlertTriangle,
    color : 'var(--color-warning)',
    bg    : '#fffbeb',
    darkBg: '#451a03',
  },
  info: {
    icon  : Info,
    color : 'var(--color-info)',
    bg    : '#eff6ff',
    darkBg: '#1e3a5f',
  },
}

const Toast = ({ toast, onRemove }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  const IconComp = style.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg',
        'animate-in slide-in-from-right-5 fade-in duration-200',
        'min-w-72 max-w-sm',
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border         : `1px solid var(--color-border)`,
        borderLeft     : `4px solid ${style.color}`,
      }}
      role="alert"
    >
      <IconComp
        size={18}
        style={{ color: style.color, marginTop: '1px', flexShrink: 0 }}
      />
      <p
        className="text-sm flex-1 leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

const ToastContainer = () => {
  const { toasts, removeToast } = useUiStore()

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

export default ToastContainer
