// Mass-add staff: paste a list (one person per line), preview what will be
// created — including manager resolution — then insert them all in one
// go. Only adds genuinely NEW people — anyone whose email already exists
// is skipped entirely, never touched (see useStaffUsers.bulkAddUsers for
// why: an earlier version upserted over existing rows, which is how an
// admin got their own role silently reset). Manager resolution happens
// server-side, after the real insert; this component's preview is a
// best-effort heads-up, not the final word (it can't see brand-new ids
// that don't exist until the insert actually runs).
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { ROLES } from "../../data/staff.js";
import { nameFromEmail } from "../../lib/nameFromEmail.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER = `One person per line: Name, email, manager, role — manager and role are optional (role defaults to "staff"). Manager can be their email (most reliable) or a name, either already in the directory or elsewhere in this same list. Or just paste a bare email and the name is worked out automatically.

Priya Patel, priya.patel@cgl.org.uk, , manager
Jane Smith, jane.smith@cgl.org.uk, priya.patel@cgl.org.uk, staff
john.doe@cgl.org.uk`;

function parseLine(line, lineNo) {
  const parts = line.split(",").map(p => p.trim());
  if (!parts[0]) return { error: { lineNo, line, reason: "Empty" } };

  let name, email, rest;
  if (parts[0].includes("@")) { email = parts[0]; name = ""; rest = parts.slice(1); }
  else { name = parts[0]; email = parts[1] || ""; rest = parts.slice(2); }

  if (!EMAIL_RE.test(email)) return { error: { lineNo, line, reason: "No valid email found" } };
  if (!name) name = nameFromEmail(email) || email.split("@")[0];

  const warnings = [];
  const managerRef = rest[0] || null;
  let role = (rest[1] || "staff").toLowerCase();
  if (!ROLES.includes(role)) { warnings.push('Unrecognised role "' + role + '" — set to staff'); role = "staff"; }

  return { row: { name, email: email.toLowerCase(), role, active: true, managerRef }, warnings, lineNo };
}

// Best-effort preview of whether a manager reference looks resolvable,
// checking the existing directory plus everyone else in this same paste.
function previewManager(ref, users, batchRows) {
  if (ref.includes("@")) {
    const found = users.some(u => u.email.toLowerCase() === ref.toLowerCase())
      || batchRows.some(r => r.email.toLowerCase() === ref.toLowerCase());
    return found ? null : 'manager email "' + ref + '" not found';
  }
  const names = [
    ...users.filter(u => u.name.toLowerCase() === ref.toLowerCase()),
    ...batchRows.filter(r => r.name.toLowerCase() === ref.toLowerCase()),
  ];
  if (names.length === 1) return null;
  if (names.length === 0) return 'manager "' + ref + '" not found';
  return 'manager name "' + ref + '" matches more than one person — use their email instead';
}

function BulkAddUsersModal({ users, onSave, onClose }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { created, skipped } after a successful submit

  const existingEmails = new Set(users.map(u => u.email.toLowerCase()));
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const parsed = lines.map((l, i) => parseLine(l, i + 1));
  const allRows = parsed.filter(p => p.row).map(p => p.row);
  const alreadyExists = allRows.filter(r => existingEmails.has(r.email));
  const validRows = allRows.filter(r => !existingEmails.has(r.email));
  const errorLines = parsed.filter(p => p.error);
  const roleWarnings = parsed.filter(p => p.row && p.warnings?.length);
  const managerWarnings = parsed
    .filter(p => p.row?.managerRef && !existingEmails.has(p.row.email))
    .map(p => ({ lineNo: p.lineNo, issue: previewManager(p.row.managerRef, users, validRows) }))
    .filter(w => w.issue);

  async function submit() {
    if (validRows.length === 0) return;
    setSaving(true); setError(null);
    try {
      const r = await onSave(validRows);
      setResult(r || { created: validRows, skipped: [] });
    } catch (err) {
      setError(err.message || String(err));
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>✅</div>
          <h3 style={{ margin: "0 0 8px", color: CGL.blackcurrant }}>
            {result.created.length} {result.created.length === 1 ? "person" : "people"} added
          </h3>
          {result.skipped.length > 0 && (
            <p style={{ fontSize: 12, color: "#b45309", textAlign: "left", background: "#fffbeb", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
              {result.skipped.length} already existed and {result.skipped.length === 1 ? "was" : "were"} left untouched: {result.skipped.map(s => s.name).join(", ")}. Edit them individually if something needs to change.
            </p>
          )}
          <button onClick={onClose} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 700, cursor: "pointer" }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 4px", color: CGL.blackcurrant }}>Bulk add users</h3>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px" }}>Adds new people only — anyone already in the directory is skipped, never edited. Site isn't set in bulk either — edit that individually afterward if needed.</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #d2c5e2", fontFamily: "monospace", fontSize: 12.5, color: "#1a1a2e", boxSizing: "border-box", resize: "vertical", marginBottom: 12 }}
        />

        {lines.length > 0 && (
          <div style={{ fontSize: 12, marginBottom: 14 }}>
            <div style={{ color: "#16a34a", fontWeight: 700, marginBottom: (errorLines.length || roleWarnings.length || managerWarnings.length || alreadyExists.length) ? 6 : 0 }}>
              {validRows.length} {validRows.length === 1 ? "person" : "people"} ready to add
            </div>
            {alreadyExists.length > 0 && (
              <div style={{ color: "#b45309", marginBottom: 6 }}>
                {alreadyExists.map(r => <div key={r.email}>{r.name} ({r.email}) already exists — will be skipped, untouched</div>)}
              </div>
            )}
            {errorLines.length > 0 && (
              <div style={{ color: CGL.neon, marginBottom: 6 }}>
                {errorLines.map(e => <div key={e.error.lineNo}>Line {e.error.lineNo}: {e.error.reason} — "{e.error.line}"</div>)}
              </div>
            )}
            {roleWarnings.length > 0 && (
              <div style={{ color: "#b45309", marginBottom: 6 }}>
                {roleWarnings.map(w => <div key={"role-"+w.lineNo}>Line {w.lineNo}: {w.warnings.join("; ")}</div>)}
              </div>
            )}
            {managerWarnings.length > 0 && (
              <div style={{ color: "#b45309" }}>
                {managerWarnings.map(w => <div key={"mgr-"+w.lineNo}>Line {w.lineNo}: {w.issue} — manager will be left unset</div>)}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ color: CGL.neon, fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} disabled={validRows.length === 0 || saving} style={{
            flex: 1, background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: 12,
            fontWeight: 700, cursor: "pointer", opacity: (validRows.length === 0 || saving) ? 0.5 : 1,
          }}>
            {saving ? "Adding…" : validRows.length > 0 ? "Add " + validRows.length + (validRows.length === 1 ? " person" : " people") : "Add"}
          </button>
          <button type="button" onClick={onClose} style={{ padding: "12px 16px", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default BulkAddUsersModal;
