// Top-level "/" — a hub for the whole portal, not a direct entry into Room
// Booking. Picking a card takes you into that section's own app, which
// then owns its own identity/login and routing from there.
import { Link } from "react-router-dom";
import { CGL } from "../data/rooms.js";

const SECTIONS = [
  {
    to: "/rooms",
    icon: "🏢",
    title: "Room Booking",
    desc: "Browse and book meeting rooms across Wirral Ways sites.",
    color: CGL.blackcurrant,
    light: "#f0e8f9",
  },
  {
    to: "/staff",
    icon: "✅",
    title: "Staff Portal",
    desc: "Sign in/out, roll call, and the staff directory.",
    color: CGL.ocean,
    light: "#e4f0f8",
  },
];

function Landing() {
  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(135deg, " + CGL.blackcurrant + " 0%, #3d0f47 60%, #1a0820 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "'Nunito',system-ui,sans-serif",
    }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>Wirral Ways</div>
        <div style={{ color: CGL.orchid, fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>Portal</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, maxWidth: 520, width: "100%" }}>
        {SECTIONS.map(s => (
          <Link key={s.to} to={s.to} style={{
            background: "rgba(255,255,255,0.97)", borderRadius: 18, padding: "28px 22px", textDecoration: "none",
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10,
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)", transition: "transform 0.15s",
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: s.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{s.desc}</div>
          </Link>
        ))}
      </div>

      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 28, textAlign: "center" }}>
        More sections coming soon.
      </div>
    </div>
  );
}

export default Landing;
