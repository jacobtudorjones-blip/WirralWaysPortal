// Car Booking — top-level shell. Same shape as Room Booking's App.jsx at
// the outermost level (identity gate in front of everything, since every
// page needs to know who's booking) but far smaller: one vehicle, no
// sites/rooms/floor-plans, so no need for App.jsx's tab-state machine —
// real routes (/car, /car/book, /car/mine, /car/approvals) do that job.
import { useEffect, useState } from "react";
import { NavLink, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { CGL, VEHICLE } from "../data/car.js";
import LiveClock from "../components/LiveClock.jsx";
import CarIdentityScreen from "./components/CarIdentityScreen.jsx";
import CarHome from "./pages/CarHome.jsx";
import BookCar from "./pages/BookCar.jsx";
import MyCarBookings from "./pages/MyCarBookings.jsx";
import CarApprovals from "./pages/CarApprovals.jsx";

function navStyle({ isActive }) {
  return {
    padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none",
    color: isActive ? CGL.blackcurrant : "#fff",
    background: isActive ? "#fff" : "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)", whiteSpace: "nowrap",
  };
}

function CarApp() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Email buttons ("Cancel this booking" -> /car?tab=mybookings, "Review
  // this request" -> /car?tab=approvals — see lib/carEmail.js) land on
  // plain /car with a query param rather than the real route directly,
  // same reasoning as Room Booking's ?tab= handling: the link has to work
  // whether or not the person's already identified in this tab, so it
  // resolves to a real route only once identity's established.
  useEffect(() => {
    if (!user || location.pathname !== "/car") return;
    const tab = new URLSearchParams(location.search).get("tab");
    if (tab === "mybookings") navigate("/car/mine", { replace: true });
    else if (tab === "approvals" && user.isApprover) navigate("/car/approvals", { replace: true });
  }, [user, location, navigate]);

  if (!user) return <CarIdentityScreen onIdentify={setUser} />;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#faf8fc", fontFamily: "'Nunito',system-ui,sans-serif" }}>
      <header style={{ background: CGL.blackcurrant, padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>Wirral Ways <span style={{ fontWeight: 400, opacity: 0.85 }}>· Car Booking</span></div>
          <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <NavLink to="/car" end style={navStyle}>Home</NavLink>
            <NavLink to="/car/book" style={navStyle}>Book</NavLink>
            <NavLink to="/car/mine" style={navStyle}>My bookings</NavLink>
            {user.isApprover && <NavLink to="/car/approvals" style={navStyle}>Approvals</NavLink>}
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <LiveClock />
          <span style={{ fontSize: 12, color: "#fff", opacity: 0.85 }}>{user.name}</span>
          <button onClick={() => setUser(null)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, padding: "5px 11px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Sign out</button>
          <a href="/" style={{ fontSize: 12, color: "#fff", opacity: 0.7 }}>🏠 Portal</a>
        </div>
      </header>
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route index element={<CarHome />} />
          <Route path="book" element={<BookCar user={user} />} />
          <Route path="mine" element={<MyCarBookings user={user} />} />
          {user.isApprover && <Route path="approvals" element={<CarApprovals user={user} />} />}
          <Route path="*" element={<div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#6b7280" }}>Page not found.</div>} />
        </Routes>
      </main>
      <footer style={{ textAlign: "center", padding: "14px 20px", fontSize: 11, color: "#9ca3af" }}>
        {VEHICLE.notes ? VEHICLE.notes + " · " : ""}
        <a href="/staff/privacy" style={{ color: "#9ca3af" }}>Privacy notice</a>
      </footer>
    </div>
  );
}

export default CarApp;
