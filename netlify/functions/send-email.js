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
// sender, a bounded number of recipients (comma-separated — used for
// notifying the small APPROVERS list), a size-capped optional attachment
// (booking .ics files only, in practice), so at worst it's usable to send
// a normal-sized email as this account — not as an open relay for
// arbitrary bulk mail, a spoofed sender, or large file hosting.

const BREVO_KEY = process.env.BREVO_API_KEY;
const FROM = { name: "Wirral Ways Portal", email: "noreply@wirralways.org.uk" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 25;
const MAX_ATTACHMENT_B64 = 100000; // ~75KB decoded — generous for a booking .ics, nowhere near "file hosting"

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

  const { to, subject, textContent, attachment } = payload;

  // `to` is usually a single address, but the room-booking approver
  // notification sends to the whole (short) APPROVERS list as one
  // comma-separated string — split and validate each address.
  if (typeof to !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "to is required" }) };
  }
  const recipients = to.split(",").map(s => s.trim()).filter(Boolean);
  if (recipients.length === 0 || recipients.length > MAX_RECIPIENTS || !recipients.every(r => EMAIL_RE.test(r))) {
    return { statusCode: 400, body: JSON.stringify({ error: "to must be 1–" + MAX_RECIPIENTS + " valid, comma-separated email addresses" }) };
  }

  if (typeof subject !== "string" || !subject.trim() || subject.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ error: "subject is required (max 200 chars)" }) };
  }
  if (typeof textContent !== "string" || !textContent.trim() || textContent.length > 20000) {
    return { statusCode: 400, body: JSON.stringify({ error: "textContent is required (max 20000 chars)" }) };
  }

  let attachments;
  if (attachment != null) {
    const { name, content } = attachment;
    if (typeof name !== "string" || !/^[A-Za-z0-9._-]{1,100}$/.test(name)) {
      return { statusCode: 400, body: JSON.stringify({ error: "attachment.name must be a plain filename" }) };
    }
    if (typeof content !== "string" || !content || content.length > MAX_ATTACHMENT_B64) {
      return { statusCode: 400, body: JSON.stringify({ error: "attachment.content must be base64 (max " + MAX_ATTACHMENT_B64 + " chars)" }) };
    }
    attachments = [{ name, content }];
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: FROM,
        to: recipients.map(email => ({ email })),
        subject,
        textContent,
        ...(attachments ? { attachment: attachments } : {}),
      }),
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
