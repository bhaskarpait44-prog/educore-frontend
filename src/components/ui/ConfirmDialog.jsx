// src/components/ui/ConfirmDialog.jsx
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title       = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel= 'Confirm',
  cancelLabel = 'Cancel',
  variant     = 'danger',
  loading     = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <div className="flex gap-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: variant === 'danger' ? '#fef2f2' : '#fffbeb' }}
      >
        <AlertTriangle
          size={18}
          style={{ color: variant === 'danger' ? '#dc2626' : '#d97706' }}
        />
      </div>
      <p className="text-sm leading-relaxed pt-1" style={{ color: 'var(--color-text-secondary)' }}>
        {description}
      </p>
    </div>
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button variant={variant} onClick={onConfirm} loading={loading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
)

export default ConfirmDialog