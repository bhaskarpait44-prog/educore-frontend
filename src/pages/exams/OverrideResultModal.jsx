// src/pages/exams/OverrideResultModal.jsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Badge from '@/components/ui/Badge'
import useExamStore from '@/store/examStore'
import useToast from '@/hooks/useToast'

const RESULT_OPTIONS = [
  { value: 'pass',        label: 'Pass'        },
  { value: 'fail',        label: 'Fail'        },
  { value: 'compartment', label: 'Compartment' },
  { value: 'detained',    label: 'Detained'    },
]

const RESULT_CFG = {
  pass        : 'green',
  fail        : 'red',
  compartment : 'yellow',
  detained    : 'dark',
}

const schema = z.object({
  new_result : z.enum(['pass','fail','compartment','detained'], { required_error: 'Select a result' }),
  reason     : z.string().min(10, 'Reason must be at least 10 characters'),
})

const OverrideResultModal = ({ open, student, onClose, onSuccess }) => {
  const { toastSuccess, toastError } = useToast()
  const { overrideResult, isSaving } = useExamStore()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: { new_result: '', reason: '' },
  })

  useEffect(() => {
    if (open) reset({ new_result: student?.result || '', reason: '' })
  }, [open, student])

  const onSubmit = async (data) => {
    const result = await overrideResult({
      enrollment_id: student.enrollment_id,
      new_result   : data.new_result,
      reason       : data.reason,
    })
    if (result.success) {
      toastSuccess(`Result overridden for ${student.student_name || student.name}`)
      onSuccess?.()
    } else {
      toastError(result.message || 'Failed to override result')
    }
  }

  if (!student) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Override Result"
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
          This override will be permanently recorded in the audit trail.
        </div>

        {/* Student info */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {student.student_name || student.name}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {student.admission_no}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Current result:</span>
            {student.result
              ? <Badge variant={RESULT_CFG[student.result] || 'grey'}>{student.result}</Badge>
              : <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Not calculated</span>
            }
          </div>
        </div>

        <Select
          label="New Result"
          required
          options={RESULT_OPTIONS}
          error={errors.new_result?.message}
          {...register('new_result')}
        />

        <Textarea
          label="Reason for override"
          placeholder="e.g. Student detained due to disciplinary action approved by principal"
          hint="Min 10 characters — stored permanently"
          rows={3}
          required
          error={errors.reason?.message}
          {...register('reason')}
        />
      </div>
    </Modal>
  )
}

export default OverrideResultModal