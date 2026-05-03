// src/components/layout/Sidebar.jsx
import { useEffect, useMemo, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { APP_NAME, ROUTES, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'

/* ─────────────────────────── nav config ─────────────────────────── */
const getNavGroups = (user) => {
  const isTeacher    = user?.role === ROLES.TEACHER
  const isAccountant = user?.role === ROLES.ACCOUNTANT
  const can = (permission) => user?.role === ROLES.ADMIN || (Array.isArray(user?.permissions) && user.permissions.includes(permission))

  if (isTeacher) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard',   icon: 'LayoutDashboard', path: ROUTES.DASHBOARD },
          { label: 'My Classes',  icon: 'School2',         path: ROUTES.TEACHER_CLASSES },
          { label: 'Timetable',   icon: 'CalendarRange',   path: ROUTES.TEACHER_TIMETABLE },
        ],
      },
      {
        label: 'Attendance',
        items: [
          { label: 'Mark Attendance',      icon: 'ClipboardCheck', path: ROUTES.TEACHER_ATTENDANCE_MARK },
          { label: 'Attendance Register',  icon: 'Table2',         path: ROUTES.TEACHER_ATTENDANCE_REGISTER },
          { label: 'Attendance Reports',   icon: 'BarChart3',      path: ROUTES.TEACHER_ATTENDANCE_REPORTS },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Enter Marks',       icon: 'PenSquare',          path: ROUTES.TEACHER_MARKS_ENTER },
          { label: 'Marks Summary',     icon: 'LineChart',           path: ROUTES.TEACHER_MARKS_SUMMARY },
          { label: 'Student List',      icon: 'Users',               path: ROUTES.TEACHER_STUDENTS },
          { label: 'Student Remarks',   icon: 'MessageSquareQuote',  path: ROUTES.TEACHER_STUDENT_REMARKS },
          { label: 'Homework',          icon: 'NotebookPen',         path: ROUTES.TEACHER_HOMEWORK },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Chat',   icon: 'MessageSquare', path: ROUTES.TEACHER_CHAT },
          { label: 'Notice', icon: 'BellRing',      path: ROUTES.TEACHER_NOTICES },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Leave Application', icon: 'PlaneTakeoff', path: ROUTES.TEACHER_LEAVE },
          { label: 'My Profile',        icon: 'UserRound',    path: ROUTES.TEACHER_PROFILE },
        ],
      },
    ]
  }

  if (isAccountant) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.ACCOUNTANT_DASHBOARD },
          { label: 'Fee Collection', icon: 'IndianRupee', path: ROUTES.ACCOUNTANT_COLLECTION },
        ],
      },
      {
        label: 'Student Fees',
        items: [
          { label: 'Search Student', icon: 'Search', path: ROUTES.ACCOUNTANT_STUDENTS },
          { label: 'Invoices', icon: 'FileStack', path: ROUTES.ACCOUNTANT_INVOICES },
          { label: 'Receipts', icon: 'Receipt', path: ROUTES.ACCOUNTANT_RECEIPTS },
        ],
      },
      {
        label: 'Finance',
        items: [
          { label: 'Fee Structure', icon: 'NotebookTabs', path: ROUTES.ACCOUNTANT_FEE_STRUCTURE },
          ...(can('fees.edit') ? [{ label: 'Manage Structure', icon: 'PencilRuler', path: ROUTES.ACCOUNTANT_FEE_STRUCTURE_MANAGE }] : []),
          { label: 'Defaulters', icon: 'TriangleAlert', path: ROUTES.ACCOUNTANT_DEFAULTERS },
          { label: 'Fee Notices', icon: 'BellRing', path: ROUTES.ACCOUNTANT_NOTICES },
          ...(can('fees.waive') ? [{ label: 'Concessions', icon: 'BadgePercent', path: ROUTES.ACCOUNTANT_CONCESSIONS }] : []),
          { label: 'Carry Forward', icon: 'ArrowRightLeft', path: ROUTES.ACCOUNTANT_CARRY_FORWARD },
          ...(can('fees.refund') ? [{ label: 'Refunds', icon: 'Undo2', path: ROUTES.ACCOUNTANT_REFUNDS }] : []),
          { label: 'Cheques', icon: 'Landmark', path: ROUTES.ACCOUNTANT_CHEQUES },
        ],
      },
      {
        label: 'Reports',
        items: [
          ...(can('fees.report') ? [{ label: 'Reports', icon: 'BarChart3', path: ROUTES.ACCOUNTANT_REPORTS }] : []),
          ...(can('fees.report') ? [{ label: 'Daily Report', icon: 'CalendarClock', path: ROUTES.ACCOUNTANT_REPORT_DAILY }] : []),
          ...(can('fees.report') ? [{ label: 'Monthly Report', icon: 'CalendarDays', path: ROUTES.ACCOUNTANT_REPORT_MONTHLY }] : []),
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'My Profile', icon: 'UserRound', path: ROUTES.ACCOUNTANT_PROFILE },
        ],
      },
    ]
  }

  return [
    {
      label: null,
      items: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD, roles: [] },
      ],
    },
    {
      label: 'Students',
      items: [
        { label: 'Classes',       icon: 'School',         path: ROUTES.CLASSES,      roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Students',      icon: 'Users',          path: ROUTES.STUDENTS,     roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Enrollment',    icon: 'BookOpenCheck',  path: ROUTES.ENROLLMENTS,  roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Attendance',    icon: 'CalendarCheck',  path: ROUTES.ATTENDANCE,   roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Exams & Results', icon: 'ClipboardList', path: ROUTES.EXAMS,       roles: [ROLES.ADMIN, ROLES.TEACHER] },
      ],
    },
    {
      label: 'Teachers',
      items: [
        { label: 'Teachers',        icon: 'UsersRound',     path: ROUTES.TEACHERS,              roles: [ROLES.ADMIN] },
        { label: 'Teacher Control', icon: 'ShieldEllipsis', path: ROUTES.ADMIN_TEACHER_CONTROL, roles: [ROLES.ADMIN] },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Sessions',   icon: 'CalendarDays',       path: ROUTES.SESSIONS,          roles: [ROLES.ADMIN] },
        { label: 'Notices',    icon: 'BellRing',           path: ROUTES.ADMIN_NOTICES,     roles: [ROLES.ADMIN] },
        { label: 'Promotions', icon: 'ArrowUpWideNarrow',  path: ROUTES.ADMIN_PROMOTIONS,  roles: [ROLES.ADMIN] },
        { label: 'Users',      icon: 'UserCog',            path: ROUTES.USERS,             roles: [ROLES.ADMIN] },
        { label: 'Audit Logs', icon: 'ScrollText',         path: ROUTES.AUDIT,             roles: [ROLES.ADMIN] },
      ],
    },
    {
      label: 'System',
      items: [
        { label: 'Settings', icon: 'Settings', path: ROUTES.SETTINGS, roles: [ROLES.ADMIN] },
      ],
    },
  ]
}

/* ─────────────────────────── sub-components ─────────────────────── */
const NavIcon = ({ name, size = 17 }) => {
  const LucideIcon = Icons[name]
  return LucideIcon ? <LucideIcon size={size} /> : null
}

const NavItem = ({ item, collapsed }) => (
  <NavLink
    to={item.path}
    title={collapsed ? item.label : undefined}
    end={item.path === ROUTES.DASHBOARD}
    className={() =>
      cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
        'text-sm font-medium select-none outline-none',
        'transition-all duration-200 ease-out',
        collapsed && 'justify-center px-0 mx-auto w-10 h-10 rounded-xl'
      )
    }
    style={({ isActive }) => ({
      color           : isActive ? '#fff' : 'var(--color-sidebar-text)',
      backgroundColor : isActive ? 'var(--color-sidebar-active)' : 'transparent',
      boxShadow       : isActive ? '0 4px 14px rgba(16,185,129,0.25)' : 'none',
    })}
    onMouseEnter={e => {
      if (e.currentTarget.getAttribute('aria-current') !== 'page') {
        e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'
        e.currentTarget.style.color           = 'var(--color-text-primary)'
      }
    }}
    onMouseLeave={e => {
      if (e.currentTarget.getAttribute('aria-current') !== 'page') {
        e.currentTarget.style.backgroundColor = 'transparent'
        e.currentTarget.style.color           = 'var(--color-sidebar-text)'
      }
    }}
  >
    {({ isActive }) => (
      <>
        <span
          className="shrink-0 transition-transform duration-200"
          style={{
            opacity   : isActive ? 1 : 0.75,
            transform : isActive ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <NavIcon name={item.icon} size={17} />
        </span>

        {!collapsed && (
          <span className="truncate leading-none tracking-[-0.01em]">
            {item.label}
          </span>
        )}

        {/* Collapsed tooltip */}
        {collapsed && (
          <span
            className={cn(
              'absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'whitespace-nowrap pointer-events-none z-50',
              'opacity-0 group-hover:opacity-100',
              'translate-x-1 group-hover:translate-x-0',
              'transition-all duration-150 ease-out'
            )}
            style={{
              backgroundColor : 'var(--color-sidebar-card)',
              color           : 'var(--color-text-primary)',
              border          : '1px solid var(--color-sidebar-border)',
              boxShadow       : '0 8px 24px rgba(15,23,42,0.18)',
            }}
          >
            {item.label}
          </span>
        )}
      </>
    )}
  </NavLink>
)

/* ─────────────────────────── Sidebar ────────────────────────────── */
const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, hasRole } = useAuth()
  const overlayRef = useRef(null)
  const location   = useLocation()

  useEffect(() => {
    if (mobileOpen) onMobileClose?.()
  }, [location.pathname])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onMobileClose?.()
  }

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join('') || '?'

  const navGroups = useMemo(() => {
    const groups = getNavGroups(user)
    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => !item.roles || item.roles.length === 0 || hasRole(...item.roles)),
      }))
      .filter(group => group.items.length > 0)
  }, [user, hasRole])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 lg:hidden"
          style={{
            backgroundColor : 'rgba(0,0,0,0.45)',
            backdropFilter  : 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            animation       : 'fadeIn 0.2s ease-out',
          }}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex-col',
          'hidden lg:flex',
          'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
        style={{
          backgroundColor : 'var(--color-sidebar-bg)',
          borderRight     : '1px solid var(--color-sidebar-border)',
        }}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          toggleCollapsed={toggleSidebar}
          user={user}
          initials={initials}
          navGroups={navGroups}
          isMobile={false}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col w-[280px]',
          'lg:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor : 'var(--color-sidebar-bg)',
          borderRight     : '1px solid var(--color-sidebar-border)',
          boxShadow       : mobileOpen ? '0 0 60px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <SidebarContent
          collapsed={false}
          toggleCollapsed={onMobileClose}
          user={user}
          initials={initials}
          navGroups={navGroups}
          isMobile
          onClose={onMobileClose}
        />
      </aside>
    </>
  )
}

/* ─────────────────────────── SidebarContent ─────────────────────── */
const SidebarContent = ({ collapsed, toggleCollapsed, user, initials, navGroups, isMobile, onClose }) => (
  <div className="flex flex-col h-full overflow-hidden">

    {/* Logo / brand row */}
    <div
      className={cn(
        'flex items-center h-[60px] shrink-0 px-4',
        collapsed && !isMobile ? 'justify-center px-0' : 'gap-3'
      )}
      // style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
    >
      {/* Logo mark */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background : user?.role === ROLES.TEACHER
            ? 'linear-gradient(135deg,#0f766e 0%,#10b981 100%)'
            : 'linear-gradient(135deg,var(--color-brand) 0%,var(--color-brand-light) 100%)',
          boxShadow  : '0 4px 12px rgba(16,185,129,0.25)',
        }}
      >
        <Icons.GraduationCap size={17} color="#fff" />
      </div>

      {(!collapsed || isMobile) && (
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-bold truncate leading-tight tracking-[-0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {APP_NAME}
          </p>
          <p
            className="text-[10px] truncate leading-tight uppercase tracking-[0.15em] mt-0.5"
            style={{ color: 'var(--color-sidebar-muted)' }}
          >
            {user?.role === ROLES.TEACHER
              ? 'Teacher Portal'
              : 'Academic Suite'}
          </p>
        </div>
      )}

      {/* Mobile close */}
      {isMobile && (
        <button
          onClick={onClose}
          className="p-2 rounded-xl transition-all duration-150 ml-auto"
          style={{ color: 'var(--color-sidebar-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
        >
          <Icons.X size={17} />
        </button>
      )}

      {/* Desktop collapse toggle */}
      {!isMobile && !collapsed && (
        <button
          onClick={toggleCollapsed}
          className="p-1.5 rounded-lg transition-all duration-150 ml-auto"
          style={{ color: 'var(--color-sidebar-muted)' }}
          title="Collapse sidebar"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
        >
          <Icons.PanelLeftClose size={15} />
        </button>
      )}
    </div>

    {/* Expand button when collapsed */}
    {!isMobile && collapsed && (
      <button
        onClick={toggleCollapsed}
        className="mt-3 mx-auto flex w-9 h-9 items-center justify-center rounded-xl transition-all duration-150"
        style={{
          color           : 'var(--color-sidebar-muted)',
          backgroundColor : 'var(--color-sidebar-card)',
          border          : '1px solid var(--color-sidebar-border)',
        }}
        title="Expand sidebar"
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'; e.currentTarget.style.color = 'var(--color-text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-sidebar-card)'; e.currentTarget.style.color = 'var(--color-sidebar-muted)' }}
      >
        <Icons.PanelLeftOpen size={15} />
      </button>
    )}

    {/* Nav */}
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5 scrollbar-thin">
      {navGroups.map((group, index) => (
        <div key={`${group.label || 'root'}-${index}`}>
          {group.label && !collapsed && (
            <p
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--color-sidebar-muted)' }}
            >
              {group.label}
            </p>
          )}
          {group.label && collapsed && index > 0 && (
            <div
              className="mx-auto mb-2 w-5 h-px"
              style={{ backgroundColor: 'var(--color-sidebar-border)' }}
            />
          )}
          <ul className="space-y-0.5">
            {group.items.map(item => (
              <li key={item.path}>
                <NavItem item={item} collapsed={collapsed && !isMobile} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>

    {/* User card */}
    <div
      className="shrink-0 p-3"
      style={{ borderTop: '1px solid var(--color-sidebar-border)' }}
    >
      {collapsed && !isMobile ? (
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto text-xs font-bold text-white cursor-default"
          style={{
            background: user?.role === ROLES.TEACHER
              ? 'linear-gradient(135deg,#0f766e 0%,#10b981 100%)'
              : 'linear-gradient(135deg,var(--color-brand) 0%,var(--color-brand-light) 100%)',
            boxShadow: '0 4px 12px rgba(16,185,129,0.2)',
          }}
          title={user?.name}
        >
          {initials}
        </div>
      ) : (
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
          style={{
            backgroundColor : 'var(--color-sidebar-card)',
            border          : '1px solid var(--color-sidebar-border)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{
              background: user?.role === ROLES.TEACHER
                ? 'linear-gradient(135deg,#0f766e 0%,#10b981 100%)'
                : 'linear-gradient(135deg,var(--color-brand) 0%,var(--color-brand-light) 100%)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold truncate leading-tight tracking-[-0.01em]"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {user?.name || 'User'}
            </p>
            <p
              className="text-[10px] uppercase tracking-[0.12em] truncate leading-tight mt-0.5"
              style={{ color: 'var(--color-sidebar-muted)' }}
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
