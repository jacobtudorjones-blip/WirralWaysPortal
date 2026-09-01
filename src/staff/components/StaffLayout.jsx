// Shared header/nav for every staff-portal page, with an <Outlet/> for the
// current page. This is what makes it "feel like a website" — real URLs
// (/staff/sign-in, /staff/who, /staff/admin/users, …) with a persistent
// nav bar, instead of one HTML file toggling <div> "screens" with JS.
import { NavLink, Outlet, Link } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import LiveClock from "../../components/LiveClock.jsx";
import Breadcrumbs from "./Breadcrumbs.jsx";

const NAV_LINKS = [
  { to: "/staff", label: "Home", end: true },
  { to: "/staff/sign-in", label: "Sign in" },
  { to: "/staff/sign-out", label: "Sign out" },
  { to: "/staff/who", label: "Who's in" },
  { to: "/staff/admin", label: "Admin" },
];

function navStyle({ isActive }) {
  return {
    padding: "7px 13px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    textDecoration: "none",
    color: isActive ? CGL.blackcurrant : "#fff",
    background: isActive ? "#fff" : "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    whiteSpace: "nowrap",
  };
}

function StaffLayout() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#faf8fc", fontFamily: "'Nunito',system-ui,sans-serif" }}>
      <header style={{ background: CGL.blackcurrant, padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Wirral Ways <span style={{ fontWeight: 400, opacity: 0.85 }}>· Staff Portal</span></div>
          <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} end={l.end} style={navStyle}>{l.label}</NavLink>
            ))}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LiveClock />
          <a href="/" style={{ fontSize: 12, color: "#fff", opacity: 0.7 }}>🏠 Portal</a>
          <a href="/rooms" style={{ fontSize: 12, color: "#fff", opacity: 0.85 }}>Room Booking →</a>
        </div>
      </header>
      <Breadcrumbs />
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </main>
      <footer style={{ textAlign: "center", padding: "14px 20px", fontSize: 11, color: "#9ca3af" }}>
        <Link to="/staff/privacy" style={{ color: "#9ca3af" }}>Privacy notice</Link>
      </footer>
    </div>
  );
}

export default StaffLayout;
