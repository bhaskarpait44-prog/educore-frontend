// src/api/attendance.js
import api from './axios'

export const markBulk           = (data)            => api.post('/attendance/bulk', data)
export const markSingle         = (data)            => api.post('/attendance/mark', data)
export const getEnrollmentAttendance = (enrollmentId, params) =>
  api.get(`/attendance/${enrollmentId}`, { params })
export const getSessionReport   = (sessionId, params) =>
  api.get(`/attendance/report/${sessionId}`, { params })
export const overrideAttendance = (id, data)        => api.patch(`/attendance/${id}`, data)
export const getClassAttendance = (params)          => api.get('/attendance/class', { params })