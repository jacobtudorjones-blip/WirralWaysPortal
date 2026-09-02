// Transactional email via Brevo (formerly Sendinblue), sent through a
// same-origin serverless function (netlify/functions/send-email.js) so the
// real Brevo API key stays server-side — see that file's comment for the
// full story. Previously this called Brevo directly from the browser with
// the key baked into the client bundle, extractable by anyone who opened
// dev tools on the deployed site. Now the browser only ever talks to
// /.netlify/functions/send-email, which is same-origin and needs no key.

// attachment (optional): { name: "booking.ics", content: "<base64>" } —
// see App.jsx's icsAttachment() helper for how the calendar invite gets built.
// from (optional): which verified Brevo sender to send as — "room-booking"
// (the default, if omitted) or "staff-portal". See send-email.js's SENDERS
// map; this is a short key, not a raw address, so the function decides the
// real sender server-side rather than trusting whatever the client sends.
// htmlContent (optional): an HTML version of the same message — see
// lib/emailHtml.js's buildHtmlEmail() — used to render clickable buttons
// (e.g. "Cancel this booking") instead of a bare URL in the plain text.
async function sendEmail(to, subject, bodyText, attachment, from, htmlContent) {
  try {
    const res = await fetch("/.netlify/functions/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, textContent: bodyText, attachment: attachment || undefined, from: from || undefined, htmlContent: htmlContent || undefined }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("[EMAIL ERROR]", res.status, body.error || res.statusText);
    }
  } catch (e) { console.error("[EMAIL ERROR]", e); }
}

// Email simulation — replace with real SMTP/API call when one.com creds are available
function simulateEmail(to, subject, body) {
  console.log("[EMAIL] To: " + (to) + " | Subject: " + (subject));
  return { to, subject, body };
}

export { sendEmail, simulateEmail };
