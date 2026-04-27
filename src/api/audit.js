// src/api/audit.js
import api from './axios'

export const getAuditLogs    = (params)           => api.get('/audit/logs', { params })
export const getAuditDetail  = (id)               => api.get(`/audit/log/${id}`)
export const getRecordHistory= (table, recordId)  => api.get(`/audit/${table}/${recordId}`)
export const getAdminActivity= (adminId, params)  => api.get(`/audit/admin/${adminId}`, { params })
export const getAdmins       = ()                 => api.get('/audit/admins')
