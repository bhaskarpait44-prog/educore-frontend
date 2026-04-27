// src/api/exams.js
import api from './axios'

export const getExams         = (params)  => api.get('/exams', { params })
export const createExam       = (data)    => api.post('/exams', data)
export const updateExamStatus = (id,data) => api.patch(`/exams/${id}`, data)
export const getExamSubjects  = (id)      => api.get(`/exams/${id}/subjects`)
export const approveAllExamSubjects = (id) => api.patch(`/exams/${id}/subjects/approve-all`)
export const reviewExamSubject = (examId, subjectId, data) => api.patch(`/exams/${examId}/subjects/${subjectId}/review`, data)
export const deleteExam       = (id)      => api.delete(`/exams/${id}`)
export const getSubjects      = (classId) => api.get(`/subjects?class_id=${classId}`)
export const enterMarks       = (data)    => api.post('/results/enter', data)
export const getResults       = (enrollmentId) => api.get(`/results/${enrollmentId}`)
export const getClassResults  = (params)  => api.get('/results/class', { params })
export const calculateResults = (data)    => api.post('/results/calculate', data)
export const overrideResult   = (data)    => api.patch('/results/override', data)
export const overrideExamMark = (data)    => api.patch('/results/marks/override', data)
export const deleteResult     = (enrollmentId, sessionId) => api.delete(`/results/${enrollmentId}`, { params: { session_id: sessionId } })
export const promoteStudents  = (data)    => api.post('/enrollments/promote', data)
