// Supabase-backed key/value storage.
// Bookings and the waitlist are stored as JSON blobs keyed by id in the
// `ww_bookings` table (columns: id, data, updated_at).
//
// The Supabase URL + anon key are public by design (Supabase's anon key is
// meant to be shipped to the browser and is only as safe as the table's
// Row Level Security policies) but we still keep them out of source control
// via env vars. See .env.example.

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function loadKey(key) {
  try {
    const res = await fetch(SB_URL+"/rest/v1/ww_bookings?id=eq."+encodeURIComponent(key)+"&select=data", {
      headers: { "apikey": SB_KEY, "Authorization": "Bearer "+SB_KEY }
    });
    const rows = await res.json();
    if (rows && rows.length > 0) return rows[0].data;
    return null;
  } catch(e) { console.error("loadKey error", e); return null; }
}
async function saveKey(key, val) {
  try {
    await fetch(SB_URL+"/rest/v1/ww_bookings", {
      method: "POST",
      headers: {
        "apikey": SB_KEY, "Authorization": "Bearer "+SB_KEY,
        "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ id: key, data: val, updated_at: new Date().toISOString() })
    });
  } catch(e) { console.error("saveKey error", e); }
}

export { loadKey, saveKey };
