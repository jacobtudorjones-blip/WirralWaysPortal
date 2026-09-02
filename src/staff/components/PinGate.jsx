// Shared-PIN gate — used for /staff/who specifically, matching the
// original single-file app's design (a PIN prompt in front of live
// location data, separate from the email-based gates elsewhere).
//
// SECURITY NOTE: same caveat as every other gate in this app (EmailGate,
// APPROVERS — see README) — a client-side check, not real authentication.
// The PIN sits in the shipped JS bundle and is trivially extractable via
// dev tools; this stops casual browsing of who's on site, not a
// determined visitor. RLS on the underlying tables is the real boundary,
// and it's deliberately permissive (see supabase/staff-portal-schema.sql).
import { useState } from "react";
import { CGL } from "../../data/rooms.js";

const PIN = "886";

function PinGate({ storageKey, title, subtitle, children }) {
  const [unlocked, setUnlocked] = useState(() => {
    try { return sessionStorage.getItem(storageKey) === "unlocked"; } catch { return false; }
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);

  if (unlocked) return children;

  function submit(e) {
    e.preventDefault();
    if (input.trim() === PIN) {
      try { sessionStorage.setItem(storageKey, "unlocked"); } catch { /* ignore */ }
      setUnlocked(true);
      setError(null);
    } else {
      setError("Incorrect code.");
      setInput("");
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: "30px 28px", maxWidth: 300, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.08)", textAlign: "center" }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: CGL.blackcurrant, margin: "0 0 6px" }}>{title}</h2>
        <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 18px" }}>{subtitle}</p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="••••"
          style={{ width: "100%", padding: "13px 16px", borderRadius: 10, border: "1.5px solid #d2c5e2", fontSize: 20, textAlign: "center", letterSpacing: 8, marginBottom: 10, boxSizing: "border-box" }}
        />
        {error && <div style={{ color: CGL.neon, fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="submit" style={{ width: "100%", background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Unlock</button>
      </form>
    </div>
  );
}

export default PinGate;
