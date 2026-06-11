import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import jwt from 'jsonwebtoken'
import Anthropic from '@anthropic-ai/sdk'
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'
import { readFileSync, writeFile } from 'node:fs'

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*'

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '25mb' }))

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const JWT_SECRET = process.env.JWT_SECRET || 'blc-dev-secret-change-me'

// ---------------------------------------------------------------------------
// Users
// Note: the free hosting tier has an ephemeral disk, so users.json resets on
// redeploys/restarts. Issued JWTs (30 days) keep working across resets because
// only the signing secret is needed to verify them.
// ---------------------------------------------------------------------------
const USERS_FILE = new URL('./users.json', import.meta.url)
let users = {}
try {
  users = JSON.parse(readFileSync(USERS_FILE, 'utf8'))
} catch {
  users = {}
}

const saveUsers = () => {
  writeFile(USERS_FILE, JSON.stringify(users), (err) => {
    if (err) console.error('Failed to persist users:', err.message)
  })
}

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':')
  const hashBuf = Buffer.from(hash, 'hex')
  const testBuf = scryptSync(password, salt, 64)
  return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const issueToken = (email) =>
  jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })

app.post('/api/auth/signup', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }
  if (users[email]) {
    return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' })
  }

  users[email] = { passwordHash: hashPassword(password), createdAt: Date.now() }
  saveUsers()
  res.json({ token: issueToken(email), email })
})

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')

  const user = users[email]
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Wrong email or password.' })
  }
  res.json({ token: issueToken(email), email })
})

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'Please log in to chat.' })
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Your session expired. Please log in again.' })
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
  keyGenerator: (req) => req.user?.email || req.ip,
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
Don't open with filler like "Great question!" or "Certainly!". Skip robotic transitions like "Furthermore" or "Moreover".
Use markdown only when it genuinely helps (lists, code blocks, headings for long answers). An occasional emoji is fine when it fits, never more than one or two.`

const MODES = {
  chat: `You are BLC (Be Like Chakri), a sharp, friendly AI assistant. Be genuinely helpful and concise by default, going deeper when asked.`,
  homework: `You are BLC in Homework mode, a patient tutor. Explain concepts step by step, show the working before the final answer, and make sure the student actually understands rather than just copying. Use simple language and small examples.`,
  research: `You are BLC in Research mode. Give structured, thorough answers: key takeaways first, then details in clear sections. Be honest about uncertainty and point out what's worth double-checking.`,
  humanizer: `You are BLC in Humanizer mode. The user gives you text (often AI-sounding) and you rewrite it so it reads like a real person wrote it: varied sentence lengths, natural flow, simple words, no clichés, no robotic transitions, no buzzwords. Keep the meaning, change the voice. Return only the rewritten text unless asked otherwise.`,
  code: `You are BLC in Code mode, a pragmatic senior engineer. Give working code with brief explanations, point out pitfalls, and prefer the simplest solution that works.`,
  creative: `You are BLC in Creative mode, an imaginative writing partner for stories, captions, scripts, names, and brainstorms. Be vivid, specific, and original, never generic.`,
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
    if (!att?.data) continue
    if (att.media_type === 'application/pdf') {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: att.data },
      })
    } else if (IMAGE_TYPES.includes(att.media_type)) {
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: att.media_type, data: att.data },
      })
    }
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
          if (!att?.data) continue
          const validType =
            att.media_type === 'application/pdf' || IMAGE_TYPES.includes(att.media_type)
          if (!validType) {
            return res.status(400).json({ error: 'Only images and PDF files are supported.' })
          }
          if (att.data.length * 0.75 > MAX_ATTACHMENT_BYTES) {
            return res.status(400).json({ error: 'Attachments must be under 4 MB each.' })
          }
        }
      }
    }

    const system = `${MODES[mode] ?? MODES.chat}\n\n${STYLE_RULES}`

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
    res.status(500).json({ error: 'Failed to get response from Claude' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`BLC server running on port ${PORT}`))
