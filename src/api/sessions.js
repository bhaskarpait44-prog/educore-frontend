// src/api/sessions.js
import api from './axios'

export const getSessions    = ()         => api.get('/sessions')
export const getCurrentSession = ()      => api.get('/sessions/current')
export const createSession  = (data)     => api.post('/sessions', data)
export const activateSession= (id)       => api.patch(`/sessions/${id}/activate`)
export const addHoliday     = (id, data) => api.post(`/sessions/${id}/holidays`, data)
