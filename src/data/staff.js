// Config for the Staff Portal (sign-in/out, WFH, outreach, roll call, user
// directory). Mirrors the pattern in data/rooms.js: shared config in one
// place, imported from there rather than redefined per component.
import { SITES as ROOM_SITES, SITE_COLOR, CGL } from "./rooms.js";

// Physical office locations, reusing the same site list as the Room Booking
// app so both halves of the portal agree on what a "site" is.
const OFFICE_SITES = ROOM_SITES.map(name => ({
  id: name,
  label: name,
  color: SITE_COLOR[name] || CGL.blackcurrant,
}));

// Non-office working modes shown alongside the office site cards on the
// sign-in screen. Not real "sites" — no booking rooms live here — but staff
// still need to record when they start/finish working this way.
const REMOTE_MODES = [
  { id: "Working From Home", label: "Working From Home", color: CGL.ocean, icon: "🏠" },
  { id: "Working Elsewhere", label: "Working Elsewhere", color: CGL.saffron, icon: "📍" },
];

// Roles for the staff directory. "admin" can access the admin dashboard and
// manage users; "manager" can view the dashboard/roll call but not manage
// users; "staff" is a normal directory entry with no portal access.
// NOTE: same caveat as APPROVERS in data/rooms.js — this is an email
// allowlist checked client-side, not real authentication. Anyone who can
// read the Supabase anon key (shipped in the bundle) and the table's RLS
// allows it could still call the API directly. See README for details.
const ROLES = ["staff", "manager", "admin"];

export { OFFICE_SITES, REMOTE_MODES, ROLES };
