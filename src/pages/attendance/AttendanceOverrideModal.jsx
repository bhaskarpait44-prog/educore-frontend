// src/pages/attendance/AttendanceOverrideModal.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import useAttendanceStore from '@/store/attendanceStore'
import useToast from '@/hooks/useToast'
import { formatDate } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { value: 'present',  label: 'Present'  },
  { value: 'absent',   label: 'Absent'   },
  { value: 'late',     label: 'Late'     },
  { value: 'half_day', label: 'Half Day' },
  { value: 'holiday',  label: 'Holiday'  },
]

const STATUS_COLOR = {
  present  : '#16a34a',
  absent   : '#dc2626',
  late     : '#d97706',
  half_day : '#2563eb',
  holiday  : '#94a3b8',
}

const schema = z.object({
  status          : z.string().min(1, 'Status is required'),
  override_reason : z.string().min(10, 'Reason must be at least 10 characters'),
})

const AttendanceOverrideModal = ({ open, record, student, onClose, onSuccess }) => {
  const { overrideAttendance, isSaving } = useAttendanceStore()
  const { toastSuccess, toastError } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: { status: record?.status || 'present', override_reason: '' },
  })

  useEffect(() => {
    if (open && record) reset({ status: record.status, override_reason: '' })
  }, [open, record])

  const onSubmit = async (data) => {
    const result = await overrideAttendance(record.id, data)
    if (result.success) {
      toastSuccess('Attendance updated')
      onSuccess?.()
    } else {
      toastError(result.message || 'Failed to update')
    }
  }

  if (!record) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override Attendance"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>Save Override</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Audit warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl text-sm"
          style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          This override will be permanently logged in the audit trail.
        </div>

        {/* Context */}
        <div
          className="p-3 rounded-xl space-y-1"
          style={{ backgroundColor: 'var(--color-surface-raised)' }}
        >
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Student</p>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {student?.student_name || student?.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatDate(record.date)}
          </p>
        </div>

        {/* Current → new status visual */}
        <div className="flex items-center gap-3">
          <div
            className="flex-1 py-2 px-3 rounded-xl text-center text-sm font-semibold"
            style={{
              backgroundColor : '#f1f5f9',
              color           : STATUS_COLOR[record.status] || '#64748b',
            }}
          >
            {record.status}
          </div>
          <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
          <div className="flex-1">
            <Select
              options={STATUS_OPTIONS}
              error={errors.status?.message}
              {...register('status')}
            />
          </div>
        </div>

        {/* Reason */}
        <Textarea
          label="Reason for override"
          placeholder="e.g. Student was present but marked absent in error"
          hint="Min 10 characters — stored permanently"
          rows={3}
          required
          error={errors.override_reason?.message}
          {...register('override_reason')}
        />
      </div>
    </Modal>
  )
}

export default AttendanceOverrideModal