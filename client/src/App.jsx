import { useEffect, useState } from 'react'
import { getSession, clearSession } from './api'
import { loadConversations, saveConversations, newConversation, titleFrom } from './storage'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [user, setUser] = useState(() => getSession())
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draft, setDraft] = useState(() => newConversation('chat'))

  useEffect(() => {
    if (!user) return
    const stored = loadConversations(user.email)
    setConversations(stored)
    setActiveId(null)
  }, [user?.email])

  if (!user) {
    return <AuthScreen onAuthed={setUser} />
  }

  const persist = (next) => {
    setConversations(next)
    saveConversations(user.email, next)
  }

  const active = conversations.find((c) => c.id === activeId) ?? draft

  const updateConvo = (updated) => {
    const exists = conversations.some((c) => c.id === updated.id)
    // Derive the title from the first user message so a late update (e.g. the
    // assistant reply landing with a stale convo object) can't undo it.
    const firstUser = updated.messages.find((m) => m.role === 'user')
    const titled = {
      ...updated,
      updatedAt: Date.now(),
      title:
        updated.title === 'New chat' && firstUser
          ? titleFrom(firstUser.content)
          : updated.title,
    }
    persist(
      exists
        ? conversations.map((c) => (c.id === titled.id ? titled : c))
        : [titled, ...conversations],
    )
    setActiveId(titled.id)
  }

  const handleNewChat = () => {
    setDraft(newConversation('chat'))
    setActiveId(null)
    setSidebarOpen(false)
  }

  const handleSelect = (id) => {
    setActiveId(id)
    setSidebarOpen(false)
  }

  const handleDelete = (id) => {
    persist(conversations.filter((c) => c.id !== id))
    if (id === activeId) setActiveId(null)
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setConversations([])
    setActiveId(null)
  }

  return (
    <div className="app">
      <Sidebar
        user={user}
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatArea
        key={active.id}
        convo={active}
        onUpdate={updateConvo}
        onMenuOpen={() => setSidebarOpen(true)}
        onAuthExpired={handleLogout}
      />
    </div>
  )
}
