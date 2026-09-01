import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES } from "../../data/staff.js";
import { listRows } from "../../lib/staffApi.js";

const TILES = [
  { to: "/staff/sign-in", label: "Sign in", sub: "Arriving at a site", icon: "✅", color: CGL.blackcurrant, light: "#f0e8f9" },
  { to: "/staff/sign-out", label: "Sign out", sub: "Leaving a site", icon: "🚪", color: CGL.neon, light: "#fde8f2" },
  { to: "/staff/who", label: "Who's in", sub: "Roll call / live view", icon: "📋", color: CGL.ocean, light: "#e4f0f8" },
  { to: "/staff/admin", label: "Admin", sub: "Dashboard & users", icon: "⚙️", color: CGL.saffron, light: "#fff3e0" },
];
const SECONDARY = [
  { to: "/staff/wfh", label: "Working from home", icon: "🏠" },
  { to: "/staff/outreach", label: "Record outreach", icon: "🗺️" },
  { to: "/staff/elsewhere", label: "Working elsewhere", icon: "📍" },
];

function useLiveCounts() {
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [signIns, wfh, elsewhere, outreach] = await Promise.all([
          listRows("staff_sign_ins", "?select=site_id&sign_out_time=is.null"),
          listRows("staff_wfh", "?select=id&returned_time=is.null"),
          listRows("staff_elsewhere", "?select=id&returned_time=is.null"),
          listRows("staff_outreach", "?select=id&returned_time=is.null"),
        ]);
        if (cancelled) return;
        const perSite = {};
        signIns.forEach(r => { perSite[r.site_id] = (perSite[r.site_id] || 0) + 1; });
        setCounts({ perSite, wfh: wfh.length, elsewhere: elsewhere.length, outreach: outreach.length });
      } catch (e) {
        console.error("Home live counts error", e);
        if (!cancelled) setCounts({ perSite: {}, wfh: 0, elsewhere: 0, outreach: 0, error: true });
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return counts;
}

function Home() {
  const counts = useLiveCounts();
  const totalIn = counts ? Object.values(counts.perSite).reduce((a, b) => a + b, 0) + counts.wfh + counts.elsewhere + counts.outreach : null;

  return (
    <div style={{ flex: 1, padding: "26px 20px", maxWidth: 880, width: "100%", margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: CGL.blackcurrant, margin: "0 0 4px" }}>Good {greeting()}</h1>
      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 22px" }}>
        Sign in and out for health &amp; safety, and manage the staff directory.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 22 }}>
        {TILES.map(t => (
          <Link key={t.to} to={t.to} style={{
            background: "#fff", border: "2px solid #e5e7eb", borderRadius: 16, padding: "22px 16px",
            textAlign: "center", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: t.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{t.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: t.color }}>{t.label}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{t.sub}</div>
          </Link>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 }}>
        {SECONDARY.map(s => (
          <Link key={s.to} to={s.to} style={{
            background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#1a1a1a", fontSize: 13, fontWeight: 700,
          }}>
            <span>{s.icon}</span>{s.label}
          </Link>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 12 }}>
          Right now {totalIn !== null && <span style={{ color: CGL.blackcurrant }}>· {totalIn} signed in</span>}
        </div>
        {!counts ? (
          <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>Loading…</div>
        ) : counts.error ? (
          <div style={{ color: CGL.neon, fontSize: 13 }}>Couldn't reach Supabase — check VITE_SUPABASE_URL/ANON_KEY and that the staff_* tables exist (see supabase/staff-portal-schema.sql).</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {OFFICE_SITES.map(s => (
              <div key={s.id} style={{ background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
                <strong style={{ color: s.color }}>{counts.perSite[s.id] || 0}</strong> {s.label}
              </div>
            ))}
            <div style={{ background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
              <strong>{counts.wfh}</strong> WFH
            </div>
            <div style={{ background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
              <strong>{counts.elsewhere}</strong> Elsewhere
            </div>
            <div style={{ background: "#faf8fc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", fontSize: 12 }}>
              <strong>{counts.outreach}</strong> On outreach
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}

export default Home;
