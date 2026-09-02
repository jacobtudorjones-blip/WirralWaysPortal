// Wraps a plain-text email body (the same string sent as textContent, so
// text-only mail clients still get something sensible) in a simple styled
// HTML shell, plus optional clickable buttons — e.g. "Cancel this booking".
// Deliberately minimal: no external images/fonts (Brevo strips a lot of
// exotic CSS anyway), just enough to make links easy to tap on a phone
// instead of a bare URL someone has to select and copy.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// buttons: [{ label, url, color }] — color defaults to Wirral Ways purple.
function buildHtmlEmail(bodyText, buttons = []) {
  const paragraphs = bodyText
    .split("\n\n")
    .map(p => '<p style="margin:0 0 14px;white-space:pre-line;line-height:1.5;">' + escapeHtml(p) + "</p>")
    .join("");
  const buttonsHtml = buttons
    .map(b => '<a href="' + b.url + '" style="display:inline-block;margin:6px 10px 0 0;padding:11px 20px;background:' + (b.color || "#5C2D91") + ';color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;font-family:system-ui,sans-serif;">' + escapeHtml(b.label) + "</a>")
    .join("");
  return (
    '<!doctype html><html><body style="margin:0;padding:24px 16px;background:#faf8fc;font-family:system-ui,sans-serif;color:#1f2937;">' +
    '<div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 26px;">' +
    paragraphs +
    (buttons.length ? '<div style="margin-top:8px;">' + buttonsHtml + "</div>" : "") +
    "</div></body></html>"
  );
}

export { buildHtmlEmail };
