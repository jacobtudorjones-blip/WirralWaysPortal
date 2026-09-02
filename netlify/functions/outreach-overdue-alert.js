// Scheduled function: lone-working safety check. If someone on outreach
// is 15+ minutes past the "back by" time they gave when they signed in
// and still hasn't signed back in, their manager gets an email asking
// them to check the person's okay.
//
// Runs every 15 minutes during a working-hours-ish window (see
// netlify.toml) rather than self-gating to a single moment like
// manager-report.js does — overdue events can happen at any time of day,
// so this genuinely needs to check repeatedly, not just once. Each row's
// overdue_notified flag (see supabase/staff-portal-schema.sql) stops it
// re-emailing on every later run for the same still-open trip; it resets
// naturally because the next trip is a fresh row.
//
// Uses the same Supabase project + Brevo setup as the rest of this
// directory — see manager-report.js's header comment for why no extra
// env vars/credentials are needed.

import { buildHtmlEmail } from "../../src/lib/emailHtml.js";

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BREVO_KEY = process.env.BREVO_API_KEY;
const FROM = { name: "Wirral Ways Staff Portal", email: "noreply@wirralways.org.uk" };
const WHO_URL = "https://portal.wirralways.org.uk/staff/who";
const OVERDUE_AFTER_MINUTES = 15;

// ── Europe/London-aware time math ───────────────────────────────────────
// expected_return is a "HH:MM" LOCAL LONDON wall-clock time-of-day, typed
// by the person before they left (see SignIn.jsx / StartFinishFlow.jsx).
// This function runs on Netlify's infrastructure, whose runtime clock is
// UTC — turning "HH:MM on the day they left" into the right UTC instant
// needs to account for BST, not just building a UTC Date from the same
// numbers (an hour off during British Summer Time). Same DST concern as
// manager-report.js's isReportTime(), applied here to a full date+time
// rather than just an "is it 9:30" check.
function londonParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = t => Number(parts.find(p => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), H: get("hour"), M: get("minute") };
}
function londonOffsetMinutesAt(utcMs) {
  const guess = new Date(utcMs);
  const asUTC = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  const asLondon = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/London" }));
  return (asLondon - asUTC) / 60000;
}
function londonWallTimeToUTC(y, m, d, H, M) {
  const naiveUTC = Date.UTC(y, m - 1, d, H, M, 0);
  return new Date(naiveUTC - londonOffsetMinutesAt(naiveUTC) * 60000);
}

// Mirrors src/staff/pages/WhoIsIn.jsx's isOverdue() (keep both in sync if
// the "expected return" logic ever changes), but computed in London
// wall-clock terms rather than the browser's local time, and returns how
// many minutes overdue rather than just a yes/no.
function overdueMinutes(row) {
  if (row.returned_time || !row.expected_return) return 0;
  const [expH, expM] = row.expected_return.split(":").map(Number);
  const sp = londonParts(new Date(row.start_time));
  let expectedUTC = londonWallTimeToUTC(sp.y, sp.m, sp.d, expH, expM);
  // "Back by" earlier in the day than when they left means tomorrow
  // (e.g. left at 23:00 expecting back at 01:00).
  if (expH < sp.H || (expH === sp.H && expM < sp.M)) {
    expectedUTC = londonWallTimeToUTC(sp.y, sp.m, sp.d + 1, expH, expM);
  }
  return Math.floor((Date.now() - expectedUTC.getTime()) / 60000);
}

async function sb(path, opts = {}) {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...opts,
    headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error("Supabase " + (opts.method || "GET") + " " + path + " failed (" + res.status + "): " + await res.text().catch(() => ""));
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function sendAlert(to, subject, textContent) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [{ email: to }], subject, textContent, htmlContent: buildHtmlEmail(textContent, [{ label: "View live status", url: WHO_URL, color: "#5e1b6d" }]) }),
  });
  if (!res.ok) console.error("outreach-overdue-alert: Brevo rejected an alert for", to, res.status, await res.text().catch(() => ""));
}

export const handler = async () => {
  if (!SB_URL || !SB_KEY) {
    console.error("outreach-overdue-alert: Supabase env vars not set, skipping");
    return { statusCode: 200, body: "Supabase not configured, skipping." };
  }
  if (!BREVO_KEY) {
    console.error("outreach-overdue-alert: BREVO_API_KEY not set, skipping");
    return { statusCode: 200, body: "Brevo not configured, skipping." };
  }

  try {
    // Only trips linked to a registered user (user_id set) can be traced
    // to a manager — same scoping manager-report.js uses for the same
    // reason. overdue_notified=is.false is the re-notify guard.
    const openTrips = await sb("staff_outreach?select=*&returned_time=is.null&overdue_notified=is.false&user_id=not.is.null");
    const overdue = openTrips.filter(t => overdueMinutes(t) >= OVERDUE_AFTER_MINUTES);
    if (overdue.length === 0) return { statusCode: 200, body: "Nothing overdue." };

    const users = await sb("staff_users?select=id,name,email,manager_id");
    const userById = Object.fromEntries(users.map(u => [u.id, u]));

    let sent = 0;
    for (const trip of overdue) {
      const person = userById[trip.user_id];
      const manager = person?.manager_id ? userById[person.manager_id] : null;
      if (manager?.email) {
        const mins = overdueMinutes(trip);
        await sendAlert(
          manager.email,
          "Overdue from outreach — " + trip.name,
          trip.name + " was due back from " + (trip.location || "outreach") + " " + mins + " minute" + (mins === 1 ? "" : "s") + " ago and hasn't signed back in.\n\nMake contact with them to check they are okay.\n\nLive view: " + WHO_URL,
        );
        sent++;
      }
      // Mark notified even with no manager on file (or no email set) —
      // otherwise this keeps retrying, and logging nothing useful, every
      // 15 minutes until the trip is closed.
      await sb("staff_outreach?id=eq." + trip.id, { method: "PATCH", body: JSON.stringify({ overdue_notified: true }) });
    }
    return { statusCode: 200, body: "Alerted " + sent + " manager(s) for " + overdue.length + " overdue trip(s)." };
  } catch (e) {
    console.error("outreach-overdue-alert error", e);
    return { statusCode: 500, body: "Error: " + e.message };
  }
};
