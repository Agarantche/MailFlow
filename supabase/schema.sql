create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  google_id text not null unique,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  google_id text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, google_id)
);

create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_message_id text not null,
  thread_id text,
  sender text not null,
  subject text not null,
  body text not null,
  category text check (
    category is null or category in (
      'Work',
      'Personal',
      'Billing',
      'Support',
      'Sales',
      'Newsletter',
      'Spam',
      'Phishing',
      'Other'
    )
  ),
  priority text check (
    priority is null or priority in ('Low', 'Medium', 'High', 'Urgent')
  ),
  risk_score integer check (risk_score is null or risk_score between 0 and 10),
  needs_reply boolean,
  summary text,
  action_items text[] not null default '{}'::text[],
  recommended_action text,
  created_at timestamptz not null default now(),
  unique (user_id, gmail_message_id)
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email_id uuid not null references public.emails(id) on delete cascade,
  draft_text text not null,
  gmail_draft_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  emails_analyzed integer not null default 0 check (emails_analyzed >= 0),
  drafts_generated integer not null default 0 check (drafts_generated >= 0),
  billing_cycle_start timestamptz not null,
  billing_cycle_end timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, billing_cycle_start)
);

create index if not exists emails_user_created_idx
  on public.emails(user_id, created_at desc);

create index if not exists emails_user_category_idx
  on public.emails(user_id, category);

create index if not exists drafts_email_created_idx
  on public.drafts(email_id, created_at desc);

create index if not exists usage_user_cycle_idx
  on public.usage(user_id, billing_cycle_start desc);

alter table public.users enable row level security;
alter table public.gmail_connections enable row level security;
alter table public.emails enable row level security;
alter table public.drafts enable row level security;
alter table public.usage enable row level security;

comment on table public.gmail_connections is
  'Server-only OAuth token store. Use the Supabase service role from API routes only; encrypt tokens before production launch.';
