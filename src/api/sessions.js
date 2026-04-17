// src/api/sessions.js
import api from './axios'

export const getSessions       = (params) => api.get('/sessions', { params })
export const getCurrentSession = ()       => api.get('/sessions/current')
export const getSession        = (id)     => api.get(`/sessions/${id}`)
export const createSession     = (data)   => api.post('/sessions', data)
export const activateSession   = (id)     => api.patch(`/sessions/${id}/activate`)
export const lockSession       = (id)     => api.patch(`/sessions/${id}/lock`)
export const addHoliday        = (id, data) => api.post(`/sessions/${id}/holidays`, data)
export const getHolidays       = (id)     => api.get(`/sessions/${id}/holidays`)