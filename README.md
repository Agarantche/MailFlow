# MailFlow

MailFlow is an MVP AI-powered Gmail assistant built with Next.js, TypeScript, Tailwind CSS, shadcn-style UI components, Supabase, Gmail API, and OpenAI.

It fetches recent unread Gmail messages, analyzes them with AI, displays category/priority/risk/summary/action items, generates copyable replies, and optionally saves a reply as a Gmail draft. It never auto-sends email.

## What is included

- Landing page, Gmail connection page, dashboard, email detail page, and settings/usage page
- Server-side Google OAuth flow
- Gmail unread fetch helper
- Gmail draft creation helper
- OpenAI analysis and reply helpers
- Supabase schema with users, emails, drafts, usage, and Gmail connection token storage
- Free plan limits: 100 analyses/month, 20 drafts/month, 1 Gmail account
- Pro plan UI and Stripe-ready checkout placeholder
- Demo mode with realistic sample emails, filters, mocked analysis, and mocked drafts

## Project structure

- `app/`: Next.js route layer for pages and API route adapters
- `frontend/`: UI components, client React workspaces, shared app shell, and styles
- `backend/`: server-side helpers for auth/session, Gmail, OpenAI, Supabase, demo mode, and API responses
- `lib/`: shared TypeScript types, constants, and utilities used by both frontend and backend
- `supabase/`: SQL schema
- `scripts/`: local development helpers

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.

4. Create a Google OAuth client:

- Application type: Web application
- Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
- Required scopes:
  - `openid`
  - `email`
  - `profile`
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.compose`

The app does not request `https://www.googleapis.com/auth/gmail.send`, and no route calls Gmail send endpoints. Gmail's compose scope is used only for draft creation.

5. Add your OpenAI API key and optional model in `.env.local`.

6. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo mode

Use demo mode when you want to explore the product without Supabase, Google OAuth, Gmail, or OpenAI credentials.

- Click `Try demo` on the landing page or `Try demo inbox` on the connect page.
- Or set `MAILFLOW_DEMO_MODE=true` in `.env.local`.
- If Supabase is not configured, MailFlow automatically falls back to the demo inbox.

Demo mode includes realistic analyzed emails, one pending email, dashboard filters, simulated analysis, simulated reply generation, and simulated Gmail draft saves. It does not call Gmail or OpenAI.

## API routes

- `GET /api/auth/google/start`: starts Google OAuth
- `GET /api/auth/google/callback`: stores the user and Gmail connection
- `POST /api/auth/logout`: clears the local session cookie
- `GET /api/demo/start`: starts the local demo inbox
- `POST /api/emails/fetch`: fetches the latest 25 unread Gmail messages
- `POST /api/emails/analyze`: analyzes unanalyzed emails and updates usage
- `POST /api/emails/:id/reply`: generates a reply and optionally saves a Gmail draft
- `POST /api/subscription/checkout`: Stripe-ready placeholder

## Production notes

- Encrypt Gmail access and refresh tokens before production launch.
- Replace the local `mailflow_user_id` cookie with Supabase Auth or a signed session.
- Add Stripe Checkout in `app/api/subscription/checkout/route.ts`.
- Add background jobs for large inboxes instead of analyzing sequentially in one request.
- Keep Gmail send permission out of the OAuth consent screen unless the product scope changes.
