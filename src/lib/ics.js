// Builds an .ics calendar file for a confirmed booking — used both by the
// "Add to calendar" download button (BookingCard) and as an email
// attachment on booking-confirmed emails (see App.jsx's buildEmail/
// icsAttachment and netlify/functions/send-email.js).
import { ROOMS } from "../data/rooms.js";

// RFC 5545 §3.3.11 text escaping — backslash, semicolon, comma and
// newlines all need escaping in TEXT-valued properties (SUMMARY,
// DESCRIPTION, LOCATION). buildICS() below doesn't do this (its inputs
// are project-controlled enough that it hasn't bitten anyone), but
// buildCalendarInviteICS() carries real booking titles/notes typed by
// whoever's booking, and Exchange's resource mailboxes are much less
// forgiving of a stray comma or semicolon breaking the property value
// than a personal "add to my calendar" download is.
function icsEscape(s) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function buildICS(booking) {
  const room = ROOMS[booking.roomId];
  const dtStart = booking.date.replace(/-/g,"") + "T" + booking.startTime.replace(":","") + "00";
  const dtEnd   = booking.date.replace(/-/g,"") + "T" + booking.endTime.replace(":","")   + "00";
  const uid     = (booking.id)+"@wirralways.org.uk";
  const notes   = booking.notes ? "\\nRequirements: "+(booking.notes) : "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wirral Ways//Room Booking//EN",
    "BEGIN:VEVENT",
    "UID:"+(uid),
    "DTSTAMP:"+(new Date().toISOString().replace(/[-:]/g,"").slice(0,15))+"Z",
    "DTSTART:"+(dtStart),
    "DTEND:"+(dtEnd),
    "SUMMARY:"+(booking.title)+" — "+(room.name),
    "DESCRIPTION:Room: "+(room.name)+" ("+(room.site)+")\\nBooked by: "+(booking.bookedBy)+(notes),
    "LOCATION:"+(room.name)+"\\, "+(room.site)+"\\, Wirral Ways",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

// Builds a real iTIP calendar invite — METHOD:REQUEST to put a booking on
// an external resource mailbox's shared calendar (e.g. one of Wirral
// Ways' Q0084.*@cgl.org.uk Exchange room mailboxes), or METHOD:CANCEL to
// take it back off. Deliberately separate from buildICS() above: that one
// builds a personal "add this to my own calendar" file (no METHOD, no
// ORGANIZER/ATTENDEE — nothing to accept or decline), which is a
// different iCalendar use case from a genuine meeting request a
// calendaring system can auto-process. Kept room/vehicle-agnostic (takes
// already-resolved summary/location/description strings rather than a
// booking+ROOMS lookup) so both Room Booking and Car Booking can call it.
//
// Whether this actually gets auto-accepted onto the target mailbox's
// calendar — rather than just landing as an email with an .ics attached —
// depends on how that mailbox is configured (Exchange's Calendar
// Attendant / resource auto-accept). Brevo (the only way this project
// sends email — see netlify/functions/send-email.js) is a transactional
// ESP, not a mail client speaking full calendaring MIME, so it can only
// attach the .ics conventionally rather than inline it as the message's
// primary text/calendar body the way Outlook would when natively
// inviting a room. Many resource mailboxes still process a well-formed
// METHOD:REQUEST attachment fine (this is how most third-party booking
// tools integrate with Exchange rooms) — but test with one real booking
// after this ships and check the target calendar before relying on it.
//
// uid MUST stay the same across a REQUEST and any later CANCEL for the
// same booking so the calendar system matches them to one entry —
// callers pass booking.id-derived UIDs consistently for this reason.
function buildCalendarInviteICS({
  uid, method, sequence = 0,
  date, startTime, endTime,
  summary, description, location,
  organizerEmail, organizerName,
  attendeeEmail, attendeeName,
}) {
  const dtStart = date.replace(/-/g, "") + "T" + startTime.replace(":", "") + "00";
  const dtEnd   = date.replace(/-/g, "") + "T" + endTime.replace(":", "")   + "00";
  const isCancel = method === "CANCEL";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wirral Ways//Booking Calendar Sync//EN",
    "METHOD:" + method,
    "BEGIN:VEVENT",
    "UID:" + uid,
    "SEQUENCE:" + sequence,
    "STATUS:" + (isCancel ? "CANCELLED" : "CONFIRMED"),
    "DTSTAMP:" + (new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)) + "Z",
    "DTSTART:" + dtStart,
    "DTEND:" + dtEnd,
    "SUMMARY:" + (isCancel ? "CANCELLED: " : "") + icsEscape(summary),
    "DESCRIPTION:" + icsEscape(description),
    "LOCATION:" + icsEscape(location),
    "ORGANIZER;CN=" + icsEscape(organizerName) + ":mailto:" + organizerEmail,
    "ATTENDEE;CN=" + icsEscape(attendeeName) + ";ROLE=REQ-PARTICIPANT;PARTSTAT=" + (isCancel ? "DECLINED" : "NEEDS-ACTION") + ";RSVP=TRUE:mailto:" + attendeeEmail,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// Triggers a browser download of the .ics file (the "📅 .ics" button on a booking card).
function generateICS(booking) {
  const ics = buildICS(booking);
  const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = (booking.title.replace(/[^a-z0-9]/gi,"_"))+"_"+(booking.date)+".ics";
  a.click();
  URL.revokeObjectURL(url);
}

export { buildICS, buildCalendarInviteICS, generateICS };
