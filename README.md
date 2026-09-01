# Wirral Ways Portal

Two apps, one Vite + React project, one deploy:

- **Room Booking** (`/`) — for CGL's Wirral Ways sites (Price Street,
  Market Street, Argyle Street, Brighton Street). Staff identify themselves
  with a `@cgl.org.uk` email address, browse rooms, request bookings
  (single, bulk, or recurring), and — for the small list of approvers
  configured in `src/data/rooms.js` — approve/reject requests, check
  people in, and view analytics and an audit log.
- **Staff Portal** (`/staff`) — sign in/out for health & safety and lone
  working, working-from-home and working-elsewhere tracking, outreach
  tracking, a live "who's in" roll-call view, and a staff directory with
  user management (add staff, record their site/role/manager). See
  [Staff Portal](#staff-portal) below.

Both were originally single self-contained `index.html` files (React +
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
| `VITE_SUPABASE_URL` | Supabase project URL — used by both apps |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key — protected by RLS, used by both apps |
| `VITE_BREVO_API_KEY` | Brevo API key used to send booking/waitlist emails (Room Booking only) |

Both apps can share the same Supabase project (cheapest option — one
free-tier project) since their tables use different name prefixes
(`ww_` vs `staff_`), or you can point them at separate projects by editing
the values per-environment.

**⚠️ Known security issue, carried over from the original app:** the Brevo
API key is called directly from the browser (`src/lib/email.js`), so it
ships inside the built JS bundle and is extractable by anyone who opens dev
tools on the deployed site — not just kept out of git. A leaked key could be
used to send email as `rooms@wirralways.org.uk`. Before relying on this in
production, put email-sending behind a small server-side function (a
Supabase Edge Function or similar) that holds the Brevo key server-side
instead of shipping it to the browser.

## Project structure

```
index.html            Vite entry HTML
public/_redirects     Netlify SPA fallback (all paths → index.html)
public/robots.txt     Disallows all crawling — internal tool, not meant to be indexed
supabase/
  staff-portal-schema.sql   Staff Portal tables + RLS policies — run once per Supabase project
src/
  main.jsx            React root — routes "/" to the Room Booking App, "/staff/*" to StaffApp
  App.jsx             Room Booking: identity, tabs, data loading/saving
  data/rooms.js        Brand palette, sites, approvers, room + layout data
  lib/                 Framework-agnostic helpers, shared by both apps
    helpers.js          date/time formatting, recurrence, conflict checks
    storage.js           Supabase load/save (Room Booking's ww_bookings)
    staffApi.js           Supabase REST CRUD for any staff_* table
    waitlist.js           waitlist load/save/notify
    email.js               Brevo send + dev-only email simulation
    ics.js                  .ics calendar file export
    slots.js                 30-minute time-slot helpers
    nameFromEmail.js          parses a display name from a CGL email
  styles/shared.js      shared inline style objects (inputs, labels)
  components/          Room Booking components (forms, modals, views)
  staff/               Staff Portal — see below
    StaffApp.jsx         route table, mounted at /staff/*
    components/          StaffLayout (header/nav/breadcrumbs), NamePicker,
                          EmailGate, UserFormModal, StartFinishFlow (shared
                          WFH/outreach/elsewhere UI), PageWrap, PrivacyNote,
                          Breadcrumbs
    pages/                Home, SignIn, SignOut, Wfh, Elsewhere, Outreach,
                           WhoIsIn, AdminDashboard, AdminUsers, PrivacyPolicy
    lib/                  useStaffUsers (directory hook), identity.js
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

**Pages:** `/staff` (home), `/staff/sign-in`, `/staff/sign-out`,
`/staff/wfh`, `/staff/elsewhere`, `/staff/outreach`, `/staff/who` (live
roll-call view), `/staff/admin` (dashboard, gated to `role IN ('admin',
'manager')`), `/staff/admin/users` (add/edit/deactivate/delete staff,
gated to `role = 'admin'`), `/staff/privacy` (what's recorded and why —
linked from every form that collects a name/location/timestamp).

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
people are added.

**⚠️ Security model — no real authentication:** admin access and the
"Who's in" gate check the entered email against `staff_users.role`
client-side, the same pattern as `APPROVERS` in `src/data/rooms.js` for
Room Booking approvers. It stops casual access through the UI, but not
someone calling the Supabase REST API directly with the anon key (which
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
