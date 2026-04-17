// src/api/students.js
import api from './axios'

export const getStudents   = (params)   => api.get('/students', { params })
export const getStudent    = (id)       => api.get(`/students/${id}`)
export const createStudent = (data)     => api.post('/students', data)
export const updateIdentity= (id, data) => api.patch(`/students/${id}/identity`, data)
export const updateProfile = (id, data) => api.patch(`/students/${id}/profile`, data)
export const getHistory    = (id)       => api.get(`/students/${id}/history`)
