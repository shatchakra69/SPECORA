// Plain-language, GDPR-aware privacy policy shown in a modal.
// Edit the copy here freely; it's the single source for the policy text.

const LAST_UPDATED = 'June 15, 2026'
const CONTACT_EMAIL = 'shatchakra69@gmail.com'

export default function PrivacyModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Privacy Policy</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close privacy policy">✕</button>
        </div>

        <div className="privacy">
          <p className="privacy-meta">Last updated: {LAST_UPDATED}</p>

          <p>
            This policy explains what information SPECORA collects, why, and how it is
            handled. SPECORA is a personal project operated by Shat Chakra Pawar Amgothu.
            Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <h3>What I collect and why</h3>
          <ul>
            <li><strong>Account details.</strong> When you sign up with email, your email address is stored to identify your account. Your password is handled and hashed by Supabase (the authentication provider); SPECORA never sees or stores it in plain text.</li>
            <li><strong>Google sign-in (optional).</strong> If you choose "Continue with Google", Google shares your name, email, and profile picture so you can log in. You can use email and password instead.</li>
            <li><strong>Your chat messages.</strong> The messages you send are passed to Anthropic's Claude API to generate replies.</li>
            <li><strong>Uploaded files.</strong> Images and PDFs you attach are stored on Cloudinary and passed to Claude so the AI can read them.</li>
            <li><strong>Profile and chat history.</strong> Your display name, avatar, and past conversations are stored locally in your own browser, not on SPECORA's servers.</li>
          </ul>

          <h3>Who processes your data</h3>
          <p>SPECORA relies on a few trusted services, each receiving only what it needs:</p>
          <ul>
            <li><strong>Supabase</strong> (authentication and accounts) &middot; <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">privacy policy</a></li>
            <li><strong>Anthropic / Claude</strong> (processes your messages and files to generate replies) &middot; <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noreferrer">privacy policy</a></li>
            <li><strong>Cloudinary</strong> (stores files you upload) &middot; <a href="https://cloudinary.com/privacy" target="_blank" rel="noreferrer">privacy policy</a></li>
            <li><strong>Google</strong> (only if you use Google sign-in) &middot; <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">privacy policy</a></li>
          </ul>

          <h3>Legal basis (GDPR)</h3>
          <p>Your data is processed to provide the service you asked for and, where relevant, on the basis of your consent. You can withdraw consent at any time.</p>

          <h3>International transfers</h3>
          <p>Some providers process data outside the EU/EEA (for example, in the United States). They rely on standard safeguards such as the EU Standard Contractual Clauses to protect it.</p>

          <h3>How long it is kept</h3>
          <ul>
            <li>Account data: kept until you ask to delete your account.</li>
            <li>Profile and chat history: stay in your browser until you clear them or sign out.</li>
            <li>Uploaded files: remain on Cloudinary until removed.</li>
          </ul>

          <h3>Your rights</h3>
          <p>
            Under the GDPR you can access, correct, delete, restrict, or export your data, and
            you can object to processing or withdraw consent. To exercise any of these, email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. You also have the right to
            lodge a complaint with your local data protection authority.
          </p>

          <h3>Security</h3>
          <p>Connections use HTTPS, passwords are hashed by Supabase, and API secrets stay server-side and are never exposed to the browser.</p>

          <h3>Cookies and local storage</h3>
          <p>SPECORA uses your browser's local storage to keep you signed in and to save your chat history and profile on your device. It does not use third-party advertising or tracking cookies.</p>

          <h3>Children</h3>
          <p>SPECORA is not intended for anyone under 16, and I do not knowingly collect data from children.</p>

          <h3>Changes</h3>
          <p>If this policy changes, the "last updated" date above will change with it.</p>

          <p className="privacy-note">This is a plain-language summary of how SPECORA handles data, not formal legal advice.</p>
        </div>
      </div>
    </div>
  )
}
