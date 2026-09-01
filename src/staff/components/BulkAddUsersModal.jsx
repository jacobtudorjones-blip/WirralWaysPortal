// Mass-add staff: paste a list (one person per line), preview what will be
// created, then insert them all in one request. Upserts by email, so
// re-pasting an updated list (e.g. someone's role or site changed) fixes
// them up rather than erroring on duplicates — see useStaffUsers.bulkAddUsers.
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES, ROLES } from "../../data/staff.js";
import { nameFromEmail } from "../../lib/nameFromEmail.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER = `One person per line: Name, email, site, role — site and role are optional (role defaults to "staff"). Or just paste an email on its own and the name is worked out automatically.

Jane Smith, jane.smith@cgl.org.uk, Market Street, staff
Priya Patel, priya.patel@cgl.org.uk, Price Street, manager
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
  let site = rest[0] || null;
  if (site) {
    const match = OFFICE_SITES.find(s => s.id.toLowerCase() === site.toLowerCase());
    if (!match) { warnings.push('Unrecognised site "' + site + '" — left blank'); site = null; }
    else site = match.id;
  }
  let role = (rest[1] || "staff").toLowerCase();
  if (!ROLES.includes(role)) { warnings.push('Unrecognised role "' + role + '" — set to staff'); role = "staff"; }

  return { row: { name, email: email.toLowerCase(), site, role, active: true }, warnings, lineNo };
}

function BulkAddUsersModal({ onSave, onClose }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const parsed = lines.map((l, i) => parseLine(l, i + 1));
  const validRows = parsed.filter(p => p.row).map(p => p.row);
  const errorLines = parsed.filter(p => p.error);
  const warningLines = parsed.filter(p => p.row && p.warnings?.length);

  async function submit() {
    if (validRows.length === 0) return;
    setSaving(true); setError(null);
    try {
      await onSave(validRows);
    } catch (err) {
      setError(err.message || String(err));
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: "24px 26px", maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <h3 style={{ margin: "0 0 4px", color: CGL.blackcurrant }}>Bulk add users</h3>
        <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 14px" }}>Manager assignment isn't supported here — add people first, then set their manager individually (Edit) once everyone's in.</p>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={8}
          style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #d2c5e2", fontFamily: "monospace", fontSize: 12.5, color: "#1a1a2e", boxSizing: "border-box", resize: "vertical", marginBottom: 12 }}
        />

        {lines.length > 0 && (
          <div style={{ fontSize: 12, marginBottom: 14 }}>
            <div style={{ color: "#16a34a", fontWeight: 700, marginBottom: errorLines.length || warningLines.length ? 6 : 0 }}>
              {validRows.length} {validRows.length === 1 ? "person" : "people"} ready to add
            </div>
            {errorLines.length > 0 && (
              <div style={{ color: CGL.neon, marginBottom: 6 }}>
                {errorLines.map(e => <div key={e.error.lineNo}>Line {e.error.lineNo}: {e.error.reason} — "{e.error.line}"</div>)}
              </div>
            )}
            {warningLines.length > 0 && (
              <div style={{ color: "#b45309" }}>
                {warningLines.map(w => <div key={w.lineNo}>Line {w.lineNo}: {w.warnings.join("; ")}</div>)}
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
