// Transactional email via Brevo (formerly Sendinblue).
//
// SECURITY NOTE: this calls the Brevo API directly from the browser with an
// API key baked into the client bundle. That was true of the original
// single-file app too — moving the key into an env var keeps it out of git,
// but it is still shipped to (and readable by) every visitor once built.
// A leaked/scraped key could be used to send email as this account. Before
// going to production, consider proxying this call through a small serverless
// function (Supabase Edge Function, Cloudflare Worker, etc.) that holds the
// Brevo key server-side instead.
const BREVO_KEY = import.meta.env.VITE_BREVO_API_KEY;

async function sendEmail(to, subject, bodyText) {
  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Wirral Ways Room Booking", email: "rooms@wirralways.org.uk" },
        to: [{ email: to }], subject, textContent: bodyText
      })
    });
  } catch (e) { console.error("[BREVO ERROR]", e); }
}

// Email simulation — replace with real SMTP/API call when one.com creds are available
function simulateEmail(to, subject, body) {
  console.log("[EMAIL] To: " + (to) + " | Subject: " + (subject));
  return { to, subject, body };
}

export { sendEmail, simulateEmail };
