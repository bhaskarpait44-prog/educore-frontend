// src/utils/permissions.js

/**
 * All permission strings — mirror of backend permissionConstants.js
 * Import from here to avoid magic strings scattered across components.
 */
export const PERMISSION = {
  // Fees
  FEES_VIEW    : 'fees.view',
  FEES_COLLECT : 'fees.collect',
  FEES_EDIT    : 'fees.edit',
  FEES_WAIVE   : 'fees.waive',
  FEES_REPORT  : 'fees.report',
  FEES_REFUND  : 'fees.refund',

  // Students
  STUDENTS_VIEW     : 'students.view',
  STUDENTS_CREATE   : 'students.create',
  STUDENTS_EDIT     : 'students.edit',
  STUDENTS_DELETE   : 'students.delete',
  STUDENTS_PROMOTE  : 'students.promote',
  STUDENTS_TRANSFER : 'students.transfer',

  // Attendance
  ATTENDANCE_VIEW   : 'attendance.view',
  ATTENDANCE_MARK   : 'attendance.mark',
  ATTENDANCE_EDIT   : 'attendance.edit',
  ATTENDANCE_REPORT : 'attendance.report',

  // Results
  RESULTS_VIEW     : 'results.view',
  RESULTS_ENTER    : 'results.enter',
  RESULTS_EDIT     : 'results.edit',
  RESULTS_OVERRIDE : 'results.override',
  RESULTS_PUBLISH  : 'results.publish',

  // Classes
  CLASSES_VIEW   : 'classes.view',
  CLASSES_CREATE : 'classes.create',
  CLASSES_EDIT   : 'classes.edit',
  CLASSES_DELETE : 'classes.delete',

  // Reports
  REPORTS_FEES       : 'reports.fees',
  REPORTS_ATTENDANCE : 'reports.attendance',
  REPORTS_RESULTS    : 'reports.results',
  REPORTS_EXPORT     : 'reports.export',

  // Users
  USERS_VIEW        : 'users.view',
  USERS_CREATE      : 'users.create',
  USERS_EDIT        : 'users.edit',
  USERS_DELETE      : 'users.delete',
  USERS_PERMISSIONS : 'users.permissions',

  // Audit
  AUDIT_VIEW   : 'audit.view',
  AUDIT_EXPORT : 'audit.export',

  // Notices
  NOTICES_VIEW        : 'notices.view',
  NOTICES_POST        : 'notices.post',
  NOTICES_ALL_CLASSES : 'notices.all_classes',
  NOTICES_EDIT        : 'notices.edit',
  NOTICES_DELETE      : 'notices.delete',
}

// Roles with full access — bypass permission checks in UI
const ADMIN_ROLES = ['admin']

/**
 * hasPermission(user, permission)
 *
 * Check if a user has a specific permission.
 * Admin users always return true.
 *
 * @param {Object} user - User object from auth store ({ role, permissions: string[] })
 * @param {string} permission - Permission string e.g. 'fees.view'
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) return false
  if (ADMIN_ROLES.includes(user.role)) return true
  if (!Array.isArray(user.permissions)) return false
  return user.permissions.includes(permission)
}

/**
 * hasAnyPermission(user, permissions[])
 * Returns true if user has at least ONE of the permissions.
 */
export function hasAnyPermission(user, permissions = []) {
  if (!user) return false
  if (ADMIN_ROLES.includes(user.role)) return true
  return permissions.some(p => hasPermission(user, p))
}

/**
 * hasAllPermissions(user, permissions[])
 * Returns true ONLY if user has ALL listed permissions.
 */
export function hasAllPermissions(user, permissions = []) {
  if (!user) return false
  if (ADMIN_ROLES.includes(user.role)) return true
  return permissions.every(p => hasPermission(user, p))
}

/**
 * getPermissionsForRole(role)
 * Returns default permission set suggestions for a given role.
 * Used as quick-fill in user creation form.
 */
export function getDefaultPermissionsForRole(role) {
  const defaults = {
    teacher    : [
      PERMISSION.STUDENTS_VIEW,
      PERMISSION.ATTENDANCE_VIEW, PERMISSION.ATTENDANCE_MARK,
      PERMISSION.RESULTS_VIEW, PERMISSION.RESULTS_ENTER,
      PERMISSION.NOTICES_VIEW, PERMISSION.CLASSES_VIEW,
    ],
    student    : [PERMISSION.RESULTS_VIEW, PERMISSION.NOTICES_VIEW],
    parent     : [PERMISSION.RESULTS_VIEW, PERMISSION.NOTICES_VIEW, PERMISSION.FEES_VIEW],
    admin      : [], // admin gets everything implicitly
  }
  return defaults[role] || []
}

/**
 * PERMISSION_CATEGORIES
 * Used to render the permission selector accordion in the admin UI.
 */
export const PERMISSION_CATEGORIES = [
  {
    key   : 'fees',
    label : 'Fees',
    permissions: [
      { name: PERMISSION.FEES_VIEW,    label: 'View Fee Records',       description: 'View fee structures, invoices, and payment history' },
      { name: PERMISSION.FEES_COLLECT, label: 'Collect Payments',       description: 'Record fee payments from students and parents' },
      { name: PERMISSION.FEES_EDIT,    label: 'Edit Fee Structure',     description: 'Modify fee components and amounts' },
      { name: PERMISSION.FEES_WAIVE,   label: 'Waive or Concede Fees', description: 'Grant fee waivers, concessions, or scholarships' },
      { name: PERMISSION.FEES_REPORT,  label: 'Generate Fee Reports',   description: 'Access and export fee collection reports' },
      { name: PERMISSION.FEES_REFUND,  label: 'Process Refunds',        description: 'Issue refunds and reverse payments' },
    ],
  },
  {
    key   : 'students',
    label : 'Students',
    permissions: [
      { name: PERMISSION.STUDENTS_VIEW,     label: 'View Students',     description: 'View student profiles and details' },
      { name: PERMISSION.STUDENTS_CREATE,   label: 'Admit Students',    description: 'Create new student admissions' },
      { name: PERMISSION.STUDENTS_EDIT,     label: 'Edit Student Data', description: 'Modify student profiles and identity information' },
      { name: PERMISSION.STUDENTS_DELETE,   label: 'Delete Students',   description: 'Soft-delete student records' },
      { name: PERMISSION.STUDENTS_PROMOTE,  label: 'Promote Students',  description: 'Promote or detain students at year end' },
      { name: PERMISSION.STUDENTS_TRANSFER, label: 'Transfer Students', description: 'Transfer students between sections' },
    ],
  },
  {
    key   : 'attendance',
    label : 'Attendance',
    permissions: [
      { name: PERMISSION.ATTENDANCE_VIEW,   label: 'View Attendance',    description: 'View attendance records and reports' },
      { name: PERMISSION.ATTENDANCE_MARK,   label: 'Mark Attendance',    description: 'Take daily class attendance' },
      { name: PERMISSION.ATTENDANCE_EDIT,   label: 'Edit Attendance',    description: 'Override and correct attendance records' },
      { name: PERMISSION.ATTENDANCE_REPORT, label: 'Attendance Reports', description: 'Generate attendance analysis reports' },
    ],
  },
  {
    key   : 'results',
    label : 'Results',
    permissions: [
      { name: PERMISSION.RESULTS_VIEW,     label: 'View Results',      description: 'View exam results and marks' },
      { name: PERMISSION.RESULTS_ENTER,    label: 'Enter Marks',        description: 'Enter exam marks for students' },
      { name: PERMISSION.RESULTS_EDIT,     label: 'Edit Marks',         description: 'Modify entered exam marks' },
      { name: PERMISSION.RESULTS_OVERRIDE, label: 'Override Results',   description: 'Override calculated results with reason' },
      { name: PERMISSION.RESULTS_PUBLISH,  label: 'Publish Results',    description: 'Make results visible to students' },
    ],
  },
  {
    key   : 'classes',
    label : 'Classes',
    permissions: [
      { name: PERMISSION.CLASSES_VIEW,   label: 'View Classes',   description: 'View class, section, and subject structure' },
      { name: PERMISSION.CLASSES_CREATE, label: 'Create Classes', description: 'Create new classes and sections' },
      { name: PERMISSION.CLASSES_EDIT,   label: 'Edit Classes',   description: 'Modify class details and subjects' },
      { name: PERMISSION.CLASSES_DELETE, label: 'Delete Classes', description: 'Remove classes and sections' },
    ],
  },
  {
    key   : 'reports',
    label : 'Reports',
    permissions: [
      { name: PERMISSION.REPORTS_FEES,       label: 'Fee Reports',         description: 'Access fee collection reports' },
      { name: PERMISSION.REPORTS_ATTENDANCE, label: 'Attendance Reports',  description: 'Access attendance analysis' },
      { name: PERMISSION.REPORTS_RESULTS,    label: 'Result Reports',      description: 'Access academic result reports' },
      { name: PERMISSION.REPORTS_EXPORT,     label: 'Export Reports',      description: 'Download reports as PDF or Excel' },
    ],
  },
  {
    key   : 'users',
    label : 'Users',
    permissions: [
      { name: PERMISSION.USERS_VIEW,        label: 'View Users',       description: 'View user list and profiles' },
      { name: PERMISSION.USERS_CREATE,      label: 'Create Users',     description: 'Create new user accounts' },
      { name: PERMISSION.USERS_EDIT,        label: 'Edit Users',       description: 'Modify user account details' },
      { name: PERMISSION.USERS_DELETE,      label: 'Delete Users',     description: 'Deactivate and delete users' },
      { name: PERMISSION.USERS_PERMISSIONS, label: 'Edit Permissions', description: 'Assign and revoke user permissions' },
    ],
  },
  {
    key   : 'audit',
    label : 'Audit',
    permissions: [
      { name: PERMISSION.AUDIT_VIEW,   label: 'View Audit Logs',    description: 'View all system audit trail entries' },
      { name: PERMISSION.AUDIT_EXPORT, label: 'Export Audit Logs',  description: 'Download audit log as CSV or PDF' },
    ],
  },
  {
    key   : 'notices',
    label : 'Notices',
    permissions: [
      { name: PERMISSION.NOTICES_VIEW,        label: 'View Notices',        description: 'View notice board and announcements' },
      { name: PERMISSION.NOTICES_POST,        label: 'Post Notices',        description: 'Create and publish notices' },
      { name: PERMISSION.NOTICES_ALL_CLASSES, label: 'Post to All Classes', description: 'Send school-wide notices' },
      { name: PERMISSION.NOTICES_EDIT,        label: 'Edit Notices',        description: 'Edit published notices' },
      { name: PERMISSION.NOTICES_DELETE,      label: 'Delete Notices',      description: 'Delete notice board entries' },
    ],
  },
]

// ── Template presets ──────────────────────────────────────────────────────
export const PERMISSION_TEMPLATES = {
  class_teacher: {
    label: 'Class Teacher',
    permissions: [
      PERMISSION.STUDENTS_VIEW,
      PERMISSION.ATTENDANCE_VIEW, PERMISSION.ATTENDANCE_MARK, PERMISSION.ATTENDANCE_EDIT,
      PERMISSION.RESULTS_VIEW, PERMISSION.RESULTS_ENTER,
      PERMISSION.NOTICES_VIEW, PERMISSION.NOTICES_POST,
      PERMISSION.CLASSES_VIEW,
    ],
  },
  subject_teacher: {
    label: 'Subject Teacher',
    permissions: [
      PERMISSION.STUDENTS_VIEW,
      PERMISSION.ATTENDANCE_VIEW, PERMISSION.ATTENDANCE_MARK,
      PERMISSION.RESULTS_VIEW, PERMISSION.RESULTS_ENTER,
      PERMISSION.NOTICES_VIEW, PERMISSION.CLASSES_VIEW,
    ],
  },
  admin_assistant: {
    label: 'Admin Assistant',
    permissions: [
      PERMISSION.STUDENTS_VIEW, PERMISSION.STUDENTS_CREATE, PERMISSION.STUDENTS_EDIT,
      PERMISSION.CLASSES_VIEW,
      PERMISSION.ATTENDANCE_VIEW,
      PERMISSION.NOTICES_VIEW, PERMISSION.NOTICES_POST,
      PERMISSION.USERS_VIEW,
    ],
  },
}
