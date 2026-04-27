import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Moon, Sun, LogOut, CreditCard, LayoutDashboard, Receipt, AlertTriangle, UserCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import { ROUTES } from '@/constants/app'

function linkStyle({ isActive }) {
  return [
    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-amber-100 text-amber-900' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]',
  ].join(' ')
}

export default function AccountantLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore(useShallow((state) => ({
    user   : state.user,
    logout : state.logout,
  })))
  const { theme, toggleTheme } = useUiStore(useShallow((state) => ({
    theme       : state.theme,
    toggleTheme : state.toggleTheme,
  })))

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[260px_1fr]">
        <aside
          className="border-r p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
                Accountant
              </div>
              <div className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {user?.name || 'Finance Desk'}
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <NavLink to={ROUTES.ACCOUNTANT_DASHBOARD} className={linkStyle} end>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink to={ROUTES.ACCOUNTANT_COLLECTION} className={linkStyle}>
              <CreditCard size={18} />
              Fee Collection
            </NavLink>
            <NavLink to={ROUTES.ACCOUNTANT_RECEIPTS} className={linkStyle}>
              <Receipt size={18} />
              Receipts
            </NavLink>
            <NavLink to={ROUTES.ACCOUNTANT_DEFAULTERS} className={linkStyle}>
              <AlertTriangle size={18} />
              Defaulters
            </NavLink>
            <NavLink to={ROUTES.ACCOUNTANT_PROFILE} className={linkStyle}>
              <UserCircle2 size={18} />
              My Profile
            </NavLink>
          </nav>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              Theme
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
