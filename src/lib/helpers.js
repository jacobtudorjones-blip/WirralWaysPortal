// Generic date/time/booking helper functions used throughout the app.

const genId    = () => Math.random().toString(36).slice(2,10);
const todayStr = () => new Date().toISOString().slice(0,10);
const nowStr   = () => new Date().toISOString();
const norm     = s  => (s||"").trim().toLowerCase();
// URL-friendly slug for a room name, e.g. "Meadow Room" -> "meadow-room".
// Used for /rooms/:slug deep links — see data/rooms.js's ROOM_BY_SLUG.
const slugify  = s  => (s||"").toString().trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

function formatDate(d) {
  if (!d) return "";
  return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function formatDateShort(d) {
  if (!d) return "";
  return new Date(d+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
}
function formatTime(t) {
  if (!t) return "";
  const [h,m] = t.split(":");
  const hr = parseInt(h);
  return (hr>12?hr-12:hr===0?12:hr)+":"+(m)+(hr>=12?"pm":"am");
}
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})+" at "+d.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
}
// nth-weekday helper: get the nth occurrence (1-4) or last (-1) of a weekday (0=Sun) in a given month
function getNthWeekdayOfMonth(year, month, weekday, nth) {
  if (nth === -1) {
    // Last occurrence — start from end of month
    const last = new Date(year, month + 1, 0);
    while (last.getDay() !== weekday) last.setDate(last.getDate() - 1);
    return last.getDate();
  }
  // nth occurrence — find first then add weeks
  const first = new Date(year, month, 1);
  const diff = (weekday - first.getDay() + 7) % 7;
  const day = 1 + diff + (nth - 1) * 7;
  // Make sure it's still in the same month
  if (day > new Date(year, month + 1, 0).getDate()) return null;
  return day;
}

function getRecurrenceDates(start, pattern, until, nthWeekday = null) {
  // nthWeekday: { nth: 1|2|3|4|-1, weekday: 0-6 }  (-1 = last)
  const dates = [], end = new Date(until + "T00:00:00");
  let cur = new Date(start + "T00:00:00");

  if (pattern === "nth_weekday" && nthWeekday) {
    // Start from the month of the start date
    let year = cur.getFullYear(), month = cur.getMonth();
    while (true) {
      const day = getNthWeekdayOfMonth(year, month, nthWeekday.weekday, nthWeekday.nth);
      if (day !== null) {
        const d = new Date(year, month, day);
        if (d > end) break;
        if (d >= cur) dates.push(d.toISOString().slice(0, 10));
      }
      month++;
      if (month > 11) { month = 0; year++; }
      // Safety: stop if we've gone more than 5 years
      if (year > cur.getFullYear() + 5) break;
    }
    return dates;
  }

  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    if (pattern === "weekly")       cur.setDate(cur.getDate() + 7);
    else if (pattern === "fortnightly") cur.setDate(cur.getDate() + 14);
    else if (pattern === "monthly") cur.setMonth(cur.getMonth() + 1);
    else break;
  }
  return dates;
}
function hasConflict(bookings,roomId,date,startTime,endTime,excludeId=null) {
  return bookings.some(b=>
    b.id!==excludeId && b.roomId===roomId && b.date===date &&
    (b.status==="confirmed") && // autoReleased and cancelled are free again
    startTime<b.endTime && endTime>b.startTime
  );
}

export {
  genId, todayStr, nowStr, norm, slugify,
  formatDate, formatDateShort, formatTime, formatDateTime,
  getNthWeekdayOfMonth, getRecurrenceDates, hasConflict,
};
