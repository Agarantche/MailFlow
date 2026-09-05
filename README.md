# MailFlow

> 🚧 **Work in progress** — core features are implemented but the app is not fully functional yet. See [Current status](#current-status).

MailFlow is an AI-powered Gmail assistant built with Next.js, TypeScript, Tailwind CSS, shadcn-style UI components, Supabase, Gmail API, and OpenAI.

It fetches recent unread Gmail messages, analyzes them with AI, displays category/priority/risk/summary/action items, generates copyable replies, and optionally saves a reply as a Gmail draft. It never auto-sends email.

## Current status

Actively being built. What's done and what's still in flight:

- ✅ UI: landing, connect, dashboard, email detail, and settings pages
- ✅ Server-side Google OAuth flow and Gmail fetch/draft helpers
- ✅ OpenAI analysis and reply generation pipeline
- ✅ Supabase schema and demo mode (works without any credentials)
- 🔧 End-to-end flow with live Gmail/OpenAI credentials — still being tested and stabilized
- 🔧 Stripe checkout — placeholder only
- 🔧 Production hardening (token encryption, signed sessions) — planned

The easiest way to see it working today is [demo mode](#demo-mode), which needs no setup.

## A lighter workspace

The landing page opens with a procedural leaf canopy: shaded leaves drift, turn, and respond to the pointer. Use the pause control to stop the leaves. Reduced-motion preferences produce a static scene and disable scroll effects. Off-screen and hidden scenes stop rendering.

The same pine-and-mist palette, locally hosted Cabinet Grotesk typography, and leaf identity carry through the inbox, message details, connection, settings, and day planner. The landing-page sample inbox is interactive; the full demo supports filters, search, previews, and editable replies. No remote image or font request is needed to render the new design.

Development output uses `.next-dev`; production builds use `.next`. Run `npm run dev -- --port 3001` alongside a production preview on port 3000 when needed. To refresh that production preview, stop it, run `npm run build`, then `npm run preview:background`.

## Decision Lab

Open [http://localhost:3000/lab](http://localhost:3000/lab) for an interactive planning tool that works without credentials. It turns an editable fictional inbox into an exact schedule with deadlines, dependencies, meetings, context switching, and duration buffers. Lock commitments, inspect the opportunity cost of deferred work, stress-test the day, and export a local calendar file. You can add your own tasks, edit fixed meetings, and import/export complete scenarios as JSON; changes are saved in your browser.

The default scenario scores 331 impact points versus 225 for the deadline-first baseline. Scores are authored judgments, and optimality applies to the explicit scheduling model. See [the model and examples](docs/decision-lab.md) and [independent verification](docs/decision-lab-verification.md). Run `npm run test:planner` and `npm run test:planner:io` to reproduce the checks.

## What is included

- Landing page, Gmail connection page, dashboard, email detail page, and settings/usage page
- Server-side Google OAuth flow
- Gmail unread fetch helper
- Gmail draft creation helper
- OpenAI analysis and reply helpers
- Supabase schema with users, emails, drafts, usage, and Gmail connection token storage
- Free plan limits: 100 analyses/month, 20 drafts/month, 1 Gmail account
- Stripe-ready checkout placeholder (no active checkout UI)
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

- Click `Try MailFlow` or `Find your calm` on the landing page, or choose the sample inbox on the connect page.
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
- `POST /api/emails/:id/reply`: generates a reply, or saves the exact edited reply as a Gmail draft
- `POST /api/subscription/checkout`: Stripe-ready placeholder

## Production notes

- Encrypt Gmail access and refresh tokens before production launch.
- Replace the local `mailflow_user_id` cookie with Supabase Auth or a signed session.
- Add Stripe Checkout in `app/api/subscription/checkout/route.ts`.
- Add background jobs for large inboxes instead of analyzing sequentially in one request.
- Keep Gmail send permission out of the OAuth consent screen unless the product scope changes.
