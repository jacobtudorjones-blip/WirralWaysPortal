-- Room Booking module — Supabase (REST) used as a JSON key/value store,
-- not a normal relational table (see src/lib/storage.js's loadKey/saveKey
-- and CLAUDE.md). Every "key" (bookings, the audit log, ...) is one row in
-- this table: id = the key string (e.g. "ww_bookings_v4"), data = the
-- entire JSON value for that key (an array of booking objects, for the
-- bookings key). App.jsx currently reads/writes "ww_bookings_v4" and
-- "ww_audit_v4" — bump the _vN suffix there (not here) if the booking
-- object shape ever changes incompatibly; this table doesn't care what
-- shape `data` holds.
--
-- This table predates this repo (the original single-file Room Booking
-- app already used it) and had no tracked schema file until now — this
-- file exists so the table is reproducible/documented like every other
-- table in this project, and so a fresh Supabase project can be set up
-- from schema files alone. Same permissive RLS posture as
-- staff-portal-schema.sql and car-booking-schema.sql: the anon key can
-- read/write this table directly, and the app's own gates (PIN, approver
-- email allowlist) are client-side conveniences, not real authentication.

create table if not exists ww_bookings (
  id         text primary key,   -- the storage "key", e.g. "ww_bookings_v4"
  data       jsonb not null,     -- the whole JSON value stored under that key
  updated_at timestamptz not null default now()
);

alter table ww_bookings enable row level security;

drop policy if exists ww_bookings_anon_all on ww_bookings;
create policy ww_bookings_anon_all on ww_bookings for all to anon using (true) with check (true);
