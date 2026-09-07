// Monthly overview — a Mon-Sun calendar grid for the whole month, showing
// every confirmed/pending car booking on the day it falls on. Room
// Booking has no equivalent (only Daily/Weekly views — see CLAUDE.md), so
// this is designed fresh rather than adapted from an existing view; the
// week-grid maths (Mon-first, "leadDays" padding into the previous month)
// mirrors WeeklyView.jsx's getWeekStart() reasoning, just extended to a
// whole month instead of 7 fixed days.
import { Link } from "react-router-dom";
import { useState } from "react";
import { CGL, VEHICLE } from "../../data/car.js";
import { todayStr, formatTime } from "../../lib/helpers.js";
import { useCarBookings } from "../lib/useCarBookings.js";
import PageWrap from "../components/PageWrap.jsx";

const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Builds a Mon-Sun grid of date strings covering the given month, padded
// with just enough leading/trailing days to complete whole weeks (no
// trailing all-next-month row, unlike a fixed 6-row grid).
function buildMonthGrid(monthStart) {
  const first = new Date(monthStart + "T00:00:00");
  const year = first.getFullYear(), month = first.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = first.getDay(); // 0=Sun..6=Sat
  const leadDays = firstDay === 0 ? 6 : firstDay - 1; // pad back to Monday
  const weeks = Math.ceil((leadDays + daysInMonth) / 7);
  const gridStart = new Date(year, month, 1 - leadDays);
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function CarMonth() {
  const { bookings } = useCarBookings();
  const [monthStart, setMonthStart] = useState(() => todayStr().slice(0, 7) + "-01");

  function shiftMonth(delta) {
    const d = new Date(monthStart + "T00:00:00");
    d.setMonth(d.getMonth() + delta, 1);
    setMonthStart(d.toISOString().slice(0, 10));
  }
  function goToday() { setMonthStart(todayStr().slice(0, 7) + "-01"); }

  const monthLabel = new Date(monthStart + "T00:00:00").toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const monthNum = new Date(monthStart + "T00:00:00").getMonth();
  const cells = buildMonthGrid(monthStart);
  const today = todayStr();

  function bookingsFor(date) {
    return (bookings || [])
      .filter(b => b.date === date && (b.status === "confirmed" || b.status === "pending"))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <PageWrap backTo="/car" title="Month view" subtitle={"See what's booked for " + VEHICLE.name + " across the month."} maxWidth={920}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => shiftMonth(-1)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15, color: CGL.blackcurrant }}>‹</button>
          <div style={{ fontWeight: 800, fontSize: 16, color: CGL.blackcurrant, minWidth: 150, textAlign: "center" }}>{monthLabel}</div>
          <button onClick={() => shiftMonth(1)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 15, color: CGL.blackcurrant }}>›</button>
          <button onClick={goToday} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Today</button>
        </div>
        <Link to="/car/book" style={{ background: CGL.saffron, color: "#fff", textDecoration: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, fontSize: 13 }}>Book the car →</Link>
      </div>

      {!bookings ? (
        <div style={{ color: "#6b7280", fontStyle: "italic", fontSize: 13 }}>Loading…</div>
      ) : (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: CGL.blackcurrant + "0d" }}>
            {DAY_ABBR.map(d => (
              <div key={d} style={{ padding: "8px 6px", fontSize: 11, fontWeight: 800, color: CGL.blackcurrant, textAlign: "center", letterSpacing: 0.5 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
            {cells.map(date => {
              const inMonth = new Date(date + "T00:00:00").getMonth() === monthNum;
              const isToday = date === today;
              const items = bookingsFor(date);
              const dayNum = parseInt(date.slice(8, 10), 10);
              return (
                <div key={date} style={{
                  minHeight: 96, borderTop: "1px solid #f0f0f2", borderRight: "1px solid #f0f0f2",
                  padding: "6px 6px 8px", background: inMonth ? "#fff" : "#fafafa",
                  opacity: inMonth ? 1 : 0.55, display: "flex", flexDirection: "column", gap: 3,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? "#fff" : "#555",
                      background: isToday ? CGL.blackcurrant : "transparent",
                      borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{dayNum}</span>
                  </div>
                  {items.slice(0, 3).map(b => (
                    <div key={b.id} title={b.purpose + " — " + b.requested_by} style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 5px", lineHeight: 1.3,
                      background: b.status === "confirmed" ? "#dcfce7" : "#fff3cd",
                      color: b.status === "confirmed" ? "#16a34a" : "#7a5c00",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {formatTime(b.start_time)} {b.requested_by.split(" ")[0]}
                    </div>
                  ))}
                  {items.length > 3 && <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700 }}>+{items.length - 3} more</div>}
                  {inMonth && (
                    <Link to={"/car/book?date=" + date} style={{ marginTop: "auto", fontSize: 10, color: "#9ca3af", textDecoration: "none", fontWeight: 700 }}>+ Book</Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11, color: "#6b7280" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#dcfce7", display: "inline-block" }} />Confirmed</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#fff3cd", display: "inline-block" }} />Awaiting approval</span>
      </div>
    </PageWrap>
  );
}

export default CarMonth;
