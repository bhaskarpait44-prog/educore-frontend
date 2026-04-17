// src/types/index.js
// JSDoc type definitions — used for IDE autocomplete without TypeScript

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {number} school_id
 * @property {string} name
 * @property {string} email
 * @property {'admin'|'teacher'|'accountant'|'staff'} role
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {*}       data
 * @property {string}  message
 * @property {string[]} errors
 */

/**
 * @typedef {Object} Session
 * @property {number}  id
 * @property {string}  name
 * @property {string}  start_date
 * @property {string}  end_date
 * @property {'upcoming'|'active'|'locked'|'closed'|'archived'} status
 * @property {boolean} is_current
 */

/**
 * @typedef {Object} Student
 * @property {number} id
 * @property {number} school_id
 * @property {string} admission_no
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} date_of_birth
 * @property {'male'|'female'|'other'} gender
 * @property {boolean} is_deleted
 */

/**
 * @typedef {Object} Enrollment
 * @property {number} id
 * @property {number} student_id
 * @property {number} session_id
 * @property {number} class_id
 * @property {number} section_id
 * @property {string} roll_number
 * @property {string} joined_date
 * @property {'fresh'|'promoted'|'failed'|'transfer_in'|'rejoined'} joining_type
 * @property {'active'|'inactive'} status
 */

/**
 * @typedef {Object} Toast
 * @property {number} id
 * @property {string} message
 * @property {'success'|'error'|'warning'|'info'} type
 * @property {number} duration
 */

export {} // Makes this a module
