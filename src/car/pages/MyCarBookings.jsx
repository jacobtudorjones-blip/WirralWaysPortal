// The current user's own car bookings — status, and cancel while it's
// still pending or confirmed. Deliberately no recurring-booking concept
// here (Room Booking has one; a single shared vehicle doesn't need it).
import { CGL } from "../../data/car.js";
import { formatDateShort, formatTime, nowStr } from "../../lib/helpers.js";
import { useCarBookings } from "../lib/useCarBookings.js";
import { syncCarCalendar } from "../lib/carEmail.js";
import PageWrap from "../components/PageWrap.jsx";

const STATUS_STYLE = {
  pending: { bg: "#fff3cd", color: "#7a5c00", label: "Awaiting approval" },
  confirmed: { bg: "#dcfce7", color: "#16a34a", label: "Confirmed" },
  rejected: { bg: "#fdecea", color: "#b71c1c", label: "Not approved" },
  cancelled: { bg: "#f3f4f6", color: "#6b7280", label: "Cancelled" },
};

function MyCarBookings({ user }) {
  const { bookings, reload, updateRow } = useCarBookings();
  const mine = (bookings || []).filter(b => b.requested_by_email === user.email);

  async function cancel(b) {
    await updateRow("car_bookings", b.id, { status: "cancelled", cancelled_by: user.name, cancelled_at: nowStr() });
    // Only had a calendar entry to remove if it was actually confirmed —
    // a still-pending request never got one in the first place.
    if (b.status === "confirmed") await syncCarCalendar(b, "cancelled");
    reload();
  }

  return (
    <PageWrap backTo="/car" title="My car bookings" subtitle="Everything you've requested or booked.">
      {!bookings ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : mine.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>You haven't booked the car yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mine.map(b => {
            const s = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            const canCancel = b.status === "pending" || b.status === "confirmed";
            return (
              <div key={b.id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: CGL.blackcurrant }}>{b.purpose}</div>
                  <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>{formatDateShort(b.date)} · {formatTime(b.start_time)}–{formatTime(b.end_time)}</div>
                {b.status === "rejected" && b.rejection_note && <div style={{ fontSize: 12, color: "#b71c1c", marginTop: 6 }}>Reason: {b.rejection_note}</div>}
                {canCancel && (
                  <button onClick={() => cancel(b)} style={{ marginTop: 10, background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, color: "#b91c1c", cursor: "pointer" }}>Cancel booking</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageWrap>
  );
}

export default MyCarBookings;
