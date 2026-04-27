import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import useExamStore from '@/store/examStore'
import useToast from '@/hooks/useToast'
import { getClasses, getClassOptions, getSubjectList, getSubjects } from '@/api/classApi'

const EXAM_NAME_OPTIONS = [
  { value: 'Unit Test', label: 'Unit Test', exam_type: 'term' },
  { value: 'Half Yearly', label: 'Half Yearly', exam_type: 'midterm' },
  { value: 'Final', label: 'Final', exam_type: 'final' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

const schema = z.object({
  name: z.enum(['Unit Test', 'Half Yearly', 'Final'], { required_error: 'Exam name is required' }),
  class_id: z.string().min(1, 'Class is required'),
  start_date: z.string().min(1, 'Start date required'),
  end_date: z.string().min(1, 'End date required'),
  status: z.enum(['draft', 'published'], { required_error: 'Status is required' }),
}).refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

const CreateExamModal = ({ open, onClose, sessionId }) => {
  const { toastSuccess, toastError } = useToast()
  const { createExam, isSaving } = useExamStore()
  const [classes, setClasses] = useState([])
  const [classSubjects, setClassSubjects] = useState([])
  const [subjectConfigs, setSubjectConfigs] = useState({})

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: 'Unit Test',
      class_id: '',
      start_date: '',
      end_date: '',
      status: 'draft',
    },
  })

  const classId = watch('class_id')

  useEffect(() => {
    getClasses().then((response) => setClasses(getClassOptions(response))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) return
    reset({
      name: 'Unit Test',
      class_id: '',
      start_date: '',
      end_date: '',
      status: 'draft',
    })
    setClassSubjects([])
    setSubjectConfigs({})
  }, [open, reset])

  useEffect(() => {
    if (!classId) {
      setClassSubjects([])
      setSubjectConfigs({})
      return
    }

    getSubjects(classId)
      .then((response) => {
        const subjects = getSubjectList(response)
        setClassSubjects(subjects)
        setSubjectConfigs(Object.fromEntries(subjects.map((subject) => [subject.id, {
          selected: true,
          subject_type: subject.subject_type || 'theory',
          theory_total_marks: subject.theory_total_marks ?? '',
          theory_passing_marks: subject.theory_passing_marks ?? '',
          practical_total_marks: subject.practical_total_marks ?? '',
          practical_passing_marks: subject.practical_passing_marks ?? '',
        }])))
      })
      .catch(() => {
        setClassSubjects([])
        setSubjectConfigs({})
      })
  }, [classId])

  const selectedCount = useMemo(
    () => Object.values(subjectConfigs).filter((item) => item.selected).length,
    [subjectConfigs]
  )

  const updateSubjectConfig = (subjectId, patch) => {
    setSubjectConfigs((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        ...patch,
      },
    }))
  }

  const onSubmit = async (data) => {
    const preset = EXAM_NAME_OPTIONS.find((item) => item.value === data.name)
    const subjects = classSubjects
      .filter((subject) => subjectConfigs[subject.id]?.selected)
      .map((subject) => {
        const config = subjectConfigs[subject.id] || {}
        return {
          subject_id: Number(subject.id),
          subject_type: config.subject_type || subject.subject_type || 'theory',
          theory_total_marks: config.theory_total_marks === '' ? null : Number(config.theory_total_marks),
          theory_passing_marks: config.theory_passing_marks === '' ? null : Number(config.theory_passing_marks),
          practical_total_marks: config.practical_total_marks === '' ? null : Number(config.practical_total_marks),
          practical_passing_marks: config.practical_passing_marks === '' ? null : Number(config.practical_passing_marks),
        }
      })

    if (subjects.length === 0) {
      toastError('Select at least one subject for this exam')
      return
    }

    const result = await createExam({
      session_id: Number(sessionId),
      class_id: Number(data.class_id),
      name: data.name,
      exam_type: preset?.exam_type || 'term',
      start_date: data.start_date,
      end_date: data.end_date,
      status: data.status,
      subjects,
    })

    if (result.success) {
      toastSuccess(`Exam "${data.name}" created`)
      onClose()
    } else {
      toastError(result.message || 'Failed to create exam')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Exam"
      size="xl"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSaving}>Create Exam</Button>
        </>
      )}
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Exam Name"
            options={EXAM_NAME_OPTIONS}
            error={errors.name?.message}
            {...register('name')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          <Select
            label="Class"
            options={classes}
            error={errors.class_id?.message}
            {...register('class_id')}
          />
          <div className="rounded-2xl px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
            This exam is for the selected class and only the chosen subjects below.
          </div>
          <Input label="Start Date" type="date" error={errors.start_date?.message} {...register('start_date')} />
          <Input label="End Date" type="date" error={errors.end_date?.message} {...register('end_date')} />
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Subject Selection</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedCount} subject(s) selected for this exam.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const nextSelected = selectedCount !== classSubjects.length
                setSubjectConfigs((prev) => Object.fromEntries(classSubjects.map((subject) => [subject.id, {
                  ...prev[subject.id],
                  selected: nextSelected,
                }])))
              }}
            >
              {selectedCount === classSubjects.length ? 'Clear All' : 'Select All'}
            </Button>
          </div>

          {!classId ? (
            <div className="rounded-2xl px-4 py-6 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
              Select a class first to configure subjects.
            </div>
          ) : classSubjects.length === 0 ? (
            <div className="rounded-2xl px-4 py-6 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
              No subjects found for this class.
            </div>
          ) : (
            <div className="space-y-4">
              {classSubjects.map((subject) => {
                const config = subjectConfigs[subject.id] || {}
                const subjectType = config.subject_type || subject.subject_type || 'theory'
                return (
                  <div
                    key={subject.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!config.selected}
                          onChange={(event) => updateSubjectConfig(subject.id, { selected: event.target.checked })}
                        />
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{subject.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{subject.code}</p>
                        </div>
                      </label>
                      <div className="w-full lg:w-56">
                        <Select
                          label="Subject Type"
                          value={subjectType}
                          onChange={(event) => updateSubjectConfig(subject.id, { subject_type: event.target.value })}
                          options={[
                            { value: 'theory', label: 'Theory' },
                            { value: 'practical', label: 'Practical' },
                            { value: 'both', label: 'Theory + Practical' },
                          ]}
                        />
                      </div>
                    </div>

                    {config.selected && (
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {subjectType !== 'practical' && (
                          <>
                            <Input
                              label="Theory Total"
                              type="number"
                              min="1"
                              value={config.theory_total_marks ?? ''}
                              onChange={(event) => updateSubjectConfig(subject.id, { theory_total_marks: event.target.value })}
                            />
                            <Input
                              label="Theory Passing"
                              type="number"
                              min="1"
                              value={config.theory_passing_marks ?? ''}
                              onChange={(event) => updateSubjectConfig(subject.id, { theory_passing_marks: event.target.value })}
                            />
                          </>
                        )}
                        {subjectType !== 'theory' && (
                          <>
                            <Input
                              label="Practical Total"
                              type="number"
                              min="1"
                              value={config.practical_total_marks ?? ''}
                              onChange={(event) => updateSubjectConfig(subject.id, { practical_total_marks: event.target.value })}
                            />
                            <Input
                              label="Practical Passing"
                              type="number"
                              min="1"
                              value={config.practical_passing_marks ?? ''}
                              onChange={(event) => updateSubjectConfig(subject.id, { practical_passing_marks: event.target.value })}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </form>
    </Modal>
  )
}

export default CreateExamModal
