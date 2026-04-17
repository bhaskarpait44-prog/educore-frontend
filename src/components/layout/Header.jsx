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
import { ROUTES } from '@/constants/app'
import { cn, getInitials } from '@/utils/helpers'
import Breadcrumb from './Breadcrumb'

const Header = ({ onMenuClick }) => {
  const { theme, toggleTheme, sidebarCollapsed } = useUiStore()
  const { user, logout } = useAuthStore()
  const { currentSession }  = useSessionStore()
  const navigate            = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const userMenuRef = useRef(null)
  const notifRef    = useRef(null)

  const isDark     = theme === 'dark'
  const leftOffset = sidebarCollapsed ? '72px' : '256px'
  const initials   = getInitials(user?.name)

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

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 flex flex-col transition-all duration-300"
      style={{
        left            : `var(--header-left, 0px)`,
        height          : 'var(--header-height)',
        backgroundColor : 'var(--color-surface)',
        borderBottom    : '1px solid var(--color-border)',
        // Dynamic left offset via CSS var set on AppLayout
      }}
    >
      {/* ── Main header row ──────────────────────────────────────────── */}
      <div className="flex items-center h-full px-4 sm:px-6 gap-3">

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
        <div className="flex-1 min-w-0">
          <Breadcrumb />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">

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
              {/* Unread dot */}
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
                style={{
                  backgroundColor : '#ef4444',
                  borderColor     : 'var(--color-surface)',
                }}
              />
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
                <div className="p-8 text-center">
                  <Bell size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No new notifications
                  </p>
                </div>
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
                    onClick={() => { navigate(ROUTES.SETTINGS); setUserMenuOpen(false) }}
                  />
                  <DropdownItem
                    icon={Settings}
                    label="Settings"
                    onClick={() => { navigate(ROUTES.SETTINGS); setUserMenuOpen(false) }}
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