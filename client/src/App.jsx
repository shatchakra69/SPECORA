import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import './index.css'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/chat`

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey, I'm BLC — Be Like Chakri. Ask me anything.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(API_URL, { messages: newMessages })
      const reply =
        res.data?.reply ?? res.data?.message ?? res.data?.content ?? ''
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Something went wrong reaching the server. Please check that the backend is running and try again.',
          error: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">B</span>
            <span className="logo-text">BLC</span>
          </div>
          <span className="tagline">Be Like Chakri</span>
        </div>
      </header>

      <main className="chat-area">
        <div className="chat-scroll">
          <div className="chat-inner">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message-row ${
                  msg.role === 'user' ? 'message-row--user' : 'message-row--ai'
                }`}
              >
                <div className="avatar">
                  {msg.role === 'user' ? 'You' : 'BLC'}
                </div>
                <div
                  className={`bubble ${
                    msg.role === 'user' ? 'bubble--user' : 'bubble--ai'
                  } ${msg.error ? 'bubble--error' : ''}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="message-row message-row--ai">
                <div className="avatar">BLC</div>
                <div className="bubble bubble--ai bubble--loading">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </main>

      <footer className="composer">
        <div className="composer-inner">
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Message BLC..."
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 11.5L21 3L13.5 21L11 13L3 11.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className="footer-note">
          BLC can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  )
}

export default App
