// src/pages/sessions/CreateSessionPage.jsx
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, ArrowLeft } from 'lucide-react'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import usePageTitle from '@/hooks/usePageTitle'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ROUTES } from '@/constants/app'
import { cn } from '@/utils/helpers'

const DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
]

const schema = z.object({
  name      : z.string().min(1, 'Session name is required').max(20, 'Max 20 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date  : z.string().min(1, 'End date is required'),
  working_days: z.object({
    monday    : z.boolean(),
    tuesday   : z.boolean(),
    wednesday : z.boolean(),
    thursday  : z.boolean(),
    friday    : z.boolean(),
    saturday  : z.boolean(),
    sunday    : z.boolean(),
  }),
}).refine(d => new Date(d.end_date) > new Date(d.start_date), {
  message: 'End date must be after start date',
  path   : ['end_date'],
})

const CreateSessionPage = () => {
  usePageTitle('Create Session')

  const navigate = useNavigate()
  const { toastSuccess, toastError } = useToast()
  const { createSession, isSaving, sessions } = useSessionStore()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver     : zodResolver(schema),
    defaultValues: {
      name        : '',
      start_date  : '',
      end_date    : '',
      working_days: {
        monday: true, tuesday: true, wednesday: true,
        thursday: true, friday: true, saturday: false, sunday: false,
      },
    },
  })

  const onSubmit = async (data) => {
    // Client-side duplicate check
    const isDuplicate = sessions.some(
      s => s.name.toLowerCase() === data.name.toLowerCase()
    )
    if (isDuplicate) {
      setError('name', { message: 'A session with this name already exists' })
      return
    }

    const result = await createSession(data)
    if (result.success) {
      toastSuccess(`Session "${data.name}" created successfully`)
      navigate(ROUTES.SESSIONS)
    } else {
      toastError(result.message || 'Failed to create session')
    }
  }

  const startDate = watch('start_date')

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(ROUTES.SESSIONS)}
          className="p-2 rounded-xl transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Create Academic Session
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Set up a new academic year
          </p>
        </div>
      </div>

      {/* ── Form card ──────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          className="rounded-2xl p-6 space-y-6"
          style={{
            backgroundColor : 'var(--color-surface)',
            border          : '1px solid var(--color-border)',
          }}
        >
          {/* Section: Basic info */}
          <div>
            <SectionTitle icon={CalendarDays} title="Session Details" />
            <div className="mt-4 space-y-4">

              <Input
                label="Session Name"
                placeholder="e.g. 2024-2025"
                error={errors.name?.message}
                hint='Use format like "2024-2025" to represent the academic year'
                required
                {...register('name')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  error={errors.start_date?.message}
                  required
                  {...register('start_date')}
                />
                <Input
                  label="End Date"
                  type="date"
                  min={startDate || undefined}
                  error={errors.end_date?.message}
                  required
                  {...register('end_date')}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)' }} />

          {/* Section: Working days */}
          <div>
            <SectionTitle
              title="Working Days"
              subtitle="Select which days of the week are school working days"
            />
            <div className="mt-4">
              <Controller
                control={control}
                name="working_days"
                render={({ field: { value, onChange } }) => (
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => {
                      const isChecked = value[day.key]
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => onChange({ ...value, [day.key]: !isChecked })}
                          className={cn(
                            'w-12 h-12 rounded-xl text-sm font-semibold transition-all duration-150',
                            'border-2',
                          )}
                          style={{
                            backgroundColor : isChecked ? 'var(--color-brand)'       : 'var(--color-surface-raised)',
                            borderColor     : isChecked ? 'var(--color-brand)'       : 'var(--color-border)',
                            color           : isChecked ? '#fff'                     : 'var(--color-text-secondary)',
                            transform       : isChecked ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                These settings affect attendance calculation and holiday exclusion.
              </p>
            </div>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => navigate(ROUTES.SESSIONS)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSaving}
            icon={CalendarDays}
          >
            Create Session
          </Button>
        </div>
      </form>
    </div>
  )
}

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div>
    <div className="flex items-center gap-2">
      {Icon && <Icon size={16} style={{ color: 'var(--color-brand)' }} />}
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
    </div>
    {subtitle && (
      <p className="text-xs mt-0.5 ml-6" style={{ color: 'var(--color-text-secondary)' }}>
        {subtitle}
      </p>
    )}
  </div>
)

export default CreateSessionPage