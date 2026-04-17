// src/constants/app.js
// Fixed values used across the app — never hardcode these inline

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'EduCore'
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0'

// ── Local storage keys ────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN: 'educore_token',
  REFRESH_TOKEN: 'educore_refresh_token',
  USER: 'educore_user',
  THEME: 'educore_theme',
  SIDEBAR: 'educore_sidebar_collapsed',
}

// ── User roles (must match backend ENUM) ─────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  ACCOUNTANT: 'accountant',
  STAFF: 'staff',
}

// ── Route paths — single source of truth for navigation ──────────────────
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  

  // Students
  STUDENTS: '/students',
  STUDENT_NEW: '/students/new',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_EDIT: '/students/:id/edit',

  // Sessions
  SESSIONS: '/sessions',
  SESSION_NEW: '/sessions/new',
  SESSION_DETAIL: '/sessions/:id',

  // Enrollments
  ENROLLMENTS: '/enrollments',

  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_BULK: '/attendance/bulk',
  ATTENDANCE_REPORT: '/attendance/report',

  // Fees
  FEES: '/fees',
  FEE_STRUCTURES: '/fees/structures',
  FEE_INVOICES: '/fees/invoices',

  // Exams
  EXAMS: '/exams',
  RESULTS: '/results',

  // Audit
  AUDIT: '/audit',

  // Settings
  SETTINGS: '/settings',
}

// ── API response status ───────────────────────────────────────────────────
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
}

// ── Pagination defaults ───────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
  PER_PAGE_OPTIONS: [10, 20, 50, 100],
}
