// src/constants/navigation.js
// Single source of truth for sidebar navigation items.
// Icon names map to lucide-react icons — imported dynamically in Sidebar.jsx

import { ROUTES, ROLES } from './app'

/**
 * Navigation groups shown in the sidebar.
 * allowedRoles: which roles can SEE this item. Empty = all roles.
 */
export const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      {
        label       : 'Dashboard',
        icon        : 'LayoutDashboard',
        path        : ROUTES.DASHBOARD,
        allowedRoles: [],
      },
    ],
  },
  {
    label: 'Academics',
    items: [
      {
        label       : 'Students',
        icon        : 'Users',
        path        : ROUTES.STUDENTS,
        allowedRoles: [ROLES.ADMIN, ROLES.TEACHER],
      },
      {
        label       : 'Enrollments',
        icon        : 'BookOpen',
        path        : ROUTES.ENROLLMENTS,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        label       : 'Attendance',
        icon        : 'CalendarCheck',
        path        : ROUTES.ATTENDANCE,
        allowedRoles: [ROLES.ADMIN, ROLES.TEACHER],
      },
      {
        label       : 'Exams & Results',
        icon        : 'ClipboardList',
        path        : ROUTES.EXAMS,
        allowedRoles: [ROLES.ADMIN, ROLES.TEACHER],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label       : 'Sessions',
        icon        : 'CalendarDays',
        path        : ROUTES.SESSIONS,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        label       : 'Audit Logs',
        icon        : 'ScrollText',
        path        : ROUTES.AUDIT,
        allowedRoles: [ROLES.ADMIN],
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label       : 'Settings',
        icon        : 'Settings',
        path        : ROUTES.SETTINGS,
        allowedRoles: [ROLES.ADMIN],
      },
    ],
  },
]
