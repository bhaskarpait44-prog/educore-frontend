import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getClasses, getClassOptions, getSections, getSubjects } from '@/api/classApi'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { SectionHeading } from './StepIdentity'

const schema = z.object({
  session_id: z.string().min(1, 'Session is required'),
  class_id: z.string().min(1, 'Class is required'),
  section_id: z.string().min(1, 'Section is required'),
  stream: z.enum(['arts', 'commerce', 'science']).optional().or(z.literal('')),
  joining_type: z.enum(['fresh', 'promoted', 'transfer_in', 'rejoined'], { required_error: 'Joining type required' }),
  joined_date: z.string().min(1, 'Joining date is required'),
  roll_number: z.string().optional(),
  subject_ids: z.array(z.string()).optional(),
})

const JOINING_TYPES = [
  { value: 'fresh', label: 'Fresh Admission' },
  { value: 'promoted', label: 'Promoted from another school' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'rejoined', label: 'Re-Admitted' },
]

const STREAM_OPTIONS = [
  { value: 'arts', label: 'Arts' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'science', label: 'Science' },
]

const StepEnrollment = ({ defaultValues, currentSession, onSubmit, onBack }) => {
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loadingC, setLoadingC] = useState(false)
  const [loadingS, setLoadingS] = useState(false)
  const [loadingSubj, setLoadingSubj] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...defaultValues,
      session_id: defaultValues.session_id || String(currentSession?.id || ''),
      joined_date: defaultValues.joined_date || new Date().toISOString().split('T')[0],
      joining_type: defaultValues.joining_type || 'fresh',
      subject_ids: defaultValues.subject_ids || [],
    },
  })

  const classId = watch('class_id')
  const subjectIds = watch('subject_ids')
  const selectedClass = classes.find((cls) => String(cls.value) === String(classId))

  useEffect(() => {
    setLoadingC(true)
    getClasses()
      .then(r => setClasses(getClassOptions(r)))
      .catch(() => {})
      .finally(() => setLoadingC(false))
  }, [])

  useEffect(() => {
    if (!classId) {
      setSections([])
      setSubjects([])
      setValue('stream', '')
      return
    }

    if (selectedClass?.stream) {
      setValue('stream', selectedClass.stream)
    }

    setLoadingS(true)
    getSections(classId)
      .then(r => setSections((r.data || []).map(s => ({ value: String(s.id), label: `Section ${s.name}` }))))
      .catch(() => {})
      .finally(() => setLoadingS(false))

    // Fetch subjects for this class
    setLoadingSubj(true)
    getSubjects(classId)
      .then(r => {
        const subjList = r.data || []
        setSubjects(subjList)
        // Auto-select core subjects
        const coreSubjectIds = subjList.filter(s => s.is_core).map(s => String(s.id))
        setValue('subject_ids', coreSubjectIds)
      })
      .catch(() => {})
      .finally(() => setLoadingSubj(false))
  }, [classId, selectedClass?.stream, setValue])

  const toggleSubject = (subjectId) => {
    const current = subjectIds || []
    const updated = current.includes(subjectId)
      ? current.filter(id => id !== subjectId)
      : [...current, subjectId]
    setValue('subject_ids', updated)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <SectionHeading title="Enrollment" subtitle="Assign class, section and subjects" />

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
            label="Class"
            required
            error={errors.class_id?.message}
            options={classes}
            placeholder={loadingC ? 'Loading…' : 'Select class'}
            disabled={loadingC}
            {...register('class_id')}
          />
          <Select
            label="Section"
            required
            error={errors.section_id?.message}
            options={sections}
            placeholder={!classId ? 'Select class first' : loadingS ? 'Loading…' : 'Select section'}
            disabled={!classId || loadingS}
            {...register('section_id')}
          />
          <Select
            label="Stream"
            error={errors.stream?.message}
            options={STREAM_OPTIONS}
            placeholder={selectedClass?.stream ? 'Stream from selected class' : 'Select stream'}
            disabled={Boolean(selectedClass?.stream)}
            {...register('stream')}
          />
          <Select
            label="Joining Type"
            required
            error={errors.joining_type?.message}
            options={JOINING_TYPES}
            {...register('joining_type')}
          />
          <Input
            label="Joining Date"
            type="date"
            required
            error={errors.joined_date?.message}
            {...register('joined_date')}
          />
          <Input
            label="Roll Number"
            placeholder="Leave blank for auto-assign"
            hint="Auto-assigned sequentially if left blank"
            {...register('roll_number')}
            containerClassName="sm:col-span-2"
          />
        </div>

        {/* Subject Selection */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Subjects
            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--color-text-secondary)' }}>
              (Core subjects are pre-selected)
            </span>
          </h3>

          {!classId ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Select a class first to see available subjects
            </p>
          ) : loadingSubj ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading subjects…</p>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-amber-600">No subjects configured for this class yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((subject) => {
                const isSelected = subjectIds?.includes(String(subject.id))
                return (
                  <label
                    key={subject.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                      ${isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      checked={isSelected}
                      onChange={() => toggleSubject(String(subject.id))}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {subject.name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {subject.code} • {subject.subject_type}
                      </p>
                    </div>
                    {subject.is_core && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400">
                        Core
                      </span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <Button variant="secondary" type="button" onClick={onBack}>← Back</Button>
        <Button type="submit">Continue to Access</Button>
      </div>
    </form>
  )
}

export default StepEnrollment
