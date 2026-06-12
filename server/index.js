import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import Anthropic from '@anthropic-ai/sdk'
import { createHash } from 'node:crypto'

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*'

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '25mb' }))

const anthropic = new Anthropic({
  apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY,
})

// ---------------------------------------------------------------------------
// Auth (Supabase)
// Accounts live in Supabase (email/password + Google). The client sends the
// Supabase access token; we validate it against the Supabase Auth API and
// cache the result briefly so chat requests don't pay a lookup every time.
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('SUPABASE_URL / SUPABASE_ANON_KEY not set: all requests will be rejected.')
}

const TOKEN_CACHE_TTL = 60 * 1000
const tokenCache = new Map() // access token -> { email, expires }

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Please log in to chat.' })
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'Auth is not configured on the server.' })
  }

  const cached = tokenCache.get(token)
  if (cached && cached.expires > Date.now()) {
    req.user = { email: cached.email }
    return next()
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) {
      return res.status(401).json({ error: 'Your session expired. Please log in again.' })
    }
    const user = await resp.json()
    if (!user?.email) {
      return res.status(401).json({ error: 'Your session expired. Please log in again.' })
    }
    if (tokenCache.size > 1000) {
      tokenCache.delete(tokenCache.keys().next().value)
    }
    tokenCache.set(token, { email: user.email, expires: Date.now() + TOKEN_CACHE_TTL })
    req.user = { email: user.email }
    next()
  } catch (err) {
    console.error('Auth check failed:', err.message)
    res.status(503).json({ error: 'Could not verify your session. Please try again.' })
  }
}

// ---------------------------------------------------------------------------
// Uploads (Cloudinary)
// The client uploads files directly to Cloudinary so large attachments never
// transit this server. We only hand out a short-lived signature; the API
// secret stays here.
// ---------------------------------------------------------------------------
const CLOUDINARY = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
}
const UPLOAD_FOLDER = 'specora'

app.post('/api/uploads/sign', requireAuth, (req, res) => {
  if (!CLOUDINARY.cloudName || !CLOUDINARY.apiKey || !CLOUDINARY.apiSecret) {
    return res.status(503).json({ error: 'File uploads are not configured on the server.' })
  }
  const timestamp = Math.floor(Date.now() / 1000)
  // Cloudinary signature: sha1 of the alphabetically sorted params + secret.
  const signature = createHash('sha1')
    .update(`folder=${UPLOAD_FOLDER}&timestamp=${timestamp}${CLOUDINARY.apiSecret}`)
    .digest('hex')
  res.json({
    cloudName: CLOUDINARY.cloudName,
    apiKey: CLOUDINARY.apiKey,
    folder: UPLOAD_FOLDER,
    timestamp,
    signature,
  })
})

// Only fetch attachments from our own Cloudinary account, never arbitrary URLs.
const isCloudinaryUrl = (value) => {
  if (!CLOUDINARY.cloudName) return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'res.cloudinary.com' &&
      url.pathname.startsWith(`/${CLOUDINARY.cloudName}/`)
    )
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.email || ipKeyGenerator(req.ip),
  message: { error: 'Too many requests. Please try again later.' },
})

const MAX_MESSAGES = 15
const MAX_MESSAGE_LENGTH = 8000
const MAX_ATTACHMENTS = 3
const MAX_ATTACHMENT_BYTES = 4.5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const STYLE_RULES = `STYLE RULES (always follow, top priority):
Write like a thoughtful human, not an AI. Use contractions and a warm, natural voice with varied sentence lengths.
NEVER use em dashes (—), en dashes (–), or double hyphens (--) anywhere. Use commas, periods, colons, or parentheses instead.
Use **bold** to stress the most important words, key terms, and takeaways, and use bold headings for longer answers.
Don't open with filler like "Great question!" or "Certainly!". Skip robotic transitions like "Furthermore" or "Moreover".
Use markdown only when it genuinely helps (lists, code blocks, headings for long answers). An occasional emoji is fine when it fits, never more than one or two.`

const MODES = {
  chat: `You are SPECORA, a sharp, friendly AI assistant. Be genuinely helpful and concise by default, going deeper when asked.`,
  homework: `You are SPECORA in Homework mode, a patient tutor. Explain concepts step by step, show the working before the final answer, and make sure the student actually understands rather than just copying. Use simple language and small examples.`,
  research: `You are SPECORA in Research mode. Give structured, thorough answers: key takeaways first, then details in clear sections. Be honest about uncertainty and point out what's worth double-checking.`,
  humanizer: `You are SPECORA in Humanizer mode. The user gives you text (often AI-sounding) and you rewrite it so it reads like a real person wrote it: varied sentence lengths, natural flow, simple words, no clichés, no robotic transitions, no buzzwords. Keep the meaning, change the voice. Return only the rewritten text unless asked otherwise.`,
  code: `You are SPECORA in Code mode, a pragmatic senior engineer. Give working code with brief explanations, point out pitfalls, and prefer the simplest solution that works.`,
  creative: `You are SPECORA in Creative mode, an imaginative writing partner for stories, captions, scripts, names, and brainstorms. Be vivid, specific, and original, never generic.`,
}

// Strip any dash punctuation the model sneaks through. Keeps single hyphens
// inside words (well-known), list markers, and markdown rules intact.
const humanizeReply = (text) =>
  text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/ -- /g, ', ')
    .replace(/,\s*([,.!?;:])/g, '$1')
    .replace(/,\s*,/g, ', ')

const buildContent = (msg) => {
  const blocks = []
  for (const att of msg.attachments ?? []) {
    const isPdf = att?.media_type === 'application/pdf'
    const isImage = IMAGE_TYPES.includes(att?.media_type)
    if (!isPdf && !isImage) continue
    const source = att.url
      ? { type: 'url', url: att.url }
      : att.data
        ? { type: 'base64', media_type: att.media_type, data: att.data }
        : null
    if (!source) continue
    blocks.push(isPdf ? { type: 'document', source } : { type: 'image', source })
  }
  const text = (msg.content || '').trim() || 'See the attached file.'
  if (blocks.length === 0) return text
  blocks.push({ type: 'text', text })
  return blocks
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/chat', requireAuth, chatLimiter, async (req, res) => {
  try {
    const { messages, mode } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({
        error: 'This conversation hit its length limit. Start a new chat to keep going.',
      })
    }

    for (const msg of messages) {
      if (
        typeof msg.content !== 'string' ||
        msg.content.length > MAX_MESSAGE_LENGTH ||
        !['user', 'assistant'].includes(msg.role)
      ) {
        return res.status(400).json({ error: 'Invalid message format' })
      }
      if (msg.attachments) {
        if (!Array.isArray(msg.attachments) || msg.attachments.length > MAX_ATTACHMENTS) {
          return res.status(400).json({ error: 'Too many attachments (max 3 per message).' })
        }
        for (const att of msg.attachments) {
          if (!att?.url && !att?.data) continue
          const validType =
            att.media_type === 'application/pdf' || IMAGE_TYPES.includes(att.media_type)
          if (!validType) {
            return res.status(400).json({ error: 'Only images and PDF files are supported.' })
          }
          if (att.url && !isCloudinaryUrl(att.url)) {
            return res.status(400).json({ error: 'Invalid attachment URL.' })
          }
          if (att.data && att.data.length * 0.75 > MAX_ATTACHMENT_BYTES) {
            return res.status(400).json({ error: 'Attachments must be under 4 MB each.' })
          }
        }
      }
    }

    const userName =
      typeof req.body.userName === 'string'
        ? req.body.userName.replace(/[\r\n]/g, ' ').trim().slice(0, 40)
        : ''

    let system = `${MODES[mode] ?? MODES.chat}\n\n${STYLE_RULES}`
    if (userName) {
      system += `\n\nThe user's name is ${userName}. Address them by name when it feels natural, without overdoing it.`
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: buildContent(msg),
      })),
    })

    const reply = response.content?.find((b) => b.type === 'text')?.text ?? ''
    res.json({ reply: humanizeReply(reply) })
  } catch (err) {
    console.error(err)
    if (err.status === 429 || err.status === 529) {
      return res.status(503).json({ error: 'The AI is a bit busy right now. Try again in a moment.' })
    }
    res.status(500).json({ error: 'The AI had trouble answering. Please try again.' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`SPECORA server running on port ${PORT}`))
