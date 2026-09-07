// Consistent page container + heading for Car Booking pages — same shape
// as staff/components/PageWrap.jsx, kept as its own copy rather than a
// cross-module import so Car Booking has its own self-contained
// pages/components/lib layout, matching the convention Staff Portal set
// (see CLAUDE.md). Only real difference: defaults backTo to /car.
import { Link } from "react-router-dom";
import { CGL } from "../../data/car.js";

function PageWrap({ title, subtitle, backTo = "/car", maxWidth = 640, children }) {
  return (
    <div style={{ flex: 1, padding: "22px 20px", maxWidth, width: "100%", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <Link to={backTo} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "7px 14px", fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Back</Link>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 800, color: CGL.blackcurrant, margin: 0 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default PageWrap;
