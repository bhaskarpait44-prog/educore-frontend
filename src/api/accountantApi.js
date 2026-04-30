import api from './axios'

export const getAccountantDashboard = (params) => api.get('/accountant/dashboard', { params })
export const getTodayStats = (params) => api.get('/accountant/dashboard/today-stats', { params })
export const getRecentTransactions = (params) => api.get('/accountant/dashboard/recent-transactions', { params })
export const getPendingTasks = (params) => api.get('/accountant/dashboard/pending-tasks', { params })
export const getWeekTrend = (params) => api.get('/accountant/dashboard/week-trend', { params })

export const searchStudents = (params) => api.get('/accountant/students/search', { params })
export const getStudentPendingInvoices = (id, params) => api.get(`/accountant/students/${id}/pending-invoices`, { params })
export const collectFees = (data) => api.post('/accountant/collect', data)
export const getReceipt = (id) => api.get(`/accountant/receipt/${id}`)
export const getReceiptPdf = (id) => api.get(`/accountant/receipt/${id}/pdf`, { responseType: 'blob' })

export const getStudentFeesList = (params) => api.get('/accountant/students', { params })
export const getStudentFeesDetail = (id, params) => api.get(`/accountant/students/${id}/fees`, { params })
export const getStudentInvoices = (id, params) => api.get(`/accountant/students/${id}/invoices`, { params })
export const getStudentPayments = (id, params) => api.get(`/accountant/students/${id}/payments`, { params })
export const getStudentStatementPdf = (id, params) => api.get(`/accountant/students/${id}/statement/pdf`, { params, responseType: 'blob' })

export const getFeeStructure = (params) => api.get('/accountant/fee-structure', { params })
export const createFeeStructure = (data) => api.post('/accountant/fee-structure', data)
export const updateFeeStructure = (id, data) => api.patch(`/accountant/fee-structure/${id}`, data)
export const deleteFeeStructure = (id) => api.delete(`/accountant/fee-structure/${id}`)
export const generateFeeInvoices = (data) => api.post('/accountant/fee-structure/generate-invoices', data)
export const copyFeeStructure = (data) => api.post('/accountant/fee-structure/copy-from-session', data)

export const getInvoices = (params) => api.get('/accountant/invoices', { params })
export const getOverdueInvoices = (params) => api.get('/accountant/invoices/overdue', { params })
export const getDueTodayInvoices = (params) => api.get('/accountant/invoices/due-today', { params })

export const getReceipts = (params) => api.get('/accountant/receipts', { params })
export const getReceiptById = (id) => api.get(`/accountant/receipts/${id}`)
export const getReceiptByIdPdf = (id) => api.get(`/accountant/receipts/${id}/pdf`, { responseType: 'blob' })
export const duplicateReceipt = (id) => api.post(`/accountant/receipts/${id}/duplicate`)
export const emailReceipt = (id) => api.post(`/accountant/receipts/${id}/email`)
export const whatsappReceipt = (id) => api.post(`/accountant/receipts/${id}/whatsapp`)

export const getDefaulters = (params) => api.get('/accountant/defaulters', { params })
export const sendReminder = (data) => api.post('/accountant/defaulters/remind', data)
export const sendReminderBulk = (data) => api.post('/accountant/defaulters/remind-bulk', data)

export const getConcessions = (params) => api.get('/accountant/concessions', { params })
export const applyConcession = (data) => api.post('/accountant/concessions/apply', data)
export const getConcessionReport = (params) => api.get('/accountant/concessions/report', { params })

export const getDailyReport = (params) => api.get('/accountant/reports/daily', { params })
export const getMonthlyReport = (params) => api.get('/accountant/reports/monthly', { params })
export const getClasswiseReport = (params) => api.get('/accountant/reports/classwise', { params })
export const getSessionReport = (params) => api.get('/accountant/reports/session', { params })
export const getDefaulterReport = (params) => api.get('/accountant/reports/defaulters', { params })
export const getConcessionsReport = (params) => api.get('/accountant/reports/concessions', { params })
export const buildCustomReport = (data) => api.post('/accountant/reports/custom', data)

export const getCarryForwardEligible = (params) => api.get('/accountant/carry-forward/eligible', { params })
export const carryForwardSingle = (data) => api.post('/accountant/carry-forward/single', data)
export const carryForwardBulk = (data) => api.post('/accountant/carry-forward/bulk', data)

export const getRefunds = (params) => api.get('/accountant/refunds', { params })
export const processRefund = (data) => api.post('/accountant/refunds/process', data)
export const getRefundReport = (params) => api.get('/accountant/refunds/report', { params })

export const getCheques = (params) => api.get('/accountant/cheques', { params })
export const getPendingCheques = (params) => api.get('/accountant/cheques/pending', { params })
export const clearCheque = (id, data) => api.post(`/accountant/cheques/${id}/clear`, data)
export const bounceCheque = (id, data) => api.post(`/accountant/cheques/${id}/bounce`, data)

export const getAccountantProfile = () => api.get('/accountant/profile')
export const getAccountantActivity = () => api.get('/accountant/profile/activity')
export const changeAccountantPassword = (data) => api.post('/accountant/profile/change-password', data)
