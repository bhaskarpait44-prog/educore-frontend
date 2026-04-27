import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'

const ChangePassword = () => {
  usePageTitle('Change Password')

  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const { toastError, toastSuccess } = useToast()
  const { saving, submitPasswordChange } = useStudentProfile()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const strength = useMemo(() => getStrength(newPassword), [newPassword])

  useEffect(() => {
    if (localError) toastError(localError)
  }, [localError, toastError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')

    if (newPassword.length < 8) {
      setLocalError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setLocalError('New password and confirm password do not match.')
      return
    }

    try {
      await submitPasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toastSuccess('Password changed successfully. Please log in again.')
      logout()
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      toastError(err?.message || 'Unable to change password.')
    }
  }

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: 'linear-gradient(135deg, rgba(109,40,217,0.16), rgba(239,68,68,0.05) 52%, var(--color-surface) 100%)',
        }}
      >
        <h1 className="text-2xl font-bold sm:text-3xl text-[var(--color-text-primary)]">Change Password</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
          Use your current password, choose a stronger new one, and you will be redirected to login after the change is saved.
        </p>
      </section>

      <section
        className="rounded-[28px] border p-5"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField label="Current Password" value={currentPassword} onChange={setCurrentPassword} />
          <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
          <div className="rounded-[20px] border px-4 py-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">Strength Meter</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
            </div>
            <p className="mt-2 text-sm font-semibold" style={{ color: strength.color }}>{strength.label}</p>
          </div>
          <PasswordField label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} />

          <Button type="submit" loading={saving}>
            Save Password
          </Button>
        </form>
      </section>
    </div>
  )
}

const PasswordField = ({ label, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</span>
    <input
      type="password"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-12 w-full rounded-[20px] border px-4 py-3 text-sm"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      required
    />
  </label>
)

function getStrength(password) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Weak', percent: 25, color: '#dc2626' }
  if (score === 2) return { label: 'Fair', percent: 50, color: '#d97706' }
  if (score === 3) return { label: 'Good', percent: 75, color: '#2563eb' }
  return { label: 'Strong', percent: 100, color: '#16a34a' }
}

export default ChangePassword
