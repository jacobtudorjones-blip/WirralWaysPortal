// Scheduled function: keeps "auto-continuing" recurring Room Booking
// series topped up to a rolling 3-month horizon, forever — the actual
// answer to "extend indefinitely" for a bookings model that only ever
// stores real, materialised rows (there's no lazy/virtual recurrence
// concept anywhere in this app; see App.jsx's handleBook). Runs on the
// 1st of every month (see netlify.toml) and, for every series it finds,
// generates any missing weekly occurrences between its latest existing
// date and "today + ROLLING_MONTHS", then stops — next month's run picks
// up where this one left off, so the buffer never grows unbounded and
// never needs a person to come back and ask for "a bit more".
//
// Only ever touches a series that carries autoContinue: true on at least
// one of its bookings — that flag is set by the one-off migration script
// that seeded these series (continuing recurring clinics/groups found in
// the September 2026 room log import that only had that one month's
// worth of dates). An ordinary recurring booking someone makes through
// the app (BookingForm.jsx's "Recurring booking" tickbox) does NOT carry
// this flag and is never extended by this function — it keeps whatever
// fixed end date the person who created it actually chose. Don't set
// autoContinue on a normal user-made booking; it would make that series
// run forever regardless of what the person picked in the form.
//
// Same "write straight to the table" approach as every other bulk import
// in this project: no request/confirmation emails, no Exchange calendar
// sync (see ROOM_CALENDAR_EMAIL's "going forward only" note in
// data/rooms.js — that's about the September import specifically, but
// the same reasoning applies here: these are administrative continuations
// of an existing series, not a person actively booking something new).

const SB_URL = process.env.VITE_SUPABASE_URL;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BOOKINGS_KEY = "ww_bookings_v4";
const ROLLING_MONTHS = 3;

const genId = () => Math.random().toString(36).slice(2, 10);

// Same local-calendar-date formatter as src/lib/helpers.js's toDateStr —
// duplicated here (not imported) since Netlify's function bundler for a
// scheduled function doesn't reliably resolve a relative import the way
// send-email.js's Brevo helper does; this is a two-line function, not
// worth the risk of getting that wrong.
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

async function loadBookings() {
  const res = await fetch(SB_URL + "/rest/v1/ww_bookings?id=eq." + encodeURIComponent(BOOKINGS_KEY) + "&select=data", {
    headers: { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY },
  });
  if (!res.ok) throw new Error("Supabase GET ww_bookings failed (" + res.status + "): " + await res.text().catch(() => ""));
  const rows = await res.json();
  return (rows && rows[0] && rows[0].data) || [];
}

async function saveBookings(data) {
  const res = await fetch(SB_URL + "/rest/v1/ww_bookings", {
    method: "POST",
    headers: {
      apikey: SB_KEY, Authorization: "Bearer " + SB_KEY,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: BOOKINGS_KEY, data, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Supabase upsert ww_bookings failed (" + res.status + "): " + await res.text().catch(() => ""));
}

// Same rule as src/lib/helpers.js's hasConflict — only a CONFIRMED
// booking blocks a slot.
function hasConflict(bookings, roomId, date, startTime, endTime) {
  return bookings.some(b =>
    b.roomId === roomId && b.date === date && b.status === "confirmed" &&
    startTime < b.endTime && endTime > b.startTime
  );
}

export const handler = async () => {
  if (!SB_URL || !SB_KEY) {
    console.error("extend-recurring-bookings: Supabase env vars not set, skipping");
    return { statusCode: 200, body: "Supabase not configured, skipping." };
  }

  let bookings;
  try {
    bookings = await loadBookings();
  } catch (e) {
    console.error("extend-recurring-bookings: failed to load bookings", e);
    return { statusCode: 500, body: "Error loading bookings: " + e.message };
  }

  // Find every distinct auto-continuing series and its most recent
  // occurrence — that occurrence's room/title/time/booker is treated as
  // the series' current definition (so an edit to "this and all future"
  // via EditBookingModal.jsx is respected going forward, same as it
  // would be for a person actually clicking through the app).
  const series = new Map(); // recurringGroupId -> latest booking in that group
  for (const b of bookings) {
    if (!b.autoContinue || !b.recurringGroupId || b.status === "cancelled") continue;
    const existing = series.get(b.recurringGroupId);
    if (!existing || b.date > existing.date) series.set(b.recurringGroupId, b);
  }

  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + ROLLING_MONTHS);
  const nowIso = new Date().toISOString();
  const additions = [];

  for (const [recurringGroupId, latest] of series) {
    const weekday = new Date(latest.date + "T00:00:00").getDay();
    let cur = new Date(latest.date + "T00:00:00");
    cur.setDate(cur.getDate() + 7);
    while (cur <= horizon) {
      const date = toDateStr(cur);
      if (cur.getDay() === weekday && !hasConflict(bookings.concat(additions), latest.roomId, date, latest.startTime, latest.endTime)) {
        additions.push({
          id: genId(), roomId: latest.roomId, title: latest.title,
          bookedBy: latest.bookedBy, email: latest.email,
          requestedBy: latest.bookedBy, requestedByEmail: latest.email,
          bookedForOther: false,
          date, startTime: latest.startTime, endTime: latest.endTime,
          notes: "Automatically continued by the recurring-booking scheduler.",
          status: "confirmed", approvedBy: latest.bookedBy, approvedAt: nowIso,
          checkedIn: false,
          isRecurring: true, recurringGroupId,
          recurrencePattern: "weekly", recurrenceUntil: "",
          createdAt: nowIso, autoContinue: true,
        });
      }
      cur.setDate(cur.getDate() + 7);
    }
  }

  if (additions.length) {
    try {
      await saveBookings(bookings.concat(additions));
    } catch (e) {
      console.error("extend-recurring-bookings: failed to save", e);
      return { statusCode: 500, body: "Error saving bookings: " + e.message };
    }
  }

  return { statusCode: 200, body: "Checked " + series.size + " auto-continuing series, added " + additions.length + " booking(s)." };
};
