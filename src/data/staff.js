// Config for the Staff Portal (sign-in/out, WFH, outreach, roll call, user
// directory). Mirrors the pattern in data/rooms.js: shared config in one
// place, imported from there rather than redefined per component.
import { SITES as ROOM_SITES, SITE_COLOR, CGL } from "./rooms.js";
import { slugify } from "../lib/helpers.js";

// Physical office locations, reusing the same site list as the Room Booking
// app so both halves of the portal agree on what a "site" is.
//
// `image`: an optional photo per site, expected at this path under
// public/ (e.g. public/sites/price-street.jpg). None are shipped yet —
// drop real photos in there using this exact naming (slugified site name)
// and they'll show automatically; until then every site card falls back
// to its colour tile (SiteTile.jsx handles the missing-image case, it's
// not an error to leave these unset).
const OFFICE_SITES = ROOM_SITES.map(name => ({
  id: name,
  label: name,
  color: SITE_COLOR[name] || CGL.blackcurrant,
  image: "/sites/" + slugify(name) + ".jpg",
}));

// Non-office working modes offered alongside the office site cards on the
// sign-in screen — not real "sites" (no booking rooms live here), but
// staff still need to record when they start working this way, and which
// staff_* table that goes in.
const REMOTE_MODES = [
  { id: "Working From Home", label: "Working From Home", color: CGL.ocean, icon: "🏠", table: "staff_wfh" },
  { id: "Working Elsewhere", label: "Working Elsewhere", color: CGL.saffron, icon: "📍", table: "staff_elsewhere" },
  { id: "Outreach", label: "Outreach", color: CGL.raspberry, icon: "🗺️", table: "staff_outreach" },
];

// Roles for the staff directory. "admin" can access the admin dashboard and
// manage users; "manager" can view the dashboard/roll call but not manage
// users; "staff" is a normal directory entry with no portal access.
// NOTE: same caveat as APPROVERS in data/rooms.js — this is an email
// allowlist checked client-side, not real authentication. Anyone who can
// read the Supabase anon key (shipped in the bundle) and the table's RLS
// allows it could still call the API directly. See README for details.
const ROLES = ["staff", "manager", "admin"];

// Full weekday names, Monday-first — used for the recurring
// non_working_days pattern on a staff_users profile (e.g. a part-time
// person who doesn't work Fridays). Distinct from staff_leave, which is
// specific one-off date ranges, not a standing weekly pattern.
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export { OFFICE_SITES, REMOTE_MODES, ROLES, WEEKDAYS };
