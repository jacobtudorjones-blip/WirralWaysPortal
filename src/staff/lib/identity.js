// Admin identity for the Staff Portal — kept separate from the Room
// Booking app's identity (different sessionStorage key) since these are
// two independent sections of the site.
//
// SECURITY NOTE: like APPROVERS in data/rooms.js, this is an email
// allowlist checked client-side against the staff_users table (role must
// be "admin" or "manager"), not real authentication — see README.
const KEY = "ww_staff_admin_email";

function getAdminEmail() {
  try { return sessionStorage.getItem(KEY) || ""; } catch { return ""; }
}
function setAdminEmail(email) {
  try { sessionStorage.setItem(KEY, email); } catch { /* ignore */ }
}
function clearAdminEmail() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

export { getAdminEmail, setAdminEmail, clearAdminEmail };
