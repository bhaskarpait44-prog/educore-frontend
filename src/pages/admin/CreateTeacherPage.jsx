import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Check,
  Copy,
  GraduationCap,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import * as userApi from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { getDefaultPermissionsForRole } from '@/utils/permissions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/helpers'

const teacherSchema = z.object({
  name: z.string().trim().min(1, 'Teacher name is required'),
  email: z.string().trim().email('Valid email is required'),
  phone: z.string().trim().optional(),
  employee_id: z.string().trim().optional(),
  department: z.string().trim().optional(),
  designation: z.string().trim().optional(),
  joining_date: z.string().optional(),
  highest_qualification: z.string().trim().optional(),
  specialization: z.string().trim().optional(),
  university_name: z.string().trim().optional(),
  graduation_year: z.string().trim().optional(),
  years_of_experience: z.string().trim().optional(),
  address: z.string().trim().optional(),
  internal_notes: z.string().trim().optional(),
})

const defaultValues = {
  name: '',
  email: '',
  phone: '',
  employee_id: '',
  department: '',
  designation: '',
  joining_date: '',
  highest_qualification: '',
  specialization: '',
  university_name: '',
  graduation_year: '',
  years_of_experience: '',
  address: '',
  internal_notes: '',
}

const ADMIT_STEPS = [
  { id: 1, label: 'Identity', desc: 'Basic details' },
  { id: 2, label: 'Professional', desc: 'Education details' },
  { id: 3, label: 'Profile', desc: 'Address and notes' },
  { id: 4, label: 'Access', desc: 'Review and create' },
]

const panelStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
}

const inputClassName = (hasError = false) => `w-full rounded-2xl px-4 py-3 text-sm outline-none transition-all ${
  hasError ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-100'
}`

const CreatedCredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: '#ecfeff', color: '#0f766e' }}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {value || '--'}
        </p>
      </div>
    </div>
    <Button variant="secondary" size="sm" onClick={() => onCopy(value)} icon={Copy}>
      Copy
    </Button>
  </div>
)

const Field = ({
  label, required, error, hint, children,
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
      {label}
      {required ? <span className="ml-1 text-red-500">*</span> : null}
    </label>
    {children}
    {error ? (
      <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
    ) : hint ? (
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>
    ) : null}
  </div>
)

const TeacherListPanel = ({ navigate, toastError }) => {
  const [teachers, setTeachers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadTeachers = async () => {
      setIsLoading(true)
      try {
        const response = await userApi.getUsers({
          role: 'teacher',
          search: search.trim(),
          page: 1,
          perPage: 50,
        })
        setTeachers(response?.data?.users || [])
      } catch (error) {
        toastError(error.message || 'Failed to load teachers')
        setTeachers([])
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(loadTeachers, 300)
    return () => clearTimeout(timer)
  }, [search, toastError])

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teacher by name, email, employee ID..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {isLoading ? (
          <div className="animate-pulse divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="h-14" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Teacher', 'Employee ID', 'Department', 'Joined', 'Status'].map((header) => (
                    <th key={header} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr
                    key={teacher.source_id || teacher.id}
                    onClick={() => navigate(ROUTES.TEACHER_DETAIL.replace(':id', String(teacher.source_id || teacher.id)))}
                    style={{ borderBottom: index < teachers.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{teacher.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{teacher.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{teacher.employee_id || '--'}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{teacher.department || '--'}</td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {teacher.joining_date ? formatDate(teacher.joining_date) : '--'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${teacher.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${teacher.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {teacher.is_active ? 'Active' : 'Inactive'}
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

const CreateTeacherPage = () => {
  usePageTitle('Teacher')

  const navigate = useNavigate()
  const { toastSuccess, toastError, toastInfo } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [createdTeacher, setCreatedTeacher] = useState(null)
  const [showAdmitForm, setShowAdmitForm] = useState(false)
  const [admitStep, setAdmitStep] = useState(1)

  const defaultPermissions = useMemo(() => getDefaultPermissionsForRole('teacher'), [])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues,
  })

  const teacherEmail = watch('email')
  const teacherName = watch('name')
  const loginId = teacherEmail?.trim().toLowerCase() || ''

  const handleCopy = async (value) => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      toastInfo('Copied to clipboard')
    } catch {
      toastError('Unable to copy to clipboard')
    }
  }

  const openAdmitWizard = () => {
    reset(defaultValues)
    setAdmitStep(1)
    setShowAdmitForm(true)
  }

  const closeAdmitWizard = () => {
    setShowAdmitForm(false)
    setAdmitStep(1)
    reset(defaultValues)
  }

  const goNextStep = async () => {
    if (admitStep === 1) {
      const valid = await trigger(['name', 'email'])
      if (!valid) return
    }

    setAdmitStep((prev) => Math.min(4, prev + 1))
  }

  const goBackStep = () => {
    if (admitStep === 1) {
      closeAdmitWizard()
      return
    }

    setAdmitStep((prev) => prev - 1)
  }

  const onSubmit = async (values) => {
    setIsSaving(true)
    try {
      const response = await userApi.createUser({
        ...values,
        graduation_year: values.graduation_year ? Number(values.graduation_year) : null,
        years_of_experience: values.years_of_experience ? Number(values.years_of_experience) : null,
        role: 'teacher',
        auto_password: true,
        force_password_change: true,
        permission_names: defaultPermissions,
      })

      const data = response?.data || {}

      setCreatedTeacher({
        id: data.user?.id,
        name: data.user?.name || values.name,
        email: data.user?.email || values.email,
        login_id: data.user?.email || values.email,
        generated_password: data.generated_password || '',
      })

      toastSuccess('Teacher profile created successfully')
      setAdmitStep(1)
      reset(defaultValues)
    } catch (error) {
      toastError(error.message || 'Failed to create teacher')
    } finally {
      setIsSaving(false)
    }
  }

  const reviewValues = getValues()

  return (
    <>
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Teacher
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Manage teacher admissions and profiles
            </p>
          </div>
          {!showAdmitForm && (
            <Button icon={Plus} onClick={openAdmitWizard}>
              Admit New Teacher
            </Button>
          )}
        </div>

        {showAdmitForm ? (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={goBackStep}
                className="p-2 rounded-xl transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Admit New Teacher
                </h2>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Step {admitStep} of 4 - {ADMIT_STEPS[admitStep - 1]?.desc}
                </p>
              </div>
            </div>

            <div
              className="p-4 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center">
                {ADMIT_STEPS.map((step, i) => {
                  const isDone = admitStep > step.id
                  const isCurrent = admitStep === step.id

                  return (
                    <div key={step.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                          style={{
                            backgroundColor: isDone ? '#22c55e' : isCurrent ? 'var(--color-brand)' : 'var(--color-surface-raised)',
                            color: isDone || isCurrent ? '#fff' : 'var(--color-text-muted)',
                            border: isCurrent ? '2px solid var(--color-brand)' : '2px solid transparent',
                          }}
                        >
                          {isDone ? <Check size={14} /> : step.id}
                        </div>
                        <span
                          className="text-xs font-medium hidden sm:block"
                          style={{ color: isCurrent ? 'var(--color-brand)' : 'var(--color-text-muted)' }}
                        >
                          {step.label}
                        </span>
                      </div>

                      {i < ADMIT_STEPS.length - 1 && (
                        <div
                          className="flex-1 h-0.5 mx-2 transition-all duration-500"
                          style={{ backgroundColor: isDone ? '#22c55e' : 'var(--color-border)' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-2xl p-6 space-y-4" style={panelStyle}>
                {admitStep === 1 && (
                  <>
                    <div className="flex items-center gap-2">
                      <UserRound size={16} style={{ color: 'var(--color-brand)' }} />
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Identity Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full Name" required error={errors.name?.message}>
                        <input
                          {...register('name')}
                          autoFocus
                          placeholder="Ananya Sharma"
                          className={inputClassName(!!errors.name)}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Email Address" required error={errors.email?.message} hint="This email is also used as login ID.">
                        <input
                          {...register('email')}
                          type="email"
                          placeholder="ananya@school.edu.in"
                          className={inputClassName(!!errors.email)}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Phone Number">
                        <input
                          {...register('phone')}
                          placeholder="+91 9876543210"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Employee ID">
                        <input
                          {...register('employee_id')}
                          placeholder="TCH-014"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Department">
                        <input
                          {...register('department')}
                          placeholder="Science"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Designation">
                        <input
                          {...register('designation')}
                          placeholder="Class Teacher"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Joining Date">
                        <input
                          {...register('joining_date')}
                          type="date"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {admitStep === 2 && (
                  <>
                    <div className="flex items-center gap-2">
                      <GraduationCap size={16} style={{ color: 'var(--color-brand)' }} />
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Professional Details</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Highest Qualification">
                        <input
                          {...register('highest_qualification')}
                          placeholder="M.Ed, M.Sc, B.Ed"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Specialization">
                        <input
                          {...register('specialization')}
                          placeholder="Mathematics Education"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="University / Institution">
                        <input
                          {...register('university_name')}
                          placeholder="Delhi University"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Graduation Year">
                        <input
                          {...register('graduation_year')}
                          type="number"
                          min="1900"
                          max="2100"
                          placeholder="2020"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Experience (Years)">
                        <input
                          {...register('years_of_experience')}
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="5"
                          className={inputClassName()}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {admitStep === 3 && (
                  <>
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} style={{ color: 'var(--color-brand)' }} />
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Profile Notes</h3>
                    </div>
                    <div className="space-y-4">
                      <Field label="Address">
                        <textarea
                          {...register('address')}
                          rows={3}
                          placeholder="Residential address"
                          className={`${inputClassName()} resize-none`}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                      <Field label="Internal Notes">
                        <textarea
                          {...register('internal_notes')}
                          rows={4}
                          placeholder="Optional notes for admin use only"
                          className={`${inputClassName()} resize-none`}
                          style={{ backgroundColor: 'var(--color-bg)', borderWidth: 1, color: 'var(--color-text-primary)' }}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {admitStep === 4 && (
                  <>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} style={{ color: 'var(--color-brand)' }} />
                      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Access & Review</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Teacher Name</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{reviewValues.name || '--'}</p>
                      </div>
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Login Email</p>
                        <p className="mt-1 text-sm font-semibold break-all" style={{ color: 'var(--color-text-primary)' }}>{reviewValues.email || '--'}</p>
                      </div>
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Role</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Teacher</p>
                      </div>
                      <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Default Permissions</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{defaultPermissions.length} permissions assigned</p>
                      </div>
                    </div>

                    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: '#9a3412' }}>Password</p>
                      <p className="mt-1 text-sm font-semibold" style={{ color: '#7c2d12' }}>
                        Temporary password will be auto-generated after creating this teacher.
                      </p>
                    </div>

                    <div className="rounded-2xl p-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
                      <p className="text-sm font-semibold" style={{ color: '#166534' }}>
                        First login will require password change.
                      </p>
                      <p className="mt-1 text-sm" style={{ color: '#166534' }}>
                        Login ID is the teacher email: {loginId || '--'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button type="button" variant="secondary" onClick={goBackStep}>
                  {admitStep === 1 ? 'Back to Teacher List' : 'Back'}
                </Button>

                {admitStep < 4 ? (
                  <Button type="button" onClick={goNextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" loading={isSaving} icon={BadgeCheck}>
                    {isSaving ? 'Creating Teacher...' : 'Create Teacher'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <TeacherListPanel navigate={navigate} toastError={toastError} />
        )}
      </div>

      <Modal
        open={!!createdTeacher}
        onClose={() => setCreatedTeacher(null)}
        title="Teacher Created Successfully"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreatedTeacher(null)}>
              Create Another
            </Button>
            <Button
              onClick={() => {
                setCreatedTeacher(null)
                closeAdmitWizard()
              }}
            >
              Go to Teacher List
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="rounded-[24px] p-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>
              Share these credentials with {createdTeacher?.name || 'the teacher'}.
            </p>
            <p className="mt-1 text-sm" style={{ color: '#166534' }}>
              The account is ready now, and the first login will require a password change.
            </p>
          </div>

          <CreatedCredentialRow icon={UserRound} label="Teacher" value={createdTeacher?.name} onCopy={handleCopy} />
          <CreatedCredentialRow icon={Mail} label="Login Email" value={createdTeacher?.login_id} onCopy={handleCopy} />
          <CreatedCredentialRow icon={KeyRound} label="Temporary Password" value={createdTeacher?.generated_password} onCopy={handleCopy} />
        </div>
      </Modal>
    </>
  )
}

export default CreateTeacherPage
