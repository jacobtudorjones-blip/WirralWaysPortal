// Sign-in related notification emails, sent through the same Brevo proxy
// as everything else (see lib/email.js / netlify/functions/send-email.js).
//
// Removed on request: sendSignInAck (confirmed-to-self "you've signed in"
// email on every start action) and sendOutreachStartNotification/
// sendOutreachReturnNotification (manager emails at the start/end of an
// outreach trip). Staff were getting too many emails from ordinary,
// successful sign-ins/outs; managers only want to hear about outreach
// when something's actually wrong. The one outreach email that's kept is
// the overdue alert — see netlify/functions/outreach-overdue-alert.js,
// which is untouched by this and still fires 15+ minutes past
// expected_return. Don't reintroduce a per-sign-in/per-outreach-trip
// email without checking this decision still holds.
import { sendEmail } from "../../lib/email.js";
import { buildHtmlEmail } from "../../lib/emailHtml.js";

// Tells whoever a visitor is here to see that they've arrived. Kept —
// this is a one-off, low-volume "someone's waiting for you" alert, not
// the everyday sign-in noise the removal above was about.
async function sendVisitorNotification(hostEmail, hostName, visitorName, destinationLabel) {
  if (!hostEmail) return;
  const body = "Hi " + (hostName.split(" ")[0] || hostName) + ",\n\n" + visitorName + " has signed in at " + destinationLabel + " to see you.\n\nWirral Ways Staff Portal";
  await sendEmail(hostEmail, visitorName + " is here to see you", body, undefined, "staff-portal", buildHtmlEmail(body));
}

export { sendVisitorNotification };
