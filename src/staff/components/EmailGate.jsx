// Lightweight access gate shared by "Who's in" and the Admin pages: enter
// your work email, checked against the staff_users directory.
//
// SECURITY NOTE: this is the same allowlist pattern as APPROVERS in
// data/rooms.js — a client-side check, not real authentication. It stops
// casual browsing of who's on site / the admin dashboard, but does not
// stop someone from calling the Supabase REST API directly with the anon
// key. See README before relying on this for genuinely sensitive data.
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { inp, lbl } from "../../styles/shared.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";

function EmailGate({ storageKey, allow, title, subtitle, children }) {
  const { users, loading } = useStaffUsers();
  const [email, setEmail] = useState(() => {
    try { return sessionStorage.getItem(storageKey) || ""; } catch { return ""; }
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  const verifiedUser = email
    ? users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active !== false)
    : null;

  if (email && verifiedUser && allow(verifiedUser)) {
    return children(verifiedUser);
  }

  function submit(e) {
    e.preventDefault();
    const u = users.find(u => u.email.toLowerCase() === input.trim().toLowerCase() && u.active !== false);
    if (!u) { setError("That email isn't in the staff directory (or is deactivated)."); return; }
    if (!allow(u)) { setError("Your account doesn't have access to this page."); return; }
    try { sessionStorage.setItem(storageKey, u.email); } catch { /* ignore */ }
    setEmail(u.email);
    setError(null);
  }

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: "30px 28px", maxWidth: 340, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: CGL.blackcurrant, margin: "0 0 6px" }}>{title}</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 18px" }}>{subtitle}</p>
        <label style={lbl}>Work email</label>
        <input style={{ ...inp, marginBottom: 10 }} type="email" value={input} onChange={e => setInput(e.target.value)} placeholder="you@cgl.org.uk" autoFocus />
        {error && <div style={{ color: CGL.neon, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: "100%", background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Loading directory…" : "Continue"}
        </button>
      </form>
    </div>
  );
}

export default EmailGate;
