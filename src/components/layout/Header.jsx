// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Sun, Moon, Bell, LogOut,
  ChevronDown, User, Settings, X
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
  const { theme, toggleTheme, sidebarCollapsed } = useUiStore()
  const { user, logout } = useAuthStore()
  const { currentSession }  = useSessionStore()
  const { toastSuccess } = useToast()
  const navigate            = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const userMenuRef = useRef(null)
  const notifRef    = useRef(null)

  const isDark     = theme === 'dark'
  const initials   = getInitials(user?.name)
  const profileRoute = user?.role === 'teacher'
    ? ROUTES.TEACHER_PROFILE
    : user?.role === ROLES.ACCOUNTANT
    ? ROUTES.ACCOUNTANT_PROFILE
    : ROUTES.SETTINGS
  const secondaryRoute = user?.role === ROLES.ACCOUNTANT ? ROUTES.FEES : ROUTES.SETTINGS
  const secondaryLabel = user?.role === ROLES.ACCOUNTANT ? 'Portal Home' : 'Settings'
  const isAdminUser = user?.role === ROLES.ADMIN
  const isTeacherUser = user?.role === ROLES.TEACHER
  const isStudentUser = user?.role === ROLES.STUDENT
  const unreadCount = notifications.reduce((sum, item) => sum + Number(item.count || 0), 0)

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
          const res = await adminTeacherControlApi.getTeacherControlOverview()
          if (!active) return

          const counts = res?.data?.counts || {}
          const nextItems = [
            {
              id: 'pending_leaves',
              title: 'Teacher leave applications',
              description: 'New leave requests are waiting in Workflow Controls.',
              count: Number(counts.pending_leaves || 0),
              route: ROUTES.ADMIN_TEACHER_CONTROL,
            },
            {
              id: 'pending_corrections',
              title: 'Profile correction requests',
              description: 'Teacher profile updates are waiting for admin review.',
              count: Number(counts.pending_corrections || 0),
              route: ROUTES.ADMIN_TEACHER_CONTROL,
            },
          ].filter((item) => item.count > 0)

          setNotifications(nextItems)
          return
        }

        if (isTeacherUser) {
          const res = await teacherApi.getTeacherHomework()
          if (!active) return

          const homework = Array.isArray(res?.data?.homework) ? res.data.homework : []
          const nextItems = homework
            .filter((item) => Number(item?.pending_count || 0) > 0 || item?.workflow_status === 'overdue')
            .sort((a, b) => new Date(b.created_at || b.due_date || 0) - new Date(a.created_at || a.due_date || 0))
            .slice(0, 5)
            .map((item) => ({
              id: `teacher-homework-${item.id}`,
              title: item.title || 'Homework update',
              description: buildTeacherHomeworkDescription(item),
              count: Math.max(Number(item.pending_count || 0), item?.workflow_status === 'overdue' ? 1 : 0),
              route: ROUTES.TEACHER_HOMEWORK,
            }))

          setNotifications(nextItems)
          return
        }

        const res = await studentApi.getStudentHomework()
        if (!active) return

        const homework = Array.isArray(res?.data?.homework) ? res.data.homework : []
        const nextItems = homework
          .filter((item) => item?.submission_status !== 'submitted')
          .sort((a, b) => new Date(b.created_at || b.due_date || 0) - new Date(a.created_at || a.due_date || 0))
          .slice(0, 5)
          .map((item) => ({
            id: `student-homework-${item.id}`,
            title: item.title || 'New homework',
            description: buildStudentHomeworkDescription(item),
            count: 1,
            route: ROUTES.STUDENT_HOMEWORK,
          }))

        setNotifications(nextItems)
      } catch {
        if (active) setNotifications([])
      } finally {
        if (active) setNotifLoading(false)
      }
    }

    loadNotifications()
    const timer = window.setInterval(loadNotifications, 30000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [isAdminUser, isStudentUser, isTeacherUser])

  const handleNotificationClick = (route) => {
    setNotifOpen(false)
    navigate(route)
  }

  const handleLogout = () => {
    logout()
    toastSuccess('Signed out successfully')
    navigate(ROUTES.LOGIN)
  }

  return (
    <header
      className="flex h-full min-w-0 flex-col transition-all duration-300"
      style={{
        backgroundColor : 'var(--color-surface)',
        borderBottom    : '1px solid var(--color-border)',
      }}
    >
      {/* ── Main header row ──────────────────────────────────────────── */}
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6">

        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <div className="min-w-0 flex-1 overflow-hidden pr-2 sm:pr-4">
          <Breadcrumb />
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1">

          {/* Current session badge */}
          {currentSession && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                backgroundColor : 'var(--color-surface-raised)',
                color           : 'var(--color-text-secondary)',
                border          : '1px solid var(--color-border)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              {currentSession.name}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notification bell */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 min-w-[18px] rounded-full px-1 text-[10px] font-bold leading-[18px] text-center"
                  style={{
                    backgroundColor : '#ef4444',
                    color           : '#fff',
                    border          : '2px solid var(--color-surface)',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{
                  backgroundColor : 'var(--color-surface)',
                  border          : '1px solid var(--color-border)',
                  boxShadow       : '0 20px 40px rgba(0,0,0,0.15)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Notifications
                  </p>
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg hover:opacity-70"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                {notifLoading ? (
                  <div className="p-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Loading notifications...
                    </p>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item.route)}
                        className="w-full rounded-2xl px-3 py-3 text-left transition-colors"
                        style={{ color: 'var(--color-text-primary)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {item.description}
                            </p>
                          </div>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-bold"
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
                    <Bell size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      No new notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            className="w-px h-6 mx-1"
            style={{ backgroundColor: 'var(--color-border)' }}
          />

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={cn(
                'flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-colors',
              )}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="User menu"
            >
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                {initials}
              </div>
              {/* Name */}
              <span
                className="hidden sm:block text-sm font-medium max-w-28 truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown
                size={14}
                className={cn('transition-transform duration-200', userMenuOpen && 'rotate-180')}
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{
                  backgroundColor : 'var(--color-surface)',
                  border          : '1px solid var(--color-border)',
                  boxShadow       : '0 20px 40px rgba(0,0,0,0.15)',
                }}
              >
                {/* User info */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {user?.name}
                  </p>
                  <p className="text-xs truncate capitalize" style={{ color: 'var(--color-text-muted)' }}>
                    {user?.email}
                  </p>
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      backgroundColor : 'var(--color-surface-raised)',
                      color           : 'var(--color-brand)',
                    }}
                  >
                    {user?.role}
                  </span>
                </div>

                {/* Menu items */}
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
                  <DropdownItem
                    icon={LogOut}
                    label="Sign out"
                    onClick={handleLogout}
                    danger
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function buildStudentHomeworkDescription(item) {
  const details = [item?.subject_name, item?.teacher_name].filter(Boolean)
  const dueDate = formatNotificationDate(item?.due_date)
  const status = formatHomeworkStatus(item?.submission_status)

  if (dueDate) details.push(`Due ${dueDate}`)
  if (status) details.push(status)

  return details.join(' - ') || 'A teacher assigned new homework.'
}

function buildTeacherHomeworkDescription(item) {
  const details = [item?.subject_name, item?.class_name, item?.section_name].filter(Boolean)
  const pendingCount = Number(item?.pending_count || 0)

  if (pendingCount > 0) details.push(`${pendingCount} pending`)
  if (item?.workflow_status === 'overdue') details.push('Overdue')

  const dueDate = formatNotificationDate(item?.due_date)
  if (dueDate) details.push(`Due ${dueDate}`)

  return details.join(' - ') || 'A homework item needs attention.'
}

function formatHomeworkStatus(status) {
  if (status === 'due_today') return 'Due today'
  if (status === 'overdue') return 'Overdue'
  if (status === 'pending') return 'Pending'
  return ''
}

function formatNotificationDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const DropdownItem = ({ icon: Icon, label, onClick, danger }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left"
    style={{ color: danger ? '#ef4444' : 'var(--color-text-secondary)' }}
    onMouseEnter={e => {
      e.currentTarget.style.backgroundColor = danger ? '#fef2f2' : 'var(--color-surface-raised)'
      e.currentTarget.style.color = danger ? '#dc2626' : 'var(--color-text-primary)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = danger ? '#ef4444' : 'var(--color-text-secondary)'
    }}
  >
    <Icon size={15} />
    {label}
  </button>
)

export default Header
