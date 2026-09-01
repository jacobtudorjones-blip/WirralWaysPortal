// Breadcrumb trail derived from the current URL — reinforces where a page
// sits in the /staff/* structure (most useful for nested ones, e.g.
// Staff Portal / Admin / Manage users).
import { Link, useLocation } from "react-router-dom";

const LABELS = {
  staff: "Staff Portal",
  "sign-in": "Sign in",
  "sign-out": "Sign out",
  wfh: "Working from home",
  elsewhere: "Working elsewhere",
  outreach: "Outreach",
  who: "Who's in",
  admin: "Admin",
  users: "Manage users",
  privacy: "Privacy notice",
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean); // e.g. ["staff","admin","users"]
  if (segments.length <= 1) return null; // just "/staff" — Home has no trail

  let acc = "";
  const crumbs = segments.map((seg, i) => {
    acc += "/" + seg;
    return { to: acc, label: LABELS[seg] || seg, last: i === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb" style={{ maxWidth: 920, width: "100%", margin: "0 auto", padding: "10px 20px 0", fontSize: 12, color: "#9ca3af" }}>
      {crumbs.map((c, i) => (
        <span key={c.to}>
          {i > 0 && " / "}
          {c.last ? <span style={{ color: "#6b7280", fontWeight: 700 }}>{c.label}</span> : <Link to={c.to} style={{ color: "#9ca3af" }}>{c.label}</Link>}
        </span>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
