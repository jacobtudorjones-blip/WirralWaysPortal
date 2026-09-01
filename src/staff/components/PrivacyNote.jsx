// Short inline privacy notice shown on every form that records personal
// data (name, location, timestamps) for health & safety / lone-working
// purposes — required under UK GDPR (data collected must be accompanied
// by a fair-processing notice at the point of collection), and present in
// the original app this was rebuilt from. Full detail lives at
// /staff/privacy, linked from here.
import { Link } from "react-router-dom";

function PrivacyNote() {
  return (
    <div style={{ fontSize: 11, color: "#6b7280", background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 13px", marginBottom: 16, lineHeight: 1.5 }}>
      We record your name, location and time for health & safety, fire safety and lone-working purposes.
      This is held securely by Change Grow Live and only accessible to authorised staff.{" "}
      <Link to="/staff/privacy" style={{ color: "#5C2D91", fontWeight: 700 }}>Full privacy notice →</Link>
    </div>
  );
}

export default PrivacyNote;
