// src/api/attendance.js
import api from './axios'

const toInt = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : undefined
}

const compact = (value = {}) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
)

export const markBulk = (data = {}) => api.post('/attendance/bulk', {
  ...data,
  session_id: toInt(data.session_id),
  class_id: toInt(data.class_id),
  section_id: toInt(data.section_id),
  records: Array.isArray(data.records)
    ? data.records.map((record) => ({
        ...record,
        enrollment_id: toInt(record.enrollment_id),
      }))
    : [],
})

export const markSingle = (data = {}) => api.post('/attendance/mark', {
  ...data,
  enrollment_id: toInt(data.enrollment_id),
})

export const getEnrollmentAttendance = (enrollmentId, params = {}) =>
  api.get(`/attendance/${enrollmentId}`, { params: compact(params) })

export const getSessionReport = (sessionId, params = {}) =>
  api.get(`/attendance/report/${sessionId}`, {
    params: compact({
      ...params,
      class_id: toInt(params.class_id),
      section_id: toInt(params.section_id),
    }),
  })

export const overrideAttendance = (id, data)        => api.patch(`/attendance/${id}`, data)
export const getClassAttendance = (params = {})     =>
  api.get('/attendance/class', {
    params: compact({
      ...params,
      session_id: toInt(params.session_id),
      class_id: toInt(params.class_id),
      section_id: toInt(params.section_id),
    }),
  })

export const getClassRegister = (params = {}) =>
  api.get('/attendance/register', {
    params: compact({
      ...params,
      session_id: toInt(params.session_id),
      class_id: toInt(params.class_id),
      section_id: toInt(params.section_id),
      month: toInt(params.month),
      year: toInt(params.year),
    }),
  })
