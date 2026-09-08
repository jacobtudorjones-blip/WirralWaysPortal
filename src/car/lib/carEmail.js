// Email builder for Car Booking — same shape as App.jsx's buildEmail for
// Room Booking (request/confirmed/rejected/approver_notify), trimmed
// down for a single vehicle (no room/site detail).
import { sendEmail } from "../../lib/email.js";
import { buildHtmlEmail } from "../../lib/emailHtml.js";
import { buildCalendarInviteICS } from "../../lib/ics.js";
import { VEHICLE, CAR_REQUEST_NOTIFY_EMAILS, CAR_CALENDAR_EMAIL } from "../../data/car.js";
import { formatDate, formatDateShort, formatTime, norm } from "../../lib/helpers.js";

const PORTAL_URL = "https://portal.wirralways.org.uk";
const MY_BOOKINGS_URL = PORTAL_URL + "/car?tab=mybookings";
const CANCEL_BUTTON = { label: "Cancel this booking", url: MY_BOOKINGS_URL, color: "#b52372" };

function detailFor(booking) {
  return "Vehicle: " + VEHICLE.name + "\nDate: " + formatDate(booking.date) + "\nTime: " + formatTime(booking.start_time) + " – " + formatTime(booking.end_time) + "\nPurpose: " + booking.purpose;
}

// When booked_for/booked_for_email are set (see BookCar.jsx's "book for
// someone else" toggle), the request/confirmed/rejected emails should
// reach both the person the car is actually for and whoever submitted it
// on their behalf — same comma-separated multi-recipient `to` pattern
// Room Booking's recipientsFor() uses in App.jsx.
function recipientsFor(booking) {
  if (!booking.booked_for_email) return booking.requested_by_email;
  return norm(booking.booked_for_email) === norm(booking.requested_by_email)
    ? booking.requested_by_email
    : booking.booked_for_email + "," + booking.requested_by_email;
}

function buildCarEmail(type, booking) {
  const detail = detailFor(booking) + (booking.booked_for && booking.booked_for_email ? "\nBooked for: " + booking.booked_for + " (" + booking.booked_for_email + ")" : "");
  // Greet whoever the car is actually for, not the submitter, when this
  // was booked on someone else's behalf — matches Room Booking, whose
  // emails greet booking.bookedBy rather than the requester.
  const firstName = (booking.booked_for || booking.requested_by).split(" ")[0];
  let result;
  if (type === "requested") {
    result = {
      to: recipientsFor(booking), type,
      subject: "Car booking request received — " + formatDateShort(booking.date),
      body: "Hi " + firstName + ",\n\nYour request to book " + VEHICLE.name + " has been received. An approver will review it shortly and you'll get a confirmation email once it's been approved or if there's a problem.\n\n" + detail + "\n\nIf you need to make any changes, please get in touch.\n\nWirral Ways Car Booking",
      buttons: [{ label: "View your bookings", url: MY_BOOKINGS_URL }],
    };
  } else if (type === "confirmed") {
    result = {
      to: recipientsFor(booking), type,
      subject: "Car booking confirmed — " + formatDateShort(booking.date),
      body: "Hi " + firstName + ",\n\nGreat news — your booking for " + VEHICLE.name + " has been confirmed.\n\n" + detail + "\n\nNo longer need it? You can cancel from " + MY_BOOKINGS_URL + ".\n\nWirral Ways Car Booking",
      buttons: [CANCEL_BUTTON],
    };
  } else if (type === "rejected") {
    result = {
      to: recipientsFor(booking), type,
      subject: "Car booking update — " + formatDateShort(booking.date),
      body: "Hi " + firstName + ",\n\nUnfortunately your car booking request could not be approved." + (booking.rejection_note ? "\n\nReason: " + booking.rejection_note : "") + "\n\n" + detail + "\n\nIf you have any questions, please get in touch with the team.\n\nWirral Ways Car Booking",
      buttons: [{ label: "View your bookings", url: MY_BOOKINGS_URL }, { label: "Contact the team", url: "mailto:wirral.services@cgl.org.uk", color: "#5e1b6d" }],
    };
  } else if (type === "approver_notify") {
    result = {
      to: CAR_REQUEST_NOTIFY_EMAILS.join(", "), type: "requested",
      subject: "New car booking request — " + formatDateShort(booking.date),
      body: "Hi,\n\nA new car booking request has been submitted and needs your approval.\n\n" + detail + "\nRequested by: " + booking.requested_by + " (" + booking.requested_by_email + ")\n\nPlease log in to " + PORTAL_URL + "/car?tab=approvals to approve or reject this request.\n\nWirral Ways Car Booking",
      buttons: [{ label: "Review this request", url: PORTAL_URL + "/car?tab=approvals" }],
    };
  } else {
    throw new Error("Unknown car email type: " + type);
  }
  result.html = buildHtmlEmail(result.body, result.buttons || []);
  return result;
}

// Fires the request-received + approver-notify pair for a brand new
// booking — call sites don't need to know both emails exist.
async function sendCarRequestEmails(booking) {
  const req = buildCarEmail("requested", booking);
  await sendEmail(req.to, req.subject, req.body, undefined, "car-booking", req.html);
  const notify = buildCarEmail("approver_notify", booking);
  await sendEmail(notify.to, notify.subject, notify.body, undefined, "car-booking", notify.html);
}

async function sendCarDecisionEmail(type, booking) {
  const email = buildCarEmail(type, booking);
  await sendEmail(email.to, email.subject, email.body, undefined, "car-booking", email.html);
}

// Keeps the car's real Exchange shared calendar (CAR_CALENDAR_EMAIL —
// Q0084.CarLog@cgl.org.uk — see data/car.js) in sync with what's
// confirmed in this app, going forward only — same reasoning and same
// fixed 0/1/2 sequence tiering as Room Booking's syncRoomCalendar() in
// App.jsx (see that function's comment); Car Booking has no edit feature
// so only "created"/"cancelled" are actually reachable here, but the
// stage is kept generic for parity.
const CALENDAR_SEQUENCE = { created: 0, edited: 1, cancelled: 2 };
async function syncCarCalendar(booking, stage) {
  const method = stage === "cancelled" ? "CANCEL" : "REQUEST";
  const ics = buildCalendarInviteICS({
    uid: booking.id + "-calsync@wirralways.org.uk",
    method,
    sequence: CALENDAR_SEQUENCE[stage],
    date: booking.date, startTime: booking.start_time, endTime: booking.end_time,
    summary: booking.purpose + " — " + VEHICLE.name,
    description: "Booked by: " + (booking.booked_for || booking.requested_by)
      + (booking.notes ? "\nNotes: " + booking.notes : "")
      + "\n\nSynced automatically from the Wirral Ways Portal (portal.wirralways.org.uk/car). Don't edit this event directly here — changes made in the portal will overwrite it.",
    location: VEHICLE.name,
    organizerEmail: "rooms@wirralways.org.uk", organizerName: "Wirral Ways Car Booking",
    attendeeEmail: CAR_CALENDAR_EMAIL, attendeeName: VEHICLE.name,
  });
  const subject = (stage === "cancelled" ? "Cancelled: " : "") + booking.purpose + " — " + formatDateShort(booking.date);
  const body = stage === "cancelled"
    ? "This booking has been cancelled and should be removed from the car's calendar."
    : "This booking is confirmed on the car's calendar via the Wirral Ways Portal.";
  await sendEmail(CAR_CALENDAR_EMAIL, subject, body, { name: "invite.ics", content: btoa(unescape(encodeURIComponent(ics))) }, "car-booking", undefined);
}

export { buildCarEmail, sendCarRequestEmails, sendCarDecisionEmail, syncCarCalendar };
