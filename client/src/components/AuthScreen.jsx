import { useState } from 'react'
import { login, signup, storeSession } from '../api'

export default function AuthScreen({ onAuthed }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [waking, setWaking] = useState(false)
  const [shake, setShake] = useState(false)

  const fail = (msg) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const fn = tab === 'login' ? login : signup
      const res = await fn(email, password, () => setWaking(true))
      storeSession(res.data.token)
      onAuthed({ email: res.data.email })
    } catch (err) {
      fail(err.response?.data?.error ?? 'Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
      setWaking(false)
    }
  }

  return (
    <div className="auth">
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="orb orb--3" />

      <div className={`auth-card glass ${shake ? 'shake' : ''}`}>
        <div className="auth-brand">
          <span className="logo-mark logo-mark--lg">B</span>
          <h1 className="brand-gradient">BLC</h1>
          <p className="auth-tagline">Be Like Chakri · Your AI for everything</p>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => { setTab('login'); setError('') }}
          >
            Log in
          </button>
          <button
            className={tab === 'signup' ? 'active' : ''}
            onClick={() => { setTab('signup'); setError('') }}
          >
            Sign up
          </button>
          <span className={`auth-tab-pill ${tab === 'signup' ? 'right' : ''}`} />
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder={tab === 'signup' ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}
          {waking && (
            <p className="auth-waking">Waking up the server, this can take up to a minute…</p>
          )}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">
          {tab === 'login' ? 'New here? ' : 'Already have an account? '}
          <button className="link" onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError('') }}>
            {tab === 'login' ? 'Create an account' : 'Log in instead'}
          </button>
        </p>
      </div>

      <p className="auth-features">
        💬 Chat · 📚 Homework · 🔍 Research · ✍️ Humanizer · 💻 Code · 🎨 Creative
      </p>
    </div>
  )
}
