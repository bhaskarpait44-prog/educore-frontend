import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

const LEAVE_OPTIONS = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'without_pay', label: 'Without Pay Leave' },
]

const toDate = (value) => new Date(`${value}T00:00:00`)
const dateKey = (date) => date.toISOString().slice(0, 10)
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const LeaveForm = ({ workingDays, holidays, onSubmit, saving }) => {
  const [form, setForm] = useState({
    leave_type: 'casual',
    from_date: new Date().toISOString().slice(0, 10),
    to_date: new Date().toISOString().slice(0, 10),
    reason: '',
    document_path: '',
  })

  const holidaySet = useMemo(() => new Set((holidays || []).map((holiday) => String(holiday.holiday_date).slice(0, 10))), [holidays])

  const computedDays = useMemo(() => {
    if (!form.from_date || !form.to_date || form.to_date < form.from_date) return 0

    let count = 0
    const current = toDate(form.from_date)
    const end = toDate(form.to_date)

    while (current <= end) {
      const key = dateKey(current)
      const dayKey = DAY_KEYS[current.getDay()]
      if ((workingDays?.[dayKey] ?? (dayKey !== 'saturday' && dayKey !== 'sunday')) && !holidaySet.has(key)) {
        count += 1
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }, [form.from_date, form.to_date, holidaySet, workingDays])

  useEffect(() => {
    if (form.to_date < form.from_date) {
      setForm((prev) => ({ ...prev, to_date: prev.from_date }))
    }
  }, [form.from_date, form.to_date])

  const handleSubmit = async (event) => {
    event.preventDefault()
    await onSubmit({
      ...form,
      reason: form.reason.trim(),
      document_path: form.document_path.trim() || null,
    })
    setForm((prev) => ({ ...prev, reason: '', document_path: '' }))
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Select
          label="Leave Type"
          value={form.leave_type}
          onChange={(event) => setForm((prev) => ({ ...prev, leave_type: event.target.value }))}
          options={LEAVE_OPTIONS}
          required
        />
        <Input
          label="Working Days Count"
          value={String(computedDays)}
          readOnly
          hint="Computed automatically after excluding weekends and holidays."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Input
          type="date"
          label="From Date"
          value={form.from_date}
          onChange={(event) => setForm((prev) => ({ ...prev, from_date: event.target.value }))}
          required
        />
        <Input
          type="date"
          label="To Date"
          value={form.to_date}
          min={form.from_date}
          onChange={(event) => setForm((prev) => ({ ...prev, to_date: event.target.value }))}
          required
        />
      </div>

      <Textarea
        label="Reason"
        value={form.reason}
        onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
        placeholder={`Respected Principal,\nI kindly request leave from ${form.from_date || '[from date]'} to ${form.to_date || '[to date]'} due to [reason]. I will complete all pending academic work and coordinate with the school as required.\nThank you.`}
        hint="Write a short formal application with dates, reason, and any handover note if needed."
        rows={5}
        required
      />

      <Input
        label="Document Path"
        value={form.document_path}
        onChange={(event) => setForm((prev) => ({ ...prev, document_path: event.target.value }))}
        placeholder="Optional medical certificate or supporting file path"
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={saving}>
          Submit Leave Application
        </Button>
      </div>
    </form>
  )
}

export default LeaveForm
