import { useState } from 'react'
import { relativeTime } from '../storage'
import { getMode } from '../modes'

export default function Sidebar({
  user, conversations, activeId, open,
  onNewChat, onSelect, onDelete, onLogout, onClose,
}) {
  const [filter, setFilter] = useState('')

  const visible = conversations
    .filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar glass ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="logo">
            <span className="logo-mark">B</span>
            <span className="logo-text brand-gradient">BLC</span>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        <button className="btn-primary new-chat" onClick={onNewChat}>
          <span className="plus">+</span> New chat
        </button>

        <input
          className="sidebar-search"
          placeholder="Search chats…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />

        <nav className="chat-list">
          {visible.length === 0 && (
            <p className="chat-list-empty">
              {conversations.length === 0 ? 'No chats yet. Start one! ✨' : 'No matches.'}
            </p>
          )}
          {visible.map((c) => (
            <div
              key={c.id}
              className={`chat-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <span className="chat-item-emoji">{getMode(c.mode).emoji}</span>
              <div className="chat-item-body">
                <span className="chat-item-title">{c.title}</span>
                <span className="chat-item-time">{relativeTime(c.updatedAt)}</span>
              </div>
              <button
                className="chat-item-delete"
                aria-label="Delete chat"
                onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
              >
                🗑
              </button>
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar-circle">{user.email[0].toUpperCase()}</span>
            <span className="user-email" title={user.email}>{user.email}</span>
          </div>
          <button className="icon-btn" title="Log out" onClick={onLogout}>⎋</button>
        </div>
      </aside>
    </>
  )
}
