// src/components/layout/Sidebar.jsx
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { APP_NAME, ROUTES, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'

// ── Navigation config ─────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: null,   // No label for top group
    items: [
      { label: 'Dashboard',       icon: 'LayoutDashboard', path: ROUTES.DASHBOARD,  roles: [] },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Students',        icon: 'Users',           path: ROUTES.STUDENTS,   roles: [ROLES.ADMIN, ROLES.TEACHER] },
      { label: 'Enrollment',      icon: 'BookOpen',        path: ROUTES.ENROLLMENTS,roles: [ROLES.ADMIN] },
      { label: 'Attendance',      icon: 'CalendarCheck',   path: ROUTES.ATTENDANCE, roles: [ROLES.ADMIN, ROLES.TEACHER] },
      { label: 'Exams & Results', icon: 'ClipboardList',   path: ROUTES.EXAMS,      roles: [ROLES.ADMIN, ROLES.TEACHER] },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Sessions',        icon: 'CalendarDays',    path: ROUTES.SESSIONS,   roles: [ROLES.ADMIN] },
      { label: 'Fees',            icon: 'IndianRupee',     path: ROUTES.FEES,       roles: [ROLES.ADMIN, ROLES.ACCOUNTANT] },
      { label: 'Audit Logs',      icon: 'ScrollText',      path: ROUTES.AUDIT,      roles: [ROLES.ADMIN] },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings',        icon: 'Settings',        path: ROUTES.SETTINGS,   roles: [ROLES.ADMIN] },
    ],
  },
]

// ── Dynamic icon ──────────────────────────────────────────────────────────
const NavIcon = ({ name, size = 18 }) => {
  const LucideIcon = Icons[name]
  return LucideIcon ? <LucideIcon size={size} /> : null
}

// ── Single nav item ───────────────────────────────────────────────────────
const NavItem = ({ item, collapsed }) => {
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      end={item.path === ROUTES.DASHBOARD}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
          'text-sm font-medium transition-all duration-150 select-none',
          collapsed && 'justify-center px-0 mx-auto w-10 h-10',
          isActive
            ? 'text-white shadow-sm'
            : 'hover:text-white'
        )
      }
      style={({ isActive }) => ({
        color           : isActive ? '#fff' : 'rgba(203,213,225,0.75)',
        backgroundColor : isActive ? 'var(--color-brand)'
                        : 'transparent',
      })}
      onMouseEnter={e => {
        if (!e.currentTarget.classList.contains('text-white')) {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'
        }
      }}
      onMouseLeave={e => {
        if (!e.currentTarget.classList.contains('text-white')) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {({ isActive }) => (
        <>
          <span
            className="shrink-0"
            style={{ opacity: isActive ? 1 : 0.75 }}
          >
            <NavIcon name={item.icon} size={18} />
          </span>

          {/* Label — slides in/out */}
          {!collapsed && (
            <span className="truncate leading-none">{item.label}</span>
          )}

          {/* Collapsed tooltip */}
          {collapsed && (
            <span
              className={cn(
                'absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                'whitespace-nowrap pointer-events-none',
                'opacity-0 group-hover:opacity-100 translate-x-0',
                'transition-opacity duration-150 z-50',
              )}
              style={{
                backgroundColor : '#1e293b',
                color           : '#f1f5f9',
                border          : '1px solid rgba(255,255,255,0.08)',
                boxShadow       : '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Main Sidebar ──────────────────────────────────────────────────────────
const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, hasRole } = useAuth()
  const overlayRef = useRef(null)

  // Close mobile sidebar on route change
  const location = useLocation()
  useEffect(() => {
    if (mobileOpen) onMobileClose?.()
  }, [location.pathname])

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onMobileClose?.()
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join('') || '?'

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          // Desktop: fixed, always visible
          'fixed top-0 left-0 h-screen z-50 flex flex-col',
          'transition-all duration-300 ease-in-out',
          // Desktop width
          'hidden lg:flex',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
        )}
        style={{
          backgroundColor : '#0f172a',
          borderRight     : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          toggleCollapsed={toggleSidebar}
          user={user}
          initials={initials}
          hasRole={hasRole}
          isMobile={false}
        />
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col w-64',
          'lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          backgroundColor : '#0f172a',
          borderRight     : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SidebarContent
          collapsed={false}
          toggleCollapsed={onMobileClose}
          user={user}
          initials={initials}
          hasRole={hasRole}
          isMobile={true}
          onClose={onMobileClose}
        />
      </aside>
    </>
  )
}

// ── Sidebar inner content (shared between desktop + mobile) ───────────────
const SidebarContent = ({ collapsed, toggleCollapsed, user, initials, hasRole, isMobile, onClose }) => (
  <div className="flex flex-col h-full overflow-hidden">

    {/* ── Brand header ──────────────────────────────────────────────── */}
    <div
      className={cn(
        'flex items-center h-16 shrink-0 px-4',
        collapsed && !isMobile ? 'justify-center px-0' : 'gap-3',
      )}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo mark */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: 'var(--color-brand)' }}
      >
        <Icons.GraduationCap size={16} color="#fff" />
      </div>

      {/* Brand name */}
      {(!collapsed || isMobile) && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate leading-tight">{APP_NAME}</p>
          <p className="text-xs truncate leading-tight" style={{ color: 'rgba(148,163,184,0.7)' }}>
            School ERP
          </p>
        </div>
      )}

      {/* Close button — mobile drawer */}
      {isMobile && (
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: 'rgba(148,163,184,0.7)' }}
        >
          <Icons.X size={18} />
        </button>
      )}

      {/* Collapse toggle — desktop */}
      {!isMobile && !collapsed && (
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/10 ml-auto"
          style={{ color: 'rgba(148,163,184,0.5)' }}
          title="Collapse sidebar"
        >
          <Icons.PanelLeftClose size={16} />
        </button>
      )}
    </div>

    {/* Expand button when collapsed on desktop */}
    {!isMobile && collapsed && (
      <button
        onClick={toggleCollapsed}
        className="mt-3 mx-auto flex w-9 h-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
        style={{ color: 'rgba(148,163,184,0.5)' }}
        title="Expand sidebar"
      >
        <Icons.PanelLeftOpen size={16} />
      </button>
    )}

    {/* ── Nav groups ────────────────────────────────────────────────── */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-6">
      {NAV_GROUPS.map((group, gi) => {
        const visible = group.items.filter(
          item => item.roles.length === 0 || hasRole(...item.roles)
        )
        if (visible.length === 0) return null

        return (
          <div key={gi}>
            {/* Group label */}
            {group.label && !collapsed && (
              <p
                className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: 'rgba(148,163,184,0.4)' }}
              >
                {group.label}
              </p>
            )}
            {/* Divider when collapsed */}
            {group.label && collapsed && gi > 0 && (
              <div
                className="mx-auto mb-2 w-5 h-px"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              />
            )}

            <ul className="space-y-0.5">
              {visible.map(item => (
                <li key={item.path}>
                  <NavItem item={item} collapsed={collapsed && !isMobile} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>

    {/* ── User footer ───────────────────────────────────────────────── */}
    <div
      className="shrink-0 p-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
    >
      {collapsed && !isMobile ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center mx-auto text-xs font-bold text-white cursor-default"
          style={{ backgroundColor: 'var(--color-brand)' }}
          title={user?.name}
        >
          {initials}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-1 py-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-white leading-tight">
              {user?.name || 'User'}
            </p>
            <p
              className="text-xs capitalize truncate leading-tight"
              style={{ color: 'rgba(148,163,184,0.6)' }}
            >
              {user?.role || 'staff'}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
)

export default Sidebar