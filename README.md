# SPECORA

**Spec your AI, your way. Gain your aura.**

SPECORA is a full-stack AI chat platform with multiple personality modes, accounts, chat history and file understanding. React + Vite frontend, Node.js/Express backend.

**Status: ✅ Live** — try it at **https://specora-ai.vercel.app**

> ⏳ **Note:** The backend runs on a free hosting tier that spins down after
> 15 minutes of inactivity. If the app has been idle, the **first message (or
> login) may take ~30-60 seconds** while the server wakes up. Everything after
> that is fast.

## Features

- **Modern animated UI** — monochrome glassmorphism design, smooth message animations, typewriter replies
- **Email login / sign-up** — only registered users can chat, so a bare link can't burn API credits
- **Settings & profile** — profile photo, preferred name (SPECORA addresses you by it), contact details, all editable
- **Chat history sidebar** — searchable, per-account, saved in your browser
- **Six modes** — 💬 Chat, 📚 Homework, 🔍 Research, ✍️ Humanizer, 💻 Code, 🎨 Creative
- **File understanding** — attach images, screenshots and PDFs (or paste screenshots straight into the input)
- **Emoji picker**
- **Humanized responses** — natural tone with **no em dashes or robotic phrasing**, enforced server-side
- **Markdown rendering** — code blocks, lists and tables in replies
- **Fully mobile responsive**
- **Per-user rate limiting** with input validation

> **Note on accounts:** users are stored on the server's disk, which is
> ephemeral on the free hosting tier, so accounts reset when the service
> restarts or redeploys. Logged-in sessions (30-day tokens) keep working across
> resets. For permanent accounts, plug in a free Postgres (e.g. Supabase).

## Tech Stack

- **Frontend:** React, Vite, Axios
- **Backend:** Node.js, Express
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
SPECORA/
├── client/   # React frontend (Vite)
└── server/   # Express backend (AI engine proxy, auth, rate limiting)
```

## Local Development

### 1. Backend

```bash
cd server
cp .env.example .env   # add your AI_API_KEY and a random JWT_SECRET
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## Deployment

### Backend (Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a new **Web Service** from this repo, root directory `server`.
3. Set environment variables:
   - `AI_API_KEY` — your AI provider API key
   - `JWT_SECRET` — a long random string used to sign login tokens (`openssl rand -hex 32`)
   - `CORS_ORIGIN` — your frontend domain(s), comma separated
4. Deploy and note the service URL.

### Frontend (Vercel)

1. On [Vercel](https://vercel.com), import this repo, set root directory to `client`.
2. Set environment variable:
   - `VITE_API_URL` — your backend URL from above
3. Deploy.

### Custom Domain

1. In Vercel, go to your project → **Settings → Domains** and add your domain.
2. At your domain registrar, add the DNS records Vercel shows you (usually a `CNAME` record pointing to `cname.vercel-dns.com`).
3. Add the new domain to the backend's `CORS_ORIGIN` env var.

## Security Notes

- Never commit your `.env` file or API keys.
- `/api/chat` requires a logged-in user and is rate-limited to 15 requests per 15 minutes per user, with a 15-message cap per conversation — adjust in `server/index.js`.
- Passwords are hashed with scrypt; sessions use signed 30-day tokens.
- Set a spending limit in your AI provider's billing dashboard.
