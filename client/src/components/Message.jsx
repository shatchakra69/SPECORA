import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Logo from './Logo'

// Assistant replies type themselves out when fresh; restored history renders instantly.
function useTypewriter(text, animate) {
  const [len, setLen] = useState(animate ? 0 : text.length)

  useEffect(() => {
    if (!animate) {
      setLen(text.length)
      return
    }
    let i = 0
    const id = setInterval(() => {
      i = Math.min(i + 4, text.length)
      setLen(i)
      if (i >= text.length) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [text, animate])

  return text.slice(0, len)
}

export default function Message({ msg, avatarSrc }) {
  const isUser = msg.role === 'user'
  const shown = useTypewriter(msg.content, !isUser && msg.fresh === true)

  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--ai'}`}>
      {isUser ? (
        avatarSrc ? (
          <img src={avatarSrc} alt="" className="avatar avatar--img" />
        ) : (
          <div className="avatar">You</div>
        )
      ) : (
        <div className="avatar avatar--ai"><Logo width={20} /></div>
      )}
      <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--ai'} ${msg.error ? 'bubble--error' : ''}`}>
        {msg.attachments?.length > 0 && (
          <div className="bubble-attachments">
            {msg.attachments.map((a, i) => (
              <span key={i} className="attach-chip attach-chip--sent">
                {a.media_type === 'application/pdf' ? '📄' : '🖼️'} {a.name}
              </span>
            ))}
          </div>
        )}
        {isUser ? (
          <span className="user-text">{msg.content}</span>
        ) : (
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{shown}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
