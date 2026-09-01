import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { listRows } from "../../lib/staffApi.js";
import { formatClock } from "../lib/format.js";
import EmailGate from "../components/EmailGate.jsx";
import PageWrap from "../components/PageWrap.jsx";

function todayIsoStart() {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value ?? "…"}</div>
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <EmailGate
      storageKey="ww_staff_admin_email"
      allow={u => u.role === "admin" || u.role === "manager"}
      title="Admin sign in"
      subtitle="Your email must be registered as an admin or manager in the staff directory."
    >
      {user => <DashboardBody currentUser={user} />}
    </EmailGate>
  );
}

function DashboardBody({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [log, setLog] = useState(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const since = todayIsoStart();
        const [openSignIns, openWfh, openEl, openOr, todayLog] = await Promise.all([
          listRows("staff_sign_ins", "?select=id&sign_out_time=is.null"),
          listRows("staff_wfh", "?select=id&returned_time=is.null"),
          listRows("staff_elsewhere", "?select=id&returned_time=is.null"),
          listRows("staff_outreach", "?select=id&returned_time=is.null"),
          listRows("staff_sign_ins", "?select=*&sign_in_time=gte." + encodeURIComponent(since) + "&order=sign_in_time.desc"),
        ]);
        setStats({ in: openSignIns.length, wfh: openWfh.length, elsewhere: openEl.length, outreach: openOr.length });
        setLog(todayLog);
      } catch (e) {
        setError(e.message || String(e));
      }
    }
    load();
  }, []);

  const filteredLog = (log || []).filter(r => !filter.trim() || r.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <PageWrap title="Admin dashboard" subtitle={"Signed in as " + currentUser.name + " (" + currentUser.role + ")"} maxWidth={920}>
      <div style={{ marginBottom: 18 }}>
        <Link to="/staff/admin/users" style={{ background: CGL.blackcurrant, color: "#fff", borderRadius: 10, padding: "9px 16px", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
          👥 Manage users
        </Link>
      </div>

      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 24 }}>
        <StatCard label="Signed in" value={stats?.in} color={CGL.blackcurrant} />
        <StatCard label="WFH" value={stats?.wfh} color={CGL.ocean} />
        <StatCard label="Elsewhere" value={stats?.elsewhere} color={CGL.saffron} />
        <StatCard label="On outreach" value={stats?.outreach} color={CGL.raspberry} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 10 }}>Today's sign-in log</div>
      <input
        placeholder="Filter by name…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, marginBottom: 12, width: 220 }}
      />
      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#faf8fc" }}>
              {["Name", "Site", "Type", "In", "Out"].map(h => (
                <th key={h} style={{ padding: "8px 10px", color: CGL.blackcurrant, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!log ? (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#6b7280", fontStyle: "italic" }}>Loading…</td></tr>
            ) : filteredLog.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>No records</td></tr>
            ) : filteredLog.map(r => (
              <tr key={r.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "8px 10px", fontWeight: 700 }}>{r.name}</td>
                <td style={{ padding: "8px 10px" }}>{r.site_id}</td>
                <td style={{ padding: "8px 10px" }}>{r.person_type}</td>
                <td style={{ padding: "8px 10px" }}>{formatClock(r.sign_in_time)}</td>
                <td style={{ padding: "8px 10px" }}>{formatClock(r.sign_out_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrap>
  );
}

export default AdminDashboard;
