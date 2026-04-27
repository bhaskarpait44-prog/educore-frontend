// src/utils/helpers.js
// Pure utility functions — no side effects

/**
 * Merge class names conditionally (lightweight clsx alternative)
 * Usage: cn('base', condition && 'extra', { 'active': isActive })
 */
export const cn = (...args) => {
  return args
    .flatMap((arg) => {
      if (!arg) return []
      if (typeof arg === 'string') return [arg]
      if (Array.isArray(arg)) return arg
      if (typeof arg === 'object') {
        return Object.entries(arg)
          .filter(([, v]) => v)
          .map(([k]) => k)
      }
      return []
    })
    .join(' ')
}

/**
 * Format a date string to a readable format
 * @param {string|Date} date
 * @param {'short'|'long'|'numeric'} style
 */
export const formatDate = (date, style = 'short') => {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d)) return '—'

  const options = {
    short  : { day: '2-digit', month: 'short', year: 'numeric' },
    long   : { day: '2-digit', month: 'long',  year: 'numeric' },
    numeric: { day: '2-digit', month: '2-digit', year: 'numeric' },
  }
  return d.toLocaleDateString('en-IN', options[style] || options.short)
}

/**
 * Format a number as Indian currency
 * @param {number} amount
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-IN', {
    style   : 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a percentage value
 * @param {number} value
 * @param {number} decimals
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '—'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Get initials from a full name
 * @param {string} name
 */
export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

/**
 * Truncate a string to a max length
 */
export const truncate = (str, max = 40) => {
  if (!str || str.length <= max) return str
  return str.slice(0, max) + '…'
}

/**
 * Capitalize first letter of each word
 */
export const titleCase = (str) => {
  if (!str) return ''
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Convert snake_case or kebab-case to Title Case
 */
export const labelFromKey = (key) => {
  if (!key) return ''
  return key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Debounce a function call
 */
export const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

const EXAM_TYPE_LABELS = {
  term: 'Exam',
  midterm: 'Unit 2',
  final: 'Final',
  compartment: 'Compartment',
}

export const getExamTypeLabel = (examType, examName = '') => {
  const normalizedName = String(examName || '').trim().toLowerCase()
  if (normalizedName.includes('unit 1')) return 'Unit 1'
  if (normalizedName.includes('unit 2')) return 'Unit 2'
  if (normalizedName.includes('half yearly')) return 'Half Yearly'
  if (normalizedName.includes('unit 3')) return 'Unit 3'
  if (normalizedName.includes('final')) return 'Final'
  return EXAM_TYPE_LABELS[examType] || titleCase(String(examType || 'Exam'))
}
