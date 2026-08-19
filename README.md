# Wirral Ways — Room Booking

A room booking system for CGL's Wirral Ways sites (Price Street, Market
Street, Argyle Street, Brighton Street). Staff identify themselves with a
`@cgl.org.uk` email address, browse rooms, request bookings (single, bulk,
or recurring), and — for the small list of approvers configured in
`src/data/rooms.js` — approve/reject requests, check people in, and view
analytics and an audit log.

This project was converted from a single self-contained `index.html` file
(React + Babel loaded from CDNs, no build step) into a normal Vite + React
project, so it can be developed, linted, and built like any other JS
project — including with Claude Code.

## Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/)
- Plain inline styles (no CSS framework) — matches the original design
- [Supabase](https://supabase.com/) (REST API) as a simple JSON key/value
  store for bookings and the waitlist (table: `ww_bookings`)
- [Brevo](https://www.brevo.com/) for transactional email

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real Supabase/Brevo values
npm run dev
```

Open the printed local URL. `npm run build` produces a static `dist/`
folder you can deploy anywhere (Netlify, Cloudflare Pages, S3, etc.) — there
is no server-side component.

## Environment variables

See `.env.example`. All three variables are `VITE_`-prefixed so Vite
inlines them into the client bundle at build time:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (protected by RLS on the `ww_bookings` table) |
| `VITE_BREVO_API_KEY` | Brevo API key used to send booking/waitlist emails |

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
src/
  main.jsx            React root
  App.jsx             Top-level app: identity, tabs, data loading/saving
  data/rooms.js        Brand palette, sites, approvers, room + layout data
  lib/                 Framework-agnostic helpers
    helpers.js          date/time formatting, recurrence, conflict checks
    storage.js           Supabase load/save
    waitlist.js           waitlist load/save/notify
    email.js               Brevo send + dev-only email simulation
    ics.js                  .ics calendar file export
    slots.js                 30-minute time-slot helpers
    nameFromEmail.js          parses a display name from a CGL email
  styles/shared.js      shared inline style objects (inputs, labels)
  components/          one file per UI component (forms, modals, views)
```

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
