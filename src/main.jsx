import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy-loaded as separate chunks: visiting "/" never downloads the Staff
// Portal's code and vice versa — the two apps don't share screen time, so
// there's no reason to ship both in one bundle on first load.
const App = lazy(() => import("./App.jsx"));
const StaffApp = lazy(() => import("./staff/StaffApp.jsx"));

function LoadingFallback() {
  return <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontFamily: "system-ui,sans-serif" }}>Loading…</div>;
}

// Note: deliberately not wrapped in <React.StrictMode> — several effects in
// this app trigger real network side-effects (Supabase writes, Brevo emails),
// and StrictMode's dev-only double-invoke would double-fire them locally.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Staff sign-in/out portal — its own multi-page section, own router. */}
        <Route path="/staff/*" element={<StaffApp />} />
        {/* Room Booking app keeps its existing single-mount, tab-based nav. */}
        <Route path="/*" element={<App />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);
