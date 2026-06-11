import { useEffect, useRef, useState } from 'react'

const EMOJIS = [
  '😀','😂','🥹','😊','😍','😎','🤩','😅','🙃','🤔','🤯','😴',
  '👍','👎','🙏','👏','💪','🤝','✌️','🫶','❤️','🔥','✨','⭐',
  '🎉','🎯','🚀','💡','📚','📝','💻','🧠','☕','🍕','🌍','🌙',
  '✅','❌','⚡','💯','🤖','👀','😉','🥳','😭','😤','🤓','🫡',
]

const MAX_FILES = 3
const MAX_BYTES = 4 * 1024 * 1024

export default function Composer({ onSend, disabled, limitReached }) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState([])
  const [showEmoji, setShowEmoji] = useState(false)
  const [fileError, setFileError] = useState('')
  const taRef = useRef(null)
  const fileRef = useRef(null)
  const emojiRef = useRef(null)

  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px'
  }, [input])

  useEffect(() => {
    if (!showEmoji) return
    const close = (e) => {
      if (!emojiRef.current?.contains(e.target)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showEmoji])

  const addFiles = (list) => {
    setFileError('')
    const incoming = Array.from(list)
    const next = [...files]
    for (const f of incoming) {
      if (next.length >= MAX_FILES) {
        setFileError(`Max ${MAX_FILES} files per message.`)
        break
      }
      const isImage = f.type.startsWith('image/')
      const isPdf = f.type === 'application/pdf'
      if (!isImage && !isPdf) {
        setFileError('Only images and PDFs are supported.')
        continue
      }
      if (f.size > MAX_BYTES) {
        setFileError(`"${f.name}" is over 4 MB.`)
        continue
      }
      next.push(f)
    }
    setFiles(next)
  }

  const handlePaste = (e) => {
    const pasted = Array.from(e.clipboardData?.files ?? [])
    if (pasted.length > 0) {
      e.preventDefault()
      addFiles(pasted)
    }
  }

  const insertEmoji = (emoji) => {
    const ta = taRef.current
    const start = ta?.selectionStart ?? input.length
    const end = ta?.selectionEnd ?? input.length
    setInput(input.slice(0, start) + emoji + input.slice(end))
    setShowEmoji(false)
    requestAnimationFrame(() => {
      ta?.focus()
      const pos = start + emoji.length
      ta?.setSelectionRange(pos, pos)
    })
  }

  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () =>
        resolve({
          name: file.name,
          media_type: file.type === 'image/jpg' ? 'image/jpeg' : file.type,
          data: reader.result.split(',')[1],
        })
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const send = async () => {
    const text = input.trim()
    if ((!text && files.length === 0) || disabled || limitReached) return
    const attachments = await Promise.all(files.map(readAsBase64))
    setInput('')
    setFiles([])
    setFileError('')
    onSend(text, attachments)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <footer className="composer">
      {limitReached && (
        <div className="limit-banner">
          This chat reached its 15-message limit. Start a new chat to keep going.
        </div>
      )}

      <div className="composer-inner glass">
        {files.length > 0 && (
          <div className="attach-row">
            {files.map((f, i) => (
              <span key={i} className="attach-chip">
                {f.type === 'application/pdf' ? '📄' : '🖼️'}
                <span className="attach-name">{f.name}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove file">✕</button>
              </span>
            ))}
          </div>
        )}
        {fileError && <p className="attach-error">{fileError}</p>}

        <div className="composer-main">
          <button
            className="icon-btn"
            title="Attach image or PDF"
            onClick={() => fileRef.current?.click()}
            disabled={limitReached}
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            multiple
            hidden
            onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
          />

          <div className="emoji-wrap" ref={emojiRef}>
            <button
              className="icon-btn"
              title="Emoji"
              onClick={() => setShowEmoji(!showEmoji)}
              disabled={limitReached}
            >
              😊
            </button>
            {showEmoji && (
              <div className="emoji-pop glass">
                {EMOJIS.map((em) => (
                  <button key={em} onClick={() => insertEmoji(em)}>{em}</button>
                ))}
              </div>
            )}
          </div>

          <textarea
            ref={taRef}
            className="composer-input"
            placeholder={limitReached ? 'Start a new chat to continue…' : 'Message SPECORA…  (paste screenshots right here)'}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={limitReached}
          />

          <button
            className="send-btn"
            onClick={send}
            disabled={disabled || limitReached || (!input.trim() && files.length === 0)}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 11.5L21 3L13.5 21L11 13L3 11.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <p className="footer-note">SPECORA can make mistakes. Verify important information.</p>
    </footer>
  )
}
