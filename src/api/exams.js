// src/api/exams.js
import api from './axios'

export const createExam      = (data)          => api.post('/exams', data)
export const enterMarks      = (data)          => api.post('/results/enter', data)
export const getResults      = (enrollmentId)  => api.get(`/results/${enrollmentId}`)
export const calculateResult = (data)          => api.post('/results/calculate', data)
export const overrideResult  = (data)          => api.patch('/results/override', data)
