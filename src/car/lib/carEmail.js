// Email builder for Car Booking — same shape as App.jsx's buildEmail for
// Room Booking (request/confirmed/rejected/approver_notify), trimmed
// down for a single vehicle (no room/site detail, no recipientsFor —
// Car Booking doesn't have a "book for someone else" option yet).
import { sendEmail } from "../../lib/email.js";
import { buildHtmlEmail } from "../../lib/emailHtml.js";
import { VEHICLE, CAR_REQUEST_NOTIFY_EMAILS } from "../../data/car.js";
import { formatDate, formatDateShort, formatTime } from "../../lib/helpers.js";

const PORTAL_URL = "https://portal.wirralways.org.uk";
const MY_BOOKINGS_URL = PORTAL_URL + "/car?tab=mybookings";
const CANCEL_BUTTON = { label: "Cancel this booking", url: MY_BOOKINGS_URL, color: "#b52372" };

function detailFor(booking) {
  return "Vehicle: " + VEHICLE.name + "\nDate: " + formatDate(booking.date) + "\nTime: " + formatTime(booking.start_time) + " – " + formatTime(booking.end_time) + "\nPurpose: " + booking.purpose;
}

function buildCarEmail(type, booking) {
  const detail = detailFor(booking);
  const firstName = booking.requested_by.split(" ")[0];
  let result;
  if (type === "requested") {
    result = {
      to: booking.requested_by_email, type,
      subject: "Car booking request received — " + formatDateShort(booking.date),
      body: "Hi " + firstName + ",\n\nYour request to book " + VEHICLE.name + " has been received. An approver will review it shortly and you'll get a confirmation email once it's been approved or if there's a problem.\n\n" + detail + "\n\nIf you need to make any changes, please get in touch.\n\nWirral Ways Car Booking",
      buttons: [{ label: "View your bookings", url: MY_BOOKINGS_URL }],
    };
  } else if (type === "confirmed") {
    result = {
      to: booking.requested_by_email, type,
      subject: "Car booking confirmed — " + formatDateShort(booking.date),
      body: "Hi " + firstName + ",\n\nGreat news — your booking for " + VEHICLE.name + " has been confirmed.\n\n" + detail + "\n\nNo longer need it? You can cancel from " + MY_BOOKINGS_URL + ".\n\nWirral Ways Car Booking",
      buttons: [CANCEL_BUTTON],
    };
  } else if (type === "rejected") {
    result = {
      to: booking.requested_by_email, type,
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

export { buildCarEmail, sendCarRequestEmails, sendCarDecisionEmail };
