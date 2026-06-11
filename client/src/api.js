import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('blc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// The free backend spins down when idle and can answer with network errors or
// 502/503 while waking up. Retry with growing delays before giving up.
async function withRetry(fn, onWake) {
  const delays = [3000, 8000, 15000]
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err.response?.status
      const retryable = !status || status === 502 || status === 503
      if (!retryable || attempt >= delays.length) throw err
      if (attempt === 0) onWake?.()
      await new Promise((r) => setTimeout(r, delays[attempt]))
    }
  }
}

export const signup = (email, password, onWake) =>
  withRetry(() => api.post('/api/auth/signup', { email, password }, { timeout: 30000 }), onWake)

export const login = (email, password, onWake) =>
  withRetry(() => api.post('/api/auth/login', { email, password }, { timeout: 30000 }), onWake)

export const sendChat = (messages, mode, onWake) =>
  withRetry(() => api.post('/api/chat', { messages, mode }, { timeout: 90000 }), onWake)

export const getSession = () => {
  const token = localStorage.getItem('blc_token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) return null
    return { email: payload.email }
  } catch {
    return null
  }
}

export const storeSession = (token) => localStorage.setItem('blc_token', token)
export const clearSession = () => localStorage.removeItem('blc_token')
