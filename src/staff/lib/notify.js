// Sign-in related notification emails, sent through the same Brevo proxy
// as everything else (see lib/email.js / netlify/functions/send-email.js).
import { sendEmail } from "../../lib/email.js";

// Confirms to the person themselves that they're signed in. Only sent
// when we actually have an email for them — a matched directory user, or
// someone who just self-registered via the inline "add yourself" flow on
// SignIn. A visitor with no account doesn't get one (we don't ask
// visitors for an email — see SignIn.jsx).
async function sendSignInAck(email, name, destinationLabel) {
  if (!email) return;
  await sendEmail(
    email,
    "Signed in — " + destinationLabel,
    "Hi " + (name.split(" ")[0] || name) + ",\n\nThis confirms you've signed in at " + destinationLabel + ".\n\nWirral Ways Staff Portal",
    undefined,
    "staff-portal",
  );
}

// Tells whoever a visitor is here to see that they've arrived.
async function sendVisitorNotification(hostEmail, hostName, visitorName, destinationLabel) {
  if (!hostEmail) return;
  await sendEmail(
    hostEmail,
    visitorName + " is here to see you",
    "Hi " + (hostName.split(" ")[0] || hostName) + ",\n\n" + visitorName + " has signed in at " + destinationLabel + " to see you.\n\nWirral Ways Staff Portal",
    undefined,
    "staff-portal",
  );
}

export { sendSignInAck, sendVisitorNotification };
