// src/api/fees.js
import api from './axios'

export const createFeeStructure  = (data)          => api.post('/fees/structure', data)
export const getFeeStructures    = (params)         => api.get('/fees/structures', { params })
export const deleteFeeStructure  = (id)             => api.delete(`/fees/structure/${id}`)
export const getStudentFees      = (enrollmentId)   => api.get(`/fees/${enrollmentId}`)
export const recordPayment       = (data)           => api.post('/fees/payment', data)
export const carryForwardFees    = (data)           => api.post('/fees/carry-forward', data)
export const generateInvoices    = (data)           => api.post('/fees/generate', data)
export const getFeeReport        = (params)         => api.get('/fees/report', { params })