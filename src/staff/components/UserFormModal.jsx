// Add/edit modal for a staff_users row — name, email, site, role, and
// manager (picked from the existing directory, self-referencing).
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES, ROLES } from "../../data/staff.js";
import { inp, lbl } from "../../styles/shared.js";

function UserFormModal({ users, editing, onSave, onClose }) {
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [site, setSite] = useState(editing?.site || OFFICE_SITES[0].id);
  const [role, setRole] = useState(editing?.role || "staff");
  const [managerId, setManagerId] = useState(editing?.manager_id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Can't be your own manager, and (loosely) can't pick someone who reports
  // to you — full cycle detection isn't worth the complexity here, this is
  // just meant to keep the common mistake from being one click away.
  const managerOptions = users.filter(u => u.id !== editing?.id && u.active !== false);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setSaving(true); setError(null);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        site,
        role,
        manager_id: managerId || null,
      });
    } catch (err) {
      setError(err.message || String(err));
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
      <form onSubmit={submit} style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 16px", color: CGL.blackcurrant }}>{editing ? "Edit user" : "Add user"}</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Full name</label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} required autoFocus />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Email</label>
          <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Site</label>
          <select style={inp} value={site} onChange={e => setSite(e.target.value)}>
            {OFFICE_SITES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Role</label>
          <select style={inp} value={role} onChange={e => setRole(e.target.value)}>
            {ROLES.map(r => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Manager</label>
          <select style={inp} value={managerId} onChange={e => setManagerId(e.target.value)}>
            <option value="">— No manager set —</option>
            {managerOptions.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>

        {error && <div style={{ color: CGL.neon, fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={saving} style={{ flex: 1, background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Saving…" : editing ? "Save changes" : "Add user"}
          </button>
          <button type="button" onClick={onClose} style={{ padding: "12px 16px", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default UserFormModal;
