import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useToast from '@/hooks/useToast'
import { getClasses, getClassOptions } from '@/api/classApi'
import * as feesApi from '@/api/fees'
import * as accountantApi from '@/api/accountantApi'

const schema = z.object({
  name: z.string().min(1, 'Fee name is required'),
  amount: z.string().min(1, 'Amount is required').refine(
    (value) => !Number.isNaN(parseFloat(value)) && parseFloat(value) > 0,
    'Enter a valid amount',
  ),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time'], {
    required_error: 'Frequency is required',
  }),
  due_day: z.string().refine((value) => {
    const day = parseInt(value, 10)
    return day >= 1 && day <= 28
  }, 'Due day must be between 1 and 28'),
  class_id: z.string().min(1, 'Class is required'),
})

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly - charged every month' },
  { value: 'quarterly', label: 'Quarterly - every 3 months' },
  { value: 'annual', label: 'Annual - once per session' },
  { value: 'one_time', label: 'One Time - admission or exam fee' },
]

const AddFeeComponentModal = ({ open, onClose, sessionId, classId: preSelectedClass, apiMode = 'default', onCreated }) => {
  const { toastSuccess, toastError } = useToast()
  const [classes, setClasses] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    getClasses()
      .then((response) => setClasses(getClassOptions(response)))
      .catch(() => {})
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      amount: '',
      frequency: 'monthly',
      due_day: '10',
      class_id: preSelectedClass || '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: '',
        amount: '',
        frequency: 'monthly',
        due_day: '10',
        class_id: preSelectedClass || '',
      })
    }
  }, [open, preSelectedClass, reset])

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      const payload = {
        session_id: parseInt(sessionId, 10),
        class_id: parseInt(data.class_id, 10),
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        due_day: parseInt(data.due_day, 10),
      }
      const response = await (apiMode === 'accountant'
        ? accountantApi.createFeeStructure(payload)
        : feesApi.createFeeStructure(payload))

      onCreated?.(response.data)
      toastSuccess(`"${data.name}" fee component added`)
      onClose()
    } catch (error) {
      toastError(error?.message || 'Failed to add component')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Fee Component"
      size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>
            Save Component
          </Button>
        </>
      )}
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Select
          label="Class"
          required
          options={classes}
          error={errors.class_id?.message}
          {...register('class_id')}
        />
        <Input
          label="Fee Name"
          placeholder="e.g. Tuition Fee, Transport Fee"
          required
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Amount (Rs)"
          type="number"
          placeholder="1200.00"
          required
          min="1"
          step="0.01"
          error={errors.amount?.message}
          hint="Enter the base amount per billing period"
          {...register('amount')}
        />
        <Select
          label="Frequency"
          required
          options={FREQUENCY_OPTIONS}
          error={errors.frequency?.message}
          {...register('frequency')}
        />
        <Input
          label="Due Day of Month"
          type="number"
          min="1"
          max="28"
          placeholder="10"
          required
          error={errors.due_day?.message}
          hint="Day of month payment is due (1-28)."
          {...register('due_day')}
        />

        <div
          className="rounded-xl p-3 text-xs"
          style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
        >
          Add the fee component for the selected class and session.
        </div>
      </form>
    </Modal>
  )
}

export default AddFeeComponentModal
