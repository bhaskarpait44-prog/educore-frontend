// src/utils/validations.js
// Zod schemas for all forms — imported by React Hook Form pages

import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email   : z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ── Student ───────────────────────────────────────────────────────────────
export const studentAdmitSchema = z.object({
  admission_no : z.string().min(1, 'Admission number is required'),
  first_name   : z.string().min(1, 'First name is required'),
  last_name    : z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender       : z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required',
  }),
})

export const studentIdentitySchema = z.object({
  first_name   : z.string().min(1).optional(),
  last_name    : z.string().min(1).optional(),
  date_of_birth: z.string().optional(),
  gender       : z.enum(['male', 'female', 'other']).optional(),
  reason       : z.string().min(10, 'Reason must be at least 10 characters'),
})

// ── Session ───────────────────────────────────────────────────────────────
export const sessionSchema = z.object({
  name      : z.string().min(1, 'Session name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date  : z.string().min(1, 'End date is required'),
}).refine((d) => new Date(d.end_date) > new Date(d.start_date), {
  message: 'End date must be after start date',
  path   : ['end_date'],
})

// ── Attendance ────────────────────────────────────────────────────────────
export const attendanceSchema = z.object({
  enrollment_id: z.number().int().positive(),
  date         : z.string().min(1, 'Date is required'),
  status       : z.enum(['present', 'absent', 'late', 'half_day', 'holiday']),
  method       : z.enum(['biometric', 'manual', 'auto']),
})

// ── Fee payment ───────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  invoice_id    : z.number().int().positive(),
  amount        : z.string().min(1, 'Amount is required'),
  payment_date  : z.string().min(1, 'Payment date is required'),
  payment_mode  : z.enum(['cash', 'online', 'cheque', 'dd']),
  transaction_ref: z.string().optional(),
})

// ── Result override ───────────────────────────────────────────────────────
export const resultOverrideSchema = z.object({
  enrollment_id: z.number().int().positive(),
  new_result   : z.enum(['pass', 'fail', 'compartment', 'detained']),
  reason       : z.string().min(10, 'Reason must be at least 10 characters'),
})
