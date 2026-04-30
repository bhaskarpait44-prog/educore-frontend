// src/components/ui/Modal.jsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/helpers'

const Modal = ({ open, onClose, title, children, size = 'md', footer }) => {
  const overlayRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeMap = {
    sm : 'max-w-sm',
    md : 'max-w-lg',
    lg : 'max-w-2xl',
    xl : 'max-w-4xl',
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={cn(
          'my-4 w-full rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh]',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeMap[size] || sizeMap.md,
        )}
        style={{
          backgroundColor : 'var(--color-surface)',
          border          : '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="px-4 py-4 sm:px-6 shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
