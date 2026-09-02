import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { REMOTE_MODES } from "../../data/staff.js";
import { listRows, updateRow } from "../../lib/staffApi.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import { sendOutreachReturnNotification } from "../lib/notify.js";
import { formatElapsed, formatClock, initials } from "../lib/format.js";
import PageWrap from "../components/PageWrap.jsx";

// Table → {label, icon} for the three remote modes, so this page can label
// them the same way Sign In does rather than redefining that here.
const MODE_BY_TABLE = Object.fromEntries(REMOTE_MODES.map(m => [m.table, m]));

// Sign In is unified across office sites and remote modes (see SignIn.jsx) —
// this page used to only cover office sign-ins (staff_sign_ins), so anyone
// who'd started WFH/Elsewhere/Outreach from the unified Sign In page had no
// way to end it from here, only from that mode's own dedicated page. Pulls
// open records from all four tables and normalises them into one list so
// signing out is symmetric with signing in, whichever way someone started.
async function loadOpenEntries() {
  const [signIns, wfh, elsewhere, outreach] = await Promise.all([
    listRows("staff_sign_ins", "?select=*&sign_out_time=is.null"),
    listRows("staff_wfh", "?select=*&returned_time=is.null"),
    listRows("staff_elsewhere", "?select=*&returned_time=is.null"),
    listRows("staff_outreach", "?select=*&returned_time=is.null"),
  ]);
  const remote = (rows, table) => rows.map(r => ({
    id: r.id, table, name: r.name, userId: r.user_id, startTime: r.start_time, closeField: "returned_time",
    label: MODE_BY_TABLE[table].icon + " " + MODE_BY_TABLE[table].label + (r.location ? " — " + r.location : ""),
  }));
  const entries = [
    ...signIns.map(r => ({
      id: r.id, table: "staff_sign_ins", name: r.name, userId: r.user_id, startTime: r.sign_in_time, closeField: "sign_out_time",
      label: r.site_id,
    })),
    ...remote(wfh, "staff_wfh"),
    ...remote(elsewhere, "staff_elsewhere"),
    ...remote(outreach, "staff_outreach"),
  ];
  entries.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  return entries;
}

// Known filterable tables + how to describe the filtered list — used by
// the "Returning from outreach" tile on Sign In (?filter=staff_outreach)
// so that link lands on a shortlist instead of everyone signed in anywhere.
const FILTER_LABELS = {
  staff_sign_ins: "who's currently signed in at a site",
  staff_wfh: "who's currently working from home",
  staff_elsewhere: "who's currently working elsewhere",
  staff_outreach: "who's currently on outreach",
};

function SignOut() {
  const { activeUsers } = useStaffUsers();
  const [searchParams] = useSearchParams();
  const filterTable = FILTER_LABELS[searchParams.get("filter")] ? searchParams.get("filter") : null;
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [done, setDone] = useState(null);

  async function load() {
    try {
      const all = await loadOpenEntries();
      setEntries(filterTable ? all.filter(e => e.table === filterTable) : all);
    } catch (e) {
      setError(e.message || String(e));
    }
  }
  useEffect(() => { load(); }, [filterTable]);

  async function confirmSignOut() {
    await updateRow(confirming.table, confirming.id, { [confirming.closeField]: new Date().toISOString() });
    if (confirming.table === "staff_outreach" && confirming.userId) {
      const person = activeUsers.find(u => u.id === confirming.userId);
      const manager = person?.manager_id ? activeUsers.find(u => u.id === person.manager_id) : null;
      if (manager) sendOutreachReturnNotification(manager.email, manager.name, confirming.name);
    }
    setDone(confirming);
    setConfirming(null);
    load();
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fde8f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{done.table === "staff_outreach" ? "🎉" : "👋"}</div>
        <h2 style={{ color: CGL.neon, margin: 0 }}>{done.table === "staff_outreach" ? "Welcome back" : "Signed out"}</h2>
        <p style={{ color: "#6b7280", fontSize: 13 }}>{done.table === "staff_outreach" ? "Glad you're back safe, " + done.name + "." : "See you next time, " + done.name + "."}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/staff/sign-in" style={{ background: CGL.saffron, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, textDecoration: "none" }}>Sign in somewhere else →</Link>
          <button onClick={() => setDone(null)} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Sign out someone else</button>
          <Link to="/staff" style={{ padding: "10px 20px", color: "#6b7280", textDecoration: "none" }}>Done</Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrap
      title={filterTable === "staff_outreach" ? "Returning from outreach" : "Sign out"}
      subtitle={"Pick your name from " + (filterTable ? FILTER_LABELS[filterTable] : "who's currently signed in — office sites, WFH, elsewhere, or outreach") + "."}
    >
      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}
      {!entries ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : entries.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>{filterTable === "staff_outreach" ? "Nobody is currently on outreach." : "Nobody is currently signed in."}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map(e => (
            <button key={e.table + ":" + e.id} onClick={() => setConfirming(e)} style={{
              background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
            }}>
              <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0e8f9", color: CGL.blackcurrant, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initials(e.name)}</span>
              <span style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{e.label} · since {formatClock(e.startTime)} ({formatElapsed(e.startTime)} ago)</div>
              </span>
            </button>
          ))}
        </div>
      )}

      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px" }}>Sign out {confirming.name}?</h3>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>{confirming.label} · since {formatClock(confirming.startTime)}</p>
            <button onClick={confirmSignOut} style={{ width: "100%", background: CGL.neon, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Yes, sign out</button>
            <button onClick={() => setConfirming(null)} style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: 11, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

export default SignOut;
