import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  CircleX,
  CreditCard,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
  UserCircle2,
  Wallet,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useAccountant from '@/hooks/useAccountant'
import useAuthStore from '@/store/authStore'
import usePageTitle from '@/hooks/usePageTitle'
import usePermissions from '@/hooks/usePermissions'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatCurrency, formatDate, getInitials, titleCase } from '@/utils/helpers'
import { PERMISSION, PERMISSION_CATEGORIES } from '@/utils/permissions'

const PROFILE_PERMISSIONS = [
  PERMISSION.FEES_VIEW,
  PERMISSION.FEES_COLLECT,
  PERMISSION.FEES_EDIT,
  PERMISSION.FEES_WAIVE,
  PERMISSION.FEES_REPORT,
  PERMISSION.REPORTS_EXPORT,
  PERMISSION.FEES_REFUND,
  PERMISSION.STUDENTS_VIEW,
  PERMISSION.AUDIT_VIEW,
  PERMISSION.REPORTS_ATTENDANCE,
]

const PERMISSION_LABELS = PERMISSION_CATEGORIES
  .flatMap((category) => category.permissions)
  .reduce((acc, permission) => {
    acc[permission.name] = permission.label
    return acc
  }, {})

function roleLabel(role, permissions = []) {
  if (role === 'admin' || role === 'super_admin') return 'Administrator'
  const has = (permission) => permissions.includes(permission)
  if (has(PERMISSION.AUDIT_VIEW) && has(PERMISSION.STUDENTS_VIEW) && has(PERMISSION.REPORTS_ATTENDANCE)) {
    return 'Accounts Head'
  }
  if (
    has(PERMISSION.FEES_EDIT) &&
    has(PERMISSION.FEES_WAIVE) &&
    has(PERMISSION.FEES_REPORT) &&
    has(PERMISSION.REPORTS_EXPORT)
  ) {
    return 'Senior Accountant'
  }
  if (has(PERMISSION.FEES_VIEW) && has(PERMISSION.FEES_COLLECT)) {
    return 'Junior Accountant'
  }
  return 'Accountant'
}

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

function InfoTile({ icon: Icon, label, value, hint }) {
  return (
    <div
      className="rounded-[1.4rem] border p-4"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-3 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '—'}</div>
      {hint ? <div className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{hint}</div> : null}
    </div>
  )
}

function StatCard({ title, value, subtitle, accent = 'var(--color-brand)', icon: Icon }) {
  return (
    <div
      className="rounded-[1.6rem] border p-5"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{title}</div>
        {Icon ? (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: 'var(--color-surface-raised)', color: accent }}
          >
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-bold" style={{ color: accent }}>{value}</div>
      {subtitle ? <div className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</div> : null}
    </div>
  )
}

export default function AccountantProfile() {
  usePageTitle('My Profile')

  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const authUser = useAuthStore((state) => state.user)
  const { toastError, toastSuccess } = useToast()
  const { permissions, can } = usePermissions()
  const {
    accountantProfile,
    accountantProfileActivity,
    isLoading,
    isSaving,
    fetchProfile,
    fetchProfileActivity,
    changePassword,
  } = useAccountant()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const runProfileLoad = useEffectEvent(() => Promise.all([fetchProfile(), fetchProfileActivity()]))

  useEffect(() => {
    runProfileLoad().catch(() => {})
  }, [runProfileLoad])

  const profile = accountantProfile || authUser || {}
  const activity = accountantProfileActivity || {}
  const today = activity.today || {}
  const month = activity.month || {}
  const strength = useMemo(() => getStrength(newPassword), [newPassword])
  const derivedRole = roleLabel(profile.role || authUser?.role, profile.permissions || permissions || [])

  const permissionItems = useMemo(() => PROFILE_PERMISSIONS.map((permission) => ({
    key   : permission,
    label : PERMISSION_LABELS[permission] || titleCase(permission.replace('.', ' ')),
    value : can(permission),
  })), [can, permissions, profile.permissions])

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    if (newPassword.length < 8) {
      toastError('New password must be at least 8 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      toastError('New password and confirm password do not match.')
      return
    }

    const result = await changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    })

    if (!result?.success) return

    toastSuccess('Password changed successfully. Please log in again.')
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="space-y-6">
      <section
        className="overflow-hidden rounded-[2rem] border p-6 sm:p-7"
        style={{
          borderColor : 'rgba(221, 141, 31, 0.22)',
          background  : 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,88,12,0.12) 45%, var(--color-surface) 100%)',
        }}
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {profile.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt={profile.name || 'Accountant'}
                className="h-24 w-24 rounded-[1.75rem] object-cover ring-4"
                style={{ boxShadow: '0 0 0 4px rgba(255,255,255,0.65)' }}
              />
            ) : (
              <div
                className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] text-3xl font-bold"
                style={{ backgroundColor: 'rgba(255,255,255,0.7)', color: 'var(--color-brand)' }}
              >
                {getInitials(profile.name || authUser?.name || 'A')}
              </div>
            )}

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]" style={{ borderColor: 'rgba(221, 141, 31, 0.24)', color: 'var(--color-brand)' }}>
                <ShieldCheck size={14} />
                My Profile
              </div>
              <h1 className="mt-3 text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {profile.name || authUser?.name || 'Accountant'}
              </h1>
              <p className="mt-2 text-sm sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                {profile.designation || derivedRole} · {profile.department || 'Accounts Department'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
                  Role: {derivedRole}
                </span>
                <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: profile.is_active ? '#15803d' : '#b91c1c' }}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="rounded-full border px-3 py-1 text-sm font-semibold" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
                  {permissionItems.filter((item) => item.value).length} permissions enabled
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
            <InfoTile icon={Mail} label="Email" value={profile.email} />
            <InfoTile icon={Phone} label="Phone" value={profile.phone} />
            <InfoTile icon={IdCard} label="Employee ID" value={profile.employee_id} />
            <InfoTile
              icon={CalendarDays}
              label="Joining Date"
              value={formatDate(profile.joining_date)}
              hint={profile.last_login_at ? `Last login ${formatDate(profile.last_login_at, 'long')}` : null}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              title="My Activity Today"
              value={formatCurrency(today.amount_collected || 0)}
              subtitle={`${today.transactions || 0} transactions · ${today.receipts_generated || 0} receipts generated`}
              accent="#dd8d1f"
              icon={Wallet}
            />
            <StatCard
              title="Receipts & Concessions Today"
              value={`${today.receipts_generated || 0} / ${today.concessions_applied || 0}`}
              subtitle="Receipts generated / concessions applied"
              accent="#2563eb"
              icon={CreditCard}
            />
          </div>

          <div
            className="rounded-[1.7rem] border p-5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>My Activity This Month</h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  A quick counter summary for repeated day-to-day accounting work.
                </p>
              </div>
              <TrendingUp size={18} style={{ color: 'var(--color-brand)' }} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <StatCard
                title="Month Collection"
                value={formatCurrency(month.amount_collected || 0)}
                subtitle={`${month.transactions || 0} transactions this month`}
                accent="#ea580c"
              />
              <StatCard
                title="Average Daily Collection"
                value={formatCurrency(month.average_daily_amount || 0)}
                subtitle={`${month.active_days || 0} active collection day${Number(month.active_days || 0) === 1 ? '' : 's'}`}
                accent="#16a34a"
              />
              <StatCard
                title="Receipts This Month"
                value={month.receipts_generated || 0}
                subtitle={`${month.concessions_applied || 0} concessions applied`}
                accent="#7c3aed"
              />
              <StatCard
                title="Most Collected Day"
                value={month.most_collected_day ? formatCurrency(month.most_collected_day.amount_collected) : '—'}
                subtitle={month.most_collected_day ? `${formatDate(month.most_collected_day.date)} · ${month.most_collected_day.transactions} transactions` : 'No collection recorded yet'}
                accent="#0f766e"
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-[1.7rem] border p-5"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>My Permissions</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Contact admin to update accountant access. This page is informational only.
              </p>
            </div>
            <UserCircle2 size={18} style={{ color: 'var(--color-brand)' }} />
          </div>

          <div className="mt-5 grid gap-3">
            {permissionItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-[1.2rem] border px-4 py-3"
                style={{
                  borderColor     : item.value ? 'rgba(22, 163, 74, 0.24)' : 'var(--color-border)',
                  backgroundColor : item.value ? 'rgba(22, 163, 74, 0.08)' : 'var(--color-surface-raised)',
                }}
              >
                <div>
                  <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--color-text-muted)' }}>{item.key}</div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: item.value ? '#15803d' : 'var(--color-text-muted)' }}>
                  {item.value ? <BadgeCheck size={18} /> : <CircleX size={18} />}
                  {item.value ? 'Granted' : 'Not Granted'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="rounded-[1.8rem] border p-5 sm:p-6"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Change Password</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Use your current password, set a stronger new password, and you will be asked to log in again after saving.
            </p>
          </div>
          <KeyRound size={18} style={{ color: 'var(--color-brand)' }} />
        </div>

        <form className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.9fr]" onSubmit={handlePasswordSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <div className="hidden sm:block" />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              hint="Use at least 8 characters with uppercase, number, and special character."
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </div>

          <div
            className="rounded-[1.4rem] border p-4"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              Password Strength
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-surface)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
            </div>
            <div className="mt-3 text-sm font-semibold" style={{ color: strength.color }}>{strength.label}</div>
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              This update is logged in the audit trail for security.
            </div>
            <div className="mt-5">
              <Button type="submit" loading={isSaving} icon={KeyRound}>
                Save Password
              </Button>
            </div>
          </div>
        </form>
      </section>

      {isLoading ? (
        <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading profile details...
        </div>
      ) : null}
    </div>
  )
}
