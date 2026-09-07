// Scheduled function: at 22:00 Europe/London every night, closes any
// still-open attendance record — office sign-ins, WFH, working elsewhere,
// and outreach — so nobody is left showing as "signed in" indefinitely
// just because they forgot to sign out. Applies to all four attendance
// tables, not just office sign-ins, matching this app's "one unified
// sign in/out" model (see SignOut.jsx) rather than treating office
// presence as the only thing that needs closing out.
//
// Runs every 15 minutes across a window covering 22:00 in both BST and
// GMT (see netlify.toml), but only actually does anything inside the
// exact 22:00 Europe/London slot — same self-gating pattern as
// manager-report.js's isReportTime(), for the same DST reason: a fixed
// UTC cron time would drift an hour off local time across the clock
// change, so the actual "is it 10pm here" check happens in code via
// Intl, not by baking a UTC hour into the cron expression.
//
// No per-person notification on being auto-signed-out — this is a
// nightly tidy-up, not something anyone needs to act on. If that ever
// needs to change, hook in near CLOSE_TABLES below.

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const CLOSE_HOUR = 22;
const CLOSE_MINUTE_START = 0;
const CLOSE_WINDOW_MINUTES = 15; // must match this function's cron schedule in netlify.toml

// table -> the timestamp column that marks a record as still open (null)
// / closed (set). Office sign-ins call it sign_out_time; the three
// remote-mode tables all call it returned_time.
const CLOSE_TABLES = [
  { table: "staff_sign_ins", field: "sign_out_time" },
  { table: "staff_wfh", field: "returned_time" },
  { table: "staff_elsewhere", field: "returned_time" },
  { table: "staff_outreach", field: "returned_time" },
];

function londonNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = t => Number(parts.find(p => p.type === t)?.value);
  return { hour: get("hour"), minute: get("minute") };
}
function isCloseTime() {
  const { hour, minute } = londonNow();
  return hour === CLOSE_HOUR && minute >= CLOSE_MINUTE_START && minute < CLOSE_MINUTE_START + CLOSE_WINDOW_MINUTES;
}

// One bulk PATCH per table (every currently-open row at once) rather than
// select-then-loop — there's nothing to notify or branch on per row here,
// unlike manager-report.js/outreach-overdue-alert.js.
async function closeOpenRecords(table, field) {
  const res = await fetch(SB_URL + "/rest/v1/" + table + "?" + field + "=is.null", {
    method: "PATCH",
    headers: {
      apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ [field]: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Supabase PATCH " + table + " failed (" + res.status + "): " + await res.text().catch(() => ""));
  const rows = await res.json();
  return rows.length;
}

export const handler = async () => {
  if (!isCloseTime()) {
    return { statusCode: 200, body: "Not closing time, skipping." };
  }
  if (!SB_URL || !SB_KEY) {
    console.error("auto-signout: Supabase env vars not set, skipping");
    return { statusCode: 200, body: "Supabase not configured, skipping." };
  }

  try {
    const counts = await Promise.all(CLOSE_TABLES.map(({ table, field }) => closeOpenRecords(table, field)));
    const total = counts.reduce((a, b) => a + b, 0);
    return { statusCode: 200, body: "Auto-signed-out " + total + " open record(s) at 22:00." };
  } catch (e) {
    console.error("auto-signout error", e);
    return { statusCode: 500, body: "Error: " + e.message };
  }
};
