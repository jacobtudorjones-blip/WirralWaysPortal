// Shown from BookingForm.jsx when one or more occurrences of a recurring
// series collide with an existing confirmed booking. Previously this just
// blocked the whole submission with a generic error naming the first
// conflicting date — nothing in the series got booked, even the dates
// that were free. This lets the user resolve each conflicting date
// individually instead: skip it (drop it from the series) or move just
// that occurrence to a free, similar room at the same site — rather than
// having to go back and change the room/time for the entire series.
import { useState } from "react";
import { CGL, ROOMS, ROOM_LIST } from "../data/rooms.js";
import { formatDateShort, formatTime, hasConflict } from "../lib/helpers.js";

function RecurrenceConflictModal({ dates, conflictDates, roomId, startTime, endTime, bookings, onConfirm, onClose }) {
  const room = ROOMS[roomId];
  // One resolution per conflicting date: "skip" (default) or an
  // alternative room id chosen from the dropdown below.
  const [resolutions, setResolutions] = useState(
    () => Object.fromEntries(conflictDates.map(d => [d, "skip"]))
  );

  function alternativesFor(date) {
    return ROOM_LIST.filter(r =>
      r.id !== roomId &&
      r.site === room.site &&
      r.types.some(t => room.types.includes(t)) &&
      !hasConflict(bookings, r.id, date, startTime, endTime)
    );
  }

  function conflictingBookingFor(date) {
    return bookings.find(b =>
      b.roomId === roomId && b.date === date && b.status === "confirmed" &&
      startTime < b.endTime && endTime > b.startTime
    );
  }

  const freeDates = dates.filter(d => !conflictDates.includes(d));
  const keptCount = conflictDates.filter(d => resolutions[d] !== "skip").length;
  const totalToBook = freeDates.length + keptCount;

  function confirm() {
    const items = [
      ...freeDates.map(date => ({ date, roomId })),
      ...conflictDates.filter(d => resolutions[d] !== "skip").map(date => ({ date, roomId: resolutions[date] })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    onConfirm(items);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1003, padding: 16, fontFamily: "'Nunito',system-ui,sans-serif" }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, boxShadow: "0 24px 80px rgba(0,0,0,0.25)", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ background: CGL.saffron, padding: "18px 24px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(0,0,0,0.45)", letterSpacing: 1.5, marginBottom: 3 }}>SOME DATES ARE ALREADY BOOKED</div>
          <div style={{ color: "#3a2a00", fontSize: 17, fontWeight: 800 }}>
            {conflictDates.length} of {dates.length} date{dates.length !== 1 ? "s" : ""} clash{conflictDates.length === 1 ? "es" : ""} in {room.name}
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
            {freeDates.length > 0 && <>The other {freeDates.length} date{freeDates.length !== 1 ? "s" : ""} {freeDates.length !== 1 ? "are" : "is"} free and will be booked as normal. </>}
            For each clashing date below, choose to skip it or move just that one to a different room.
          </div>

          {conflictDates.map(date => {
            const clash = conflictingBookingFor(date);
            const alts = alternativesFor(date);
            const resolution = resolutions[date];
            return (
              <div key={date} style={{ border: "1.5px solid " + (resolution === "skip" ? CGL.lavender : CGL.saffron), background: resolution === "skip" ? "#fafafa" : CGL.saffron + "0d", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1a1a2e", marginBottom: 2 }}>{formatDateShort(date)} &bull; {formatTime(startTime)}–{formatTime(endTime)}</div>
                {clash && <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>Already booked: "{clash.title}" ({clash.bookedBy})</div>}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#444" }}>
                    <input type="radio" name={"res-" + date} checked={resolution === "skip"} onChange={() => setResolutions(r => ({ ...r, [date]: "skip" }))} style={{ accentColor: CGL.saffron }} />
                    Skip this date — don't book anything
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: alts.length ? "pointer" : "not-allowed", fontSize: 12, fontWeight: 700, color: alts.length ? "#444" : "#bbb" }}>
                    <input type="radio" name={"res-" + date} disabled={!alts.length} checked={resolution !== "skip"} onChange={() => setResolutions(r => ({ ...r, [date]: alts[0].id }))} style={{ accentColor: CGL.saffron }} />
                    Use a different room{alts.length === 0 ? " (none free at this site/time)" : ""}
                  </label>
                  {resolution !== "skip" && alts.length > 0 && (
                    <select value={resolution} onChange={e => setResolutions(r => ({ ...r, [date]: e.target.value }))}
                      style={{ marginLeft: 24, padding: "6px 10px", borderRadius: 7, border: "1.5px solid " + CGL.lavender, fontSize: 12, fontFamily: "inherit" }}>
                      {alts.map(r => <option key={r.id} value={r.id}>{r.name} — {r.type}{r.capacity !== "TBC" ? " — up to " + r.capacity : ""}</option>)}
                    </select>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ fontSize: 12, color: CGL.blackcurrant, background: CGL.blackcurrant + "0d", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            {totalToBook} of {dates.length} date{dates.length !== 1 ? "s" : ""} will be booked.
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid " + CGL.lavender, display: "flex", gap: 10, justifyContent: "flex-end", position: "sticky", bottom: 0, background: "white", borderRadius: "0 0 16px 16px" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#888", border: "1px solid " + CGL.lavender, borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>Back</button>
          <button onClick={confirm} disabled={totalToBook === 0}
            style={{ background: totalToBook === 0 ? "#ccc" : "linear-gradient(135deg," + CGL.blackcurrant + "," + CGL.amethyst + ")", color: "white", border: "none", borderRadius: 8, padding: "10px 24px", cursor: totalToBook === 0 ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, fontFamily: "inherit" }}>
            {totalToBook === 0 ? "Nothing to book" : "Submit " + totalToBook + " booking" + (totalToBook !== 1 ? "s" : "")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecurrenceConflictModal;
