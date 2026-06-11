# BLC — Be Like Chakri

A full-stack AI chat app powered by the Claude API. React + Vite frontend, Node.js/Express backend.

**Status: ✅ Working** — live at https://blc-ai.vercel.app
(backend: https://blc-server-yp7x.onrender.com)

> ⏳ **Note:** The backend runs on Render's free tier, which spins down after
> 15 minutes of inactivity. If the app has been idle, the **first message (or
> login) may take ~30-60 seconds** while the server wakes up. Subsequent
> messages will be fast.

## Features

- ✨ Modern animated UI: gradient glassmorphism design, smooth message animations, typewriter replies
- 🔐 Email login / sign-up — only registered users can chat, so a bare link can't burn API credits
- 🗂️ Chat history sidebar with search, per-account, saved in your browser
- 🧠 Six modes: 💬 Chat, 📚 Homework, 🔍 Research, ✍️ Humanizer, 💻 Code, 🎨 Creative
- 📎 Attach images, screenshots and PDFs (paste screenshots straight into the input)
- 😊 Emoji picker
- 🧍 Humanized responses: natural tone enforced by the system prompt, plus a server-side filter that removes em dashes and double hyphens
- 📝 Markdown rendering (code blocks, lists, tables) in AI replies
- 📱 Fully mobile responsive
- 🚦 Rate-limited backend (per-user) with input validation

> **Note on accounts:** users are stored on the server's disk, which is
> ephemeral on Render's free tier, so accounts reset when the service
> restarts/redeploys. Logged-in sessions (30-day tokens) keep working across
> resets. For permanent accounts, plug in a free Postgres (e.g. Supabase).

## Tech Stack

- **Frontend:** React, Vite, Axios
- **Backend:** Node.js, Express, Anthropic SDK
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
BLC/
├── client/   # React frontend (Vite)
└── server/   # Express backend (Anthropic API proxy)
```

## Local Development

### 1. Backend

```bash
cd server
cp .env.example .env   # add your ANTHROPIC_API_KEY
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
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `CORS_ORIGIN` — your frontend domain, e.g. `https://ai.blc.com`
   - `JWT_SECRET` — a long random string used to sign login tokens (`openssl rand -hex 32`)
4. Deploy. Note the service URL (e.g. `https://blc-server.onrender.com`).

### Frontend (Vercel)

1. On [Vercel](https://vercel.com), import this repo, set root directory to `client`.
2. Set environment variable:
   - `VITE_API_URL` — your backend URL from above (e.g. `https://blc-server.onrender.com`)
3. Deploy.

### Custom Domain (ai.blc)

1. In Vercel, go to your project → **Settings → Domains** and add `ai.blc.com` (or your chosen subdomain).
2. At your domain registrar, add the DNS records Vercel shows you (usually a `CNAME` record pointing to `cname.vercel-dns.com`).
3. Optionally set up a subdomain like `api.ai.blc.com` for the backend on Render the same way.

## Security Notes

- Never commit your `.env` file or API key.
- The backend rate-limits `/api/chat` to 15 requests per 15 minutes per IP, and caps each conversation at 15 messages — adjust in `server/index.js` as needed.
- Set a spending limit on your Anthropic account at [console.anthropic.com](https://console.anthropic.com/settings/billing).
