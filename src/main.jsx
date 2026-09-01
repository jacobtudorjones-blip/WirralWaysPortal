import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing.jsx";

// Lazy-loaded as separate chunks: visiting one section never downloads
// another's code — they don't share screen time, so there's no reason to
// ship them all in one bundle on first load. Landing itself is tiny and is
// the first thing anyone sees, so it's a normal (non-lazy) import.
const App = lazy(() => import("./App.jsx"));
const StaffApp = lazy(() => import("./staff/StaffApp.jsx"));

function LoadingFallback() {
  return <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontFamily: "system-ui,sans-serif" }}>Loading…</div>;
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "system-ui,sans-serif", color: "#374151" }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Page not found.</div>
      <Link to="/" style={{ color: "#5C2D91", fontWeight: 700 }}>← Back to the portal</Link>
    </div>
  );
}

// Note: deliberately not wrapped in <React.StrictMode> — several effects in
// this app trigger real network side-effects (Supabase writes, Brevo emails),
// and StrictMode's dev-only double-invoke would double-fire them locally.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Portal hub — pick a section, more to come here later. */}
        <Route path="/" element={<Landing />} />
        {/* Staff sign-in/out portal — its own multi-page section, own router. */}
        <Route path="/staff/*" element={<StaffApp />} />
        {/* Room Booking: /rooms (browse) and /rooms/:slug (a specific room). */}
        <Route path="/rooms/*" element={<App />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
