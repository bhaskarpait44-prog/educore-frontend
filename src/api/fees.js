// src/api/fees.js
import api from './axios'

export const createFeeStructure = (data)         => api.post('/fees/structure', data)
export const generateInvoices   = (data)         => api.post('/fees/generate', data)
export const getStudentFees     = (enrollmentId) => api.get(`/fees/${enrollmentId}`)
export const recordPayment      = (data)         => api.post('/fees/payment', data)
export const carryForwardFees   = (data)         => api.post('/fees/carry-forward', data)
