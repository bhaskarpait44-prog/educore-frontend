// src/store/feeStore.js
import { create } from 'zustand'
import * as api from '@/api/fees'

const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const normalizeInvoice = (invoice = {}) => {
  const amountDue = toNumber(invoice.amount_due)
  const amountPaid = toNumber(invoice.amount_paid)
  const lateFee = toNumber(invoice.late_fee_amount)
  const concession = toNumber(invoice.concession_amount)
  const balance = toNumber(
    invoice.balance ??
    invoice.balance_remaining ??
    (amountDue + lateFee - concession - amountPaid)
  )

  return {
    ...invoice,
    fee_name: invoice.fee_name || invoice.fee_type_name || invoice.name || 'Fee',
    amount_due: amountDue,
    amount_paid: amountPaid,
    late_fee_amount: lateFee,
    concession_amount: concession,
    balance,
    balance_remaining: balance,
  }
}

const normalizeStudentFeesPayload = (payload = {}) => {
  const invoices = Array.isArray(payload.invoices) ? payload.invoices.map(normalizeInvoice) : []
  const totalDue = toNumber(payload.summary?.total_due)
  const totalPaid = toNumber(payload.summary?.total_paid)
  const totalBalance = toNumber(
    payload.summary?.total_balance ??
    invoices.reduce((sum, invoice) => sum + toNumber(invoice.balance), 0)
  )

  return {
    ...payload,
    invoices,
    summary: {
      ...payload.summary,
      total_due: totalDue,
      total_paid: totalPaid,
      total_balance: totalBalance,
      pending_count: Number(payload.summary?.pending_count || 0),
    },
  }
}

const useFeeStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────────
  structures    : [],
  studentFees   : null,   // { invoices: [], summary: {} }
  report        : null,
  isLoading     : false,
  isSaving      : false,
  error         : null,

  // ── Fee structures ──────────────────────────────────────────────────
  fetchStructures: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getFeeStructures(params)
      const data = Array.isArray(res.data) ? res.data : (res.data?.structures || res.data?.data || [])
      set({ structures: data, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  createStructure: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.createFeeStructure(data)
      set(s => ({ structures: [...s.structures, res.data], isSaving: false }))
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  deleteStructure: async (id) => {
    set({ isSaving: true })
    try {
      await api.deleteFeeStructure(id)
      set(s => ({ structures: s.structures.filter(f => f.id !== id), isSaving: false }))
      return { success: true }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Student fees ────────────────────────────────────────────────────
  fetchStudentFees: async (enrollmentId) => {
    set({ isLoading: true, error: null, studentFees: null })
    try {
      const res = await api.getStudentFees(enrollmentId)
      const data = normalizeStudentFeesPayload(res.data)
      set({ studentFees: data, isLoading: false })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // ── Record payment ──────────────────────────────────────────────────
  recordPayment: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.recordPayment(data)
      // Refresh student fees after payment
      if (data.enrollment_id) {
        const fees = await api.getStudentFees(data.enrollment_id)
        set({ studentFees: normalizeStudentFeesPayload(fees.data), isSaving: false })
      } else {
        set({ isSaving: false })
      }
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Carry forward ───────────────────────────────────────────────────
  carryForward: async (data) => {
    set({ isSaving: true })
    try {
      const res = await api.carryForwardFees(data)
      set({ isSaving: false })
      return { success: true, data: res.data }
    } catch (err) {
      set({ isSaving: false })
      return { success: false, message: err.message }
    }
  },

  // ── Fee collection report ───────────────────────────────────────────
  fetchReport: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.getFeeReport(params)
      set({ report: res.data, isLoading: false })
      return res.data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  clearStudentFees: () => set({ studentFees: null }),
}))

export default useFeeStore
