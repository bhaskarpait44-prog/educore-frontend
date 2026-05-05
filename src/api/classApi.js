// src/api/classApi.js
import api from './axios'

const formatStreamLabel = (stream) => {
  if (!stream) return null
  const label = `${stream.charAt(0).toUpperCase()}${stream.slice(1)}`
  return stream === 'regular' ? label : `${label} Stream`
}

// ── Classes ───────────────────────────────────────────────────────────────
export const getClasses = (params = {}) =>
  api.get('/classes', { params })

export const getClassList = (response) => {
  const data = response?.data
  if (Array.isArray(data)) return data
  return data?.classes || []
}

export const getClassOptions = (response) =>
  getClassList(response).map(c => ({
    value: String(c.id),
    label: [c.name, formatStreamLabel(c.stream)].filter(Boolean).join(' - '),
    stream: c.stream || null,
  }))

export const getClassTeachers = () =>
  api.get('/classes/teachers')

export const getClassById = (id) =>
  api.get(`/classes/${id}`)

export const downloadClassStudentsPdf = (id, params = {}) =>
  api.get(`/classes/${id}/students/pdf`, { params, responseType: 'blob' })

export const createClass = (data) =>
  api.post('/classes', data)

export const updateClass = (id, data) =>
  api.patch(`/classes/${id}`, data)

export const deleteClass = (id, reason, options = {}) =>
  api.delete(`/classes/${id}`, { data: { reason, ...options } })

export const toggleClassActive = (id) =>
  api.patch(`/classes/${id}/toggle`)

// ── Sections ──────────────────────────────────────────────────────────────
export const getSections = (classId) =>
  api.get(`/classes/${classId}/sections`)

export const createSection = (classId, data) =>
  api.post(`/classes/${classId}/sections`, data)

export const updateSection = (classId, sectionId, data) =>
  api.patch(`/classes/${classId}/sections/${sectionId}`, data)

export const deleteSection = (classId, sectionId) =>
  api.delete(`/classes/${classId}/sections/${sectionId}`)

// ── Subjects ───────────────────────────────────────────────────────────────
export const getSubjects = (classId) =>
  api.get(`/classes/${classId}/subjects`)

export const getSubjectList = (response) => {
  const data = response?.data
  return Array.isArray(data) ? data : (data?.subjects || [])
}
