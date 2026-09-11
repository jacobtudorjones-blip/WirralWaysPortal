# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A portal hub plus three apps, sharing one Vite + React 18 project and one
deploy (see README.md for the full picture):

- **Landing** (`/`, `src/pages/Landing.jsx`) — the actual home page: three
  cards (Room Booking, Staff Portal, Car Booking), nothing else. None of
  the apps auto-open here — this exists specifically so `/` isn't a direct
  entry into any one of them. More sections are expected here later.
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
- **Car Booking** (`/car/*`, `src/car/`) — book the one shared work
  vehicle: pick a date and time slot, requests need approval (same
  pattern as Room Booking — `CarApprovals.jsx`), and an approver's own
  requests auto-confirm. Much smaller than Room Booking (one vehicle, no
  sites/rooms/floor-plans), but the same shape: its own `pages/`,
  `components/`, `lib/` under `src/car/`, its own identity screen
  (`CarIdentityScreen.jsx`, CGL-email-only, checks `CAR_APPROVERS`), and
  its own Supabase table (`car_bookings` — see
  `supabase/car-booking-schema.sql`).

Routing lives in `src/main.jsx`: `/` mounts `Landing`, `/staff/*` mounts
`StaffApp`, `/rooms/*` mounts the Room Booking `App`, `/car/*` mounts
`CarApp`, anything else hits a top-level `NotFound`. Client-side routing
needs a server-side fallback to
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

- Room Booking and Car Booking both used to be PIN-locked behind a
  `RoomsLock`/`CarLock` wrapper (`main.jsx`, `PinGate`, code `1335`) while
  in testing — both were opened up (the wrappers removed, `/rooms/*` and
  `/car/*` mount `<App />`/`<CarApp />` directly again) once testing was
  done. `PinGate` (`src/components/PinGate.jsx`) is still used elsewhere
  (Who's In, code `886` — see below) and is written generically (`pin` as
  a prop) specifically so it could be reused for this kind of temporary
  lock again if either app ever needs one.
- Car Booking (`src/car/`) deliberately duplicates a few small things
  from Room Booking rather than sharing them, on the theory that a
  second, much simpler booking flow was cheaper to keep independent than
  to generalise the first one to cover both:
  - `CarIdentityScreen.jsx` is its own component (not a reused/parameterised
    `IdentityScreen.jsx`) — same email-validation/name-parsing logic, but
    checks `CAR_APPROVERS` (`src/data/car.js`, defaults to importing Room
    Booking's `APPROVERS` — replace with a real separate list if the same
    people shouldn't approve both) instead of Room Booking's `APPROVERS`.
  - `car/components/PageWrap.jsx` is its own copy of
    `staff/components/PageWrap.jsx` (defaults `backTo` to `/car`), rather
    than Car Booking reaching into the Staff Portal's `components/` —
    keeps each app's `pages/`/`components/`/`lib/` self-contained, per the
    "Staff Portal follows the same per-concern layout" convention this
    file already documents; Car Booking follows it too now.
  - `CarSchedulePicker.jsx` is a trimmed copy of `DaySchedulePicker.jsx`
    (drag-to-select grid, `lib/slots.js`'s `SLOTS`/`slotToMins`/
    `minsToSlot` reused directly since those are already room-agnostic) —
    no room concept, no waitlist button (doesn't apply to one vehicle).
  - `car_bookings` rows are read/written with the exact same generic
    `listRows`/`insertRow`/`updateRow` helpers from `src/lib/staffApi.js`
    that every `staff_*` table also uses — despite the filename, that
    module was already fully table-agnostic, not staff-specific, so Car
    Booking needed no new API layer, just the shared one.
  - Bookings are only ever blocked by another **confirmed** booking for
    the same date/time (`BookCar.jsx`'s local `hasConflict()`) — pending
    requests can overlap, since only one will actually get approved. Same
    deliberate rule as Room Booking's `hasConflict()` in `lib/helpers.js`;
    kept as a small local copy here rather than trying to reuse that one,
    since it's coupled to Room Booking's `roomId`/camelCase field names
    and `car_bookings` uses plain Supabase column names (`start_time`, not
    `startTime`) throughout — there's no camelCase translation layer in
    this module, unlike Room Booking's `bookings` state shape.
  - Emails reuse `lib/emailHtml.js`'s `buildHtmlEmail()` (see the Room
    Booking email bullet below) and go out under a **third** Brevo sender
    key, `"car-booking"` (`send-email.js`'s `SENDERS` map) — same
    `rooms@wirralways.org.uk` verified address as Room Booking, just a
    different display name, specifically to avoid needing a fourth
    address verified in Brevo (see the sender-verification incident
    documented below) for what's cosmetically a different "from" name.
  - Approving/rejecting/requesting all send real emails
    (`car/lib/carEmail.js`), same event set as Room Booking
    (requested/confirmed/rejected/approver_notify), now including
    `recipientsFor()`'s "book for someone else" handling too — added on
    request; `BookCar.jsx` has the same toggle Room Booking's
    `BookingForm.jsx` does. Naming differs slightly from Room Booking
    on purpose: `car_bookings.requested_by`/`requested_by_email` always
    stays whoever actually submitted the request (that column already
    meant "requester", unlike Room Booking's `bookedBy`/`email`, which
    mean "who it's for"), and two new nullable columns,
    `booked_for`/`booked_for_email`, hold who the car is actually for
    when they're not the same person — null for the (still far more
    common) case of booking for yourself. `recipientsFor()` sends to
    both (comma-separated) when they differ, same pattern as Room
    Booking's own `recipientsFor()` in `App.jsx`; the email greeting and
    the calendar-sync "Booked by:" line address the actual recipient
    (`booked_for || requested_by`), not the submitter. `MyCarBookings.jsx`
    matches on `requested_by_email` **or** `booked_for_email` so both
    people see it in their own bookings list. Bulk booking
    (`BulkBookCar.jsx`) deliberately doesn't get this — Room Booking's own
    bulk form (`BulkBookingForm.jsx`) doesn't have it either, so this
    keeps parity rather than adding it in one app and not the other.
  - `CarMonth.jsx` (`/car/month`) is a Mon-Sun month-grid overview —
    designed fresh, not adapted, since Room Booking has no monthly view of
    its own to copy (only `WeeklyView.jsx`/`DailyView.jsx`); the grid
    maths (padding to a Monday start, trimming to just the weeks the month
    needs) is original to this component. Each day cell shows up to 3
    bookings as small chips (green = confirmed, amber = pending, "+N more"
    beyond that) and a "+ Book" link that goes to `/car/book?date=...` —
    `BookCar.jsx` reads that query param (`useSearchParams`) to pre-fill
    the date, falling back to today when it's absent, same `?tab=`-style
    pattern the rest of the app uses for email/link deep-linking.
  - `BulkBookCar.jsx` is a trimmed copy of Room Booking's
    `BulkBookingForm.jsx` modal, opened from a "Book multiple dates"
    button on `BookCar.jsx` — cut down to two modes instead of three
    ("Pick specific dates" and "Every weekday in a range"; there's no
    "multiple rooms" mode since there's only one vehicle), reusing the
    same 60-booking cap and per-item `hasConflict()` check (its own local
    copy, same reasoning as `BookCar.jsx`'s). `BookCar.jsx`'s
    `handleBulkBook` batches the insert in one call via `insertRows`
    (`src/lib/staffApi.js`) rather than looping `insertRow`, and —
    deliberately matching Room Booking's own `handleBulkBook` in
    `App.jsx`, which doesn't email either — sends **no** per-item email;
    a bulk request of N dates would otherwise mean N near-identical
    emails. The on-screen result banner on `BookCar.jsx` (dismissible,
    "N bookings confirmed/requested") is the confirmation instead. Same
    auto-approve rule as a single booking: an approver's own bulk request
    confirms every date immediately.
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
  the natural alternative). `send-email.js` is shared by both apps and
  picks its Brevo sender from a small server-side `SENDERS` map keyed by
  a `from` string the caller passes (`"room-booking"`, the default if
  omitted, or `"staff-portal"`) — never a raw address from the client,
  so this can't be used to send as an arbitrary sender. Room Booking
  (`src/lib/email.js` callers that don't pass `from`) sends as
  `rooms@wirralways.org.uk`; Staff Portal (`src/staff/lib/notify.js`,
  and `manager-report.js` — a separate function with its own hardcoded
  `FROM`, not routed through `send-email.js`) sends as
  `noreply@wirralways.org.uk`. Both are confirmed verified in Brevo
  (Senders, domains, IPs → Senders: green "Verified", DKIM configured for
  the `wirralways.org.uk` domain, DMARC configured). Adding a sender that
  isn't in Brevo's verified list is exactly what caused a real incident:
  Brevo silently rejects sends from an unrecognized sender and the
  function returns a 502 to the browser with no other symptom — always
  check Brevo's Senders page shows an address as Verified before wiring
  it up, don't assume. If emails stop arriving, check the Netlify
  function log for `send-email`/`manager-report` for the actual Brevo
  rejection reason (status + response body, logged via `console.error`)
  before guessing at a cause — sender verification is the most common
  one, but not the only one.
- Room types on Room Booking rooms (`src/data/rooms.js`) are a `types`
  array per room, not a single string — a room can legitimately be both a
  121 room and a group space, for example. `ROOM_TYPES` (exported from
  `rooms.js`) is the canonical 5-tag list: `121 Room`, `Clinical Room`,
  `Group Room`, `Meeting Room`, `Training Room`. Every room object also
  gets a computed `type = types.join(" / ")` string so display-only call
  sites (room cards, booking form, floor plan labels) don't need to
  change. `FilterBar.jsx`'s type chips are generated from `ROOM_TYPES`
  filtered to what's actually available at the selected site, and it also
  has a capacity range slider ("fits at least N people") — both `App.jsx`
  and the calendar views (`WeeklyView.jsx`/`DailyView.jsx`) filter with
  `r.types.includes(filters.type)` rather than `r.type === filters.type`.
  When adding a room, give it a `types` array (one or more of the 5
  tags), not a bare `type` string.
- A room tagged `"Clinical Room"` can only be *requested* by an approver
  — a non-approver can still see it everywhere (floor plans, weekly/daily
  view, room cards) including its booked/free status, same as any other
  room; they just can't submit a request for it. Enforced in
  `BookingForm.jsx` (`isClinicalRoom()`, a local helper — not exported,
  duplicated the same way in `BulkBookingForm.jsx` rather than shared,
  matching this project's usual small-local-copy approach) and in
  `BulkBookingForm.jsx`'s three room pickers (`dates`/`rooms`/`range`
  modes) the same way. `BookingForm.jsx` shows a small "blocked" panel
  (room name + "please speak to admin") instead of the real form when it
  was opened directly for a clinical room via `preRoom` (every
  Request/free-slot-click entry point across the app funnels through
  this one component, so the check lives here rather than at each call
  site); both forms' room `<select>` dropdowns simply omit clinical rooms
  from the list for a non-approver, so they can't pick one that way
  either. `RoomInfoCard.jsx` shows an "APPROVER BOOKING ONLY" badge on
  every clinical room card, for everyone, so this isn't a dead-end
  surprise on click. Same client-side-only caveat as every other
  permission check in this app (see APPROVERS above) — this stops
  casual use of the form, not a determined person calling Supabase's
  REST API directly.
- Room photos work the same way site photos already did for Staff Portal
  (`SiteTile.jsx`, `public/sites/*.jpg`): every room gets a computed
  `image = "/rooms/" + slug + ".jpg"` field in `data/rooms.js`'s `ROOMS`
  mapping, and dropping a same-named file in `public/rooms/` (e.g.
  `public/rooms/meadow-room.jpg`) is all that's needed to make it show —
  no code change, no rebuild-required config. No room photos ship with
  this repo yet, so this degrades gracefully until real ones are added:
  `RoomInfoCard.jsx` (room list cards) tracks its own `imageFailed` state
  via the `<img>`'s `onError` and just doesn't render the image tag when
  one 404s (falls back to its existing "No photo yet" note instead of the
  old always-shown placeholder text). The Floor Plans tab's enlarged
  detail panel uses the same pattern but via a dedicated component,
  `RoomPhoto.jsx`, rather than inline state — that panel lives inside an
  IIFE in `App.jsx` (see "Room deep links" above for why that IIFE
  exists) and can't hold its own `useState`, so the onError/fallback
  logic had to be extracted into a real component; `App.jsx` passes
  `key={room.id}` at the call site so switching rooms resets the fallback
  flag instead of carrying over a stale "failed" state from the previous
  room. The small per-room thumbnails in the Floor Plans tab's "All
  rooms" compact grid below the detail panel are a separate, still-static
  "🗺️ Floor plan coming soon" placeholder — deliberately not wired to
  `room.image` here, since those cards are small (175px) name/type click
  targets to switch `activeRoom`, not a photo display; worth revisiting
  if that changes. `FloorPlan.jsx` (an SVG-generated room diagram) is
  unrelated to any of this and remains genuinely dead code — grep confirms
  nothing imports it — left in place, not removed, since nothing asked
  for that.
- Booking emails are real (`sendEmail`), not simulated — `App.jsx` used to
  call a `simulateEmail()` that only logged to the console for every
  request/confirmed/rejected/reminder/approver-notify email; that's gone.
  A "confirmed" email also carries a `.ics` attachment
  (`icsAttachment()` in App.jsx, built from `lib/ics.js`'s `buildICS()` —
  the same function the "📅 .ics" download button uses). Don't reintroduce
  `simulateEmail` in the booking flow. When a booking is made on someone
  else's behalf (`BookingForm.jsx`'s "I'm booking this for someone else"
  — `booking.email`/`bookedBy` end up being the other person, while
  `booking.requestedByEmail`/`requestedBy` stay the actual submitter),
  `buildEmail`'s `recipientsFor()` sends the request/confirmed/rejected/
  reminder emails to **both** as one comma-separated `to` (same pattern
  the approver notification already used for multiple recipients) —
  don't go back to `to: booking.email` alone, that was a real gap
  (whoever booked on someone else's behalf never heard anything back).
  The approver-notify email also names the real requester
  (`requestedBy`/`requestedByEmail`), with a separate "Booked for" line
  when it's not the same person — it used to show `bookedBy` as
  "Requested by", which is wrong in exactly this case. The "new room
  request" approver-notify email goes to `REQUEST_NOTIFY_EMAILS`
  (`src/data/rooms.js`) — deliberately **not** the full `APPROVERS` list;
  `APPROVERS` stays the access-control allowlist (who can log in and
  approve/reject), this is just narrower on purpose for where the email
  itself lands. Every booking email is also HTML now, not just plain
  text — `buildEmail()` wraps its plain-text `body` through
  `lib/emailHtml.js`'s `buildHtmlEmail()` to add clickable buttons (e.g.
  "Cancel this booking", "Review this request"), sent as `htmlContent`
  alongside `textContent` so plain-text clients still get something
  sensible. A "cancel" button deliberately does **not** cancel straight
  from the link — it lands on `/rooms?tab=mybookings` (App.jsx reads a
  `?tab=` query param at identify-time to preselect that tab), where
  cancelling still needs an explicit click on the booking itself. That's
  intentional: a mail client or security scanner pre-fetching links in an
  email could otherwise silently trigger a real cancellation. Every
  button links to `portal.wirralways.org.uk/...`, not the old
  `rooms.wirralways.org.uk` some of these email bodies used to reference
  — that subdomain never existed post-restructure (Room Booking lives at
  `/rooms` on the portal domain now, not its own subdomain); fix that
  domain again if it resurfaces anywhere. `lib/emailHtml.js`'s
  `buildHtmlEmail()` is shared by every emailer in the project, not just
  Room Booking — `src/staff/lib/notify.js` (sign-in ack gets a "Sign in"
  button; outreach start/return/overdue-alert get a "View live status"
  button linking to `/staff/who`) and the two scheduled functions
  (`manager-report.js`, `outreach-overdue-alert.js`, which import it
  directly from `src/lib/` — Netlify's function bundler handles an import
  reaching outside `netlify/functions/` fine, this isn't Vite-bundled)
  both use it too. A plain URL typed into a `textContent`-only email body
  doesn't render as a clickable link in every mail client (this was a
  real complaint — Outlook showed a bare "Live view: https://…" string
  with no link) — any new notification email should go through
  `buildHtmlEmail()` and pass `htmlContent` as well as `textContent`,
  not just concatenate a URL into the plain-text body and assume it's
  clickable.
- `GENERIC_BOOKING_EMAIL` (`src/data/rooms.js`, currently
  `wirral.services@cgl.org.uk`) is the placeholder booker identity used
  for bookings that don't belong to any one named person — recurring
  clinics/groups/services with no real attendee, e.g. most of the
  September 2026 room log that was bulk-imported directly into
  `ww_bookings` (SQL, not through the app — see
  `supabase/room-booking-schema.sql`'s header comment). `App.jsx`'s
  reminder-email effect skips any booking whose `email` matches it —
  nobody's expecting a "your booking is tomorrow" reminder to land in
  that shared inbox for a booking that was never really "for" anyone.
  This is reminder-only on purpose: it doesn't touch the
  request/confirmed/rejected/approver-notify emails, since those only
  ever fire from a real person actively making/approving/rejecting a
  booking through the app — a generic-booked row only exists from a bulk
  SQL import, which doesn't go through that flow at all. If a future
  automated email keyed off `booking.email` gets added, check whether it
  needs the same guard.
- The September 2026 room log import only ever covered that one month —
  a number of the imported bookings were actually recurring
  clinics/groups (same room/title/weekday/time repeated across the
  month) that would otherwise just stop appearing once September ended.
  These were identified by a one-off diagnostic query, then converted
  into real recurring series (shared `recurringGroupId`,
  `isRecurring:true`, `recurrencePattern:"weekly"`) seeded a few months
  ahead by a one-off SQL script (delivered, not committed — same
  scratchpad-file pattern as `room_bookings_import.sql`). Genuinely
  ongoing ("indefinite") continuation from there is handled by
  `netlify/functions/extend-recurring-bookings.js`, a scheduled function
  (1st of every month — see `netlify.toml`) that tops every such series
  up to a rolling 3-month horizon, forever, without needing anyone to
  ask again or re-run anything. It only ever touches a booking carrying
  `autoContinue: true` — a marker field the seed script set that isn't
  read anywhere else in the app — so an ordinary recurring booking
  someone makes through `BookingForm.jsx`'s "Recurring booking" tickbox
  is never affected; that keeps whatever fixed end date the person who
  created it actually chose. Never set `autoContinue` on a normal
  user-made booking. Same "no request/confirmed emails, no Exchange
  calendar sync" exception as the original bulk import — these are
  administrative continuations of an existing series, not someone
  actively booking something new through the app.
- Both Room Booking and Car Booking sync confirmed bookings onto real
  Exchange shared calendars, **going forward only** — the already-imported
  September 2026 log isn't resynced back, since it came FROM those very
  calendars in the first place (see `GENERIC_BOOKING_EMAIL`'s bullet
  above and `supabase/room-booking-schema.sql`). `ROOM_CALENDAR_EMAIL`
  (`src/data/rooms.js`) maps every room id to its `Q0084.*@cgl.org.uk`
  mailbox; `CAR_CALENDAR_EMAIL` (`src/data/car.js`) is the car's
  (`Q0084.CarLog@cgl.org.uk`). `lib/ics.js`'s `buildCalendarInviteICS()`
  is the shared, room/vehicle-agnostic iTIP builder (METHOD:REQUEST to
  add, METHOD:CANCEL to remove) — deliberately separate from that file's
  existing `buildICS()`, which builds a personal "add to my own calendar"
  file (no ORGANIZER/ATTENDEE/METHOD) for the download button and
  confirmation-email attachment, a different iCalendar use case. Room
  Booking's `App.jsx` has a local `syncRoomCalendar(booking, stage)`;
  Car Booking's `car/lib/carEmail.js` has `syncCarCalendar()` — same
  shape, not shared, matching this project's usual "small local copy"
  approach for logic that's genuinely per-app (mailbox lookup, sender
  identity, description text). `stage` is `"created"` (SEQUENCE 0),
  `"edited"` (SEQUENCE 1 — Room Booking only, since Car Booking has no
  edit feature) or `"cancelled"` (SEQUENCE 2, METHOD:CANCEL) — a fixed
  tiering rather than a persisted running counter, correct for the
  realistic common case but won't perfectly supersede more than one edit
  before a cancellation. Only ever called for bookings that reach/leave
  `"confirmed"` — a pending request being rejected, or a bulk item that
  stayed pending, never had a calendar entry to remove. Wired into every
  path that changes confirmed status: `handleBook`/`handleApprove`/
  `handleBulkBook`'s auto-approve branches, `handleCancelClick`/
  `handleCancelWithScope`, `handleEdit` (App.jsx — the auto-release
  effect that used to also call this was removed, see below);
  `BookCar.jsx`'s submit/bulk auto-approve branches,
  `CarApprovals.jsx`'s approve, `MyCarBookings.jsx`'s cancel.
  **Caveat**: Brevo (the only way this project sends email — see the
  Brevo bullet above) is a transactional ESP, not a mail client speaking
  full calendaring MIME — it can only attach the .ics conventionally
  rather than inline it as the message's primary `text/calendar` body
  the way Outlook natively inviting a room would. Many Exchange resource
  mailboxes still auto-process a well-formed METHOD:REQUEST attachment
  fine (how most third-party booking tools integrate with Exchange
  rooms), but this hasn't been confirmed against Wirral Ways' actual
  mailbox configuration — test with one real booking per app and check
  the target Outlook calendar before relying on this.
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
- `netlify/functions/auto-signout.js` is the same self-gating pattern as
  `manager-report.js`, at 22:00 Europe/London instead of 09:30 (cron
  `*/15 21-22 * * *` — 21-22 UTC covers 22:00 local in both BST and
  GMT). Closes **every** currently-open attendance record across **all
  four** tables (`staff_sign_ins`, `staff_wfh`, `staff_elsewhere`,
  `staff_outreach`) in one bulk PATCH per table, not just office
  sign-ins — deliberately matching the "one unified sign in/out" model
  (`SignOut.jsx`) rather than treating physical presence as the only
  thing that needs closing out nightly. No notification is sent to the
  person or their manager when this happens — it's a nightly tidy-up,
  not an event anyone needs to act on. If auto-closing outreach
  specifically ever turns out to be wrong (e.g. genuine overnight
  trips), narrow `CLOSE_TABLES` in that file rather than removing the
  function entirely.
- `/staff/sign-in` is unified across office sites and remote modes
  (`REMOTE_MODES` in `data/staff.js` now carries a `table` field —
  `staff_wfh`/`staff_elsewhere`/`staff_outreach` — that's what SignIn.jsx
  branches on; office sites have no `table`, meaning `staff_sign_ins`).
  Every "start" action (unified SignIn, and each dedicated Wfh/Elsewhere/
  Outreach page's own "Starting" tab in StartFinishFlow.jsx) calls
  `lib/attendance.js`'s `closeAnyOpenRecordForUser(userId)` **before**
  inserting the new record — it checks all four attendance tables
  unconditionally and closes whichever one has an open record for that
  user, enforcing "signed in one place at a time". Call it with no
  `exceptTable`-style exclusion — an earlier version tried to skip the
  destination table "to be safe" and that was a real bug: switching
  between two office sites both use `staff_sign_ins`, so skipping it
  meant the *old* site's record was never found. It's safe unconditional
  precisely because it always runs before the insert.
- "I am a…" on office-site sign-ins is `staff`/`visitor` only (no
  "service user"). `SignIn.jsx` defaults it to `staff` whenever the
  NamePicker resolves a real `userId`; an unmatched name + `staff` shows
  an inline "add to the directory" mini-form that calls
  `useStaffUsers.addUser` directly from the sign-in flow — the created
  user's id becomes the sign-in record's `user_id`. `visitor` requires
  picking a real directory entry as the host (a second `NamePicker`) —
  submit is blocked without one, since `lib/notify.js`'s
  `sendVisitorNotification` needs a real email. There used to also be a
  `sendSignInAck` — a "you've signed in" confirmation to the person
  themselves, fired from every start action — removed on request: staff
  were getting one on every ordinary sign-in and it added up to a lot of
  email. `sendVisitorNotification` is the only function left in
  `src/staff/lib/notify.js`; don't reintroduce a per-sign-in self-email
  without checking this is still wanted.
- `/staff/sign-out` is unified the same way sign-in is — pulls open
  records from all four attendance tables (`staff_sign_ins` +
  `staff_wfh`/`staff_elsewhere`/`staff_outreach`) and normalises them into
  one list, instead of only ever showing office sign-ins like it used to.
  That gap was real: anyone who'd started WFH/Elsewhere/Outreach from the
  unified Sign In page had no way to end it from Sign Out, only from that
  mode's own dedicated page. `SignIn.jsx` also has a "Returning from
  outreach" tile that isn't a new destination — it navigates to
  `/staff/sign-out?filter=staff_outreach`, which narrows Sign Out's list
  to outreach-only (`SignOut.jsx`'s `FILTER_LABELS`) so someone doesn't
  have to scan past everyone signed in elsewhere to find their own name.
  It also has a type-to-find search box (filters the open-records list by
  name using `lib/helpers.js`'s `norm()`, same case/whitespace-insensitive
  match Room Booking uses) rather than presenting a long scrollable list —
  matters once more than a handful of people are signed in at once. No
  names are listed until something is typed (`visibleEntries` is `[]`
  whenever `search` is empty) — this isn't a directory to browse, so
  nothing shows who's currently signed in and where until you're
  specifically searching for yourself.
- Outreach used to email the manager at both the start and end of a trip,
  in addition to the overdue alert — `sendOutreachStartNotification`/
  `sendOutreachReturnNotification`, both removed on request (managers
  only want to hear about outreach when something's actually wrong, not
  on every routine start/return). Only the safety-net alert below is
  left:
  - **Overdue** (`netlify/functions/outreach-overdue-alert.js`, scheduled
    every 15 minutes during roughly 6am-8pm UTC per `netlify.toml`) emails
    the manager if someone is 15+ minutes past their `expected_return` and
    still hasn't signed back in — a lone-working check, not just
    attendance bookkeeping. Computes "overdue" in Europe/London wall-clock
    terms (same DST reasoning as `manager-report.js`'s `isReportTime()`,
    applied to a full date+time here rather than just an hour/minute
    check) since `expected_return` is a local "HH:MM" the person typed,
    not a UTC value. A boolean `overdue_notified` column on
    `staff_outreach` stops it re-emailing every 15 minutes for the same
    still-open trip — reset only by the next trip being a fresh row.
    Mirrors `WhoIsIn.jsx`'s `isOverdue()` logic; keep both in sync if that
    ever changes.
- `/staff/who` (WhoIsIn.jsx) is **PIN-gated** (`src/components/PinGate.jsx`,
  code `886`), not email-gated like the rest of the portal — matches the
  original single-file app's design. `PinGate` is shared (top-level
  `src/components/`, not staff-specific) and takes `pin` as a prop, since
  Room Booking's testing lock (below) reuses it with a different code —
  don't hardcode a single PIN back into the component. It also
  deliberately never shows sign-in/start times — presence only. This is a
  portal-wide policy, not just WhoIsIn.jsx: `SignOut.jsx` and
  `StartFinishFlow.jsx`'s "Finishing" tab also don't show when someone
  signed in/started, for the same reason — the point of this app is
  knowing *where* people are, not clocking hours. Times are
  admin-dashboard-only (AdminDashboard.jsx's log table). The one
  exception anywhere in the non-admin UI is outreach's "back by"
  (`expected_return`) — that's not when someone started, it's when
  they're due back, kept for lone-working safety since the overdue alert
  depends on it. Don't add `formatClock`/`formatElapsed` back into
  WhoIsIn.jsx, SignOut.jsx, or StartFinishFlow.jsx's finish list without
  checking this is still what's wanted.
- `PrivacyPolicy.jsx` (`/staff/privacy`) covers the **whole portal**, not
  just the Staff Portal half — Room Booking links to it too
  (`IdentityScreen.jsx`), as does the Landing page. It names the actual
  third parties involved (Supabase for storage, Netlify for hosting,
  Brevo for email) rather than speaking generically about "secure
  storage". When a change adds a new category of personal data (a new
  table/column that stores a name, email, location, or similar) or a new
  place data gets shared (a new notification recipient, a new external
  service), update this page in the same change — it's a real,
  user-facing legal notice, not just internal documentation, so it drifts
  out of accuracy just as easily as README/CLAUDE.md do if it's treated
  as an afterthought.
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
- Auto-release — a `useEffect` in `App.jsx` that used to mark any
  confirmed today's booking `status:"autoReleased"` (freeing the room,
  notifying the waitlist) if nobody checked in within 30 minutes of its
  start time — is **removed**, on request. It was silently clearing
  rooms used for sessions where checking in through the app was never
  realistic (e.g. Sunflower Room's dense recurring 1-2-1s), which looked
  like "bookings aren't staying" rather than what it actually was.
  `"autoReleased"` is still a valid historical `status` a booking can
  carry (`StatusBadge.jsx` still renders it; `hasConflict` above still
  treats it as non-blocking) for anything auto-released before this was
  removed — nothing creates new ones anymore. `notifyWaitlist`
  (`src/lib/waitlist.js`) lost its only call site in this removal — the
  🔔 waitlist feature (`addToWaitlist`, still live in `BookingForm.jsx`/
  `DaySchedulePicker.jsx`) currently has **no trigger anywhere** that
  actually emails someone when their slot frees up, since it was never
  wired into manual cancellation either (`handleCancelClick`/
  `handleCancelWithScope`) — joining the waitlist promises an email
  ("We'll email you if it becomes free") that nothing currently sends.
  Flagged, not fixed, since wiring it to cancellation is separate scope
  from removing auto-release — check with whoever asked for this removal
  before deciding whether to wire it up. If auto-release itself comes
  back, consider making it opt-in per room rather than portal-wide.
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
- `useStaffUsers.bulkAddUsers` (`/staff/admin/users` → Bulk add) skips
  any row whose email already exists in the directory — never upserts
  over an existing person. This was a real incident, not theoretical: an
  earlier version upserted by email (`onConflict: "email"`), so
  re-pasting a list that happened to include an existing person's email
  — e.g. an admin including themselves in a team list without explicitly
  writing `admin` as their role — silently overwrote their role back to
  the default (`staff`), locking them out of `/staff/admin/users`.
  Never reintroduce an upsert in bulk-add; skip-if-exists is the
  intended, permanent behaviour, not a temporary workaround.
- The original uploaded single-file version of the Staff Portal had a
  Supabase **service-role key hardcoded in a PHP proxy** and a hardcoded
  admin password in client JS. Neither was carried over — that service-role
  key must be treated as compromised and rotated in the Supabase dashboard
  regardless of anything in this repo. See `supabase/staff-portal-schema.sql`
  for the RLS-based replacement.
