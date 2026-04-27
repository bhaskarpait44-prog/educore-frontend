import api from './axios'

export const getSubjects = (classId) =>
  api.get(`/classes/${classId}/subjects`)

export const getSubjectById = (classId, subjectId) =>
  api.get(`/classes/${classId}/subjects/${subjectId}`)

export const createSubject = (classId, data) =>
  api.post(`/classes/${classId}/subjects`, data)

export const updateSubject = (classId, subjectId, data) =>
  api.patch(`/classes/${classId}/subjects/${subjectId}`, data)

export const deleteSubject = (classId, subjectId, reason = '', options = {}) =>
  api.delete(`/classes/${classId}/subjects/${subjectId}`, { data: { reason, ...options } })

export const reorderSubjects = (classId, subject_orders) =>
  api.patch(`/classes/${classId}/subjects/reorder`, { subject_orders })
