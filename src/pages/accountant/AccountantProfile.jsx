import { useEffect, useState } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import * as accountantApi from '@/api/accountantApi'
import { formatCurrency, formatDate } from '@/utils/helpers'

const AccountantProfile = () => {
  usePageTitle('My Profile')
  const [profile, setProfile] = useState(null)
  const [activity, setActivity] = useState(null)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })

  useEffect(() => {
    accountantApi.getAccountantProfile().then((response) => setProfile(response.data)).catch(() => {})
    accountantApi.getAccountantActivity().then((response) => setActivity(response.data)).catch(() => {})
  }, [])

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{profile?.name || 'My Profile'}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {profile?.designation || '--'} • {profile?.department || '--'} • Joined {profile?.joining_date ? formatDate(profile.joining_date) : '--'}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>My Permissions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile?.permissions || []).map((permission) => (
              <span key={permission} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{permission}</span>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Activity Summary</h2>
          <div className="mt-4 space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <div>Today transactions: {activity?.today?.transactions || 0}</div>
            <div>Today amount: {formatCurrency(activity?.today?.amount || 0)}</div>
            <div>This month transactions: {activity?.month?.transactions || 0}</div>
            <div>This month amount: {formatCurrency(activity?.month?.amount || 0)}</div>
          </div>
        </div>
      </div>
      <div className="rounded-[28px] border p-5" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Change Password</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="password" value={passwords.current_password} onChange={(event) => setPasswords((current) => ({ ...current, current_password: event.target.value }))} placeholder="Current password" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
          <input type="password" value={passwords.new_password} onChange={(event) => setPasswords((current) => ({ ...current, new_password: event.target.value }))} placeholder="New password" className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
        </div>
        <button type="button" onClick={() => accountantApi.changeAccountantPassword(passwords).catch(() => {})} className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: 'var(--color-brand)' }}>
          Update Password
        </button>
      </div>
    </div>
  )
}

export default AccountantProfile
