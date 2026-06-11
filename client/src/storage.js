// Chat history lives in localStorage, namespaced per logged-in email.
// Attachment binary data is never persisted (too big), only name + type.

const key = (email) => `blc_chats_${email}`

export function loadConversations(email) {
  try {
    return JSON.parse(localStorage.getItem(key(email))) ?? []
  } catch {
    return []
  }
}

export function saveConversations(email, conversations) {
  const slim = conversations.map((c) => ({
    ...c,
    messages: c.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.error ? { error: true } : {}),
      ...(m.attachments
        ? { attachments: m.attachments.map(({ name, media_type }) => ({ name, media_type })) }
        : {}),
    })),
  }))
  try {
    localStorage.setItem(key(email), JSON.stringify(slim))
  } catch {
    // localStorage full: drop oldest conversations and retry once
    try {
      localStorage.setItem(key(email), JSON.stringify(slim.slice(0, 10)))
    } catch {
      /* give up silently */
    }
  }
}

export const newConversation = (mode) => ({
  id: crypto.randomUUID(),
  title: 'New chat',
  mode,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  messages: [],
})

export const titleFrom = (text) => {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 42 ? clean.slice(0, 42) + '…' : clean || 'New chat'
}

// Profile (name, contact info, avatar) lives in localStorage per account.
export function loadProfile(email) {
  try {
    return JSON.parse(localStorage.getItem(`blc_profile_${email}`)) ?? {}
  } catch {
    return {}
  }
}

export function saveProfile(email, profile) {
  try {
    localStorage.setItem(`blc_profile_${email}`, JSON.stringify(profile))
  } catch {
    /* storage full: drop the avatar, keep the text fields */
    try {
      localStorage.setItem(
        `blc_profile_${email}`,
        JSON.stringify({ ...profile, avatar: '' }),
      )
    } catch {
      /* give up silently */
    }
  }
}

export const relativeTime = (ts) => {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString()
}
