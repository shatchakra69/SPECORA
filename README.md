# SPECORA

**Spec your AI, your way. Gain your aura.**

SPECORA is a full-stack AI chat platform with multiple personality modes, accounts, chat history and file understanding. React + Vite frontend, Node.js/Express backend.

**Status: Live** at **https://specora-ai.vercel.app**

> **Note:** The backend runs on a free hosting tier that spins down after
> 15 minutes of inactivity. If the app has been idle, the **first message (or
> login) may take 30-60 seconds** while the server wakes up. Everything after
> that is fast.

## Features

- **Modern animated UI**: monochrome glassmorphism design, smooth message animations, typewriter replies
- **Accounts via Supabase Auth**: email/password and **Sign in with Google**; only registered users can chat, so a bare link can't burn API credits
- **Settings and profile**: profile photo, preferred name (SPECORA addresses you by it), contact details, all editable
- **Chat history sidebar**: searchable, per-account, saved in your browser
- **Six modes**: Chat, Homework, Research, Humanizer, Code, Creative
- **File understanding**: attach images, screenshots and PDFs (or paste screenshots straight into the input); files are stored on Cloudinary and the AI reads them natively, so they stay visible across the whole conversation
- **Emoji picker**
- **Humanized responses**: natural tone with **no em dashes or robotic phrasing**, enforced server-side
- **Markdown rendering**: code blocks, lists and tables in replies
- **Fully mobile responsive**
- **Per-user rate limiting** with input validation

## Tech Stack

- **Frontend:** React, Vite, Axios, Supabase Auth
- **Backend:** Node.js, Express
- **Storage:** Cloudinary (attachments), Supabase (accounts)
- **Deployment:** Vercel (frontend) + Render (backend)

## Project Structure

```
SPECORA/
├── client/   # React frontend (Vite)
└── server/   # Express backend (AI engine proxy, auth, rate limiting)
```

## One-Time Service Setup

### Supabase (accounts)

1. Create a free project at [supabase.com](https://supabase.com).
2. **Authentication → Providers**: Email is on by default. To skip the
   confirmation-email step during development, disable **Confirm email**.
3. For Google sign-in: create an OAuth client in
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   (type *Web application*), add the redirect URL Supabase shows under
   **Authentication → Providers → Google**, then paste the client ID and
   secret into that same Supabase page.
4. **Authentication → URL Configuration**: add your local and production
   frontend URLs (e.g. `http://localhost:5173`, `https://specora-ai.vercel.app`)
   to the redirect allow-list.
5. Grab the **Project URL** and **anon key** from **Project Settings → API**.

### Cloudinary (attachments)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Grab **cloud name**, **API key** and **API secret** from the dashboard.
3. **Settings → Security**: enable **Allow delivery of PDF and ZIP files**
   (new accounts block PDF delivery by default; without this the AI can't
   fetch attached PDFs).

## Local Development

### 1. Backend

```bash
cd server
cp .env.example .env   # fill in Anthropic, Supabase and Cloudinary values
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
cp .env.example .env   # fill in the Supabase URL + anon key
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

## Deployment

### Backend (Render)

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a new **Web Service** from this repo, root directory `server`.
3. Set environment variables:
   - `AI_API_KEY`: your AI provider API key
   - `SUPABASE_URL` / `SUPABASE_ANON_KEY`: from Supabase Project Settings → API
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
   - `CORS_ORIGIN`: your frontend domain(s), comma separated
4. Deploy and note the service URL.

### Frontend (Vercel)

1. On [Vercel](https://vercel.com), import this repo, set root directory to `client`.
2. Set environment variables:
   - `VITE_API_URL`: your backend URL from above
   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: same Supabase values
3. Deploy.

### Custom Domain

1. In Vercel, go to your project, then **Settings, Domains**, and add your domain.
2. At your domain registrar, add the DNS records Vercel shows you (usually a `CNAME` record pointing to `cname.vercel-dns.com`).
3. Add the new domain to the backend's `CORS_ORIGIN` env var.

## Security Notes

- Never commit your `.env` file or API keys.
- `/api/chat` requires a logged-in user and is rate-limited to 15 requests per 15 minutes per user, with a 15-message cap per conversation. Adjust in `server/index.js`.
- Accounts and sessions are managed by Supabase Auth; the backend verifies every access token against Supabase.
- File uploads use short-lived server-issued signatures; the Cloudinary API secret never reaches the browser, and the chat endpoint only accepts attachment URLs from this app's own Cloudinary account.
- Set a spending limit in your AI provider's billing dashboard.
