// src/api/auth.js
import api from './axios'

export const login          = (data) => api.post('/auth/login', data)
export const studentLogin   = (data) => api.post('/auth/student/login', data)
export const forgotPassword = (data) => api.post('/auth/forgot-password', data)
export const resetPassword  = (data) => api.post('/auth/reset-password', data)
export const refreshToken   = (data) => api.post('/auth/refresh', data)
