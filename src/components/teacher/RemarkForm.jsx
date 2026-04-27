import { useMemo } from 'react'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

const REMARK_TYPES = [
  { value: 'academic', label: 'Academic' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'health', label: 'Health' },
  { value: 'parent_communication', label: 'Parent Communication' },
  { value: 'general', label: 'General' },
]

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'share_student', label: 'Share with Student' },
]

const RemarkForm = ({
  students = [],
  value,
  onChange,
  onSubmit,
  loading = false,
  submitLabel = 'Submit Remark',
}) => {
  const studentOptions = useMemo(() => students.map((student) => ({
    value: String(student.id),
    label: `${student.first_name} ${student.last_name} | ${student.class_name} ${student.section_name} | Roll ${student.roll_number || '--'}`,
  })), [students])

  return (
    <section
      className="rounded-[28px] border p-5 sm:p-6"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        Add Remark
      </h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Record academic, behavior, health, or parent communication notes with student-only visibility controls.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Select
          label="Student"
          value={value.student_id}
          onChange={(event) => onChange('student_id', event.target.value)}
          options={studentOptions}
          placeholder="Select student"
        />
        <Select
          label="Remark Type"
          value={value.remark_type}
          onChange={(event) => onChange('remark_type', event.target.value)}
          options={REMARK_TYPES}
          placeholder="Select remark type"
        />
        <Select
          label="Visibility"
          value={value.visibility}
          onChange={(event) => onChange('visibility', event.target.value)}
          options={VISIBILITY_OPTIONS}
          placeholder="Select visibility"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Date
          </label>
          <input
            type="date"
            value={value.date}
            onChange={(event) => onChange('date', event.target.value)}
            className="min-h-11 rounded-xl px-4 text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          label="Remark Text"
          rows={5}
          value={value.remark_text}
          onChange={(event) => onChange('remark_text', event.target.value)}
          placeholder="Write the teacher remark here."
        />
      </div>

      <div className="mt-5">
        <Button loading={loading} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </section>
  )
}

export default RemarkForm
