// src/pages/students/admit/StepEnrollment.jsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getClasses, getSections } from '@/api/classes'
import Input   from '@/components/ui/Input'
import Select  from '@/components/ui/Select'
import Button  from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const schema = z.object({
  session_id  : z.string().min(1, 'Session is required'),
  class_id    : z.string().min(1, 'Class is required'),
  section_id  : z.string().min(1, 'Section is required'),
  joining_type: z.enum(['fresh','promoted','transfer_in','rejoined'], { required_error: 'Joining type required' }),
  joined_date : z.string().min(1, 'Joining date is required'),
  roll_number : z.string().optional(),
})

const JOINING_TYPES = [
  { value: 'fresh',       label: 'Fresh Admission' },
  { value: 'promoted',    label: 'Promoted from another school' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'rejoined',    label: 'Re-Admitted' },
]

const StepEnrollment = ({ defaultValues, currentSession, onSubmit, onBack, isSaving }) => {
  const [classes,  setClasses]  = useState([])
  const [sections, setSections] = useState([])
  const [loadingC, setLoadingC] = useState(false)
  const [loadingS, setLoadingS] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      session_id  : defaultValues.session_id || String(currentSession?.id || ''),
      joined_date : defaultValues.joined_date || new Date().toISOString().split('T')[0],
      joining_type: defaultValues.joining_type || 'fresh',
    },
  })

  const classId = watch('class_id')

  // Load classes
  useEffect(() => {
    setLoadingC(true)
    getClasses()
      .then(r => setClasses((r.data || []).map(c => ({ value: String(c.id), label: c.name }))))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [])

  // Load sections when class changes
  useEffect(() => {
    if (!classId) { setSections([]); return }
    setLoadingS(true)
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
      .finally(() => setLoadingS(false))
  }, [classId])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <SectionHeading title="Enrollment" subtitle="Assign class and section for current session" />

        {/* Current session display */}
        {currentSession && (
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#2563eb' }} />
            <p className="text-sm text-blue-700">
              Enrolling in current session: <strong>{currentSession.name}</strong>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Class" required
            error={errors.class_id?.message}
            options={classes}
            placeholder={loadingC ? 'Loading…' : 'Select class'}
            disabled={loadingC}
            {...register('class_id')}
          />
          <Select
            label="Section" required
            error={errors.section_id?.message}
            options={sections}
            placeholder={!classId ? 'Select class first' : loadingS ? 'Loading…' : 'Select section'}
            disabled={!classId || loadingS}
            {...register('section_id')}
          />
          <Select
            label="Joining Type" required
            error={errors.joining_type?.message}
            options={JOINING_TYPES}
            {...register('joining_type')}
          />
          <Input
            label="Joining Date" type="date" required
            error={errors.joined_date?.message}
            {...register('joined_date')}
          />
          <Input
            label="Roll Number" placeholder="01"
            hint="Leave blank to assign later"
            {...register('roll_number')}
            containerClassName="sm:col-span-2"
          />
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <Button type="submit" loading={isSaving}>
          Complete Admission
        </Button>
      </div>
    </form>
  )
}

export default StepEnrollment