# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

Wirral Ways Room Booking — a Vite + React 18 single-page app (see
README.md for the full picture). No backend of its own: Supabase (REST) is
used as a JSON key/value store, Brevo sends email, both called directly
from the browser.

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
  `src/data/rooms.js` — import from there rather than redefining.
- Secrets are read via `import.meta.env.VITE_*` (see `.env.example`) —
  never hardcode API keys/URLs in source.

## Things worth knowing before changing behaviour

- `APPROVERS` in `src/data/rooms.js` is the full authorization model for
  approving bookings — it's just an email allowlist, no real auth. Adding
  someone means adding their email there.
- The Brevo API key is exposed client-side (see the security note in
  README.md). Don't "fix" this by moving it to a `.env` alone — that only
  keeps it out of git, not out of the shipped bundle. A real fix needs a
  server-side proxy.
- `hasConflict` (src/lib/helpers.js) only treats `status === "confirmed"`
  bookings as blocking — pending/cancelled/auto-released bookings are
  intentionally not conflict sources.
