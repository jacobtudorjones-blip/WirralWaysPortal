import { useState } from "react";
import { Link } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES } from "../../data/staff.js";
import { inp, lbl } from "../../styles/shared.js";
import { insertRow } from "../../lib/staffApi.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import NamePicker from "../components/NamePicker.jsx";
import PageWrap from "../components/PageWrap.jsx";
import PrivacyNote from "../components/PrivacyNote.jsx";

const PERSON_TYPES = [
  { value: "staff", label: "Staff" },
  { value: "service_user", label: "Service user" },
  { value: "partner", label: "Partner agency" },
];

function SignIn() {
  const { activeUsers } = useStaffUsers();
  const [site, setSite] = useState(null);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [personType, setPersonType] = useState("staff");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!site || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await insertRow("staff_sign_ins", {
        name: name.trim(),
        user_id: userId,
        site_id: site,
        person_type: personType,
        notes: notes.trim() || null,
        sign_in_time: new Date().toISOString(),
      });
      setDone(true);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function again() {
    setSite(null); setName(""); setUserId(null); setPersonType("staff"); setNotes(""); setDone(false);
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✅</div>
        <h2 style={{ color: "#16a34a", margin: 0 }}>Signed in</h2>
        <p style={{ color: "#6b7280", fontSize: 13 }}>Welcome, {name} — have a great {personType === "staff" ? "shift" : "visit"}.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={again} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Sign in someone else</button>
          <Link to="/staff" style={{ padding: "10px 20px", color: "#6b7280", textDecoration: "none" }}>Done</Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrap title="Sign in" subtitle="Pick a site, then enter your name.">
      {!site ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {OFFICE_SITES.map(s => (
            <button key={s.id} onClick={() => setSite(s.id)} style={{
              background: "#fff", border: "2px solid #e5e7eb", borderRadius: 14, padding: "20px 14px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0e8f9", color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>{s.label[0]}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14, fontSize: 12, color: "#6b7280" }}>
            Site: <strong style={{ color: CGL.blackcurrant }}>{site}</strong>{" "}
            <button type="button" onClick={() => setSite(null)} style={{ border: "none", background: "none", color: CGL.neon, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Change</button>
          </div>

          <NamePicker value={name} onChange={(v, id) => { setName(v); setUserId(id); }} users={activeUsers} />

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>I am a…</label>
            <select style={inp} value={personType} onChange={e => setPersonType(e.target.value)}>
              {PERSON_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. reason for visit" />
          </div>

          <PrivacyNote />

          {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

          <button type="submit" disabled={!name.trim() || saving} style={{
            width: "100%", background: CGL.saffron, color: "#fff", border: "none", borderRadius: 12, padding: 15,
            fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: (!name.trim() || saving) ? 0.5 : 1,
          }}>{saving ? "Signing in…" : "Sign in"}</button>
        </form>
      )}
    </PageWrap>
  );
}

export default SignIn;
