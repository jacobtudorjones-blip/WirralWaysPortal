import { Routes, Route } from "react-router-dom";
import StaffLayout from "./components/StaffLayout.jsx";
import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignOut from "./pages/SignOut.jsx";
import Wfh from "./pages/Wfh.jsx";
import Elsewhere from "./pages/Elsewhere.jsx";
import Outreach from "./pages/Outreach.jsx";
import WhoIsIn from "./pages/WhoIsIn.jsx";
import Leave from "./pages/Leave.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";

function NotFound() {
  return <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, color: "#6b7280" }}>Page not found.</div>;
}

function StaffApp() {
  return (
    <Routes>
      <Route element={<StaffLayout />}>
        <Route index element={<Home />} />
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-out" element={<SignOut />} />
        <Route path="wfh" element={<Wfh />} />
        <Route path="elsewhere" element={<Elsewhere />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="who" element={<WhoIsIn />} />
        <Route path="leave" element={<Leave />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default StaffApp;
