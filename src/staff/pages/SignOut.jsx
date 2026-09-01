import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { listRows, updateRow } from "../../lib/staffApi.js";
import { formatElapsed, formatClock, initials } from "../lib/format.js";
import PageWrap from "../components/PageWrap.jsx";

function SignOut() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [done, setDone] = useState(null);

  async function load() {
    try {
      const rows = await listRows("staff_sign_ins", "?select=*&sign_out_time=is.null&order=sign_in_time.asc");
      setEntries(rows);
    } catch (e) {
      setError(e.message || String(e));
    }
  }
  useEffect(() => { load(); }, []);

  async function confirmSignOut() {
    await updateRow("staff_sign_ins", confirming.id, { sign_out_time: new Date().toISOString() });
    setDone(confirming);
    setConfirming(null);
    load();
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fde8f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👋</div>
        <h2 style={{ color: CGL.neon, margin: 0 }}>Signed out</h2>
        <p style={{ color: "#6b7280", fontSize: 13 }}>See you next time, {done.name}.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDone(null)} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Sign out someone else</button>
          <Link to="/staff" style={{ padding: "10px 20px", color: "#6b7280", textDecoration: "none" }}>Done</Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrap title="Sign out" subtitle="Pick your name from who's currently signed in.">
      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {!entries ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>Nobody is currently signed in.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map(e => (
            <button key={e.id} onClick={() => setConfirming(e)} style={{
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0e8f9", color: CGL.blackcurrant, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initials(e.name)}</span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{e.site_id} · in since {formatClock(e.sign_in_time)} ({formatElapsed(e.sign_in_time)} ago)</div>
              </span>
            </button>
          ))}
        </div>
      )}

      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px" }}>Sign out {confirming.name}?</h3>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>Signed in at {formatClock(confirming.sign_in_time)} — {confirming.site_id}</p>
            <button onClick={confirmSignOut} style={{ width: "100%", background: CGL.neon, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Yes, sign out</button>
            <button onClick={() => setConfirming(null)} style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: 11, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

export default SignOut;
