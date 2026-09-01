// Server-side proxy for sending transactional email via Brevo.
//
// This exists so the Brevo API key never ships to the browser. Before this,
// src/lib/email.js called Brevo directly from client code with
// VITE_BREVO_API_KEY — Vite inlines VITE_-prefixed vars into the built JS,
// so that key was extractable by anyone who opened dev tools on the
// deployed site and could have been used to send email as this account.
// Now the browser only ever calls this function; the real key lives in
// Netlify's environment variables as BREVO_API_KEY (deliberately NOT
// VITE_-prefixed, so it's never bundled into client code).
//
// Deploys automatically with the rest of the app via this repo's existing
// Netlify build — see netlify.toml's [functions] block. This only runs on
// Netlify: if the frontend ever moves to a host without serverless
// functions (e.g. plain static hosting like one.com), this needs to move
// somewhere that still executes it — a Supabase Edge Function is the
// natural host-agnostic alternative.
//
// No authentication here (same as every other write in this app — see the
// README's security notes), so this is deliberately narrow: one hardcoded
// sender, one recipient per call, and small size limits, so at worst it's
// usable to send a normal-sized email as this account — not as an open
// relay for arbitrary bulk mail or a spoofed sender.

const BREVO_KEY = process.env.BREVO_API_KEY;
const FROM = { name: "Wirral Ways Room Booking", email: "rooms@wirralways.org.uk" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ESM export, not `exports.handler` — this repo's package.json sets
// "type": "module", so a CommonJS `exports.handler` here would fail at
// runtime (Node treats every .js file as ESM by default in that mode).
// Netlify Functions supports both handler styles; this is the one that
// actually matches how the rest of this project is set up.
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  if (!BREVO_KEY) {
    console.error("send-email: BREVO_API_KEY is not set in this site's environment variables");
    return { statusCode: 500, body: JSON.stringify({ error: "Email is not configured on the server" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { to, subject, textContent } = payload;
  if (typeof to !== "string" || !EMAIL_RE.test(to)) {
    return { statusCode: 400, body: JSON.stringify({ error: "A valid single recipient email is required" }) };
  }
  if (typeof subject !== "string" || !subject.trim() || subject.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ error: "subject is required (max 200 chars)" }) };
  }
  if (typeof textContent !== "string" || !textContent.trim() || textContent.length > 20000) {
    return { statusCode: 400, body: JSON.stringify({ error: "textContent is required (max 20000 chars)" }) };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ sender: FROM, to: [{ email: to }], subject, textContent }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("send-email: Brevo rejected the message", res.status, text);
      return { statusCode: 502, body: JSON.stringify({ error: "Email provider rejected the message" }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("send-email: request to Brevo failed", e);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to send email" }) };
  }
};
