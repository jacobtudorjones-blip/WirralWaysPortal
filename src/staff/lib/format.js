// Small formatting helpers specific to the staff portal's attendance
// records (elapsed time since sign-in, etc). Date/time formatting shared
// with the rest of the app lives in lib/helpers.js — import from there too.
function formatElapsed(sinceIso) {
  if (!sinceIso) return "";
  const ms = Date.now() - new Date(sinceIso).getTime();
  if (ms < 0) return "0m";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}
function formatClock(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
function initials(name) {
  return (name || "")
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export { formatElapsed, formatClock, initials };
