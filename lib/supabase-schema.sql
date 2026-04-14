-- ============================================================
-- D&D Tracker Pro — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================

-- ── subscriptions ────────────────────────────────────────────
-- Mirrors Stripe subscription state. Updated by /api/stripe-webhook.
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text,
  price_id               text,
  status                 text not null default 'inactive',
  -- 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  current_period_end     timestamptz,
  updated_at             timestamptz default now(),
  unique (user_id)
);

-- ── campaigns ────────────────────────────────────────────────
-- One JSON blob per user, identical shape to the localStorage data
-- used in the free (single-file) version.
create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique (user_id)
);

-- ── Row-Level Security ────────────────────────────────────────
alter table public.subscriptions enable row level security;
alter table public.campaigns     enable row level security;

-- Subscriptions: service role (used by API functions) has full access;
-- authenticated users can read their own row.
create policy "users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Campaigns: authenticated users can read/write their own row.
create policy "users can read own campaign"
  on public.campaigns for select
  using (auth.uid() = user_id);

create policy "users can upsert own campaign"
  on public.campaigns for insert
  with check (auth.uid() = user_id);

create policy "users can update own campaign"
  on public.campaigns for update
  using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_campaigns_user_id     on public.campaigns(user_id);

-- ============================================================
-- Roll20 Live Sync
-- ============================================================

-- One pairing per user (campaign_id + hashed secret)
create table if not exists public.roll20_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  secret_hash text not null,  -- sha256 of the plaintext secret; never store plaintext
  enabled     boolean default true,
  created_at  timestamptz default now(),
  unique (user_id)             -- one Roll20 campaign per account
);

-- Live sync data keyed by (campaign_id, type)
-- Supabase Realtime broadcasts row changes to subscribed tracker windows.
-- type values: 'handshake' | 'full_sync' | 'hp_update' | 'initiative_update'
create table if not exists public.roll20_sync (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null,
  data        jsonb not null default '{}',
  updated_at  timestamptz default now(),
  unique (campaign_id, type)
);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.roll20_sessions enable row level security;
alter table public.roll20_sync     enable row level security;

-- Users can read/write their own pairing row
create policy "users manage own roll20 session"
  on public.roll20_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can read their own sync data (service role writes via webhook)
create policy "users read own roll20 sync"
  on public.roll20_sync for select
  using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_roll20_sessions_user       on public.roll20_sessions(user_id);
create index if not exists idx_roll20_sessions_campaign   on public.roll20_sessions(campaign_id);
create index if not exists idx_roll20_sync_campaign_type  on public.roll20_sync(campaign_id, type);
create index if not exists idx_roll20_sync_user           on public.roll20_sync(user_id);

-- ── Enable Realtime on roll20_sync ───────────────────────────
-- Run this in the Supabase dashboard → Table Editor → roll20_sync → Realtime: ON
-- Or execute: alter publication supabase_realtime add table public.roll20_sync;
