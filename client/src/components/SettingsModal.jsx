import { useRef, useState } from 'react'
import PrivacyModal from './PrivacyModal'

// Resize a picked image to a small square so it fits comfortably in localStorage.
const fileToAvatar = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const size = 96
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const side = Math.min(img.width, img.height)
      ctx.drawImage(
        img,
        (img.width - side) / 2,
        (img.height - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      )
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = url
  })

export default function SettingsModal({ user, profile, onSave, onClose }) {
  const [form, setForm] = useState({
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    preferredName: profile.preferredName ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    avatar: profile.avatar ?? '',
  })
  const fileRef = useRef(null)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const avatar = await fileToAvatar(file)
      setForm((f) => ({ ...f, avatar }))
    } catch {
      /* ignore unreadable images */
    }
    e.target.value = ''
  }

  const save = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      preferredName: form.preferredName.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    })
    onClose()
  }

  const initial = (form.preferredName || form.firstName || user.email)[0].toUpperCase()

  return (
    <>
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Settings</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <form className="settings-form" onSubmit={save}>
          <div className="settings-avatar">
            {form.avatar ? (
              <img src={form.avatar} alt="Profile" className="settings-avatar-img" />
            ) : (
              <span className="settings-avatar-fallback">{initial}</span>
            )}
            <div className="settings-avatar-actions">
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                Upload photo
              </button>
              {form.avatar && (
                <button
                  type="button"
                  className="btn-ghost btn-ghost--danger"
                  onClick={() => setForm((f) => ({ ...f, avatar: '' }))}
                >
                  Remove
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          </div>

          <label className="field">
            <span>What should SPECORA call you?</span>
            <input
              placeholder="e.g. Chakri"
              value={form.preferredName}
              onChange={set('preferredName')}
              maxLength={40}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>First name</span>
              <input value={form.firstName} onChange={set('firstName')} maxLength={60} />
            </label>
            <label className="field">
              <span>Last name</span>
              <input value={form.lastName} onChange={set('lastName')} maxLength={60} />
            </label>
          </div>

          <label className="field">
            <span>Email</span>
            <input value={user.email} readOnly className="readonly" title="Your login email" />
          </label>

          <label className="field">
            <span>Phone number</span>
            <input
              type="tel"
              placeholder="+49 ..."
              value={form.phone}
              onChange={set('phone')}
              maxLength={30}
            />
          </label>

          <label className="field">
            <span>Address</span>
            <textarea
              rows={2}
              placeholder="Street, city, country"
              value={form.address}
              onChange={set('address')}
              maxLength={240}
            />
          </label>

          <p className="settings-note">
            Your profile is stored only in this browser. SPECORA uses your name to
            personalize replies; the rest stays private to you.
          </p>

          <p className="settings-legal">
            <button type="button" className="link link--muted" onClick={() => setShowPrivacy(true)}>
              Privacy Policy
            </button>
          </p>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>
      </div>
    </div>
    {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  )
}
