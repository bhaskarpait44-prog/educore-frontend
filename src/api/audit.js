// src/api/audit.js
import api from './axios'

export const getAuditHistory = (table, recordId) =>
  api.get(`/audit/${table}/${recordId}`)

export const getAdminAudit = (adminId, params) =>
  api.get(`/audit/admin/${adminId}`, { params })
