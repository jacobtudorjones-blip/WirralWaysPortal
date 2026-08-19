// Parse a display name from a CGL work email address.
// firstname.lastname@cgl.org.uk  (numbers at end of local part are stripped)
// e.g. jacob.jones2@cgl.org.uk  →  Jacob Jones
function nameFromEmail(email) {
  try {
    const local = email.trim().toLowerCase().split("@")[0]; // e.g. "jacob.jones2"
    const stripped = local.replace(/\d+$/, "");             // remove trailing digits → "jacob.jones"
    return stripped
      .split(".")
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  } catch {
    return "";
  }
}

export { nameFromEmail };
