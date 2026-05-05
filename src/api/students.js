// src/api/students.js
import api from './axios'

export const getStudents    = (params)     => api.get('/students', { params })
export const getStudent     = (id)         => api.get(`/students/${id}`)
export const createStudent  = (data)       => api.post('/students', data)
export const deleteStudent  = (id, data)   => api.delete(`/students/${id}`, { data })
export const updateIdentity = (id, data)   => api.patch(`/students/${id}/identity`, data)
export const updateProfile  = (id, data)   => api.patch(`/students/${id}/profile`, data)
export const resetPassword  = (id, data)   => api.post(`/students/${id}/reset-password`, data)
export const getHistory     = (id)         => api.get(`/students/${id}/history`)
export const getAuditLog    = (table, id)  => api.get(`/audit/${table}/${id}`)

// ── Documents ─────────────────────────────────────────────────────────────
export const getDocuments   = (id)         => api.get(`/students/${id}/documents`)
export const uploadDocument = (id, data)   => api.post(`/students/${id}/documents`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteDocument = (id, docId)  => api.delete(`/students/${id}/documents/${docId}`)

export const createEnrollment = (data)     => api.post('/enrollments', data)
export const getClasses     = ()           => api.get('/classes')
export const getSections    = (classId)    => api.get(`/sections?class_id=${classId}`)
