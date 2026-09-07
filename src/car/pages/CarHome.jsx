// Car Booking landing page — current status (available / out right now)
// plus what's coming up today. The "is it out right now" check compares
// against the browser's clock, same as everywhere else in this app that
// works out "now" client-side (there's no server-side cron needed for
// this, unlike the Staff Portal's overdue-outreach alert, since nobody
// needs to be *notified* the car is in use — it's just a status display).
import { Link } from "react-router-dom";
import { CGL, VEHICLE } from "../../data/car.js";
import { todayStr, formatTime, formatDateShort } from "../../lib/helpers.js";
import { useCarBookings } from "../lib/useCarBookings.js";
import PageWrap from "../components/PageWrap.jsx";

function nowHHMM() {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

function CarHome() {
  const { bookings } = useCarBookings();
  const today = todayStr();
  const now = nowHHMM();

  const todaysConfirmed = (bookings || []).filter(b => b.date === today && b.status === "confirmed");
  const current = todaysConfirmed.find(b => b.start_time <= now && b.end_time > now);
  const upcoming = (bookings || [])
    .filter(b => b.status === "confirmed" && (b.date > today || (b.date === today && b.end_time > now)))
    .slice(0, 6);

  return (
    <PageWrap backTo="/" title="Car Booking" subtitle={VEHICLE.name + (VEHICLE.registration ? " (" + VEHICLE.registration + ")" : "")}>
      <div style={{
        background: current ? "#fdecea" : "#dcfce7", border: "1.5px solid " + (current ? "#f5b7b1" : "#86efac"),
        borderRadius: 14, padding: "18px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>{current ? "🚗" : "✅"}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: current ? "#b71c1c" : "#16a34a" }}>
            {current ? "Out — with " + current.requested_by : "Available now"}
          </div>
          {current && <div style={{ fontSize: 12, color: "#7a5c00" }}>Back by {formatTime(current.end_time)} · {current.purpose}</div>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
        <Link to="/car/book" style={{ background: CGL.saffron, color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 800, fontSize: 14 }}>Book the car →</Link>
        <Link to="/car/month" style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: CGL.blackcurrant, textDecoration: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14 }}>Month view</Link>
        <Link to="/car/mine" style={{ background: "#fff", border: "1.5px solid #e5e7eb", color: CGL.blackcurrant, textDecoration: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 700, fontSize: 14 }}>My bookings</Link>
      </div>

      <div style={{ fontSize: 11, fontWeight: 800, color: CGL.blackcurrant, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>Coming up</div>
      {!bookings ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : upcoming.length === 0 ? (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>Nothing booked yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {upcoming.map(b => (
            <div key={b.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{b.purpose}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{b.requested_by}</div>
              </div>
              <div style={{ fontSize: 12, color: "#555", textAlign: "right", whiteSpace: "nowrap" }}>
                {formatDateShort(b.date)}<br />{formatTime(b.start_time)}–{formatTime(b.end_time)}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageWrap>
  );
}

export default CarHome;
