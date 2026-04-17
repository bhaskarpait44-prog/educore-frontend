// src/pages/students/EditIdentityModal.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import useStudentStore from '@/store/studentStore'
import useToast from '@/hooks/useToast'

const schema = z.object({
  new_value : z.string().min(1, 'New value is required'),
  reason    : z.string().min(10, 'Reason must be at least 10 characters'),
})

const EditIdentityModal = ({ open, onClose, field, currentValue, studentId }) => {
  const { updateIdentity, isSaving } = useStudentStore()
  const { toastSuccess, toastError } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) reset({ new_value: currentValue || '', reason: '' })
  }, [open, currentValue])

  const onSubmit = async ({ new_value, reason }) => {
    const result = await updateIdentity(studentId, {
      [field.key]: new_value,
      reason,
    })
    if (result.success) {
      toastSuccess(`${field.label} updated`)
      onClose()
    } else {
      toastError(result.message || 'Failed to update')
    }
  }

  if (!field) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${field.label}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>Save Change</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Permanent log warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          This change will be permanently recorded in the audit log and cannot be deleted.
        </div>

        {/* Current value */}
        <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-muted)' }}>Current {field.label}</p>
          <p className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-secondary)' }}>
            {currentValue || '—'}
          </p>
        </div>

        {/* New value input */}
        {field.type === 'select' ? (
          <Select
            label={`New ${field.label}`}
            required
            error={errors.new_value?.message}
            options={(field.options || []).map(o => ({ value: o, label: o.charAt(0).toUpperCase() + o.slice(1) }))}
            {...register('new_value')}
          />
        ) : (
          <Input
            label={`New ${field.label}`}
            type={field.type}
            required
            error={errors.new_value?.message}
            {...register('new_value')}
          />
        )}

        {/* Reason */}
        <Textarea
          label="Reason for change"
          placeholder="e.g. Name corrected as per birth certificate submitted by parent"
          hint="Min 10 characters — stored permanently"
          rows={3}
          required
          error={errors.reason?.message}
          {...register('reason')}
        />
      </form>
    </Modal>
  )
}

export default EditIdentityModal