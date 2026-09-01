import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import StaffApp from "./staff/StaffApp.jsx";

// Note: deliberately not wrapped in <React.StrictMode> — several effects in
// this app trigger real network side-effects (Supabase writes, Brevo emails),
// and StrictMode's dev-only double-invoke would double-fire them locally.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      {/* Staff sign-in/out portal — its own multi-page section, own router. */}
      <Route path="/staff/*" element={<StaffApp />} />
      {/* Room Booking app keeps its existing single-mount, tab-based nav. */}
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
