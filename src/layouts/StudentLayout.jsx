import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookMarked,
  BookOpenText,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  CreditCard,
  FileBarChart2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Receipt,
  ScrollText,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import useUiStore from '@/store/uiStore'
import * as studentApi from '@/api/studentApi'
import { ROUTES } from '@/constants/app'
import { cn, getInitials } from '@/utils/helpers'

const studentMenu = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.STUDENT_DASHBOARD },
      { label: 'My Attendance', icon: CalendarDays, path: ROUTES.STUDENT_ATTENDANCE },
      { label: 'My Timetable', icon: BookMarked, path: ROUTES.STUDENT_TIMETABLE },
      { label: 'Teacher Chat', icon: MessageSquare, path: ROUTES.STUDENT_CHAT },
      { label: 'Notice Board', icon: Bell, path: ROUTES.STUDENT_NOTICES },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'My Results', icon: ClipboardList, path: ROUTES.STUDENT_RESULTS },
      { label: 'Report Card', icon: FileBarChart2, path: ROUTES.STUDENT_REPORT_CARD },
      { label: 'Homework', icon: ScrollText, path: ROUTES.STUDENT_HOMEWORK },
      { label: 'My Submissions', icon: ShieldCheck, path: ROUTES.STUDENT_HOMEWORK_SUBMISSIONS },
      { label: 'Academic History', icon: GraduationCap, path: ROUTES.STUDENT_HISTORY },
      { label: 'Study Materials', icon: BookOpenText, path: ROUTES.STUDENT_MATERIALS },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'My Fees', icon: CreditCard, path: ROUTES.STUDENT_FEES },
      { label: 'Payment History', icon: Receipt, path: ROUTES.STUDENT_FEE_PAYMENTS },
    ],
  },
  {
    label: 'Profile',
    items: [
      { label: 'My Profile', icon: UserRound, path: ROUTES.STUDENT_PROFILE },
      { label: 'Request Correction', icon: ShieldCheck, path: ROUTES.STUDENT_PROFILE_CORRECTION },
      { label: 'Change Password', icon: ShieldCheck, path: ROUTES.STUDENT_PROFILE_PASSWORD },
    ],
  },
]

const mobileTabs = [
  { label: 'Home', icon: LayoutDashboard, path: ROUTES.STUDENT_DASHBOARD },
  { label: 'Attendance', icon: CalendarDays, path: ROUTES.STUDENT_ATTENDANCE },
  { label: 'Results', icon: ClipboardList, path: ROUTES.STUDENT_RESULTS },
  { label: 'Chat', icon: MessageSquare, path: ROUTES.STUDENT_CHAT },
  { label: 'Fees', icon: CreditCard, path: ROUTES.STUDENT_FEES },
  { label: 'More', icon: UserRound, path: ROUTES.STUDENT_PROFILE },
]

const studentThemeVars = {
  '--color-brand': '#6d28d9',
  '--color-brand-light': '#8b5cf6',
  '--color-brand-dark': '#5b21b6',
  '--color-bg': '#f5f3ff',
  '--color-surface': '#ffffff',
  '--color-surface-raised': '#f3efff',
  '--color-border': '#ddd6fe',
  '--color-text-primary': '#22163a',
  '--color-text-secondary': '#5b4b77',
  '--color-text-muted': '#8b7aa8',
  '--color-sidebar-bg': '#f7f4ff',
  '--color-sidebar-text': '#3f315b',
  '--color-sidebar-muted': '#7f6a9f',
  '--color-sidebar-active': '#6d28d9',
  '--color-sidebar-hover': '#efe7ff',
  '--color-sidebar-border': '#ddd6fe',
  '--color-sidebar-card': '#ffffff',
  '--student-accent': '#7c3aed',
  '--student-accent-soft': 'rgba(124, 58, 237, 0.14)',
  '--student-tab-bg': 'rgba(255,255,255,0.86)',
}

const StudentSurface = ({ children, className = '' }) => (
  <div
    className={cn('rounded-2xl border', className)}
    style={{
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      boxShadow: '0 18px 42px rgba(109,40,217,0.08)',
    }}
  >
    {children}
  </div>
)

const StudentLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useUiStore()
  const { user, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  const [unreadNotices, setUnreadNotices] = useState(0)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    let active = true

    const loadUnread = async () => {
      try {
        const res = await studentApi.getStudentNotices()
        if (!active) return
        setUnreadNotices(Number(res?.data?.unread_count || 0))
      } catch {}
    }

    loadUnread()
    window.addEventListener('focus', loadUnread)
    return () => {
      active = false
      window.removeEventListener('focus', loadUnread)
    }
  }, [location.pathname])

  const studentName = user?.name || 'Student'
  const activeTab = useMemo(
    () => mobileTabs.find((item) => location.pathname.startsWith(item.path))?.path || ROUTES.STUDENT_DASHBOARD,
    [location.pathname]
  )

  return (
    <div
      className="min-h-screen"
      style={studentThemeVars}
    >
      <div className="dark:[--color-bg:#140f24] dark:[--color-surface:#1b1530] dark:[--color-surface-raised:#241d40] dark:[--color-border:#382d63] dark:[--color-text-primary:#f5f3ff] dark:[--color-text-secondary:#c4b5fd] dark:[--color-text-muted:#8f7bc4] dark:[--color-sidebar-bg:#120d22] dark:[--color-sidebar-text:#e9ddff] dark:[--color-sidebar-muted:#aa98d9] dark:[--color-sidebar-hover:#241a40] dark:[--color-sidebar-border:#312652] dark:[--color-sidebar-card:#1a1430] dark:[--student-tab-bg:rgba(26,20,48,0.92)] min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] transition-colors duration-300">
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r xl:block"
          style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}
        >
          <div className="flex h-full flex-col px-4 py-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--student-accent)] text-sm font-semibold text-white shadow-lg shadow-violet-500/20 shrink-0">
                {getInitials(studentName)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{studentName}</p>
                <p className="truncate text-xs text-[var(--color-sidebar-muted)]">Student Portal</p>
              </div>
            </div>

            <StudentSurface className="mb-4 px-3 py-2.5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Session View</p>
              <p className="mt-1.5 text-sm font-semibold text-[var(--color-text-primary)]">Everything here is personal to your account only.</p>
            </StudentSurface>

            <nav className="flex-1 overflow-y-auto pr-1">
              {studentMenu.map((group) => (
                <div key={group.label} className="mb-5">
                  <p className="mb-2.5 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-sidebar-muted)]">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                              isActive && 'shadow-lg shadow-violet-500/10'
                            )
                          }
                          style={({ isActive }) => ({
                            backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                            color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                          })}
                        >
                          <Icon size={18} />
                          <span className="truncate">{item.label}</span>
                          {item.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                              {unreadNotices}
                            </span>
                          ) : null}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation menu"
            />
            <aside
              className="absolute inset-y-0 left-0 flex w-[85vw] sm:w-80 max-w-xs flex-col border-r px-3 sm:px-4 py-4 sm:py-5"
              style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}
            >
              <div className="mb-4 sm:mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-[var(--student-accent)] text-sm font-semibold text-white shrink-0">
                    {getInitials(studentName)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{studentName}</p>
                    <p className="text-xs text-[var(--color-sidebar-muted)]">Student Portal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl border shrink-0"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5 sm:space-y-6 overflow-y-auto pb-10">
                {studentMenu.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 sm:mb-3 px-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-sidebar-muted)]">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => 'flex items-center gap-2.5 sm:gap-3 rounded-2xl px-2.5 sm:px-3 py-2.5 sm:py-3 text-sm font-medium transition-all duration-200'}
                            style={({ isActive }) => ({
                              backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                              color: isActive ? '#fff' : 'var(--color-sidebar-text)',
                            })}
                          >
                            <Icon size={18} />
                            <span className="truncate">{item.label}</span>
                            {item.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                              <span className="ml-auto rounded-full bg-red-500 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shrink-0">
                                {unreadNotices}
                              </span>
                            ) : null}
                          </NavLink>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        <div className="xl:pl-72">
          <header className="sticky top-0 z-30 border-b bg-[color:var(--student-tab-bg)] backdrop-blur-xl" style={{ borderColor: 'var(--color-border)' }}>
            {isOffline && (
              <div className="border-b px-3 sm:px-4 py-2 text-center text-xs font-medium text-amber-900 dark:text-amber-100" style={{ backgroundColor: '#fde68a', borderColor: '#fcd34d' }}>
                You are offline. Showing last saved data.
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border xl:hidden shrink-0"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                aria-label="Open navigation"
              >
                <Menu size={18} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">Student Portal</p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">Personal, read-only school companion</p>
              </div>

              <button
                type="button"
                onClick={() => navigate(ROUTES.STUDENT_NOTICES)}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl border shrink-0"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                aria-label="Open notices"
              >
                <Bell size={18} />
                {unreadNotices > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-5 text-white">
                    {unreadNotices > 9 ? '9+' : unreadNotices}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border shrink-0"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                aria-label="Toggle dark mode"
              >
                <Moon size={18} />
              </button>

              <button
                type="button"
                onClick={logout}
                className="hidden sm:inline-flex rounded-2xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium shrink-0"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
              >
                Sign Out
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pb-8">
            <Outlet />
          </main>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-40 border-t px-1 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-1 xl:hidden" style={{ backgroundColor: 'var(--student-tab-bg)', borderColor: 'var(--color-border)', backdropFilter: 'blur(16px)' }}>
          <div className="grid grid-cols-5 gap-0.5">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.path
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className="flex min-h-[56px] sm:min-h-[62px] flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl px-0.5 py-1.5 text-[10px] sm:text-[11px] font-medium active-zone"
                  style={{
                    backgroundColor: isActive ? 'var(--student-accent-soft)' : 'transparent',
                    color: isActive ? 'var(--student-accent)' : 'var(--color-text-secondary)',
                  }}
                >
                  <Icon size={18} />
                  <span className="truncate w-full text-center">{tab.label}</span>
                  {tab.path === ROUTES.STUDENT_NOTICES && unreadNotices > 0 ? (
                    <span className="absolute right-1.5 top-1.5 min-w-4 h-4 rounded-full bg-red-500 px-0.5 text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center">
                      {unreadNotices}
                    </span>
                  ) : null}
                </NavLink>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

export default StudentLayout
