import { useEffect, useMemo, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import useUiStore from '@/store/uiStore'
import useAuth from '@/hooks/useAuth'
import { APP_NAME, ROUTES, ROLES } from '@/constants/app'
import { cn } from '@/utils/helpers'

const getNavGroups = (user) => {
  const isTeacher = user?.role === ROLES.TEACHER
  const isAccountant = user?.role === ROLES.ACCOUNTANT
  const canPostNotices = Array.isArray(user?.permissions) && user.permissions.includes('notices.post')

  if (isTeacher) {
    return [
      {
        label: 'Main',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.DASHBOARD },
          { label: 'My Classes', icon: 'School2', path: ROUTES.TEACHER_CLASSES },
          { label: 'Timetable', icon: 'CalendarRange', path: ROUTES.TEACHER_TIMETABLE },
        ],
      },
      {
        label: 'Attendance',
        items: [
          { label: 'Mark Attendance', icon: 'ClipboardCheck', path: ROUTES.TEACHER_ATTENDANCE_MARK },
          { label: 'Attendance Register', icon: 'Table2', path: ROUTES.TEACHER_ATTENDANCE_REGISTER },
          { label: 'Attendance Reports', icon: 'BarChart3', path: ROUTES.TEACHER_ATTENDANCE_REPORTS },
        ],
      },
      {
        label: 'Academics',
        items: [
          { label: 'Enter Marks', icon: 'PenSquare', path: ROUTES.TEACHER_MARKS_ENTER },
          { label: 'Marks Summary', icon: 'LineChart', path: ROUTES.TEACHER_MARKS_SUMMARY },
          { label: 'Student List', icon: 'Users', path: ROUTES.TEACHER_STUDENTS },
          { label: 'Student Remarks', icon: 'MessageSquareQuote', path: ROUTES.TEACHER_STUDENT_REMARKS },
          { label: 'Homework', icon: 'NotebookPen', path: ROUTES.TEACHER_HOMEWORK },
        ],
      },
      {
        label: 'Communication',
        items: [
          { label: 'Chat', icon: 'MessageSquare', path: ROUTES.TEACHER_CHAT },
          { label: 'View Notices', icon: 'BellRing', path: ROUTES.TEACHER_NOTICES },
          ...(canPostNotices ? [{ label: 'Post Notice', icon: 'Send', path: ROUTES.TEACHER_NOTICE_NEW }] : []),
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Leave Application', icon: 'PlaneTakeoff', path: ROUTES.TEACHER_LEAVE },
          { label: 'My Profile', icon: 'UserRound', path: ROUTES.TEACHER_PROFILE },
        ],
      },
    ]
  }

  if (isAccountant) {
    return [
      {
        label: 'Portal',
        items: [
          { label: 'Dashboard', icon: 'LayoutDashboard', path: ROUTES.FEES },
          { label: 'Fee Collection', icon: 'HandCoins', path: ROUTES.FEE_COLLECTION },
          { label: 'Student Fee', icon: 'WalletCards', path: ROUTES.FEE_STUDENT_LEDGER },
          { label: 'Fee Structure', icon: 'Landmark', path: ROUTES.FEE_STRUCTURES },
          { label: 'Invoices', icon: 'Files', path: ROUTES.FEE_INVOICES },
          { label: 'Receipts', icon: 'Receipt', path: ROUTES.FEE_RECEIPTS },
          { label: 'Defaulters', icon: 'TriangleAlert', path: ROUTES.FEE_DEFAULTERS },
        ],
      },
      {
        label: 'Student Access',
        items: [
          { label: 'Students', icon: 'Users', path: ROUTES.STUDENTS },
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
        { label: 'Classes', icon: 'School', path: ROUTES.CLASSES, roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Students', icon: 'Users', path: ROUTES.STUDENTS, roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Enrollment', icon: 'BookOpenCheck', path: ROUTES.ENROLLMENTS, roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Attendance', icon: 'CalendarCheck', path: ROUTES.ATTENDANCE, roles: [ROLES.ADMIN, ROLES.TEACHER] },
        { label: 'Exams & Results', icon: 'ClipboardList', path: ROUTES.EXAMS, roles: [ROLES.ADMIN, ROLES.TEACHER] },
      ],
    },
    {
      label: 'Teachers',
      items: [
        { label: 'Teachers', icon: 'UsersRound', path: ROUTES.TEACHERS, roles: [ROLES.ADMIN] },
        { label: 'Teacher Control', icon: 'ShieldEllipsis', path: ROUTES.ADMIN_TEACHER_CONTROL, roles: [ROLES.ADMIN] },
      ],
    },
      {
        label: 'Administration',
        items: [
          { label: 'Sessions', icon: 'CalendarDays', path: ROUTES.SESSIONS, roles: [ROLES.ADMIN] },
          { label: 'Promotions', icon: 'ArrowUpWideNarrow', path: ROUTES.ADMIN_PROMOTIONS, roles: [ROLES.ADMIN] },
          { label: 'Users', icon: 'UserCog', path: ROUTES.USERS, roles: [ROLES.ADMIN] },
          { label: 'Fees', icon: 'IndianRupee', path: ROUTES.FEES, roles: [ROLES.ADMIN] },
          { label: 'Audit Logs', icon: 'ScrollText', path: ROUTES.AUDIT, roles: [ROLES.ADMIN] },
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

const NavIcon = ({ name, size = 18 }) => {
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
        'group relative flex items-center gap-3 rounded-2xl px-3 py-2.5',
        'text-sm font-medium transition-all duration-200 select-none',
        collapsed && 'justify-center px-0 mx-auto w-11 h-11'
      )
    }
    style={({ isActive }) => ({
      color: isActive ? '#fff' : 'var(--color-sidebar-text)',
      backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
      boxShadow: isActive ? '0 10px 24px rgba(16, 185, 129, 0.18)' : 'none',
    })}
    onMouseEnter={e => {
      if (e.currentTarget.getAttribute('aria-current') !== 'page') {
        e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)'
      }
    }}
    onMouseLeave={e => {
      if (e.currentTarget.getAttribute('aria-current') !== 'page') {
        e.currentTarget.style.backgroundColor = 'transparent'
      }
    }}
  >
    {({ isActive }) => (
      <>
        <span className="shrink-0" style={{ opacity: isActive ? 1 : 0.9 }}>
          <NavIcon name={item.icon} size={18} />
        </span>

        {!collapsed && <span className="truncate leading-none">{item.label}</span>}

        {collapsed && (
          <span
            className={cn(
              'absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'whitespace-nowrap pointer-events-none',
              'opacity-0 group-hover:opacity-100 translate-x-0',
              'transition-opacity duration-150 z-50'
            )}
            style={{
              backgroundColor: 'var(--color-sidebar-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-sidebar-border)',
              boxShadow: '0 14px 28px rgba(15,23,42,0.14)',
            }}
          >
            {item.label}
          </span>
        )}
      </>
    )}
  </NavLink>
)

const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const { user, hasRole } = useAuth()
  const overlayRef = useRef(null)
  const location = useLocation()

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
    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => !item.roles || item.roles.length === 0 || hasRole(...item.roles)),
    })).filter(group => group.items.length > 0)
  }, [user, hasRole])

  return (
    <>
      {mobileOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col',
          'transition-all duration-300 ease-in-out',
          'hidden lg:flex',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64'
        )}
        style={{
          backgroundColor: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.02)',
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

      <aside
        className={cn(
          'fixed top-0 left-0 h-screen z-50 flex flex-col w-64',
          'lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{
          backgroundColor: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          boxShadow: '0 24px 80px rgba(15,23,42,0.28)',
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

const SidebarContent = ({ collapsed, toggleCollapsed, user, initials, navGroups, isMobile, onClose }) => (
  <div className="flex flex-col h-full overflow-hidden">
    <div
      className={cn(
        'flex items-center h-18 shrink-0 px-4',
        collapsed && !isMobile ? 'justify-center px-0' : 'gap-3'
      )}
      style={{ borderBottom: '1px solid var(--color-sidebar-border)' }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: user?.role === ROLES.TEACHER
            ? 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)'
            : 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)',
          boxShadow: user?.role === ROLES.TEACHER
            ? '0 10px 24px rgba(16, 185, 129, 0.26)'
            : '0 10px 24px rgba(37, 99, 235, 0.28)',
        }}
      >
        <Icons.GraduationCap size={18} color="#fff" />
      </div>

      {(!collapsed || isMobile) && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {APP_NAME}
          </p>
          <p className="text-xs truncate leading-tight uppercase tracking-[0.18em]" style={{ color: 'var(--color-sidebar-muted)' }}>
            {user?.role === ROLES.TEACHER
              ? 'Teacher Portal'
              : user?.role === ROLES.ACCOUNTANT
              ? 'Accountant Portal'
              : 'Academic Suite'}
          </p>
        </div>
      )}

      {isMobile && (
        <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: 'var(--color-sidebar-muted)' }}>
          <Icons.X size={18} />
        </button>
      )}

      {!isMobile && !collapsed && (
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-xl transition-colors ml-auto"
          style={{ color: 'var(--color-sidebar-muted)' }}
          title="Collapse sidebar"
        >
          <Icons.PanelLeftClose size={16} />
        </button>
      )}
    </div>

    {!isMobile && collapsed && (
      <button
        onClick={toggleCollapsed}
        className="mt-3 mx-auto flex w-10 h-10 items-center justify-center rounded-2xl transition-colors"
        style={{
          color: 'var(--color-sidebar-muted)',
          backgroundColor: 'var(--color-sidebar-card)',
          border: '1px solid var(--color-sidebar-border)',
        }}
        title="Expand sidebar"
      >
        <Icons.PanelLeftOpen size={16} />
      </button>
    )}

    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-5 px-3 space-y-6">
      {navGroups.map((group, index) => (
        <div key={`${group.label || 'root'}-${index}`}>
          {group.label && !collapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--color-sidebar-muted)' }}>
              {group.label}
            </p>
          )}
          {group.label && collapsed && index > 0 && (
            <div className="mx-auto mb-2 w-6 h-px" style={{ backgroundColor: 'var(--color-sidebar-border)' }} />
          )}

          <ul className="space-y-1">
            {group.items.map(item => (
              <li key={item.path}>
                <NavItem item={item} collapsed={collapsed && !isMobile} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>

    <div className="shrink-0 p-3" style={{ borderTop: '1px solid var(--color-sidebar-border)' }}>
      {collapsed && !isMobile ? (
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto text-xs font-bold text-white cursor-default"
          style={{
            background: user?.role === ROLES.TEACHER
              ? 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)'
              : 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)',
            boxShadow: user?.role === ROLES.TEACHER
              ? '0 8px 20px rgba(16, 185, 129, 0.22)'
              : '0 8px 20px rgba(37, 99, 235, 0.24)',
          }}
          title={user?.name}
        >
          {initials}
        </div>
      ) : (
        <div
          className="flex items-center gap-3 px-3 py-3 rounded-2xl"
          style={{
            backgroundColor: 'var(--color-sidebar-card)',
            border: '1px solid var(--color-sidebar-border)',
          }}
        >
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
            style={{
              background: user?.role === ROLES.TEACHER
                ? 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)'
                : 'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] truncate leading-tight" style={{ color: 'var(--color-sidebar-muted)' }}>
              {user?.role || 'staff'}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
)

export default Sidebar
