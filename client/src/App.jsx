import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import {
  loadConversations, saveConversations, newConversation, titleFrom,
  loadProfile, saveProfile,
} from './storage'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import SettingsModal from './components/SettingsModal'

export default function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draft, setDraft] = useState(() => newConversation('chat'))
  const [profile, setProfile] = useState({})
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const toUser = (session) =>
      session?.user?.email ? { email: session.user.email } : null

    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session))
      setAuthReady(true)
    })
    // Fires on login, logout, the Google OAuth redirect, and token refreshes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser((prev) => {
        const next = toUser(session)
        return prev?.email === next?.email ? prev : next
      }),
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    setConversations(loadConversations(user.email))
    setProfile(loadProfile(user.email))
    setActiveId(null)
  }, [user?.email])

  if (!authReady) {
    return null
  }
  if (!user) {
    return <AuthScreen />
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

  const handleSaveProfile = (next) => {
    setProfile(next)
    saveProfile(user.email, next)
  }

  const handleLogout = () => {
    supabase.auth.signOut()
    setUser(null)
    setConversations([])
    setProfile({})
    setActiveId(null)
  }

  return (
    <div className="app">
      <Sidebar
        user={user}
        profile={profile}
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onNewChat={handleNewChat}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)}
        onSettings={() => setSettingsOpen(true)}
      />
      <ChatArea
        key={active.id}
        convo={active}
        profile={profile}
        onUpdate={updateConvo}
        onMenuOpen={() => setSidebarOpen(true)}
        onAuthExpired={handleLogout}
      />
      {settingsOpen && (
        <SettingsModal
          user={user}
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
