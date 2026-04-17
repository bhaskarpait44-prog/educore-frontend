// src/api/attendance.js
import api from './axios'

export const markAttendance     = (data)   => api.post('/attendance/mark', data)
export const markBulkAttendance = (data)   => api.post('/attendance/bulk', data)
export const getAttendance      = (enrollmentId, params) =>
  api.get(`/attendance/${enrollmentId}`, { params })
export const getAttendanceReport= (sessionId, params) =>
  api.get(`/attendance/report/${sessionId}`, { params })
export const overrideAttendance = (id, data) => api.patch(`/attendance/${id}`, data)
