// Approvers-only: pending car booking requests, approve or reject. Only
// rendered when CarApp.jsx's user.isApprover is true — see there.
import { useState } from "react";
import { CGL } from "../../data/car.js";
import { formatDateShort, formatTime, nowStr } from "../../lib/helpers.js";
import { useCarBookings } from "../lib/useCarBookings.js";
import { sendCarDecisionEmail } from "../lib/carEmail.js";
import PageWrap from "../components/PageWrap.jsx";
import { inp } from "../../styles/shared.js";

function CarApprovals({ user }) {
  const { bookings, reload, updateRow } = useCarBookings();
  const [rejecting, setRejecting] = useState(null); // booking being rejected
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const pending = (bookings || []).filter(b => b.status === "pending");

  async function approve(b) {
    setBusy(true);
    const updated = await updateRow("car_bookings", b.id, { status: "confirmed", approved_by: user.name, approved_at: nowStr() });
    await sendCarDecisionEmail("confirmed", updated);
    reload();
    setBusy(false);
  }

  async function reject() {
    if (!rejecting) return;
    setBusy(true);
    const updated = await updateRow("car_bookings", rejecting.id, { status: "rejected", rejected_by: user.name, rejected_at: nowStr(), rejection_note: note.trim() || null });
    await sendCarDecisionEmail("rejected", updated);
    setRejecting(null);
    setNote("");
    reload();
    setBusy(false);
  }

  return (
    <PageWrap backTo="/car" title="Car booking approvals" subtitle="Requests waiting for a decision.">
      {!bookings ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : pending.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>No pending requests.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.map(b => (
            <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: CGL.blackcurrant, marginBottom: 4 }}>{b.purpose}</div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{formatDateShort(b.date)} · {formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Requested by {b.requested_by} ({b.requested_by_email}){b.notes ? " · " + b.notes : ""}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button disabled={busy} onClick={() => approve(b)} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                <button disabled={busy} onClick={() => setRejecting(b)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, color: "#b91c1c", cursor: "pointer" }}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", maxWidth: 360, width: "100%" }}>
            <h3 style={{ margin: "0 0 6px" }}>Reject this request?</h3>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>{rejecting.purpose} — {formatDateShort(rejecting.date)}</p>
            <textarea style={{ ...inp, minHeight: 64, resize: "vertical", marginBottom: 14 }} value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional, shown to the requester)" />
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={busy} onClick={reject} style={{ flex: 1, background: "#ef5ba1", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer" }}>Reject</button>
              <button onClick={() => { setRejecting(null); setNote(""); }} style={{ flex: 1, background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: 11, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

export default CarApprovals;
