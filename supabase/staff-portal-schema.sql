-- Wirral Ways Staff Portal — schema + Row Level Security policies.
--
-- Run this once in your Supabase project's SQL Editor (Database → SQL
-- Editor → New query) before using the staff portal (routes under /staff).
--
-- This can be the SAME Supabase project the Room Booking app already uses
-- (cheapest option — one free-tier project, one set of VITE_SUPABASE_URL /
-- VITE_SUPABASE_ANON_KEY env vars) or a separate one; either works, the
-- table names below (all prefixed staff_) won't collide with ww_bookings.
--
-- ── SECURITY MODEL — READ THIS ─────────────────────────────────────────
-- The portal talks to Supabase directly from the browser using the PUBLIC
-- anon key (see .env.example / src/lib/staffApi.js) — same approach the
-- Room Booking app already uses for ww_bookings. The anon key is *meant*
-- to be shipped in the JS bundle; the tables are protected by the Row
-- Level Security (RLS) policies below instead of by keeping a key secret.
--
-- The policies here are DELIBERATELY PERMISSIVE (any anon request can
-- read/write) because, like the room-booking app's APPROVERS list and the
-- staff_users.role column used by the portal's admin/who's-in gates, there
-- is no real server-side authentication in this app — a determined visitor
-- who has the anon key (trivial: it's in the shipped JS) and knows a table
-- name can call the Supabase REST API directly, bypassing the portal's UI
-- gates entirely. That is an accepted, documented limitation (see
-- README.md), not an oversight. If you need these records to be genuinely
-- private, the real fix is Supabase Auth (so RLS can check auth.uid()
-- instead of allowing anon) or a small server-side proxy — both bigger
-- changes than this rebuild scope.
--
-- If your Supabase project used the leaked service-role key from the
-- original api.php file, ROTATE THAT KEY in Project Settings → API before
-- (or right after) running this file — that key bypassed RLS entirely and
-- must be treated as compromised regardless of what you do here.

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ── STAFF DIRECTORY ──────────────────────────────────────────────────────
-- The "add users" feature: one row per member of staff. manager_id is a
-- self-referencing link so a manager is picked from this same table.
create table if not exists staff_users (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null unique,
  site        text,                          -- one of the Room Booking SITES, or null
  role        text not null default 'staff', -- 'staff' | 'manager' | 'admin'
  manager_id  uuid references staff_users(id) on delete set null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── ATTENDANCE RECORDS ────────────────────────────────────────────────────
create table if not exists staff_sign_ins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references staff_users(id) on delete set null,
  name           text not null,
  site_id        text not null,
  person_type    text not null default 'staff', -- 'staff' | 'service_user' | 'partner'
  notes          text,
  sign_in_time   timestamptz not null default now(),
  sign_out_time  timestamptz
);

create table if not exists staff_wfh (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references staff_users(id) on delete set null,
  name           text not null,
  notes          text,
  start_time     timestamptz not null default now(),
  returned_time  timestamptz
);

create table if not exists staff_elsewhere (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references staff_users(id) on delete set null,
  name           text not null,
  location       text,
  notes          text,
  start_time     timestamptz not null default now(),
  returned_time  timestamptz
);

create table if not exists staff_outreach (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references staff_users(id) on delete set null,
  name             text not null,
  location         text,
  expected_return  text, -- "HH:MM", time-of-day they expect to be back
  notes            text,
  start_time       timestamptz not null default now(),
  returned_time    timestamptz
);

create index if not exists staff_sign_ins_open_idx  on staff_sign_ins (site_id) where sign_out_time is null;
create index if not exists staff_wfh_open_idx       on staff_wfh (id) where returned_time is null;
create index if not exists staff_elsewhere_open_idx on staff_elsewhere (id) where returned_time is null;
create index if not exists staff_outreach_open_idx  on staff_outreach (id) where returned_time is null;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────
alter table staff_users     enable row level security;
alter table staff_sign_ins  enable row level security;
alter table staff_wfh       enable row level security;
alter table staff_elsewhere enable row level security;
alter table staff_outreach  enable row level security;

-- Drop-then-create so this script is safe to re-run.
drop policy if exists staff_users_anon_all     on staff_users;
drop policy if exists staff_sign_ins_anon_all  on staff_sign_ins;
drop policy if exists staff_wfh_anon_all       on staff_wfh;
drop policy if exists staff_elsewhere_anon_all on staff_elsewhere;
drop policy if exists staff_outreach_anon_all  on staff_outreach;

create policy staff_users_anon_all     on staff_users     for all to anon using (true) with check (true);
create policy staff_sign_ins_anon_all  on staff_sign_ins  for all to anon using (true) with check (true);
create policy staff_wfh_anon_all       on staff_wfh       for all to anon using (true) with check (true);
create policy staff_elsewhere_anon_all on staff_elsewhere for all to anon using (true) with check (true);
create policy staff_outreach_anon_all  on staff_outreach  for all to anon using (true) with check (true);

-- ── SEED YOUR FIRST ADMIN ─────────────────────────────────────────────────
-- Uncomment and run (edit name/email first if this isn't you) — this is
-- the "add users" chicken-and-egg step: you need one admin before anyone
-- can use /staff/admin/users to add everyone else.
-- insert into staff_users (name, email, role, active)
-- values ('Jacob Jones', 'jacob.jones2@cgl.org.uk', 'admin', true)
-- on conflict (email) do update set role = 'admin';
