import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  ArrowLeft, AlertCircle, Copy, KeyRound, Mail, ShieldCheck, UserRound,
} from 'lucide-react'
import * as api from '@/api/userManagementApi'
import { ROUTES } from '@/constants/app'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import PermissionSelector from '@/components/admin/PermissionSelector'
import { getDefaultPermissionsForRole } from '@/utils/permissions'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

const optionalEnum = (values) => z.preprocess(
  (value) => (value === '' || value == null ? undefined : value),
  z.enum(values).optional(),
)

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'accountant', 'student']),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joining_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: optionalEnum(['male', 'female', 'other']),
  address: z.string().optional(),
  auto_password: z.boolean().optional(),
  force_password_change: z.boolean().optional(),
  password: z.string().optional(),
  internal_notes: z.string().optional(),
})

const ROLES = ['admin', 'teacher', 'accountant', 'student']

const Field = ({ label, error, children, required, hint }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-xs" style={{ color: '#dc2626' }}>
        <AlertCircle size={11} />
        {error}
      </p>
    )}
    {hint && !error && <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
  </div>
)

const Section = ({ title, children }) => (
  <div className="p-5 rounded-2xl space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
    <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>{title}</h3>
    {children}
  </div>
)

const inputClassName = (error) => `w-full px-3 py-2.5 rounded-xl text-sm border outline-none transition-all bg-white text-gray-900 placeholder:opacity-40 ${error ? 'border-red-400' : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'}`

const CredentialRow = ({ icon: Icon, label, value, onCopy }) => (
  <div
    className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: '#ecfeff', color: '#0f766e' }}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="truncate text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '--'}</p>
      </div>
    </div>
    <Button variant="secondary" size="sm" onClick={() => onCopy(value)} icon={Copy}>
      Copy
    </Button>
  </div>
)

const buildDefaultValues = (role) => ({
  name: '',
  email: '',
  phone: '',
  role,
  employee_id: '',
  department: '',
  designation: '',
  joining_date: '',
  date_of_birth: '',
  gender: '',
  address: '',
  auto_password: true,
  force_password_change: true,
  password: '',
  internal_notes: '',
})

const CreateUserPage = () => {
  usePageTitle('Create User')

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toastSuccess, toastError, toastInfo } = useToast()
  const requestedRole = searchParams.get('role')
  const initialRole = ROLES.includes(requestedRole) ? requestedRole : 'admin'
  const [permissions, setPermissions] = useState(getDefaultPermissionsForRole(initialRole))
  const [isSaving, setIsSaving] = useState(false)
  const [createdAccount, setCreatedAccount] = useState(null)

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildDefaultValues(initialRole),
  })

  const role = watch('role')
  const autoPassword = watch('auto_password')
  const email = watch('email')
  const roleDefaults = useMemo(() => getDefaultPermissionsForRole(role), [role])

  const handleRoleChange = (nextRole) => {
    setValue('role', nextRole)
    setPermissions(getDefaultPermissionsForRole(nextRole))
  }

  const handleCopy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toastInfo('Copied to clipboard')
    } catch {
      toastError('Unable to copy to clipboard')
    }
  }

  const onSubmit = async (data) => {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        permission_names: permissions,
      }

      const result = await api.createUser(payload)
      const response = result.data || {}

      setCreatedAccount({
        name: response.user?.name || data.name,
        email: response.user?.email || data.email,
        login_id: response.user?.email || data.email,
        generated_password: response.generated_password || '',
        role,
      })

      toastSuccess('User created successfully')
      reset(buildDefaultValues(role))
      setPermissions(getDefaultPermissionsForRole(role))
    } catch (e) {
      toastError(e.message || 'Failed to create user')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={15} />
            {`${initialRole.charAt(0).toUpperCase()}${initialRole.slice(1)} Users`}
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Create New User
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Section title="Basic Information">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" error={errors.name?.message} required>
                <input {...register('name')} placeholder="Priya Sharma" className={inputClassName(!!errors.name)} autoFocus />
              </Field>
              <Field label="Email" error={errors.email?.message} required>
                <input {...register('email')} type="email" placeholder="priya@school.edu.in" className={inputClassName(!!errors.email)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <input {...register('phone')} placeholder="+91 9876543210" className={inputClassName(false)} />
              </Field>
              <Field label="Role" required>
                <select {...register('role')} className={inputClassName(!!errors.role)} onChange={e => handleRoleChange(e.target.value)}>
                  {ROLES.map(item => (
                    <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Account Settings">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Employee ID">
                <input {...register('employee_id')} placeholder="ADM-001" className={inputClassName(false)} />
              </Field>
              <Field label="Joining Date">
                <input {...register('joining_date')} type="date" className={inputClassName(false)} />
              </Field>
              <Field label="Department">
                <input {...register('department')} placeholder="Administration" className={inputClassName(false)} />
              </Field>
              <Field label="Designation">
                <input {...register('designation')} placeholder="Operations Manager" className={inputClassName(false)} />
              </Field>
            </div>

            <div className="mt-1 rounded-2xl p-4" style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Login Method</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Email + password
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Login ID Preview</p>
                  <p className="mt-1 text-sm font-semibold break-all" style={{ color: 'var(--color-text-primary)' }}>
                    {email || 'Will use email'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>Password</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {autoPassword ? 'Auto-generated after creation' : 'Set manually below'}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Password">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <input id="auto_pwd" type="checkbox" {...register('auto_password')} className="w-4 h-4 accent-indigo-600 cursor-pointer" />
              <label htmlFor="auto_pwd" className="text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                Auto-generate password and show it after creation
              </label>
            </div>
            {!autoPassword && (
              <Field label="Password" hint="Minimum 8 characters">
                <input {...register('password')} type="password" placeholder="********" className={inputClassName(false)} />
              </Field>
            )}
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
              <input id="force_pwd" type="checkbox" {...register('force_password_change')} defaultChecked className="w-4 h-4 accent-indigo-600 cursor-pointer" />
              <label htmlFor="force_pwd" className="text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                Force password change on first login
              </label>
            </div>
          </Section>

          <Section title={`Permissions (${permissions.length} selected)`}>
            <PermissionSelector selected={permissions} onChange={setPermissions} />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Default permissions for this role: {roleDefaults.length}
            </p>
          </Section>

          <Section title="Internal Notes">
            <textarea {...register('internal_notes')} rows={3} placeholder="Admin-only notes about this user..." className={`${inputClassName(false)} resize-none`} />
          </Section>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}
              disabled={isSaving}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border"
              style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {isSaving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        open={!!createdAccount}
        onClose={() => setCreatedAccount(null)}
        title="User Created Successfully"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreatedAccount(null)}>
              Create Another
            </Button>
            <Button onClick={() => navigate(initialRole ? `${ROUTES.USER_MANAGE}?role=${initialRole}` : ROUTES.USERS)}>
              Go to Users
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="rounded-[24px] p-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold" style={{ color: '#166534' }}>
              Share these credentials with {createdAccount?.name || 'the user'}.
            </p>
            <p className="mt-1 text-sm" style={{ color: '#166534' }}>
              The account is ready now and the first login will require a password change.
            </p>
          </div>

          <CredentialRow icon={UserRound} label="User" value={createdAccount?.name} onCopy={handleCopy} />
          <CredentialRow icon={Mail} label="Login Email" value={createdAccount?.email} onCopy={handleCopy} />
          <CredentialRow icon={KeyRound} label="Temporary Password" value={createdAccount?.generated_password} onCopy={handleCopy} />
          <CredentialRow icon={ShieldCheck} label="Login Method" value="Email" onCopy={handleCopy} />
        </div>
      </Modal>
    </>
  )
}

export default CreateUserPage
