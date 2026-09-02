# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A portal hub plus two apps, sharing one Vite + React 18 project and one
deploy (see README.md for the full picture):

- **Landing** (`/`, `src/pages/Landing.jsx`) — the actual home page: two
  cards (Room Booking, Staff Portal), nothing else. Neither app auto-opens
  here anymore — this exists specifically so `/` isn't a direct entry into
  Room Booking. More sections are expected here later.
- **Room Booking** (`/rooms/*`, `src/App.jsx` + `src/components/`) — the
  original app, now mounted under `/rooms` instead of `/`. No backend of
  its own for data: Supabase (REST) is used as a JSON key/value store,
  called directly from the browser. Email is the one exception — it goes
  through `netlify/functions/send-email.js` (see below), not called
  directly from the browser. Individual rooms are deep-linkable at
  `/rooms/:slug` (e.g. `/rooms/meadow-room`) — see "Room deep links" below.
- **Staff Portal** (`/staff/*`, `src/staff/`) — sign in/out, WFH,
  outreach and "working elsewhere" tracking, a live "who's in" roll-call
  view, and staff directory / user management (name, email, site, role,
  manager, plus bulk-add — see below). Rebuilt from a single-file HTML
  kiosk app into real routed pages with `react-router-dom`. Also talks to
  Supabase directly from the browser (its own `staff_*` tables — see
  `supabase/staff-portal-schema.sql`), same architecture as Room Booking,
  no server of its own.

Routing lives in `src/main.jsx`: `/` mounts `Landing`, `/staff/*` mounts
`StaffApp`, `/rooms/*` mounts the Room Booking `App`, anything else hits a
top-level `NotFound`. Client-side routing needs a server-side fallback to
`index.html` for every path — `public/_redirects` does that on Netlify,
`public/.htaccess` does the same on Apache hosts (one.com). Both get
copied into `dist/` by the build; keep both in sync if the routing rule
ever changes, since only one applies per host.

### Room deep links

`App.jsx` is mounted at `/rooms/*` but still returns one big tree rather
than declaring its own `<Route>`s — the slug is parsed manually from
`useLocation().pathname` rather than via a nested route param, to keep
that a small addition instead of restructuring the whole component.
Two effects keep the URL and `tab`/`activeRoom` state in sync in both
directions (see the comment block right after the `useState` calls); a
`slug` field per room (kebab-cased name) and a `ROOM_BY_SLUG` lookup live
in `data/rooms.js`. `handleIdentify` checks for a deep-linked room and
lets it override the normal post-login default tab, so a shared room link
still lands there after someone signs in.

## Commands

- `npm install` — install deps
- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

There is currently no lint/test/typecheck script configured — this is a
plain JS (not TypeScript) project with no test suite yet.

## Conventions to follow

- Inline style objects (`style={{...}}`), not CSS classes or a CSS
  framework — match the existing style when touching components.
- One component per file under `src/components/`, default-exported.
- Framework-agnostic logic (date/time helpers, storage, email, ICS export)
  lives under `src/lib/`, not inside components.
- Shared data (rooms, sites, approvers, brand colours) lives in
  `src/data/rooms.js` — import from there rather than redefining. Staff
  Portal config (office sites, remote-work modes, directory roles) lives in
  `src/data/staff.js`, which imports sites/colours from `rooms.js` rather
  than redefining them.
- Secrets are read via `import.meta.env.VITE_*` (see `.env.example`) —
  never hardcode API keys/URLs in source.
- Staff Portal follows the same per-concern layout as Room Booking, under
  `src/staff/`: `pages/` (one route each, mounted in `StaffApp.jsx`),
  `components/`, `lib/` (Supabase table hooks, identity/session helpers,
  formatting). Generic Supabase REST helpers (`listRows`/`insertRow`/
  `updateRow`/`deleteRow` for any `staff_*` table) live in
  `src/lib/staffApi.js`, next to `storage.js`.

## Things worth knowing before changing behaviour

- `APPROVERS` in `src/data/rooms.js` is the full authorization model for
  approving bookings — it's just an email allowlist, no real auth. Adding
  someone means adding their email there.
- The Brevo API key is server-side only now: `netlify/functions/send-email.js`
  holds it (`process.env.BREVO_API_KEY`, deliberately not `VITE_`-prefixed)
  and is the only thing that calls Brevo; `src/lib/email.js` just POSTs to
  `/.netlify/functions/send-email`. Don't reintroduce `VITE_BREVO_API_KEY`
  or call Brevo directly from client code — that's the exact issue this
  fixed. This only works on Netlify (functions need a host that runs them);
  if the frontend ever moves to static-only hosting (one.com), this needs
  to move to something that still executes it (a Supabase Edge Function is
  the natural alternative).
- Booking emails are real (`sendEmail`), not simulated — `App.jsx` used to
  call a `simulateEmail()` that only logged to the console for every
  request/confirmed/rejected/reminder/approver-notify email; that's gone.
  A "confirmed" email also carries a `.ics` attachment
  (`icsAttachment()` in App.jsx, built from `lib/ics.js`'s `buildICS()` —
  the same function the "📅 .ics" download button uses). Don't reintroduce
  `simulateEmail` in the booking flow.
- `netlify/functions/manager-report.js` is a *scheduled* function
  (`netlify.toml`'s cron is `*/15 8-10 * * *` — restricted to 8-10am UTC,
  not all day, to avoid burning a function invocation every 15 minutes
  around the clock; it still self-gates to the exact 09:30 Europe/London
  window via `Intl` inside the function — see its comment for why not a
  fixed UTC cron time). Only emails people with `role === 'manager'` —
  having a direct report via `manager_id` isn't by itself enough. If you
  change `REPORT_WINDOW_MINUTES` in that file, update both the cron
  interval AND the 8-10 hour range in `netlify.toml` to match, or it'll
  fire more than once a day (or miss the window entirely).
- `/staff/who` (WhoIsIn.jsx) is **PIN-gated** (`PinGate.jsx`, code `886`),
  not email-gated like the rest of the portal — matches the original
  single-file app's design. It also deliberately never shows sign-in/start
  times — presence only. Times are admin-dashboard-only
  (AdminDashboard.jsx's log table). The one exception is outreach's "back
  by" (expected_return) — that's not when someone started, it's when
  they're due back, kept for lone-working safety since the overdue flag
  depends on it. Don't add `formatClock`/`formatElapsed` back into
  WhoIsIn.jsx without checking this is still what's wanted.
- Leave (`staff_leave` table) and non-working days
  (`staff_users.non_working_days`) are two different things, both
  editable at `/staff/leave` — leave is one-off date ranges (annual
  leave, sick, etc.); non-working days is a recurring weekly pattern on
  the profile (e.g. `{'Fri'}` for someone who doesn't work Fridays).
  `src/staff/lib/permissions.js`'s `canEditPerson()` is the shared rule
  for who can edit whose record here (and reused nowhere else yet, but
  written generically): self always, a manager for their direct reports
  (`target.manager_id === current.id`), an admin for anyone. Same
  client-side-only caveat as every other permission check in this app.
- `hasConflict` (src/lib/helpers.js) only treats `status === "confirmed"`
  bookings as blocking — pending/cancelled/auto-released bookings are
  intentionally not conflict sources.
- Staff Portal admin access (`/staff/admin`, `/staff/admin/users`) and the
  "Who's in" gate work exactly like APPROVERS above: an email checked
  against the `role` column on `staff_users`, client-side, no real auth.
  It stops casual access, not someone calling Supabase's REST API directly
  with the anon key. Don't present it as more secure than that.
- Room Booking's approver check (`IdentityScreen.jsx`) is now APPROVERS
  **or** `staff_users.role === 'admin'` — additive, and falls back to
  APPROVERS-only if the `staff_users` fetch fails for any reason (missing
  table, offline), since this must never block someone from continuing
  into the app. This means bulk-adding admins in the Staff Portal
  (`/staff/admin/users` → Bulk add) also grants Room Booking approver
  rights — that's the intended "one directory, both apps" behaviour, not
  a bug if someone added there shows up as an approver here too.
- The original uploaded single-file version of the Staff Portal had a
  Supabase **service-role key hardcoded in a PHP proxy** and a hardcoded
  admin password in client JS. Neither was carried over — that service-role
  key must be treated as compromised and rotated in the Supabase dashboard
  regardless of anything in this repo. See `supabase/staff-portal-schema.sql`
  for the RLS-based replacement.
