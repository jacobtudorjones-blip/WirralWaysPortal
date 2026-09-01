// Text input with a dropdown of matching names from the staff directory.
// Lets someone pick a registered user (recording the link to their record)
// while still allowing a free-text name for visitors/partner agencies who
// aren't in staff_users.
import { useState } from "react";
import { inp, lbl } from "../../styles/shared.js";
import { CGL } from "../../data/rooms.js";
import { initials } from "../lib/format.js";

function NamePicker({ label = "Name", value, onChange, users, placeholder = "Start typing a name…" }) {
  const [open, setOpen] = useState(false);
  const matches = value.trim().length > 0
    ? users.filter(u => u.name.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div style={{ position: "relative", marginBottom: 14 }}>
      <label style={lbl}>{label}</label>
      <input
        style={inp}
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value, null); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          background: "#fff", border: "1.5px solid " + CGL.blackcurrant, borderTop: "none",
          borderRadius: "0 0 8px 8px", maxHeight: 220, overflowY: "auto",
          boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        }}>
          {matches.map(u => (
            <div
              key={u.id}
              onMouseDown={() => { onChange(u.name, u.id); setOpen(false); }}
              style={{ padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}
            >
              <span style={{
                width: 26, height: 26, borderRadius: "50%", background: CGL.lavender, color: CGL.blackcurrant,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0,
              }}>{initials(u.name)}</span>
              <span>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                {(u.site || u.role) && (
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{[u.site, u.role].filter(Boolean).join(" · ")}</div>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NamePicker;
