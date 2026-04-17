// src/api/axios.js
import axios from 'axios'
import { STORAGE_KEYS } from '@/constants/app'

const api = axios.create({
  baseURL : import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout : 15000,
  headers : { 'Content-Type': 'application/json' },
})

// ── Track if we're already refreshing (prevent parallel refresh storms) ───
let isRefreshing = false
let failedQueue  = []   // Requests waiting while refresh is in progress

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else       prom.resolve(token)
  })
  failedQueue = []
}

// ── Request interceptor — inject access token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — handle 401 + auto refresh ─────────────────────
api.interceptors.response.use(
  // Success: unwrap to { success, data, message, errors }
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config
    const status          = error.response?.status
    const message         = error.response?.data?.message || error.message
    const errors          = error.response?.data?.errors  || []

    // ── 401 handling ──────────────────────────────────────────────────────
    if (status === 401 && !originalRequest._retry) {
      const refreshTkn = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      // No refresh token → go to login immediately
      if (!refreshTkn) {
        clearAuthAndRedirect()
        return Promise.reject({ status, message, errors })
      }

      // Already refreshing — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      // Start refresh
      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshTkn }
        )
        const { token: newToken, refresh_token: newRefresh } = response.data.data

        // Store new tokens
        localStorage.setItem(STORAGE_KEYS.TOKEN, newToken)
        if (newRefresh) localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefresh)

        // Update default header
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`

        processQueue(null, newToken)
        isRefreshing = false

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)

      } catch (refreshError) {
        // Refresh failed → clear everything and send to login
        processQueue(refreshError, null)
        isRefreshing = false
        clearAuthAndRedirect()
        return Promise.reject({ status: 401, message: 'Session expired. Please log in again.', errors: [] })
      }
    }

    return Promise.reject({ status, message, errors, raw: error })
  }
)

const clearAuthAndRedirect = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export default api