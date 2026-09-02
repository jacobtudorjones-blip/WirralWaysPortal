# Wirral Ways Portal

A portal hub plus two apps, one Vite + React project, one deploy:

- **Landing** (`/`) — pick a section: Room Booking or Staff Portal. More
  sections are expected here in future.
- **Room Booking** (`/rooms`) — for CGL's Wirral Ways sites (Price Street,
  Market Street, Argyle Street, Brighton Street). Staff identify themselves
  with a `@cgl.org.uk` email address, browse rooms, request bookings
  (single, bulk, or recurring), and — for approvers (configured in
  `src/data/rooms.js`, or anyone with an `admin` role in the Staff Portal
  directory) — approve/reject requests, check people in, and view
  analytics and an audit log. Individual rooms have their own URL, e.g.
  `/rooms/meadow-room` — shareable, bookmarkable, and what clicking a room
  card takes you to.
- **Staff Portal** (`/staff`) — sign in/out for health & safety and lone
  working, working-from-home and working-elsewhere tracking, outreach
  tracking, a live "who's in" roll-call view, and a staff directory with
  user management (add staff — one at a time or in bulk — record their
  site/role/manager). See [Staff Portal](#staff-portal) below.

Both apps were originally single self-contained `index.html` files (React +
Babel / plain JS loaded from CDNs, no build step); this project converts
them into one normal Vite + React project with real client-side routing,
so it can be developed, linted, and built like any other JS project —
including with Claude Code.

## Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/)
- [react-router-dom](https://reactrouter.com/) for the Staff Portal's
  client-side routing (`/staff/*`)
- Plain inline styles (no CSS framework) — matches the original design
- [Supabase](https://supabase.com/) (REST API), called directly from the
  browser: a simple JSON key/value store for Room Booking (table:
  `ww_bookings`), and normal relational tables for the Staff Portal
  (`staff_users`, `staff_sign_ins`, `staff_wfh`, `staff_elsewhere`,
  `staff_outreach` — see [Staff Portal](#staff-portal))
- [Brevo](https://www.brevo.com/) for transactional email (Room Booking only)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real Supabase/Brevo values
npm run dev
```

Open the printed local URL. `npm run build` produces a static `dist/`
folder you can deploy anywhere — there is no server-side component. Two
files handle the client-side routing fallback (so `/staff/admin/users`
etc. work on a hard refresh or a direct link, not just in-app navigation)
depending on the host:
- `public/_redirects` — Netlify.
- `public/.htaccess` — any Apache host (this is what one.com's web
  hosting uses; see [Deploying to one.com](#deploying-to-onecom) below).

Both just get copied into `dist/` as-is by the build; only the one that
matches your host actually does anything.

## Deploying to one.com

one.com's web hosting is classic Apache shared hosting — files uploaded
over FTP/SFTP or their File Manager, no git connection, no build step on
their end, and no server-side environment variable UI (unlike Netlify).
That changes the workflow slightly:

1. **Build locally with real values** — env vars are baked into the JS at
   build time, so you can't set them on the host afterwards:
   ```bash
   npm install
   cp .env.example .env.local   # fill in real Supabase/Brevo values
   npm run build
   ```
2. **Upload the contents of `dist/`** (not the folder itself — its
   *contents*) to your one.com webspace root for the (sub)domain you're
   using, e.g. `public_html/` or `public_html/staff/` for a subdomain.
   Use one.com's File Manager or an FTP/SFTP client (FileZilla, etc.) —
   credentials are in your one.com control panel under the site's FTP
   settings.
3. **Make sure `.htaccess` uploads too** — it starts with a dot, so some
   FTP clients hide it by default ("show hidden files" in the client's
   settings). Without it, anything under `/staff/*` will 404 on refresh.
4. **Re-deploy on every change** by repeating steps 1–2 — there's no
   auto-deploy from GitHub the way Netlify does it. If that manual step
   becomes a hassle, a GitHub Action that builds and pushes to one.com
   over SFTP on every push to `main` is a common way to automate it —
   ask if you want that set up.

One-time setup on the host side: create the (sub)domain in your one.com
control panel first (e.g. a `staff.` subdomain pointing at its own
folder, if you want Room Booking and the Staff Portal on separate
subdomains rather than `/` and `/staff` on the same one — either works,
since routing is all client-side).

## Environment variables

See `.env.example`. All variables are `VITE_`-prefixed so Vite inlines
them into the client bundle at build time:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL — used by both apps, client-side |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key — protected by RLS, used by both apps, client-side |
| `BREVO_API_KEY` | Brevo API key — **not** `VITE_`-prefixed; read server-side only, by `netlify/functions/send-email.js` |

Both apps can share the same Supabase project (cheapest option — one
free-tier project) since their tables use different name prefixes
(`ww_` vs `staff_`), or you can point them at separate projects by editing
the values per-environment.

**Brevo key: fixed, not just documented.** This used to be a known issue
(the key called directly from the browser, extractable via dev tools) —
it's now proxied through `netlify/functions/send-email.js`, a Netlify
Function that holds `BREVO_API_KEY` server-side and is the only thing that
ever talks to Brevo. `src/lib/email.js` just POSTs to
`/.netlify/functions/send-email`. Set `BREVO_API_KEY` in Netlify's site
environment variables (Site configuration → Environment variables), not in
a client `.env` — it must never end up `VITE_`-prefixed. This only works
because Netlify runs the function; a static-only host (one.com) can't, so
if the frontend ever moves there, this function needs to move to something
that still executes it (a Supabase Edge Function is the natural
host-agnostic alternative).

**Booking emails are real, not simulated.** Room Booking sends an actual
email (via the function above) for every request/confirmation/rejection/
next-day reminder, and notifies the approver list on a new request. A
confirmation or reminder also attaches a `.ics` calendar invite (built by
`src/lib/ics.js`, the same code behind the "📅 .ics" download button on
each booking card). This used to go through a `simulateEmail()` that only
logged to the console — worth knowing if you're wondering why nobody
seemed to be getting emails before.

**Room types & capacity filter.** Each room in `src/data/rooms.js` carries
a `types` array rather than a single type string, so a room that's both a
121 room and a group space (or both a training room and a meeting room)
shows up under either filter instead of forcing one label. The canonical
set is `ROOM_TYPES` (also exported from `rooms.js`): `121 Room`,
`Clinical Room`, `Group Room`, `Meeting Room`, `Training Room` — narrowed
down from the original room-by-room free text ("Group Space" folded into
"Group Room", "Clinical Space" into "Clinical Room", the various meeting/
training combinations split into their real tags). A computed
`type = types.join(" / ")` string is kept on every room for existing
display-only spots (room cards, booking form options, floor plan labels)
so they don't need to know about the array. `FilterBar.jsx` also has a
"fits at least N people" capacity slider (range 1 up to the largest room's
capacity) alongside the site/type/access chips.

**Manager attendance reports.** `netlify/functions/manager-report.js` is a
*scheduled* function (see `netlify.toml`) that emails every manager (any
`staff_users` row with `role = 'manager'`) a plain-text list of
their direct reports who have/haven't been recorded today — covering
site sign-in, WFH, outreach, or working elsewhere, not just physical
sign-in. It runs every 15 minutes but only acts during the 09:30
Europe/London window, checked with `Intl` rather than a fixed UTC cron
time, so it stays correct across the BST/GMT clock change. Needs no new
env vars (reuses `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`/
`BREVO_API_KEY` — Netlify exposes all site env vars to functions
regardless of the `VITE_` prefix, that prefix only controls what Vite
inlines into the *client* bundle). Depends entirely on managers being set
up correctly via `/staff/admin/users` — nobody gets a report until at
least one person has a `manager_id` pointing at them.

**Still open, not fixed by the above:** admin/approver access on both apps
(`APPROVERS` in `src/data/rooms.js`, `role` on `staff_users`) is still a
client-side email check, not real authentication — seeing the check pass
doesn't stop someone from calling the Supabase REST API directly with the
anon key. Fixing that properly needs real user auth (Supabase Auth) with
RLS keyed on `auth.uid()`, which is a bigger change than this — flagged
here rather than silently left out.

## Project structure

```
index.html            Vite entry HTML
public/_redirects     Netlify SPA fallback (all paths → index.html)
public/robots.txt     Disallows all crawling — internal tool, not meant to be indexed
public/sites/          Site photos, if any (see the Staff Portal section below) — none ship by default
netlify/functions/
  send-email.js        Brevo proxy — holds BREVO_API_KEY server-side, called from src/lib/email.js
  manager-report.js     Scheduled (netlify.toml) — 9:30am Europe/London manager attendance emails
supabase/
  staff-portal-schema.sql   Staff Portal tables + RLS policies — run once per Supabase project
src/
  main.jsx            React root — routes "/" to Landing, "/rooms/*" to the
                       Room Booking App, "/staff/*" to StaffApp
  pages/Landing.jsx    Portal hub — pick Room Booking or Staff Portal
  components/PinGate.jsx  Shared PIN-code gate (used by both apps — see below)
  App.jsx             Room Booking: identity, tabs, data loading/saving.
                       Mounted at /rooms/*; parses a room slug from the URL
                       for /rooms/:slug deep links (see CLAUDE.md)
  data/rooms.js        Brand palette, sites, approvers, room + layout data,
                        room slugs + ROOM_BY_SLUG for deep links
  lib/                 Framework-agnostic helpers, shared by both apps
    helpers.js          date/time formatting, recurrence, conflict checks
    storage.js           Supabase load/save (Room Booking's ww_bookings)
    staffApi.js           Supabase REST CRUD for any staff_* table
    waitlist.js           waitlist load/save/notify
    email.js               Brevo send (via the Netlify Function above)
    ics.js                  .ics calendar file export
    slots.js                 30-minute time-slot helpers
    nameFromEmail.js          parses a display name from a CGL email
  styles/shared.js      shared inline style objects (inputs, labels)
  components/          Room Booking components (forms, modals, views)
  staff/               Staff Portal — see below
    StaffApp.jsx         route table, mounted at /staff/*
    components/          StaffLayout (header/nav/breadcrumbs), NamePicker,
                          EmailGate, UserFormModal,
                          BulkAddUsersModal, StartFinishFlow (shared WFH/
                          outreach/elsewhere UI), SiteTile (site photo +
                          fallback), PersonAvailabilityCard (leave UI),
                          PageWrap, PrivacyNote, Breadcrumbs
    pages/                Home, SignIn (unified), SignOut, Wfh, Elsewhere,
                           Outreach, WhoIsIn, Leave, AdminDashboard,
                           AdminUsers, PrivacyPolicy
    lib/                  useStaffUsers (directory hook), useLeave,
                           permissions (canEditPerson), attendance
                           (closeAnyOpenRecordForUser), notify (sign-in ack
                           + visitor host notification emails), identity.js
                           (admin session), format.js (elapsed time, etc.),
                           useDocumentTitle (per-page browser tab title)
```

## Staff Portal

Rebuilt from a single 3,000+ line `index.html` (with a PHP proxy,
`api.php`, holding a Supabase **service-role key**) into routed pages under
`/staff`, using the same direct-to-Supabase-with-anon-key approach as Room
Booking instead of a server-side proxy — no PHP hosting needed, and the
anon key is meant to be public as long as RLS is configured correctly (see
`supabase/staff-portal-schema.sql`).

**Setup:**
1. Run `supabase/staff-portal-schema.sql` once in your Supabase project's
   SQL Editor — creates `staff_users`, `staff_sign_ins`, `staff_wfh`,
   `staff_elsewhere`, `staff_outreach` and their RLS policies.
2. Seed your first admin: uncomment and run the `insert into staff_users`
   statement at the bottom of that file (or run it manually), then sign
   in to `/staff/admin` and `/staff/admin/users` with that email to add
   everyone else through the UI.
3. If your Supabase project previously used the original `api.php`'s
   service-role key, **rotate it** in Project Settings → API — that key
   bypassed RLS entirely and must be treated as compromised.

**Pages:** `/staff` (home), `/staff/sign-in` (unified — see below),
`/staff/sign-out`, `/staff/wfh`, `/staff/elsewhere`, `/staff/outreach`
(these three still exist for *finishing* one without starting something
new — see below), `/staff/who` (live roll-call view, **PIN-gated** — see
below), `/staff/leave` (leave and non-working days — see below),
`/staff/admin` (dashboard, gated to `role IN ('admin', 'manager')`),
`/staff/admin/users` (add/edit/deactivate/delete staff, gated to
`role = 'admin'`), `/staff/privacy` (what's recorded and why — linked
from every form that collects a name/location/timestamp).

**`/staff/sign-in` is unified** — one screen offering the four office
sites *and* Working From Home / Working Elsewhere / Outreach as equal
"where are you" options (previously WFH/elsewhere/outreach were only
reachable from separate buttons/pages). Site tiles show a photo if one
exists at `public/sites/<slugified-site-name>.jpg` (none ship with this
repo — drop real photos in using that naming and they appear
automatically; `SiteTile.jsx` falls back to a plain colour badge
otherwise, not an error). Signing in anywhere **auto-closes any other
open record** this person has first (`lib/attendance.js`'s
`closeAnyOpenRecordForUser()`, checked across all four attendance
tables) — so someone signed in at Price Street who signs in at Market
Street (or starts WFH, etc.) gets automatically signed out of Price
Street first, rather than appearing in two places at once. Only works
for a matched `user_id` (picked from the NamePicker) — a free-typed name
can't be linked across tables. The dedicated `/staff/wfh` etc. pages'
"Starting" tab does the same auto-close for consistency; their
"Finishing" tab is still the only way to end one of those without
starting something else. `/staff/sign-out`'s confirmation screen also
links straight to `/staff/sign-in` ("Sign in somewhere else").

**"I am a…" (office-site sign-ins only)** is `staff` or `visitor` — no
"service user" any more. Picking a name that matches the directory
defaults this to `staff` automatically. If it doesn't match and `staff`
is picked anyway, a prompt offers to add that person to the directory
right there (email + manager, `useStaffUsers.addUser` under the hood) —
site is pre-filled from wherever they're signing in. Picking `visitor`
asks who they're here to see (another `NamePicker`, must resolve to a
real directory entry since we need a real email) and, on sign-in, emails
that person a heads-up (`lib/notify.js`'s `sendVisitorNotification`).
Anyone we have an email for — matched, or just self-registered — also
gets a sign-in confirmation email (`sendSignInAck`, same file), from
every entry point (unified Sign In and each dedicated Wfh/Elsewhere/
Outreach page's "Starting" tab).

**`/staff/who` is PIN-gated, not email-gated** — matches the original
app's design (a shared access code in front of live location data, not
an individual login). The code is `886` (`src/components/PinGate.jsx` —
shared between both apps, see next paragraph) — same caveat as every
other gate in this app: client-side, extractable from the shipped JS, a
deterrent not real security. It also never shows sign-in/start times,
only presence — see the note in CLAUDE.md.

**Room Booking is currently PIN-locked for testing** (`main.jsx`'s
`RoomsLock`, code `1335`, same `PinGate.jsx` as above) — visiting
`/rooms/*` shows "In testing mode — coming soon" with a contact email
instead of the app, until the right code is entered, at which point it's
the real app in full. This is temporary and sits entirely in `main.jsx`
in front of `App.jsx`, not inside it — remove `RoomsLock` and go back to
mounting `<App />` directly on the `/rooms/*` route to reopen it properly.

**Not a public site:** `public/robots.txt` disallows crawling entirely, and
there's no analytics on either app — the Staff Portal specifically records
real attendance/lone-working data (who's physically on site, working from
home, or on outreach), which isn't something to route through a third-party
analytics tool without a clear lawful basis. If you do want analytics on
the Room Booking side only, add it there deliberately rather than globally.

**User management:** `/staff/admin/users` is the "add users" feature —
each user has a name, email, site, role (`staff`/`manager`/`admin`), and
an optional **manager**, picked from the same directory (a
self-referencing link — `staff_users.manager_id → staff_users.id`), so the
manager relationship is real data, not free text, and stays consistent as
people are added. Adding someone with the `admin` role also makes them a
Room Booking approver (see `IdentityScreen.jsx`) — one directory, both
apps.

**Bulk add** (same page) accepts a pasted list — one person per line,
`Name, email, manager, role` (manager/role optional, or paste a bare
email and the name is derived automatically). Site isn't set in bulk —
edit that individually afterward if needed. **Manager** can be given as
an email (most reliable) or a name, and is resolved after the real
insert against the *full* directory as it then stands — including
someone else earlier in the same paste (so you can paste a manager and
their reports together in one go, in either order) — matching by exact
email, or by name only when it's unambiguous; an unresolvable or
ambiguous reference is flagged in the preview and left unset rather than
guessed. Parsed and previewed before inserting. **Only adds genuinely new
people** — anyone whose email already exists is skipped entirely, never
edited (an earlier version upserted by email, which meant re-pasting a
list that happened to include an existing person's email — e.g.
themselves, without explicitly writing their real role — silently
overwrote that person's role/site/manager; that's how an admin got their
own role reset to `staff` once. Don't reintroduce an upsert here).

**Leave & non-working days** (`/staff/leave`, email-gated like Admin —
any registered active user can get in and manage their own): each person
can record their own **non-working days** (a recurring weekly pattern —
`staff_users.non_working_days`, e.g. `{'Fri'}` for someone who doesn't
work Fridays — set directly on their profile, distinct from leave below)
and their own **leave** (one-off date ranges — annual leave, sick, etc. —
`staff_leave` table: `start_date`, `end_date`, optional `reason`).
Managers additionally see and can edit this for their direct reports;
admins see and can edit it for everyone — see `canEditPerson()` in
`src/staff/lib/permissions.js`, the same self/manager/admin rule everyone
else in this session's changes uses. Who's currently on leave is also
shown read-only on `/staff/who`, so any staff member can see it without
needing edit access.

**⚠️ Security model — no real authentication:** admin access, `/staff/leave`,
and the leave/non-working-days edit permissions all check the entered
email against `staff_users.role`/`manager_id` client-side, the same
pattern as `APPROVERS` in `src/data/rooms.js` for Room Booking approvers
(`/staff/who` is different — see above, it's PIN-gated). It stops casual
access through the UI, but not someone calling the Supabase REST API
directly with the anon key (which
ships in the bundle) — RLS is what actually protects the data, and the
policies in `staff-portal-schema.sql` are deliberately permissive (any
anon request can read/write) to keep the kiosk usable without a login
flow. If these records need to be genuinely private, the real fix is
Supabase Auth (so RLS can check `auth.uid()`) or a small server-side
proxy — bigger changes than this rebuild covers. Not carried over from the
original: gym membership/visit tracking and the SAR (data rights request)
form — say if you want either rebuilt too.

## Notes on the conversion

- Behaviour is preserved as-is from the original single-file app; this was
  a structural refactor (splitting one 3,000+ line file into modules with a
  real build step), not a rewrite. Cross-checked with a full production
  build and a headless-browser smoke test across every tab.
- Room data (`RAW_ROOMS`, capacities, AV info, accessibility notes) is still
  full of `"TBC"` placeholders from the original — worth filling in for
  real use.
- The `FloorPlan` component (an SVG room diagram) exists but isn't wired
  into any view yet, same as in the original file — the "Floor plans" tab
  currently shows a schedule picker, not the floor diagram.
