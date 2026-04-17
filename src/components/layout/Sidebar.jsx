// src/components/layout/Sidebar.jsx

import { NavLink, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { NAV_GROUPS } from '@/constants/navigation'
import { APP_NAME } from '@/constants/app'
import { cn } from '@/utils/helpers'

// ── Dynamic icon resolver ─────────────────────────────────────────────────
const Icon = ({ name, size = 18, ...props }) => {
  const LucideIcon = Icons[name]
  if (!LucideIcon) return null
  return <LucideIcon size={size} {...props} />
}

// ── Sidebar component ─────────────────────────────────────────────────────
const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, hasRole } = useAuth()
  const location = useLocation()

  const sidebarWidth = sidebarCollapsed ? '72px' : '256px'

  return (
    <aside
      style={{ width: sidebarWidth }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'flex flex-col',
        'transition-all duration-300 ease-in-out',
        'overflow-hidden',
      )}
      style={{
        width          : sidebarWidth,
        backgroundColor: 'var(--color-sidebar-bg)',
        borderRight    : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────────────────────── */}
      <div
        className="flex items-center h-16 px-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          <Icons.GraduationCap size={16} color="#fff" />
        </div>

        {/* Brand name — hidden when collapsed */}
        {!sidebarCollapsed && (
          <span
            className="ml-3 font-semibold text-sm tracking-wide truncate"
            style={{ color: '#f1f5f9' }}
          >
            {APP_NAME}
          </span>
        )}

        {/* Collapse toggle — pushed to right */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="ml-auto p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-sidebar-text)' }}
            title="Collapse sidebar"
          >
            <Icons.PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="mx-auto mt-2 p-2 rounded-md opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--color-sidebar-text)' }}
          title="Expand sidebar"
        >
          <Icons.PanelLeftOpen size={16} />
        </button>
      )}

      {/* ── Navigation groups ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_GROUPS.map((group) => {
          // Filter items by role
          const visibleItems = group.items.filter(
            (item) =>
              item.allowedRoles.length === 0 ||
              hasRole(...item.allowedRoles)
          )
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label}>
              {/* Group label — hidden when collapsed */}
              {!sidebarCollapsed && (
                <p
                  className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--color-sidebar-text)', opacity: 0.4 }}
                >
                  {group.label}
                </p>
              )}

              <ul className="space-y-0.5">
                {visibleItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5',
                          'text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'text-white'
                            : 'hover:text-white',
                          sidebarCollapsed && 'justify-center px-2',
                        )
                      }
                      style={({ isActive }) => ({
                        color          : isActive ? '#fff' : 'var(--color-sidebar-text)',
                        backgroundColor: isActive
                          ? 'var(--color-sidebar-active)'
                          : 'transparent',
                        ...(isActive ? {} : {
                          ':hover': { backgroundColor: 'var(--color-sidebar-hover)' }
                        }),
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className="shrink-0"
                            style={{
                              color: isActive
                                ? '#fff'
                                : 'var(--color-sidebar-text)',
                              opacity: isActive ? 1 : 0.7,
                            }}
                          >
                            <Icon name={item.icon} size={18} />
                          </span>
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* ── User info at bottom ───────────────────────────────────────── */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        {sidebarCollapsed ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
            title={user?.name}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
        ) : (
          <div className="flex items-center gap-3 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                {user?.name || 'User'}
              </p>
              <p className="text-xs capitalize truncate" style={{ color: 'var(--color-sidebar-text)', opacity: 0.5 }}>
                {user?.role || 'staff'}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
