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
  STUDENT: 'student',
  PARENT: 'parent',
  LIBRARIAN: 'librarian',
  RECEPTIONIST: 'receptionist',
}

// ── Route paths — single source of truth for navigation ──────────────────
export const ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',

  // Student Portal
  STUDENT_ROOT: '/student',
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_RESULTS: '/student/results',
  STUDENT_REPORT_CARD: '/student/results/report-card',
  STUDENT_FEES: '/student/fees',
  STUDENT_FEE_PAYMENTS: '/student/fees/payments',
  STUDENT_TIMETABLE: '/student/timetable',
  STUDENT_HOMEWORK: '/student/homework',
  STUDENT_HOMEWORK_SUBMISSIONS: '/student/homework/submissions',
  STUDENT_NOTICES: '/student/notices',
  STUDENT_CHAT: '/student/chat',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_PROFILE_CORRECTION: '/student/profile/correction',
  STUDENT_PROFILE_PASSWORD: '/student/profile/password',
  STUDENT_HISTORY: '/student/history',
  STUDENT_ACHIEVEMENTS: '/student/achievements',
  STUDENT_MATERIALS: '/student/materials',
  

  // Students
  STUDENTS: '/students',
  STUDENT_NEW: '/students/new',
  STUDENT_DETAIL: '/students/:id',
  STUDENT_EDIT: '/students/:id/edit',

  // Classes
  CLASSES: '/classes',
  CLASS_DETAIL: '/classes/:id',

  // Sessions
  SESSIONS: '/sessions',
  SESSION_NEW: '/sessions/new',
  SESSION_DETAIL: '/sessions/:id',
  ADMIN_PROMOTIONS: '/admin/promotions',

  // Enrollments
  ENROLLMENTS: '/enrollments',

  // Attendance
  ATTENDANCE: '/attendance',
  ATTENDANCE_BULK: '/attendance/bulk',
  ATTENDANCE_REPORT: '/attendance/report',

  // Fees
  FEES: '/fees',
  FEE_COLLECTION: '/fees/collection',
  FEE_STUDENT_LEDGER: '/fees/student-fees',
  FEE_STRUCTURES: '/fees/structures',
  FEE_REPORT: '/fees/report',
  FEE_INVOICES: '/fees/invoices',
  FEE_RECEIPTS: '/fees/receipts',
  FEE_DEFAULTERS: '/fees/defaulters',

  // Exams
  EXAMS: '/exams',
  RESULTS: '/results',

  // Audit
  AUDIT: '/audit',

  // Users
  USERS: '/users',
  USER_MANAGE: '/users/manage',
  USER_NEW: '/users/new',
  USER_IMPORT: '/users/import',
  USER_DETAIL: '/users/:id',
  TEACHERS: '/teachers',
  TEACHER_DETAIL: '/teachers/:id',
  TEACHER_NEW: '/teachers/new',
  ADMIN_TEACHER_CONTROL: '/admin/teacher-control',

  // Teacher Portal
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_ATTENDANCE_MARK: '/teacher/attendance/mark',
  TEACHER_ATTENDANCE_REGISTER: '/teacher/attendance/register',
  TEACHER_ATTENDANCE_REPORTS: '/teacher/attendance/reports',
  TEACHER_MARKS_ENTER: '/teacher/marks/enter',
  TEACHER_MARKS_SUMMARY: '/teacher/marks/summary',
  TEACHER_STUDENTS: '/teacher/students',
  TEACHER_STUDENT_DETAIL: '/teacher/students/:id',
  TEACHER_STUDENT_REMARKS: '/teacher/students/remarks',
  TEACHER_TIMETABLE: '/teacher/timetable',
  TEACHER_HOMEWORK: '/teacher/homework',
  TEACHER_CHAT: '/teacher/chat',
  TEACHER_NOTICES: '/teacher/notices',
  TEACHER_NOTICE_NEW: '/teacher/notices/new',
  TEACHER_LEAVE: '/teacher/leave',
  TEACHER_PROFILE: '/teacher/profile',

  // Accountant Portal
  ACCOUNTANT_ROOT: '/accountant',
  ACCOUNTANT_DASHBOARD: '/accountant/dashboard',
  ACCOUNTANT_COLLECTION: '/accountant/collect',
  ACCOUNTANT_STUDENTS: '/accountant/students',
  ACCOUNTANT_STUDENT_FEES: '/accountant/students/:id/fees',
  ACCOUNTANT_FEE_STRUCTURE: '/accountant/fee-structure',
  ACCOUNTANT_FEE_STRUCTURE_MANAGE: '/accountant/fee-structure/manage',
  ACCOUNTANT_INVOICES: '/accountant/invoices',
  ACCOUNTANT_INVOICES_OVERDUE: '/accountant/invoices/overdue',
  ACCOUNTANT_INVOICES_DUE_TODAY: '/accountant/invoices/due-today',
  ACCOUNTANT_RECEIPTS: '/accountant/receipts',
  ACCOUNTANT_RECEIPT_DETAIL: '/accountant/receipts/:id',
  ACCOUNTANT_DEFAULTERS: '/accountant/defaulters',
  ACCOUNTANT_REMINDERS: '/accountant/defaulters/reminders',
  ACCOUNTANT_CONCESSIONS: '/accountant/concessions',
  ACCOUNTANT_CONCESSIONS_APPLY: '/accountant/concessions/apply',
  ACCOUNTANT_REPORTS: '/accountant/reports',
  ACCOUNTANT_REPORT_DAILY: '/accountant/reports/daily',
  ACCOUNTANT_REPORT_MONTHLY: '/accountant/reports/monthly',
  ACCOUNTANT_REPORT_CLASSWISE: '/accountant/reports/classwise',
  ACCOUNTANT_REPORT_SESSION: '/accountant/reports/session',
  ACCOUNTANT_REPORT_DEFAULTERS: '/accountant/reports/defaulters',
  ACCOUNTANT_REPORT_CONCESSIONS: '/accountant/reports/concessions',
  ACCOUNTANT_REPORT_CUSTOM: '/accountant/reports/custom',
  ACCOUNTANT_CARRY_FORWARD: '/accountant/carry-forward',
  ACCOUNTANT_REFUNDS: '/accountant/refunds',
  ACCOUNTANT_REFUNDS_PROCESS: '/accountant/refunds/process',
  ACCOUNTANT_CHEQUES: '/accountant/cheques',
  ACCOUNTANT_PROFILE: '/accountant/profile',

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
