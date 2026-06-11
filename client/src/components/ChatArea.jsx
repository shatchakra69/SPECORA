import { useEffect, useRef, useState } from 'react'
import { sendChat } from '../api'
import { MODES, getMode } from '../modes'
import Message from './Message'
import Composer from './Composer'

const MAX_MESSAGES = 15

export default function ChatArea({ convo, onUpdate, onMenuOpen, onAuthExpired }) {
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const bottomRef = useRef(null)

  const messages = convo?.messages ?? []
  const mode = getMode(convo?.mode)
  const isFresh = messages.length === 0
  const limitReached = messages.length >= MAX_MESSAGES

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  const setMode = (id) => onUpdate({ ...convo, mode: id })

  const send = async (text, attachments) => {
    if (loading) return

    const userMsg = { role: 'user', content: text }
    if (attachments.length > 0) userMsg.attachments = attachments

    const history = [...messages, userMsg]
    onUpdate({ ...convo, messages: history })
    setLoading(true)

    // Older messages only carry attachment names (data isn't persisted), so
    // re-sending history is cheap; only this turn's files upload for real.
    const payload = history.map((m) => ({
      role: m.role,
      content:
        m.attachments?.some((a) => !a.data)
          ? `${m.content}\n[attached earlier: ${m.attachments.map((a) => a.name).join(', ')}]`
          : m.content,
      ...(m.attachments?.some((a) => a.data) ? { attachments: m.attachments } : {}),
    }))

    try {
      const res = await sendChat(payload, mode.id, () => setWaking(true))
      const reply = res.data?.reply ?? ''
      onUpdate({
        ...convo,
        messages: [...history, { role: 'assistant', content: reply, fresh: true }],
      })
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        onAuthExpired()
        return
      }
      const serverMsg = err.response?.data?.error
      const content =
        status === 429
          ? "You've hit the message limit. Please wait a bit and try again."
          : (status === 400 || status === 503) && serverMsg
            ? serverMsg
            : 'Something went wrong reaching the server. Please try again in a moment.'
      onUpdate({
        ...convo,
        messages: [...history, { role: 'assistant', content, error: true }],
      })
    } finally {
      setLoading(false)
      setWaking(false)
    }
  }

  return (
    <main className="chat-pane">
      <header className="chat-header glass">
        <button className="icon-btn menu-btn" onClick={onMenuOpen} aria-label="Open menu">☰</button>
        <span className="chat-header-title">{isFresh ? 'New chat' : convo.title}</span>
        <span className="mode-badge">{mode.emoji} {mode.name}</span>
      </header>

      <div className="chat-scroll">
        {isFresh ? (
          <div className="welcome">
            <div className="welcome-logo">
              <span className="logo-mark logo-mark--xl">B</span>
            </div>
            <h1 className="welcome-title">
              Hey! I'm <span className="brand-gradient">BLC</span> ✨
            </h1>
            <p className="welcome-sub">Pick a mode and ask me anything.</p>

            <div className="mode-pills">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className={`mode-pill ${m.id === mode.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                  title={m.tagline}
                >
                  <span className="mode-pill-emoji">{m.emoji}</span> {m.name}
                </button>
              ))}
            </div>
            <p className="mode-tagline" key={mode.id}>{mode.tagline}</p>

            <div className="suggestion-grid">
              {mode.suggestions.map((s, i) => (
                <button
                  key={s}
                  className="suggestion-card glass"
                  style={{ animationDelay: `${i * 70}ms` }}
                  onClick={() => send(s, [])}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-inner">
            {messages.map((msg, idx) => (
              <Message key={idx} msg={msg} />
            ))}

            {loading && (
              <div className="message-row message-row--ai">
                <div className="avatar">B</div>
                <div className="bubble bubble--ai bubble--loading">
                  {waking ? (
                    <span className="waking-text">
                      Waking up the server, this can take up to a minute…
                    </span>
                  ) : (
                    <>
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </>
                  )}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <Composer onSend={send} disabled={loading} limitReached={limitReached} />
    </main>
  )
}
