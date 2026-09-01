// Shared "start / finish" flow for WFH, working-elsewhere and outreach —
// all three are the same shape: log who, when they started, optional
// extra details, and later mark when they finished/returned.
import { useEffect, useState } from "react";
import { CGL } from "../../data/rooms.js";
import { inp, lbl } from "../../styles/shared.js";
import { insertRow, listRows, updateRow } from "../../lib/staffApi.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import { formatElapsed, formatClock, initials } from "../lib/format.js";
import NamePicker from "./NamePicker.jsx";
import PageWrap from "./PageWrap.jsx";

function StartFinishFlow({ table, title, subtitle, color, fields = [] }) {
  const { activeUsers } = useStaffUsers();
  const [tab, setTab] = useState("start");
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [extra, setExtra] = useState({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [openEntries, setOpenEntries] = useState(null);

  async function loadOpen() {
    try {
      const rows = await listRows(table, "?select=*&returned_time=is.null&order=start_time.asc");
      setOpenEntries(rows);
    } catch (e) {
      setError(e.message || String(e));
    }
  }
  useEffect(() => { if (tab === "finish") loadOpen(); }, [tab]);

  async function submitStart(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError(null);
    try {
      await insertRow(table, { name: name.trim(), user_id: userId, notes: notes.trim() || null, start_time: new Date().toISOString(), ...extra });
      setDone({ kind: "start", name: name.trim() });
      setName(""); setUserId(null); setExtra({}); setNotes("");
    } catch (err) { setError(err.message || String(err)); }
    finally { setSaving(false); }
  }

  async function finishEntry(entry) {
    setSaving(true); setError(null);
    try {
      await updateRow(table, entry.id, { returned_time: new Date().toISOString() });
      setDone({ kind: "finish", name: entry.name });
      loadOpen();
    } catch (err) { setError(err.message || String(err)); }
    finally { setSaving(false); }
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>{done.kind === "start" ? "✅" : "🏁"}</div>
        <h2 style={{ color: "#16a34a", margin: 0 }}>{done.kind === "start" ? "Recorded" : "Marked as finished"}</h2>
        <p style={{ color: "#6b7280", fontSize: 13 }}>{done.name}</p>
        <button onClick={() => setDone(null)} style={{ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>Done</button>
      </div>
    );
  }

  return (
    <PageWrap title={title} subtitle={subtitle}>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[["start", "Starting"], ["finish", "Finishing"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid " + (tab === k ? color : "#e5e7eb"),
            background: tab === k ? color : "#fff", color: tab === k ? "#fff" : "#1a1a1a", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{l}</button>
        ))}
      </div>

      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {tab === "start" ? (
        <form onSubmit={submitStart}>
          <NamePicker value={name} onChange={(v, id) => { setName(v); setUserId(id); }} users={activeUsers} />
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={lbl}>{f.label}</label>
              <input
                type={f.type || "text"}
                style={inp}
                value={extra[f.key] || ""}
                placeholder={f.placeholder}
                onChange={e => setExtra(x => ({ ...x, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button type="submit" disabled={!name.trim() || saving} style={{
            width: "100%", background: color, color: "#fff", border: "none", borderRadius: 12, padding: 15,
            fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: (!name.trim() || saving) ? 0.5 : 1,
          }}>{saving ? "Saving…" : "Record"}</button>
        </form>
      ) : (
        !openEntries ? (
          <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
        ) : openEntries.length === 0 ? (
          <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>Nobody has an open record right now.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {openEntries.map(e => (
              <button key={e.id} disabled={saving} onClick={() => finishEntry(e)} style={{
                background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              }}>
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0e8f9", color: CGL.blackcurrant, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initials(e.name)}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>
                    since {formatClock(e.start_time)} ({formatElapsed(e.start_time)} ago){e.location ? " · " + e.location : ""}
                  </div>
                </span>
                <span style={{ fontSize: 11, color: color, fontWeight: 700 }}>Mark finished</span>
              </button>
            ))}
          </div>
        )
      )}
    </PageWrap>
  );
}

export default StartFinishFlow;
