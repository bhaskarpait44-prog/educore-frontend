// src/api/classes.js
import api from './axios'

export const getClasses  = ()         => api.get('/classes')
export const getSections = (classId)  => api.get(`/sections?class_id=${classId}`)