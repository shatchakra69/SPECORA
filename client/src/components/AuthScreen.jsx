import { useState } from 'react'
import { supabase } from '../supabase'
import Logo from './Logo'

// Supabase error messages are technical; translate the common ones.
const friendly = (message = '') => {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('already registered')) return 'An account with this email already exists. Try logging in.'
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (m.includes('password should be')) return 'Password must be at least 6 characters.'
  return message || 'Something went wrong. Please try again.'
}

export default function AuthScreen() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)

  const fail = (msg) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const switchTab = (next) => {
    setTab(next)
    setError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (tab === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) fail(friendly(error.message))
        // Success: App's onAuthStateChange listener takes over.
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) {
          fail(friendly(error.message))
        } else if (!data.session) {
          // Email confirmation is enabled on the Supabase project.
          setNotice('Almost there! Check your inbox and confirm your email, then log in.')
          setTab('login')
        }
      }
    } catch {
      fail('Could not reach the server. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const googleSignIn = async () => {
    if (busy) return
    setError('')
    setNotice('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) fail(friendly(error.message))
  }

  return (
    <div className="auth">
      <div className="orb orb--1" />
      <div className="orb orb--2" />

      <div className={`auth-card glass ${shake ? 'shake' : ''}`}>
        <div className="auth-brand">
          <Logo width={96} className="auth-wings" />
          <h1 className="wordmark wordmark--auth">SPECORA</h1>
          <p className="auth-tagline">Spec your AI, your way. Gain your aura.</p>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === 'login' ? 'active' : ''}
            onClick={() => switchTab('login')}
          >
            Log in
          </button>
          <button
            className={tab === 'signup' ? 'active' : ''}
            onClick={() => switchTab('signup')}
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
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <span className="spinner" /> : tab === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button type="button" className="btn-google" onClick={googleSignIn} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.93-2.92l-3.87-3a7.24 7.24 0 0 1-10.78-3.8H1.29v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.99-3.1Z" />
            <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.97 11.97 0 0 0 1.29 6.62l3.99 3.1A7.17 7.17 0 0 1 12 4.77Z" />
          </svg>
          Continue with Google
        </button>

        <p className="auth-foot">
          {tab === 'login' ? 'New here? ' : 'Already have an account? '}
          <button className="link" onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}>
            {tab === 'login' ? 'Create an account' : 'Log in instead'}
          </button>
        </p>
      </div>

      <p className="auth-features">
        Chat · Homework · Research · Humanizer · Code · Creative
      </p>
    </div>
  )
}
