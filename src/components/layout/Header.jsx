// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Sun, Moon, Bell, LogOut,
  ChevronDown, User, Settings, X,
} from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuthStore from '@/store/authStore'
import useSessionStore from '@/store/sessionStore'
import useToast from '@/hooks/useToast'
import { ROUTES, ROLES } from '@/constants/app'
import { cn, getInitials } from '@/utils/helpers'
import * as adminTeacherControlApi from '@/api/adminTeacherControlApi'
import * as teacherApi from '@/api/teacherApi'
import * as studentApi from '@/api/studentApi'
import Breadcrumb from './Breadcrumb'

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme }   = useUiStore()
  const { user, logout }         = useAuthStore()
  const { currentSession }       = useSessionStore()
  const { toastSuccess }         = useToast()
  const navigate                 = useNavigate()

  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const [notifOpen,     setNotifOpen]     = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading,  setNotifLoading]  = useState(false)

  const userMenuRef = useRef(null)
  const notifRef    = useRef(null)

  const isDark         = theme === 'dark'
  const initials       = getInitials(user?.name)
  const isAdminUser    = user?.role === ROLES.ADMIN
  const isTeacherUser  = user?.role === ROLES.TEACHER
  const isStudentUser  = user?.role === ROLES.STUDENT
  const unreadCount    = notifications.reduce((sum, item) => sum + Number(item.count || 0), 0)

  const profileRoute    = user?.role === 'teacher' ? ROUTES.TEACHER_PROFILE : ROUTES.SETTINGS
  const secondaryRoute  = ROUTES.SETTINGS
  const secondaryLabel  = 'Settings'

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Notification polling ── */
  useEffect(() => {
    if (!isAdminUser && !isStudentUser && !isTeacherUser) {
      setNotifications([])
      setNotifLoading(false)
      return undefined
    }

    let active = true
    const loadNotifications = async () => {
      setNotifLoading(true)
      try {
        if (!active) return

        if (isAdminUser) {
          const res    = await adminTeacherControlApi.getTeacherControlOverview()
          if (!active) return
          const counts = res?.data?.counts || {}
          const nextItems = [
            {
              id          : 'pending_leaves',
              title       : 'Teacher leave applications',
              description : 'New leave requests are waiting in Workflow Controls.',
              count       : Number(counts.pending_leaves || 0),
              route       : ROUTES.ADMIN_TEACHER_CONTROL,
            },
            {
              id          : 'pending_corrections',
              title       : 'Profile correction requests',
              description : 'Teacher profile updates are waiting for admin review.',
              count       : Number(counts.pending_corrections || 0),
              route       : ROUTES.ADMIN_TEACHER_CONTROL,
            },
          ].filter(item => item.count > 0)
          setNotifications(nextItems)
          return
        }

        if (isTeacherUser) {
          const res      = await teacherApi.getTeacherHomework()
          if (!active) return
          const homework = Array.isArray(res?.data?.homework) ? res.data.homework : []
          const nextItems = homework
            .filter(item => Number(item?.pending_count || 0) > 0 || item?.workflow_status === 'overdue')
            .sort((a, b) => new Date(b.created_at || b.due_date || 0) - new Date(a.created_at || a.due_date || 0))
            .slice(0, 5)
            .map(item => ({
              id          : `teacher-homework-${item.id}`,
              title       : item.title || 'Homework update',
              description : buildTeacherHomeworkDescription(item),
              count       : Math.max(Number(item.pending_count || 0), item?.workflow_status === 'overdue' ? 1 : 0),
              route       : ROUTES.TEACHER_HOMEWORK,
            }))
          setNotifications(nextItems)
          return
        }

        const res      = await studentApi.getStudentHomework()
        if (!active) return
        const homework = Array.isArray(res?.data?.homework) ? res.data.homework : []
        const nextItems = homework
          .filter(item => item?.submission_status !== 'submitted')
          .sort((a, b) => new Date(b.created_at || b.due_date || 0) - new Date(a.created_at || a.due_date || 0))
          .slice(0, 5)
          .map(item => ({
            id          : `student-homework-${item.id}`,
            title       : item.title || 'New homework',
            description : buildStudentHomeworkDescription(item),
            count       : 1,
            route       : ROUTES.STUDENT_HOMEWORK,
          }))
        setNotifications(nextItems)
      } catch {
        if (active) setNotifications([])
      } finally {
        if (active) setNotifLoading(false)
      }
    }

    loadNotifications()
    const timer = window.setInterval(loadNotifications, 30_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [isAdminUser, isStudentUser, isTeacherUser])

  const handleNotificationClick = (route) => { setNotifOpen(false); navigate(route) }
  const handleLogout = () => { logout(); toastSuccess('Signed out successfully'); navigate(ROUTES.LOGIN) }

  return (
    <header
      className="flex h-full w-full items-center"
      style={{
        backgroundColor : 'var(--color-surface)',
        borderBottom    : '1px solid var(--color-border)',
      }}
    >
      <div className="flex h-full w-full items-center gap-3 px-3 sm:px-5">

        {/* ── Hamburger (mobile) ── */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl shrink-0 transition-all duration-150"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>

        {/* ── Breadcrumb ── */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <Breadcrumb />
        </div>

        {/* ── Right actions ── */}
        <div className="flex shrink-0 items-center gap-1">

          {/* Session badge */}
          {currentSession && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                backgroundColor : 'var(--color-surface-raised)',
                color           : 'var(--color-text-secondary)',
                border          : '1px solid var(--color-border)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
              {currentSession.name}
            </div>
          )}

          {/* Theme toggle */}
          <IconBtn onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} aria-label="Toggle theme">
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </IconBtn>

          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
              aria-label="Notifications"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 min-w-[17px] rounded-full px-1 text-[9px] font-bold leading-[17px] text-center"
                  style={{
                    backgroundColor : '#ef4444',
                    color           : '#fff',
                    border          : '2px solid var(--color-surface)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <Dropdown className="right-0 w-[calc(100vw-2rem)] sm:w-80">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Notifications
                  </p>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <X size={13} />
                  </button>
                </div>

                {notifLoading ? (
                  <div className="p-8 text-center">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-t-transparent mx-auto animate-spin"
                      style={{ borderColor: 'var(--color-border)', borderTopColor: 'transparent' }}
                    />
                    <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                      Loading…
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto p-2">
                    {notifications.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item.route)}
                        className="w-full rounded-xl px-3 py-3 text-left transition-all duration-150 group"
                        style={{ color: 'var(--color-text-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate leading-tight">{item.title}</p>
                            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                              {item.description}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 mt-0.5"
                            style={{ backgroundColor: '#fef3c7', color: '#b45309' }}
                          >
                            {item.count}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell
                      size={22}
                      className="mx-auto mb-2"
                      style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}
                    />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No new notifications
                    </p>
                  </div>
                )}
              </Dropdown>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 mx-0.5" style={{ backgroundColor: 'var(--color-border)' }} />

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all duration-150"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="User menu"
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {initials}
              </div>
              <span
                className="hidden sm:block text-sm font-medium max-w-[7rem] truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown
                size={13}
                className={cn('transition-transform duration-200', userMenuOpen && 'rotate-180')}
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <Dropdown className="right-0 w-56">
                {/* User info */}
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {user?.email}
                  </p>
                  <span
                    className="inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor : 'var(--color-surface-raised)',
                      color           : 'var(--color-brand)',
                    }}
                  >
                    {user?.role}
                  </span>
                </div>

                <div className="p-1.5">
                  <DropdownItem
                    icon={User}
                    label="My Profile"
                    onClick={() => { navigate(profileRoute); setUserMenuOpen(false) }}
                  />
                  <DropdownItem
                    icon={Settings}
                    label={secondaryLabel}
                    onClick={() => { navigate(secondaryRoute); setUserMenuOpen(false) }}
                  />
                </div>

                <div className="p-1.5" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <DropdownItem icon={LogOut} label="Sign out" onClick={handleLogout} danger />
                </div>
              </Dropdown>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─────────────────────────── helpers ────────────────────────────── */

function buildStudentHomeworkDescription(item) {
  const details = [item?.subject_name, item?.teacher_name].filter(Boolean)
  const dueDate = formatNotificationDate(item?.due_date)
  const status  = formatHomeworkStatus(item?.submission_status)
  if (dueDate) details.push(`Due ${dueDate}`)
  if (status)  details.push(status)
  return details.join(' · ') || 'A teacher assigned new homework.'
}

function buildTeacherHomeworkDescription(item) {
  const details      = [item?.subject_name, item?.class_name, item?.section_name].filter(Boolean)
  const pendingCount = Number(item?.pending_count || 0)
  if (pendingCount > 0)                   details.push(`${pendingCount} pending`)
  if (item?.workflow_status === 'overdue') details.push('Overdue')
  const dueDate = formatNotificationDate(item?.due_date)
  if (dueDate) details.push(`Due ${dueDate}`)
  return details.join(' · ') || 'A homework item needs attention.'
}

function formatHomeworkStatus(status) {
  if (status === 'due_today') return 'Due today'
  if (status === 'overdue')   return 'Overdue'
  if (status === 'pending')   return 'Pending'
  return ''
}

function formatNotificationDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ─────────────────────────── shared UI ──────────────────────────── */

const IconBtn = ({ children, onClick, title, ...props }) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150"
    style={{ color: 'var(--color-text-secondary)' }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)' }}
    {...props}
  >
    {children}
  </button>
)

const Dropdown = ({ children, className }) => (
  <div
    className={cn('absolute top-full mt-2 rounded-2xl shadow-xl z-50 overflow-hidden', className)}
    style={{
      backgroundColor : 'var(--color-surface)',
      border          : '1px solid var(--color-border)',
      boxShadow       : '0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)',
      animation       : 'dropdownIn 0.15s cubic-bezier(0.4,0,0.2,1)',
    }}
  >
    <style>{`
      @keyframes dropdownIn {
        from { opacity: 0; transform: translateY(-6px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0)  scale(1); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `}</style>
    {children}
  </div>
)

const DropdownItem = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left"
    style={{ color: danger ? '#ef4444' : 'var(--color-text-secondary)' }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : 'var(--color-surface-raised)'
      e.currentTarget.style.color           = danger ? '#dc2626' : 'var(--color-text-primary)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color           = danger ? '#ef4444' : 'var(--color-text-secondary)'
    }}
  >
    <Icon size={14} />
    {label}
  </button>
)

export default Header
