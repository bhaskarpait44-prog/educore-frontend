import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, Briefcase,
  Check, Copy, GraduationCap, KeyRound, Mail, Plus,
  Search, ShieldCheck, UserRound, Users,
} from 'lucide-react'
import * as userApi from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { getDefaultPermissionsForRole } from '@/utils/permissions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/helpers'

/* ─── schema ─── */
const teacherSchema = z.object({
  name:                   z.string().trim().min(1, 'Teacher name is required'),
  email:                  z.string().trim().email('Valid email is required'),
  phone:                  z.string().trim().optional(),
  employee_id:            z.string().trim().optional(),
  department:             z.string().trim().optional(),
  designation:            z.string().trim().optional(),
  joining_date:           z.string().optional(),
  highest_qualification:  z.string().trim().optional(),
  specialization:         z.string().trim().optional(),
  university_name:        z.string().trim().optional(),
  graduation_year:        z.string().trim().optional(),
  years_of_experience:    z.string().trim().optional(),
  address:                z.string().trim().optional(),
  internal_notes:         z.string().trim().optional(),
})

const defaultValues = {
  name: '', email: '', phone: '', employee_id: '', department: '',
  designation: '', joining_date: '', highest_qualification: '',
  specialization: '', university_name: '', graduation_year: '',
  years_of_experience: '', address: '', internal_notes: '',
}

const STEPS = [
  { id: 1, label: 'Identity',      icon: UserRound,     desc: 'Name, email, employee info' },
  { id: 2, label: 'Education',     icon: GraduationCap, desc: 'Qualifications & experience' },
  { id: 3, label: 'Notes',         icon: Briefcase,     desc: 'Address & internal notes' },
  { id: 4, label: 'Review',        icon: ShieldCheck,   desc: 'Confirm & create account' },
]

/* ─── tiny primitives ─── */
const Field = ({ label, required, error, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-secondary)' }}>
      {label}{required && <span className="ml-1 text-red-400">*</span>}
    </label>
    {children}
    {error
      ? <p className="text-xs font-medium" style={{ color: '#f87171' }}>{error}</p>
      : hint
        ? <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hint}</p>
        : null}
  </div>
)

const TextInput = ({ error, ...props }) => (
  <input
    {...props}
    className="w-full rounded-[14px] px-4 py-2.5 text-sm outline-none transition-all"
    style={{
      backgroundColor: 'var(--color-surface-raised)',
      border: `1px solid ${error ? '#f87171' : 'var(--color-border)'}`,
      color: 'var(--color-text-primary)',
    }}
    onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,.12)' }}
    onBlur={(e)  => { e.target.style.borderColor = error ? '#f87171' : 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
  />
)

const ReviewRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
    <span className="text-xs font-semibold uppercase tracking-[0.12em] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span className="text-sm text-right font-medium break-all" style={{ color: 'var(--color-text-primary)' }}>{value || <span style={{ color: 'var(--color-text-secondary)' }}>—</span>}</span>
  </div>
)

const CredRow = ({ icon: Icon, label, value, onCopy }) => (
  <div className="flex items-center justify-between gap-3 rounded-[18px] p-4" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: '#0c4a6e', color: '#bae6fd' }}>
        <Icon size={15} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '—'}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => onCopy(value)}
      className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0ea5e9'; e.currentTarget.style.color = '#0ea5e9' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
    >
      <Copy size={11} /> Copy
    </button>
  </div>
)

/* ════════════════════════════════════════════════════════════
   Teacher List Panel
════════════════════════════════════════════════════════════ */
const TeacherListPanel = ({ navigate, toastError }) => {
  const [teachers, setTeachers]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await userApi.getUsers({ role: 'teacher', search: search.trim(), page: 1, perPage: 50 })
        setTeachers(res?.data?.users || [])
      } catch (err) {
        toastError(err.message || 'Failed to load teachers')
        setTeachers([])
      } finally { setLoading(false) }
    }
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, toastError])

  return (
    <div className="space-y-4">
      {/* search */}
      <div
        className="flex items-center gap-3 rounded-[18px] px-4 py-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Search size={15} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or employee ID…"
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-[22px]" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        {loading ? (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-8 w-8 animate-pulse rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                  <div className="h-2.5 w-28 animate-pulse rounded-lg" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : !teachers.length ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <Users size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? 'No teachers match your search' : 'No teachers yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
                  {['Teacher', 'Employee ID', 'Department', 'Designation', 'Joined', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => (
                  <tr
                    key={t.source_id || t.id}
                    onClick={() => navigate(ROUTES.TEACHER_DETAIL.replace(':id', String(t.source_id || t.id)))}
                    className="group cursor-pointer transition-colors"
                    style={{ borderBottom: idx < teachers.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {/* avatar */}
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                          style={{ backgroundColor: `hsl(${((t.name || '').charCodeAt(0) * 37) % 360} 60% 88%)`, color: `hsl(${((t.name || '').charCodeAt(0) * 37) % 360} 60% 28%)` }}
                        >
                          {(t.name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.employee_id || '—'}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.department || '—'}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.designation || '—'}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.joining_date ? formatDate(t.joining_date) : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: t.is_active ? '#dcfce7' : 'var(--color-surface-raised)', color: t.is_active ? '#166534' : 'var(--color-text-secondary)' }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.is_active ? '#16a34a' : '#9ca3af' }} />
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Wizard sidebar stepper
════════════════════════════════════════════════════════════ */
const StepSidebar = ({ current }) => (
  <div className="hidden lg:flex lg:flex-col lg:gap-1 lg:w-52 lg:shrink-0">
    {STEPS.map((s) => {
      const done    = current > s.id
      const active  = current === s.id
      const Icon    = s.icon
      return (
        <div
          key={s.id}
          className="flex items-center gap-3 rounded-[18px] px-4 py-3 transition-all"
          style={{ backgroundColor: active ? 'var(--color-surface)' : 'transparent', border: active ? '1px solid var(--color-border)' : '1px solid transparent' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
            style={{
              backgroundColor: done ? '#16a34a' : active ? '#0369a1' : 'var(--color-surface-raised)',
              color: done || active ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {done ? <Check size={13} /> : <Icon size={13} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold" style={{ color: active ? 'var(--color-text-primary)' : done ? '#16a34a' : 'var(--color-text-secondary)' }}>{s.label}</p>
            <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{s.desc}</p>
          </div>
        </div>
      )
    })}
    {/* vertical progress bar */}
    <div className="mt-4 mx-8 h-1 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%`, backgroundColor: '#0369a1' }} />
    </div>
    <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>
      Step {current} of {STEPS.length}
    </p>
  </div>
)

/* ════════════════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════════════════ */
const CreateTeacherPage = () => {
  usePageTitle('Teacher')
  const navigate = useNavigate()
  const { toastSuccess, toastError, toastInfo } = useToast()

  const [isSaving, setIsSaving]         = useState(false)
  const [createdTeacher, setCreated]    = useState(null)
  const [showForm, setShowForm]         = useState(false)
  const [step, setStep]                 = useState(1)

  const defaultPermissions = useMemo(() => getDefaultPermissionsForRole('teacher'), [])

  const { register, handleSubmit, watch, reset, getValues, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues,
  })

  const emailVal = watch('email')
  const nameVal  = watch('name')

  const handleCopy = async (value) => {
    if (!value) return
    try { await navigator.clipboard.writeText(value); toastInfo('Copied') }
    catch  { toastError('Unable to copy') }
  }

  const openForm = () => { reset(defaultValues); setStep(1); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setStep(1); reset(defaultValues) }

  const next = async () => {
    if (step === 1) { const ok = await trigger(['name','email']); if (!ok) return }
    setStep((p) => Math.min(4, p + 1))
  }
  const back = () => { if (step === 1) { closeForm(); return } setStep((p) => p - 1) }

  const onSubmit = async (values) => {
    setIsSaving(true)
    try {
      const res = await userApi.createUser({
        ...values,
        graduation_year:     values.graduation_year     ? Number(values.graduation_year)     : null,
        years_of_experience: values.years_of_experience ? Number(values.years_of_experience) : null,
        role: 'teacher',
        auto_password: true,
        force_password_change: true,
        permission_names: defaultPermissions,
      })
      const d = res?.data || {}
      setCreated({
        name:               d.user?.name              || values.name,
        email:              d.user?.email             || values.email,
        login_id:           d.user?.email             || values.email,
        generated_password: d.generated_password      || '',
      })
      toastSuccess('Teacher created.')
      setStep(1); reset(defaultValues)
    } catch (err) { toastError(err.message || 'Failed to create teacher') }
    finally { setIsSaving(false) }
  }

  const rv = getValues()

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-5 pb-20">

        {/* ── page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Teachers</h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage teacher accounts and profiles</p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={openForm}
              className="inline-flex items-center gap-2 rounded-[18px] px-4 py-2.5 text-sm font-semibold transition-all"
              style={{ backgroundColor: '#0369a1', color: '#fff', border: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0284c7' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0369a1' }}
            >
              <Plus size={15} /> Admit Teacher
            </button>
          )}
        </div>

        {showForm ? (
          /* ── WIZARD ── */
          <div className="flex gap-6 items-start">
            <StepSidebar current={step} />

            <div className="flex-1 min-w-0 space-y-4">
              {/* mobile step indicator */}
              <div className="flex items-center gap-3 lg:hidden">
                <button type="button" onClick={back} className="rounded-xl p-2" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <ArrowLeft size={16} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
                <div className="flex-1 overflow-hidden rounded-full h-1.5" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%`, backgroundColor: '#0369a1' }} />
                </div>
                <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-secondary)' }}>{step}/4</span>
              </div>

              {/* step heading */}
              <div className="rounded-[22px] px-6 py-5" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3 mb-5">
                  {(() => { const Icon = STEPS[step - 1].icon; return <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: '#0c4a6e', color: '#bae6fd' }}><Icon size={16} /></div> })()}
                  <div>
                    <p className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{STEPS[step - 1].label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{STEPS[step - 1].desc}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* ── step 1: identity ── */}
                  {step === 1 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full Name" required error={errors.name?.message}>
                        <TextInput {...register('name')} autoFocus placeholder="Ananya Sharma" error={!!errors.name} />
                      </Field>
                      <Field label="Email Address" required error={errors.email?.message} hint="Used as login ID">
                        <TextInput {...register('email')} type="email" placeholder="ananya@school.edu.in" error={!!errors.email} />
                      </Field>
                      <Field label="Phone">
                        <TextInput {...register('phone')} placeholder="+91 9876543210" />
                      </Field>
                      <Field label="Employee ID">
                        <TextInput {...register('employee_id')} placeholder="TCH-014" />
                      </Field>
                      <Field label="Department">
                        <TextInput {...register('department')} placeholder="Science" />
                      </Field>
                      <Field label="Designation">
                        <TextInput {...register('designation')} placeholder="Class Teacher" />
                      </Field>
                      <Field label="Joining Date" hint="Optional">
                        <TextInput {...register('joining_date')} type="date" />
                      </Field>
                    </div>
                  )}

                  {/* ── step 2: education ── */}
                  {step === 2 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Highest Qualification">
                        <TextInput {...register('highest_qualification')} placeholder="M.Ed, M.Sc, B.Ed" />
                      </Field>
                      <Field label="Specialization">
                        <TextInput {...register('specialization')} placeholder="Mathematics Education" />
                      </Field>
                      <Field label="University / Institution">
                        <TextInput {...register('university_name')} placeholder="Delhi University" />
                      </Field>
                      <Field label="Graduation Year">
                        <TextInput {...register('graduation_year')} type="number" min="1960" max="2100" placeholder="2020" />
                      </Field>
                      <Field label="Years of Experience">
                        <TextInput {...register('years_of_experience')} type="number" min="0" step="0.5" placeholder="5" />
                      </Field>
                    </div>
                  )}

                  {/* ── step 3: notes ── */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <Field label="Address">
                        <textarea
                          {...register('address')}
                          rows={3}
                          placeholder="Residential address"
                          className="w-full resize-none rounded-[14px] px-4 py-2.5 text-sm outline-none transition-all"
                          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                          onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,.12)' }}
                          onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                        />
                      </Field>
                      <Field label="Internal Notes" hint="Visible to admins only">
                        <textarea
                          {...register('internal_notes')}
                          rows={4}
                          placeholder="Optional admin-only notes"
                          className="w-full resize-none rounded-[14px] px-4 py-2.5 text-sm outline-none transition-all"
                          style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                          onFocus={(e) => { e.target.style.borderColor = '#0ea5e9'; e.target.style.boxShadow = '0 0 0 3px rgba(14,165,233,.12)' }}
                          onBlur={(e)  => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                        />
                      </Field>
                    </div>
                  )}

                  {/* ── step 4: review ── */}
                  {step === 4 && (
                    <div className="space-y-5">
                      {/* summary grid */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          { label: 'Name',        value: rv.name },
                          { label: 'Email',        value: rv.email },
                          { label: 'Employee ID',  value: rv.employee_id },
                          { label: 'Department',   value: rv.department },
                          { label: 'Designation',  value: rv.designation },
                          { label: 'Joining Date', value: rv.joining_date },
                          { label: 'Qualification',value: rv.highest_qualification },
                          { label: 'Experience',   value: rv.years_of_experience ? `${rv.years_of_experience} yrs` : null },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-[14px] px-4 py-3" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                            <p className="mt-1 text-sm font-medium truncate" style={{ color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                              {value || '—'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* access notice */}
                      <div className="rounded-[18px] p-4 space-y-2" style={{ backgroundColor: '#0c4a6e18', border: '1px solid #0369a140' }}>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} style={{ color: '#0369a1' }} />
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0369a1' }}>Access Setup</p>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          <strong>{defaultPermissions.length} permissions</strong> will be assigned automatically based on the Teacher role.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          A temporary password will be generated. The teacher must change it on first login.
                        </p>
                        <p className="text-xs font-semibold" style={{ color: '#0369a1' }}>
                          Login ID: {emailVal?.trim().toLowerCase() || '—'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── nav buttons ── */}
                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={back}
                      className="inline-flex items-center gap-2 rounded-[16px] px-4 py-2.5 text-sm font-semibold transition-all"
                      style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                    >
                      <ArrowLeft size={14} />
                      {step === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {step < 4 ? (
                      <button
                        type="button"
                        onClick={next}
                        className="inline-flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-semibold transition-all"
                        style={{ backgroundColor: '#0369a1', color: '#fff', border: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0284c7' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0369a1' }}
                      >
                        Next <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none' }}
                        onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#15803d' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a' }}
                      >
                        {isSaving ? (
                          <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
                        ) : (
                          <><BadgeCheck size={15} /> Create Teacher</>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* ── LIST ── */
          <TeacherListPanel navigate={navigate} toastError={toastError} />
        )}
      </div>

      {/* ── success modal ── */}
      <Modal
        open={!!createdTeacher}
        onClose={() => setCreated(null)}
        title="Teacher Created"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreated(null)}>Add Another</Button>
            <Button onClick={() => { setCreated(null); closeForm() }}>Back to List</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="rounded-[18px] p-4" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>
              Account ready for <strong>{createdTeacher?.name}</strong>. Share the credentials below.
            </p>
            <p className="mt-1 text-xs" style={{ color: '#166534' }}>Password must be changed on first login.</p>
          </div>
          <CredRow icon={UserRound} label="Teacher"            value={createdTeacher?.name}               onCopy={handleCopy} />
          <CredRow icon={Mail}      label="Login Email"        value={createdTeacher?.login_id}            onCopy={handleCopy} />
          <CredRow icon={KeyRound}  label="Temporary Password" value={createdTeacher?.generated_password}  onCopy={handleCopy} />
        </div>
      </Modal>
    </>
  )
}

export default CreateTeacherPage