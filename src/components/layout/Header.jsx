// src/components/layout/Header.jsx

import { useLocation, useNavigate } from 'react-router-dom'
import { Sun, Moon, LogOut, Bell } from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { NAV_GROUPS } from '@/constants/navigation'
import { cn } from '@/utils/helpers'

// ── Derive page title from current route ──────────────────────────────────
const getPageTitle = (pathname) => {
  const allItems = NAV_GROUPS.flatMap((g) => g.items)
  const match = allItems.find((item) => {
    // Exact or starts-with match
    return pathname === item.path || pathname.startsWith(item.path + '/')
  })
  return match?.label || 'Dashboard'
}

// ── Header component ──────────────────────────────────────────────────────
const Header = () => {
  const { theme, toggleTheme, sidebarCollapsed } = useUiStore()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle  = getPageTitle(location.pathname)
  const isDark     = theme === 'dark'
  const leftOffset = sidebarCollapsed ? '72px' : '256px'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center px-6 transition-all duration-300"
      style={{
        left           : leftOffset,
        height         : 'var(--header-height)',
        backgroundColor: 'var(--color-surface)',
        borderBottom   : '1px solid var(--color-border)',
      }}
    >
      {/* ── Page title ─────────────────────────────────────────────────── */}
      <div className="flex-1">
        <h1
          className="text-lg font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {pageTitle}
        </h1>
      </div>

      {/* ── Right actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Notification bell — placeholder for future */}
        <button
          className={cn(
            'relative p-2 rounded-lg transition-colors',
          )}
          style={{
            color          : 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
          }}
          title="Notifications"
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Bell size={18} />
          {/* Unread dot */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-danger)' }}
          />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Divider */}
        <div
          className="w-px h-6 mx-1"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {/* User name */}
        <span
          className="text-sm font-medium hidden sm:block"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {user?.name}
        </span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Logout"
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)'
            e.currentTarget.style.color = 'var(--color-danger)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--color-text-secondary)'
          }}
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Header
