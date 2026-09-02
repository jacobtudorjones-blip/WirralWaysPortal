// Sign-in related notification emails, sent through the same Brevo proxy
// as everything else (see lib/email.js / netlify/functions/send-email.js).
import { sendEmail } from "../../lib/email.js";
import { buildHtmlEmail } from "../../lib/emailHtml.js";

const WHO_URL = "https://portal.wirralways.org.uk/staff/who";
const SIGN_IN_URL = "https://portal.wirralways.org.uk/staff/sign-in";
const LIVE_VIEW_BUTTON = { label: "View live status", url: WHO_URL, color: "#5e1b6d" };
const SIGN_IN_BUTTON = { label: "Sign in", url: SIGN_IN_URL, color: "#f08300" };

// Confirms to the person themselves that they're signed in. Only sent
// when we actually have an email for them — a matched directory user, or
// someone who just self-registered via the inline "add yourself" flow on
// SignIn. A visitor with no account doesn't get one (we don't ask
// visitors for an email — see SignIn.jsx).
async function sendSignInAck(email, name, destinationLabel) {
  if (!email) return;
  const body = "Hi " + (name.split(" ")[0] || name) + ",\n\nThis confirms you've signed in at " + destinationLabel + ".\n\nWirral Ways Staff Portal";
  await sendEmail(email, "Signed in — " + destinationLabel, body, undefined, "staff-portal", buildHtmlEmail(body, [SIGN_IN_BUTTON]));
}

// Tells whoever a visitor is here to see that they've arrived.
async function sendVisitorNotification(hostEmail, hostName, visitorName, destinationLabel) {
  if (!hostEmail) return;
  const body = "Hi " + (hostName.split(" ")[0] || hostName) + ",\n\n" + visitorName + " has signed in at " + destinationLabel + " to see you.\n\nWirral Ways Staff Portal";
  await sendEmail(hostEmail, visitorName + " is here to see you", body, undefined, "staff-portal", buildHtmlEmail(body));
}

// Lets a manager know one of their team has just started an outreach
// trip — where, and when they're expected back — for lone-working
// visibility, not just after-the-fact via the overdue alert. Only fires
// when the person on outreach has a manager on file with an email; no
// manager set is not an error, just nothing to send.
async function sendOutreachStartNotification(managerEmail, managerName, personName, location, expectedReturn) {
  if (!managerEmail) return;
  const body = "Hi " + (managerName.split(" ")[0] || managerName) + ",\n\n" + personName + " has signed in for outreach" +
    (location ? " to " + location : "") +
    (expectedReturn ? ", expected back around " + expectedReturn : "") +
    ".\n\nLive view: " + WHO_URL + "\n\nWirral Ways Staff Portal";
  await sendEmail(managerEmail, personName + " is out on outreach", body, undefined, "staff-portal", buildHtmlEmail(body, [LIVE_VIEW_BUTTON]));
}

// The other half of sendOutreachStartNotification — lets the manager know
// their team member is back safe, without them having to check the live
// "who's in" view or wait for the overdue alert to (not) fire.
async function sendOutreachReturnNotification(managerEmail, managerName, personName) {
  if (!managerEmail) return;
  const body = "Hi " + (managerName.split(" ")[0] || managerName) + ",\n\n" + personName + " has signed back in from outreach.\n\nWirral Ways Staff Portal";
  await sendEmail(managerEmail, personName + " is back from outreach", body, undefined, "staff-portal", buildHtmlEmail(body));
}

export { sendSignInAck, sendVisitorNotification, sendOutreachStartNotification, sendOutreachReturnNotification };
