// One person's non-working-days pattern + leave list, editable if
// `canEdit` is true, read-only display otherwise (used so a manager or
// admin sees their team's cards without edit controls cluttering people
// they can't touch — though in practice this page only lists people the
// viewer *can* edit; see Leave.jsx).
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { WEEKDAYS } from "../../data/staff.js";
import { inp, lbl } from "../../styles/shared.js";
import { formatDate } from "../../lib/helpers.js";

function PersonAvailabilityCard({ person, isSelf, canEdit, leaveRows, onToggleDay, onAddLeave, onRemoveLeave }) {
  const [adding, setAdding] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const days = person.non_working_days || [];

  async function submitLeave(e) {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSaving(true);
    try {
      await onAddLeave({ startDate, endDate, reason });
      setStartDate(""); setEndDate(""); setReason(""); setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <strong style={{ fontSize: 14, color: CGL.blackcurrant }}>{person.name}</strong>
        {isSelf && <span style={{ fontSize: 11, color: "#6b7280" }}>(you)</span>}
        <span style={{ fontSize: 11, color: "#6b7280", marginLeft: "auto", textTransform: "capitalize" }}>{person.role}{person.site ? " · " + person.site : ""}</span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Non-working days</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {WEEKDAYS.map(day => {
            const active = days.includes(day);
            return (
              <button
                key={day}
                disabled={!canEdit}
                onClick={() => onToggleDay(day)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "inherit",
                  border: "1.5px solid " + (active ? CGL.saffron : "#e5e7eb"),
                  background: active ? CGL.saffron : "#fff", color: active ? "#fff" : "#374151",
                  cursor: canEdit ? "pointer" : "default",
                }}
              >{day}</button>
            );
          })}
          {days.length === 0 && !canEdit && <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>Works every weekday</span>}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Leave</div>
          {canEdit && !adding && (
            <button onClick={() => setAdding(true)} style={{ background: "none", border: "none", color: CGL.blackcurrant, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+ Add leave</button>
          )}
        </div>

        {leaveRows.length === 0 && !adding && <div style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>No leave recorded</div>}

        {leaveRows.map(l => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ flex: 1 }}>{formatDate(l.start_date)} – {formatDate(l.end_date)}{l.reason ? " · " + l.reason : ""}</span>
            {canEdit && <button onClick={() => onRemoveLeave(l.id)} style={{ background: "none", border: "none", color: CGL.neon, fontSize: 11, cursor: "pointer" }}>Remove</button>}
          </div>
        ))}

        {adding && (
          <form onSubmit={submitLeave} style={{ marginTop: 10, background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={lbl}>From</label>
                <input type="date" required style={inp} value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Until</label>
                <input type="date" required style={inp} value={endDate} min={startDate || undefined} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Reason (optional)</label>
              <input style={inp} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Annual leave" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" disabled={saving} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => setAdding(false)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PersonAvailabilityCard;
