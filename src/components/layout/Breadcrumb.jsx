// src/components/layout/Breadcrumb.jsx
import { Link, useLocation, useMatches } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { ROUTES } from '@/constants/app'
import { cn } from '@/utils/helpers'

// ── Map routes to human-readable labels ──────────────────────────────────
const ROUTE_LABELS = {
  [ROUTES.DASHBOARD]   : 'Dashboard',
  [ROUTES.STUDENTS]    : 'Students',
  [ROUTES.STUDENT_NEW] : 'Admit New Student',
  [ROUTES.ENROLLMENTS] : 'Enrollment',
  [ROUTES.ATTENDANCE]  : 'Attendance',
  [ROUTES.ATTENDANCE_BULK]   : 'Bulk Attendance',
  [ROUTES.ATTENDANCE_REPORT] : 'Report',
  [ROUTES.EXAMS]       : 'Exams & Results',
  [ROUTES.RESULTS]     : 'Results',
  [ROUTES.SESSIONS]    : 'Sessions',
  [ROUTES.FEES]        : 'Fees',
  [ROUTES.FEE_STRUCTURES] : 'Fee Structures',
  [ROUTES.AUDIT]       : 'Audit Logs',
  [ROUTES.SETTINGS]    : 'Settings',
  [ROUTES.ADMIN_TEACHER_CONTROL] : 'Teacher Control',
  [ROUTES.TEACHER_CLASSES] : 'My Classes',
  [ROUTES.TEACHER_ATTENDANCE_MARK] : 'Mark Attendance',
  [ROUTES.TEACHER_ATTENDANCE_REGISTER] : 'Attendance Register',
  [ROUTES.TEACHER_ATTENDANCE_REPORTS] : 'Attendance Reports',
  [ROUTES.TEACHER_MARKS_ENTER] : 'Enter Marks',
  [ROUTES.TEACHER_MARKS_SUMMARY] : 'Marks Summary',
  [ROUTES.TEACHER_STUDENTS] : 'Student List',
  [ROUTES.TEACHER_STUDENT_DETAIL] : 'Student Detail',
  [ROUTES.TEACHER_STUDENT_REMARKS] : 'Student Remarks',
  [ROUTES.TEACHER_TIMETABLE] : 'Timetable',
  [ROUTES.TEACHER_HOMEWORK] : 'Homework',
  [ROUTES.TEACHER_CHAT] : 'Chat',
  [ROUTES.TEACHER_NOTICES] : 'View Notices',
  [ROUTES.TEACHER_NOTICE_NEW] : 'Post Notice',
  [ROUTES.TEACHER_LEAVE] : 'Leave Application',
  [ROUTES.TEACHER_PROFILE] : 'My Profile',
  [ROUTES.STUDENT_CHAT] : 'Teacher Chat',
}

const Breadcrumb = () => {
  const location = useLocation()
  const pathname = location.pathname

  // Build crumbs from path segments
  const crumbs = buildCrumbs(pathname)

  if (crumbs.length <= 1) {
    // Just show page title when at root level
    return (
      <h1
        className="text-base font-semibold leading-none"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {crumbs[0]?.label || 'Dashboard'}
      </h1>
    )
  }

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1 flex-wrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1

          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight
                  size={13}
                  className="shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                />
              )}

              {isLast ? (
                <span
                  className="text-sm font-semibold truncate max-w-40"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-sm truncate max-w-28 transition-colors hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-brand)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ── Build crumb array from pathname ───────────────────────────────────────
function buildCrumbs(pathname) {
  // Always start with Dashboard
  const crumbs = [{ label: 'Dashboard', path: ROUTES.DASHBOARD }]

  // Exact match for known routes
  const match = Object.entries(ROUTE_LABELS).find(([route]) => {
    if (route.includes(':')) {
      // Dynamic segment — check prefix
      const base = route.split('/:')[0]
      return pathname.startsWith(base) && pathname !== ROUTES.DASHBOARD
    }
    return pathname === route
  })

  if (!match || pathname === ROUTES.DASHBOARD) {
    return pathname === ROUTES.DASHBOARD ? [{ label: 'Dashboard', path: ROUTES.DASHBOARD }] : crumbs
  }

  const [routeKey, label] = match

  // Check if this is a child of another route
  const parentEntry = Object.entries(ROUTE_LABELS).find(([route, lbl]) => {
    if (route === routeKey) return false
    return routeKey.startsWith(route + '/') || pathname.startsWith(route + '/')
  })

  if (parentEntry) {
    crumbs.push({ label: parentEntry[1], path: parentEntry[0] })
  } else if (pathname !== ROUTES.DASHBOARD) {
    // Remove first "Dashboard" crumb if we're not in a sub-path
    // Keep it only for sub-paths
    return [{ label, path: pathname }]
  }

  crumbs.push({ label, path: pathname })
  return crumbs
}

export default Breadcrumb
