// Supabase REST access for the Staff Portal (sign-in/out, WFH, outreach,
// roll call, user directory). Called directly from the browser with the
// anon key, same pattern as lib/storage.js — the anon key is safe to ship
// as long as Row Level Security is correctly configured on every table
// below. See supabase/staff-portal-schema.sql for the required policies,
// and the README security note before relying on this in production.
//
// Unlike storage.js (a single JSON key/value table), these are normal
// relational tables — one row per sign-in/outreach/WFH/etc. record — so
// this exposes generic list/insert/update/delete helpers instead.

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function authHeaders(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: "Bearer " + SB_KEY,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path, opts = {}) {
  const res = await fetch(SB_URL + "/rest/v1/" + path, {
    ...opts,
    headers: authHeaders({ Prefer: opts.prefer || "return=representation", ...(opts.headers || {}) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("Supabase " + (opts.method || "GET") + " " + path + " failed (" + res.status + "): " + text);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// query is a raw PostgREST query string, e.g. "?select=*&order=name.asc"
async function listRows(table, query = "") {
  return request(table + query);
}
async function insertRow(table, row) {
  const rows = await request(table, { method: "POST", body: JSON.stringify(row) });
  return rows[0];
}
// Bulk insert (PostgREST accepts an array body as a single request). Pass
// onConflict (a column name, e.g. "email") to upsert instead of erroring
// on duplicates — used by the Staff Portal's bulk-add-users feature so
// re-pasting a list updates existing people instead of failing the batch.
async function insertRows(table, rows, { onConflict } = {}) {
  const qs = onConflict ? "?on_conflict=" + encodeURIComponent(onConflict) : "";
  return request(table + qs, {
    method: "POST",
    body: JSON.stringify(rows),
    prefer: onConflict ? "resolution=merge-duplicates,return=representation" : "return=representation",
  });
}
async function updateRow(table, id, patch) {
  const rows = await request(table + "?id=eq." + encodeURIComponent(id), {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return rows[0];
}
async function deleteRow(table, id) {
  return request(table + "?id=eq." + encodeURIComponent(id), { method: "DELETE" });
}

export { listRows, insertRow, insertRows, updateRow, deleteRow };
