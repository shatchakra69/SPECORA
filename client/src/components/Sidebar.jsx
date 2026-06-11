import { useState } from 'react'
import { relativeTime } from '../storage'
import { getMode } from '../modes'
import Logo from './Logo'

export default function Sidebar({
  user, profile, conversations, activeId, open,
  onNewChat, onSelect, onDelete, onLogout, onClose, onSettings,
}) {
  const [filter, setFilter] = useState('')

  const visible = conversations
    .filter((c) => c.title.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt)

  const displayName = profile.preferredName || profile.firstName || user.email
  const initial = displayName[0].toUpperCase()

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar glass ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div className="logo">
            <Logo width={40} className="logo-wings" />
            <span className="wordmark wordmark--side">SPECORA</span>
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
              {conversations.length === 0 ? 'No chats yet. Start one!' : 'No matches.'}
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
          <div className="user-chip" onClick={onSettings} title="Open settings" role="button">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="avatar-circle avatar-circle--img" />
            ) : (
              <span className="avatar-circle">{initial}</span>
            )}
            <span className="user-email" title={user.email}>{displayName}</span>
          </div>
          <button className="icon-btn" title="Settings" onClick={onSettings}>⚙️</button>
          <button className="icon-btn" title="Log out" onClick={onLogout}>⎋</button>
        </div>
      </aside>
    </>
  )
}
