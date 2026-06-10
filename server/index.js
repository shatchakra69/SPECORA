import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.set('trust proxy', 1)

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*'

app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '50kb' }))

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
})

const MAX_MESSAGES = 15
const MAX_MESSAGE_LENGTH = 4000

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: 'Conversation is too long' })
    }

    for (const msg of messages) {
      if (
        typeof msg.content !== 'string' ||
        msg.content.length > MAX_MESSAGE_LENGTH ||
        !['user', 'assistant'].includes(msg.role)
      ) {
        return res.status(400).json({ error: 'Invalid message format' })
      }
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: messages.map(({ role, content }) => ({ role, content })),
    })

    const reply = response.content?.[0]?.text ?? ''
    res.json({ reply })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to get response from Claude' })
  }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`BLC server running on port ${PORT}`))
