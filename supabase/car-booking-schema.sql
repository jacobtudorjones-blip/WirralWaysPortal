-- Car Booking module — one table for one shared vehicle. Same RLS posture
-- as everything else in this project (see staff-portal-schema.sql's header
-- comment and README.md's security notes): the anon key can read/write
-- this table directly, and the app's own gates (email allowlist, PIN) are
-- client-side conveniences, not real authentication. Run this once per
-- Supabase project, alongside staff-portal-schema.sql.

create extension if not exists pgcrypto; -- for gen_random_uuid(), harmless if already enabled

create table if not exists car_bookings (
  id                 uuid primary key default gen_random_uuid(),
  requested_by       text not null,                  -- name, parsed from email like Room Booking
  requested_by_email text not null,
  date               date not null,
  start_time         text not null,                  -- "HH:MM", same 30-min-slot convention as Room Booking
  end_time           text not null,
  purpose            text not null,                  -- what the car's needed for
  notes              text,
  -- Same status shape as Room Booking's ww_bookings (pending -> confirmed
  -- or rejected by an approver; cancelled is a separate terminal state) —
  -- see src/car/lib/carEmail.js and CarApprovals.jsx.
  status             text not null default 'pending' check (status in ('pending','confirmed','rejected','cancelled')),
  approved_by        text,
  approved_at        timestamptz,
  rejected_by        text,
  rejected_at        timestamptz,
  rejection_note     text,
  cancelled_by       text,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  constraint car_bookings_time_order check (end_time > start_time)
);

create index if not exists car_bookings_date_idx on car_bookings (date) where status in ('pending','confirmed');

-- "Book for someone else" — mirrors Room Booking's bookingForOther:
-- requested_by/requested_by_email above stays whoever actually submitted
-- the request; these two are set only when it's on someone else's behalf,
-- and are null for the (still far more common) case of booking for
-- yourself. See src/car/pages/BookCar.jsx and src/car/lib/carEmail.js.
alter table car_bookings add column if not exists booked_for       text;
alter table car_bookings add column if not exists booked_for_email text;

alter table car_bookings enable row level security;

drop policy if exists car_bookings_anon_all on car_bookings;
create policy car_bookings_anon_all on car_bookings for all to anon using (true) with check (true);
