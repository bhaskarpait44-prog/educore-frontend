// src/pages/sessions/AddHolidayModal.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  holiday_date : z.string().min(1, 'Date is required'),
  name         : z.string().min(1, 'Holiday name is required').max(150),
  type         : z.enum(['national', 'regional', 'school'], {
    required_error: 'Please select a type',
  }),
})

const AddHolidayModal = ({ open, onClose, sessionId, existingHolidays = [] }) => {
  const { toastSuccess, toastError } = useToast()
  const { addHoliday, isSaving } = useSessionStore()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const selectedDate = watch('holiday_date')

  // Check for date conflict
  const isDateConflict = selectedDate && existingHolidays.some(
    h => h && h.holiday_date === selectedDate
  )

  // Reset form when modal opens
  useEffect(() => {
    if (open) reset()
  }, [open])

  const onSubmit = async (data) => {
    const result = await addHoliday(sessionId, data)
    if (result.success) {
      toastSuccess(`Holiday "${data.name}" added`)
      onClose()
    } else {
      toastError(result.message || 'Failed to add holiday')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Holiday"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            loading={isSaving}
            disabled={isDateConflict}
          >
            Save Holiday
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Date */}
        <Input
          label="Holiday Date"
          type="date"
          error={errors.holiday_date?.message}
          required
          {...register('holiday_date')}
        />

        {/* Date conflict warning */}
        {isDateConflict && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl text-sm"
            style={{
              backgroundColor : '#fffbeb',
              border          : '1px solid #fde68a',
              color           : '#92400e',
            }}
          >
            <AlertTriangle size={15} className="shrink-0" />
            A holiday is already declared on this date. Choose a different date.
          </div>
        )}

        {/* Name */}
        <Input
          label="Holiday Name"
          placeholder="e.g. Republic Day, Diwali"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        {/* Type */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Holiday Type <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            {...register('type')}
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              backgroundColor : 'var(--color-surface)',
              border          : `1.5px solid ${errors.type ? '#dc2626' : 'var(--color-border)'}`,
              color           : 'var(--color-text-primary)',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--color-brand)'}
            onBlur={e   => e.target.style.borderColor = errors.type ? '#dc2626' : 'var(--color-border)'}
          >
            <option value="">Select type…</option>
            <option value="national">National — Gazetted government holiday</option>
            <option value="regional">Regional — State or district level</option>
            <option value="school">School — Institution specific</option>
          </select>
          {errors.type && (
            <p className="text-xs" style={{ color: '#dc2626' }}>{errors.type.message}</p>
          )}
        </div>

        {/* Type info */}
        <div
          className="p-3 rounded-xl text-xs"
          style={{
            backgroundColor : 'var(--color-surface-raised)',
            color           : 'var(--color-text-muted)',
          }}
        >
          Adding a holiday will retroactively update attendance records for that date.
          Students marked present on this date will be moved to "Holiday" status.
        </div>
      </form>
    </Modal>
  )
}

export default AddHolidayModal