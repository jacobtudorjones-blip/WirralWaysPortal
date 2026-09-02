// Unified sign-in: pick an office site OR a remote mode (WFH, working
// elsewhere, outreach) from the same screen — they used to be split
// across separate pages, but signing in is one decision ("where am I
// today"), not four different ones.
//
// Signing in anywhere here first closes out any other open record this
// person has (see lib/attendance.js) — so if you're signed in at Price
// Street and sign in at Market Street (or start WFH, etc.), the Price
// Street record closes automatically instead of leaving you looking
// signed in at two places at once. The dedicated Wfh/Elsewhere/Outreach
// pages still exist for *finishing* one of those without starting
// something new, and their own "start" tab does the same auto-close.
//
// "I am a..." is staff or visitor (no "service user" — dropped) — only
// asked for office-site sign-ins, not remote modes. Picking a name that
// matches the directory defaults this to "staff" automatically. If it
// doesn't match and they pick "staff" anyway, we offer to add them to
// the staff directory right there (email + manager — the same fields
// User Management asks for) rather than losing that person entirely. If
// they pick "visitor", we ask who they're here to see and email that
// person a heads-up. Everyone we have an email for gets a sign-in
// confirmation too (lib/notify.js).
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES, REMOTE_MODES } from "../../data/staff.js";
import { inp, lbl } from "../../styles/shared.js";
import { insertRow } from "../../lib/staffApi.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import { closeAnyOpenRecordForUser } from "../lib/attendance.js";
import { sendSignInAck, sendVisitorNotification, sendOutreachStartNotification } from "../lib/notify.js";
import NamePicker from "../components/NamePicker.jsx";
import PageWrap from "../components/PageWrap.jsx";
import PrivacyNote from "../components/PrivacyNote.jsx";
import SiteTile from "../components/SiteTile.jsx";

const PERSON_TYPES = [
  { value: "staff", label: "Staff" },
  { value: "visitor", label: "Visitor" },
];

const DESTINATIONS = [...OFFICE_SITES, ...REMOTE_MODES];

function SignIn() {
  const navigate = useNavigate();
  const { activeUsers, addUser } = useStaffUsers();
  const [destId, setDestId] = useState(null);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(null);
  const [personType, setPersonType] = useState("staff");
  const [location, setLocation] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  // Inline "add yourself to the directory" — shown when a name typed for
  // an office-site staff sign-in doesn't match anyone.
  const [newEmail, setNewEmail] = useState("");
  const [newManagerId, setNewManagerId] = useState("");

  // Visitor — who they're here to see.
  const [hostName, setHostName] = useState("");
  const [hostId, setHostId] = useState(null);

  const dest = DESTINATIONS.find(d => d.id === destId);
  const table = dest?.table || "staff_sign_ins"; // office sites have no `table` -> staff_sign_ins
  const isOfficeSite = table === "staff_sign_ins";
  const showAddSelf = isOfficeSite && personType === "staff" && !userId && name.trim().length > 1;
  const showVisitorHost = isOfficeSite && personType === "visitor";

  function resetPersonType(v, id) {
    setName(v);
    setUserId(id);
    if (id) setPersonType("staff"); // matched a real person -> default back to staff
  }

  async function submit(e) {
    e.preventDefault();
    if (!dest || !name.trim()) return;
    if (showVisitorHost && !hostId) { setError("Please pick who you're here to see from the list."); return; }
    setSaving(true);
    setError(null);
    try {
      let effectiveUserId = userId;
      let selfEmail = null;

      // Self-registering an unrecognised "staff" sign-in.
      if (showAddSelf && newEmail.trim()) {
        const created = await addUser({
          name: name.trim(),
          email: newEmail.trim().toLowerCase(),
          role: "staff",
          site: isOfficeSite ? dest.id : null,
          manager_id: newManagerId || null,
          active: true,
        });
        effectiveUserId = created.id;
        selfEmail = created.email;
      } else if (userId) {
        selfEmail = activeUsers.find(u => u.id === userId)?.email || null;
      }

      if (effectiveUserId) await closeAnyOpenRecordForUser(effectiveUserId);

      const base = { name: name.trim(), user_id: effectiveUserId, notes: notes.trim() || null };
      const payload = table === "staff_sign_ins"
        ? { ...base, site_id: dest.id, person_type: personType, sign_in_time: new Date().toISOString() }
        : table === "staff_outreach"
        ? { ...base, location: location.trim() || null, expected_return: expectedReturn || null, start_time: new Date().toISOString() }
        : table === "staff_elsewhere"
        ? { ...base, location: location.trim() || null, start_time: new Date().toISOString() }
        : { ...base, start_time: new Date().toISOString() }; // staff_wfh

      await insertRow(table, payload);

      if (selfEmail) sendSignInAck(selfEmail, name.trim(), dest.label);
      if (showVisitorHost && hostId) {
        const host = activeUsers.find(u => u.id === hostId);
        if (host) sendVisitorNotification(host.email, host.name, name.trim(), dest.label);
      }
      if (table === "staff_outreach" && effectiveUserId) {
        const person = activeUsers.find(u => u.id === effectiveUserId);
        const manager = person?.manager_id ? activeUsers.find(u => u.id === person.manager_id) : null;
        if (manager) sendOutreachStartNotification(manager.email, manager.name, name.trim(), location.trim(), expectedReturn);
      }

      setDone(true);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  function again() {
    setDestId(null); setName(""); setUserId(null); setPersonType("staff");
    setLocation(""); setExpectedReturn(""); setNotes(""); setDone(false);
    setNewEmail(""); setNewManagerId(""); setHostName(""); setHostId(null);
  }

  if (done) {
    const doneLabel = table === "staff_sign_ins" ? "Signed in" : "Recorded";
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✅</div>
        <h2 style={{ color: "#16a34a", margin: 0 }}>{doneLabel}</h2>
        <p style={{ color: "#6b7280", fontSize: 13 }}>{name} — {dest.label}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={again} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>Sign in someone else</button>
          <Link to="/staff" style={{ padding: "10px 20px", color: "#6b7280", textDecoration: "none" }}>Done</Link>
        </div>
      </div>
    );
  }

  return (
    <PageWrap title="Sign in" subtitle="Pick where you are, then enter your name." maxWidth={680}>
      {!dest ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
          {DESTINATIONS.map(d => (
            <SiteTile key={d.id} label={d.label} color={d.color} icon={d.icon} image={d.image} onClick={() => setDestId(d.id)} />
          ))}
          {/* Not a new destination — this is "I'm back", i.e. ending an
              existing open outreach record. Reuses Sign Out (now unified
              across all four attendance tables) rather than duplicating
              that logic here; ?filter narrows its list to outreach only
              so someone doesn't have to scan past everyone else who's
              signed in elsewhere to find their own name. */}
          <SiteTile label="Returning from outreach" color={CGL.blackcurrant} icon="↩️" onClick={() => navigate("/staff/sign-out?filter=staff_outreach")} />
        </div>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14, fontSize: 12, color: "#6b7280" }}>
            <strong style={{ color: CGL.blackcurrant }}>{dest.label}</strong>{" "}
            <button type="button" onClick={() => setDestId(null)} style={{ border: "none", background: "none", color: CGL.neon, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Change</button>
          </div>

          <NamePicker value={name} onChange={resetPersonType} users={activeUsers} />

          {isOfficeSite && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>I am a…</label>
              <select style={inp} value={personType} onChange={e => setPersonType(e.target.value)}>
                {PERSON_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          )}

          {showAddSelf && (
            <div style={{ background: "#faf8fc", border: "1.5px solid " + CGL.lavender, borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: CGL.blackcurrant, marginBottom: 8 }}>We don't recognise that name — add yourself to the staff directory?</div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Your email</label>
                <input type="email" style={inp} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="firstname.lastname@cgl.org.uk" />
              </div>
              <div>
                <label style={lbl}>Your manager (optional)</label>
                <select style={inp} value={newManagerId} onChange={e => setNewManagerId(e.target.value)}>
                  <option value="">— Not sure / skip —</option>
                  {activeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Leave your email blank to just sign in without being added.</div>
            </div>
          )}

          {showVisitorHost && (
            <NamePicker label="Who are you here to see?" value={hostName} onChange={(v, id) => { setHostName(v); setHostId(id); }} users={activeUsers} placeholder="Start typing their name…" />
          )}

          {(table === "staff_elsewhere" || table === "staff_outreach") && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>{table === "staff_outreach" ? "Where are you going?" : "Location"}</label>
              <input style={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder={table === "staff_outreach" ? "e.g. service user's home, community venue" : "e.g. partner office, training venue"} />
            </div>
          )}

          {table === "staff_outreach" && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Expected return time</label>
              <input type="time" style={inp} value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notes (optional)</label>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder={table === "staff_sign_ins" ? "e.g. reason for visit" : undefined} />
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
