// Scheduled function: sends everyone with the "manager" role in the staff
// directory a morning attendance report of their direct reports — who's
// recorded in today (site sign-in, WFH, outreach, or working elsewhere)
// and who isn't yet. Only role === "manager" gets a report — having a
// direct report via manager_id isn't by itself enough (e.g. an admin
// someone was mistakenly pointed at as a "manager" shouldn't get spammed).
//
// Runs every 15 minutes (see netlify.toml's schedule for this function),
// but only actually does anything during the 09:30 Europe/London window —
// checked here via Intl rather than baking "9:30" into the cron expression
// (which runs in UTC), so this stays correct through the BST/GMT clock
// change without needing a seasonal edit. The cron interval and the
// window width below are the same (15 minutes), so this fires exactly
// once per day, not on every 15-minute tick.
//
// Uses the same Supabase project as the browser (VITE_SUPABASE_URL/
// VITE_SUPABASE_ANON_KEY — Netlify exposes all site env vars to functions
// regardless of the VITE_ prefix, that prefix only controls what Vite
// inlines into the *client* bundle) and the same Brevo setup as
// send-email.js. RLS on every staff_* table allows anon reads (see
// supabase/staff-portal-schema.sql), so no extra credentials are needed.
//
// "Recorded" is deliberately broad — anyone with a staff_sign_ins,
// staff_wfh, staff_outreach, or staff_elsewhere row starting today counts,
// not just people physically on site. Only counts entries linked to a
// registered user (user_id set) — someone who signs in by typing a name
// instead of picking themselves from the picker won't be matched to a
// specific report row here. That's expected, not a bug: user_id is what
// makes a record attributable to a specific person.

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BREVO_KEY = process.env.BREVO_API_KEY;
const FROM = { name: "Wirral Ways Staff Portal", email: "rooms@wirralways.org.uk" };
const REPORT_HOUR = 9;
const REPORT_MINUTE_START = 30;
const REPORT_WINDOW_MINUTES = 15; // must match this function's cron schedule below

function londonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = t => Number(parts.find(p => p.type === t)?.value);
  return { hour: get("hour"), minute: get("minute") };
}
function londonTodayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
}
function isReportTime() {
  const { hour, minute } = londonNow();
  return hour === REPORT_HOUR && minute >= REPORT_MINUTE_START && minute < REPORT_MINUTE_START + REPORT_WINDOW_MINUTES;
}

async function sb(path) {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY },
  });
  if (!res.ok) throw new Error("Supabase " + path + " failed (" + res.status + "): " + await res.text().catch(() => ""));
  return res.json();
}

async function sendReport(to, subject, textContent) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ sender: FROM, to: [{ email: to }], subject, textContent }),
  });
  if (!res.ok) console.error("manager-report: Brevo rejected a report for", to, res.status, await res.text().catch(() => ""));
}

export const handler = async () => {
  if (!isReportTime()) {
    return { statusCode: 200, body: "Not report time, skipping." };
  }
  if (!SB_URL || !SB_KEY) {
    console.error("manager-report: Supabase env vars not set, skipping");
    return { statusCode: 200, body: "Supabase not configured, skipping." };
  }
  if (!BREVO_KEY) {
    console.error("manager-report: BREVO_API_KEY not set, skipping");
    return { statusCode: 200, body: "Brevo not configured, skipping." };
  }

  const today = londonTodayISO();
  // Approximate "today" as UTC midnight onward. This can miss the ~0–1hr
  // sliver right after London midnight during BST (when UTC midnight is
  // actually 1am London time) — real-world irrelevant for a 9:30am report,
  // not worth the extra complexity of computing an exact London-midnight
  // UTC instant.
  const since = encodeURIComponent(today + "T00:00:00Z");

  try {
    const [users, signIns, wfh, outreach, elsewhere] = await Promise.all([
      sb("staff_users?select=id,name,email,manager_id,role&active=is.true&order=name.asc"),
      sb("staff_sign_ins?select=user_id&sign_in_time=gte." + since),
      sb("staff_wfh?select=user_id&start_time=gte." + since),
      sb("staff_outreach?select=user_id&start_time=gte." + since),
      sb("staff_elsewhere?select=user_id&start_time=gte." + since),
    ]);

    const presentIds = new Set(
      [...signIns, ...wfh, ...outreach, ...elsewhere].map(r => r.user_id).filter(Boolean)
    );
    // Only people actually assigned the "manager" role get a report — not
    // just anyone who happens to have a direct report via manager_id
    // (e.g. an admin someone was mistakenly pointed at).
    const managers = users.filter(u => u.role === "manager");

    let sent = 0;
    for (const manager of managers) {
      const reports = users.filter(u => u.manager_id === manager.id);
      if (reports.length === 0) continue;

      const signedIn = reports.filter(r => presentIds.has(r.id));
      const notSignedIn = reports.filter(r => !presentIds.has(r.id));

      const lines = [
        "Morning attendance report — " + today,
        "",
        "Recorded in today (" + signedIn.length + "):",
        ...(signedIn.length ? signedIn.map(r => "  ✓ " + r.name) : ["  (none yet)"]),
        "",
        "Not yet recorded (" + notSignedIn.length + "):",
        ...(notSignedIn.length ? notSignedIn.map(r => "  — " + r.name) : ["  (everyone's recorded)"]),
        "",
        '"Recorded" covers site sign-in, working from home, outreach, or working elsewhere.',
        "Live view: https://portal.wirralways.org.uk/staff/who",
      ].join("\n");

      await sendReport(manager.email, "Attendance report — " + today, lines);
      sent++;
    }
    return { statusCode: 200, body: "Sent " + sent + " manager report(s)." };
  } catch (e) {
    console.error("manager-report error", e);
    return { statusCode: 500, body: "Error: " + e.message };
  }
};
