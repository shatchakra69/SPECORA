import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const api = axios.create({ baseURL: BASE })

api.interceptors.request.use(async (config) => {
  // Supabase keeps the session fresh; always send the current access token.
  const { data: { session } } = await supabase.auth.getSession()
  if (session) config.headers.Authorization = `Bearer ${session.access_token}`
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

export const sendChat = (messages, mode, userName, onWake) =>
  withRetry(
    () => api.post('/api/chat', { messages, mode, userName }, { timeout: 90000 }),
    onWake,
  )

// Uploads go straight to Cloudinary; our server only signs the request so the
// API secret never reaches the browser and big files never transit the dyno.
export async function uploadAttachment(file, onWake) {
  const sig = await withRetry(
    () => api.post('/api/uploads/sign', {}, { timeout: 30000 }),
    onWake,
  )
  const { cloudName, apiKey, folder, timestamp, signature } = sig.data

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', apiKey)
  form.append('folder', folder)
  form.append('timestamp', timestamp)
  form.append('signature', signature)

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    form,
    { timeout: 60000 },
  )
  return {
    name: file.name,
    media_type: file.type === 'image/jpg' ? 'image/jpeg' : file.type,
    url: res.data.secure_url,
  }
}
