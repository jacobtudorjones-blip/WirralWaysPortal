// Request (or, for approvers, directly confirm) a car booking — date,
// drag-select time slot, purpose, notes. Mirrors Room Booking's
// BookingForm.jsx flow, but for one vehicle: no room picker, and
// auto-approve follows the same "approvers confirm their own requests
// instantly" rule Room Booking uses.
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CGL, VEHICLE } from "../../data/car.js";
import { todayStr, nowStr } from "../../lib/helpers.js";
import { nameFromEmail } from "../../lib/nameFromEmail.js";
import { inp, lbl } from "../../styles/shared.js";
import { useCarBookings } from "../lib/useCarBookings.js";
import { sendCarRequestEmails, sendCarDecisionEmail, syncCarCalendar } from "../lib/carEmail.js";
import CarSchedulePicker from "../components/CarSchedulePicker.jsx";
import BulkBookCar from "../components/BulkBookCar.jsx";
import PageWrap from "../components/PageWrap.jsx";

// Only a CONFIRMED booking blocks a slot — same deliberate rule
// hasConflict() uses for Room Booking (see CLAUDE.md): pending requests
// can overlap since only one will actually get approved.
function hasConflict(bookings, date, startTime, endTime) {
  return bookings.some(b =>
    b.date === date && b.status === "confirmed" &&
    startTime < b.end_time && endTime > b.start_time
  );
}

function BookCar({ user }) {
  const { bookings, reload, insertRow, insertRows } = useCarBookings();
  // ?date= lets the monthly overview's "Book this day" link land here with
  // the date pre-filled (see CarMonth.jsx) — falls back to today otherwise.
  const [searchParams] = useSearchParams();
  const [date, setDate] = useState(() => searchParams.get("date") || todayStr());
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  // "Book this for someone else" — mirrors Room Booking's BookingForm.jsx
  // toggle. bookingForEmail must be a real CGL address (same rule Room
  // Booking uses) since it's who the confirmation/decision emails go to.
  const [bookingForOther, setBookingForOther] = useState(false);
  const [bookingForEmail, setBookingForEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState(null); // {count, autoApprove}

  const dayBookings = (bookings || []).filter(b => b.date === date && (b.status === "confirmed" || b.status === "pending"));

  async function submit(e) {
    e.preventDefault();
    if (!startTime || !endTime) { setError("Please select a time slot on the schedule below."); return; }
    if (!purpose.trim()) { setError("Please say what the car's needed for."); return; }
    if (bookingForOther) {
      if (!bookingForEmail.trim()) { setError("Please enter the email address of the person you are booking for."); return; }
      if (!bookingForEmail.trim().toLowerCase().endsWith("@cgl.org.uk")) { setError("The email address for the other person must end in @cgl.org.uk."); return; }
    }
    if (hasConflict(bookings || [], date, startTime, endTime)) {
      setError("That slot's just been taken — please pick a different time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const autoApprove = user.isApprover;
      const payload = {
        requested_by: user.name,
        requested_by_email: user.email,
        booked_for: bookingForOther && bookingForEmail.trim() ? nameFromEmail(bookingForEmail.trim()) : null,
        booked_for_email: bookingForOther && bookingForEmail.trim() ? bookingForEmail.trim().toLowerCase() : null,
        date, start_time: startTime, end_time: endTime,
        purpose: purpose.trim(), notes: notes.trim() || null,
        status: autoApprove ? "confirmed" : "pending",
        approved_by: autoApprove ? user.name : null,
        approved_at: autoApprove ? nowStr() : null,
      };
      const created = await insertRow("car_bookings", payload);
      if (autoApprove) {
        await sendCarDecisionEmail("confirmed", created);
        await syncCarCalendar(created, "created");
      } else {
        await sendCarRequestEmails(created);
      }
      setDone(created);
      reload();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  // Bulk request — same auto-approve rule as a single booking, but no
  // per-item email: matches Room Booking's own handleBulkBook (App.jsx),
  // which doesn't email either. A flood of N identical confirmation/
  // request emails for one bulk submission isn't wanted; the on-screen
  // banner below is the confirmation instead. insertRows does the whole
  // batch in one Supabase request rather than looping insertRow.
  async function handleBulkBook(dates, bulkPurpose, bulkStart, bulkEnd, bulkNotes) {
    const autoApprove = user.isApprover;
    const payloads = dates.map(d => ({
      requested_by: user.name,
      requested_by_email: user.email,
      date: d, start_time: bulkStart, end_time: bulkEnd,
      purpose: bulkPurpose.trim(), notes: (bulkNotes || "").trim() || null,
      status: autoApprove ? "confirmed" : "pending",
      approved_by: autoApprove ? user.name : null,
      approved_at: autoApprove ? nowStr() : null,
    }));
    const created = await insertRows("car_bookings", payloads);
    // Each bulk item is its own distinct calendar slot on the car's
    // mailbox, unlike the "no per-item email" rule above (that's about
    // not flooding a person's inbox — this is a resource calendar that
    // genuinely needs a separate entry per date to stay accurate).
    if (autoApprove) (created || []).forEach(b => syncCarCalendar(b, "created"));
    setBulkResult({ count: payloads.length, autoApprove });
    setShowBulk(false);
    reload();
  }

  if (done) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>✅</div>
        <h2 style={{ color: "#16a34a", margin: 0 }}>{done.status === "confirmed" ? "Booking confirmed" : "Request sent"}</h2>
        <p style={{ color: "#6b7280", fontSize: 13, maxWidth: 320 }}>
          {done.status === "confirmed"
            ? VEHICLE.name + " is booked for " + (done.booked_for || "you") + " " + done.date + ", " + done.start_time + "–" + done.end_time + "."
            : "You'll get an email once it's approved or if there's a problem."}
        </p>
        <button onClick={() => { setDone(null); setStartTime(null); setEndTime(null); setPurpose(""); setNotes(""); setBookingForOther(false); setBookingForEmail(""); }} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, cursor: "pointer" }}>Book again</button>
      </div>
    );
  }

  return (
    <PageWrap backTo="/car" title={"Book " + VEHICLE.name} subtitle="Pick a date and time, then say what it's for.">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button type="button" onClick={() => setShowBulk(true)} style={{ background: CGL.lavender + "30", color: CGL.blackcurrant, border: "1px solid " + CGL.lavender + "60", borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>⊞ Book multiple dates</button>
      </div>

      {bulkResult && (
        <div style={{ background: "#dcfce7", border: "1.5px solid #86efac", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 700 }}>
            {bulkResult.count} booking{bulkResult.count !== 1 ? "s" : ""} {bulkResult.autoApprove ? "confirmed" : "requested — you'll get an email once each is approved"}.
          </div>
          <button onClick={() => setBulkResult(null)} style={{ background: "none", border: "none", color: "#16a34a", fontWeight: 800, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Date</label>
          <input type="date" style={inp} value={date} min={todayStr()} onChange={e => { setDate(e.target.value); setStartTime(null); setEndTime(null); }} />
        </div>

        {/* Booking for someone else toggle — mirrors Room Booking's BookingForm.jsx */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", background: bookingForOther ? CGL.saffron + "15" : CGL.lavender + "22", borderRadius: 8, border: "1px solid " + (bookingForOther ? CGL.saffron + "66" : CGL.lavender) }}>
            <input type="checkbox" checked={bookingForOther} onChange={e => setBookingForOther(e.target.checked)} style={{ width: 17, height: 17, accentColor: CGL.saffron }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: bookingForOther ? CGL.saffron : "#555" }}>I'm booking this for someone else</div>
              <div style={{ fontSize: 11, color: "#888" }}>The booking will appear on their profile too, and they'll get the confirmation email</div>
            </div>
          </label>
          {bookingForOther && (
            <div style={{ marginTop: 8, padding: "12px 14px", background: "white", borderRadius: 8, border: "1.5px solid " + CGL.saffron + "55" }}>
              <label style={{ ...lbl, color: CGL.saffron }}>Their CGL email address *</label>
              <input
                type="email"
                value={bookingForEmail}
                onChange={e => setBookingForEmail(e.target.value.toLowerCase())}
                placeholder="firstname.lastname@cgl.org.uk"
                style={inp}
                onFocus={e => e.target.style.borderColor = CGL.saffron}
                onBlur={e => e.target.style.borderColor = CGL.lavender}
              />
              {bookingForEmail.includes("@") && (
                <div style={{ fontSize: 11, color: CGL.saffron, marginTop: 5, fontWeight: 600 }}>
                  Will show on: {nameFromEmail(bookingForEmail)}'s bookings
                </div>
              )}
            </div>
          )}
        </div>

        <CarSchedulePicker date={date} dayBookings={dayBookings} startTime={startTime} endTime={endTime} onChange={(s, e) => { setStartTime(s); setEndTime(e); }} />

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>What's it needed for? *</label>
          <input style={inp} value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Home visit — Birkenhead" />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Notes (optional)</label>
          <textarea style={{ ...inp, minHeight: 64, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && <div style={{ color: "#ef5ba1", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={saving} style={{ width: "100%", background: CGL.saffron, color: "#fff", border: "none", borderRadius: 12, padding: 15, fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Booking…" : user.isApprover ? "Confirm booking" : "Request booking"}
        </button>
      </form>

      {showBulk && (
        <BulkBookCar
          bookings={bookings || []}
          onBook={handleBulkBook}
          onClose={() => setShowBulk(false)}
          currentUser={user}
        />
      )}
    </PageWrap>
  );
}

export default BookCar;
