import { CreditCard, Mail, Shield, UserRound, Wallet } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useSessionStore from '@/store/sessionStore'
import AccountantPageShell, { Surface } from './AccountantPageShell'

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{value || '—'}</p>
      </div>
    </div>
  </div>
)

const AccountantProfilePage = () => {
  const { user } = useAuthStore()
  const { currentSession } = useSessionStore()
  const permissions = Array.isArray(user?.permissions) ? user.permissions : []

  return (
    <AccountantPageShell
      title="My Profile"
      description="Signed-in accountant account details, live permission snapshot, and the current session context."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)' }}>
              {(user?.name || 'A').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{user?.name || 'Accountant'}</h2>
              <p className="mt-1 text-sm capitalize" style={{ color: 'var(--color-text-secondary)' }}>{user?.role || 'accountant'}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InfoCard icon={UserRound} label="User ID" value={user?.id} />
            <InfoCard icon={Mail} label="Email" value={user?.email} />
            <InfoCard icon={Wallet} label="Active Session" value={currentSession?.name || 'No current session'} />
            <InfoCard icon={CreditCard} label="Permission Count" value={permissions.length} />
          </div>
        </Surface>

        <Surface className="p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>Assigned Permissions</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>This reflects the permissions shipped in your auth payload.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {permissions.length > 0 ? permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74' }}
              >
                {permission}
              </span>
            )) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No explicit permissions attached to this account.</p>
            )}
          </div>
        </Surface>
      </div>
    </AccountantPageShell>
  )
}

export default AccountantProfilePage
