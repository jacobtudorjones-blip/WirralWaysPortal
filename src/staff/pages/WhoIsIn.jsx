// Live "who's in" view for roll call / emergency evacuation and for
// general "is X in today" lookups. Groups everyone currently signed in,
// working from home, working elsewhere, or on outreach.
import { useEffect, useState, useCallback } from "react";
import { CGL } from "../../data/rooms.js";
import { OFFICE_SITES } from "../../data/staff.js";
import { listRows } from "../../lib/staffApi.js";
import { formatClock, formatElapsed, initials } from "../lib/format.js";
import EmailGate from "../components/EmailGate.jsx";
import PageWrap from "../components/PageWrap.jsx";

function isOverdue(entry) {
  if (entry.returned_time || !entry.expected_return) return false;
  const [h, m] = entry.expected_return.split(":").map(Number);
  const expected = new Date(entry.start_time);
  expected.setHours(h, m, 0, 0);
  if (expected < new Date(entry.start_time)) expected.setDate(expected.getDate() + 1);
  return Date.now() > expected.getTime();
}

function useLiveData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [signIns, wfh, elsewhere, outreach] = await Promise.all([
        listRows("staff_sign_ins", "?select=*&sign_out_time=is.null&order=sign_in_time.asc"),
        listRows("staff_wfh", "?select=*&returned_time=is.null&order=start_time.asc"),
        listRows("staff_elsewhere", "?select=*&returned_time=is.null&order=start_time.asc"),
        listRows("staff_outreach", "?select=*&returned_time=is.null&order=start_time.asc"),
      ]);
      setData({ signIns, wfh, elsewhere, outreach });
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  return { data, error, reload: load };
}

function PersonRow({ name, meta, overdue }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid #f3f4f6" }}>
      <span style={{
        width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 800, flexShrink: 0, background: overdue ? "#fee2e2" : "#f0e8f9", color: overdue ? "#c0392b" : CGL.blackcurrant,
      }}>{initials(name)}</span>
      <span style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{name}</div>
        <div style={{ fontSize: 11, color: overdue ? "#c0392b" : "#6b7280", fontWeight: overdue ? 700 : 400 }}>{overdue ? "⚠ Overdue — " : ""}{meta}</div>
      </span>
    </div>
  );
}

function WhoIsIn() {
  return (
    <EmailGate
      storageKey="ww_staff_who_email"
      allow={() => true}
      title="Who's in"
      subtitle="Enter your work email to view live sign-in status."
    >
      {() => <WhoIsInBody />}
    </EmailGate>
  );
}

function WhoIsInBody() {
  const { data, error, reload } = useLiveData();
  const totalIn = data ? data.signIns.length + data.wfh.length + data.elsewhere.length + data.outreach.length : null;

  return (
    <PageWrap title="Who's in" subtitle="Live view — refreshes automatically every 30 seconds." maxWidth={880}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{totalIn !== null ? totalIn + " people currently signed in" : "Loading…"}</div>
        <button onClick={reload} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
          {OFFICE_SITES.map(site => {
            const people = data.signIns.filter(s => s.site_id === site.id);
            return (
              <div key={site.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 12px", background: "#faf8fc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 13, color: site.color }}>{site.label}</strong>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>{people.length}</span>
                </div>
                {people.length === 0
                  ? <div style={{ padding: 14, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Nobody signed in</div>
                  : people.map(p => <PersonRow key={p.id} name={p.name} meta={"in since " + formatClock(p.sign_in_time) + " (" + formatElapsed(p.sign_in_time) + ")"} />)}
              </div>
            );
          })}

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#faf8fc", display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13, color: CGL.ocean }}>Working from home</strong><span style={{ fontSize: 12, color: "#6b7280" }}>{data.wfh.length}</span>
            </div>
            {data.wfh.length === 0
              ? <div style={{ padding: 14, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Nobody</div>
              : data.wfh.map(p => <PersonRow key={p.id} name={p.name} meta={"since " + formatClock(p.start_time)} />)}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#faf8fc", display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13, color: CGL.saffron }}>Working elsewhere</strong><span style={{ fontSize: 12, color: "#6b7280" }}>{data.elsewhere.length}</span>
            </div>
            {data.elsewhere.length === 0
              ? <div style={{ padding: 14, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Nobody</div>
              : data.elsewhere.map(p => <PersonRow key={p.id} name={p.name} meta={(p.location ? p.location + " · " : "") + "since " + formatClock(p.start_time)} />)}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 12px", background: "#faf8fc", display: "flex", justifyContent: "space-between" }}>
              <strong style={{ fontSize: 13, color: CGL.raspberry }}>On outreach</strong><span style={{ fontSize: 12, color: "#6b7280" }}>{data.outreach.length}</span>
            </div>
            {data.outreach.length === 0
              ? <div style={{ padding: 14, fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>Nobody</div>
              : data.outreach.map(p => (
                <PersonRow
                  key={p.id}
                  name={p.name}
                  overdue={isOverdue(p)}
                  meta={(p.location ? p.location + " · " : "") + "left " + formatClock(p.start_time) + (p.expected_return ? " · back by " + p.expected_return : "")}
                />
              ))}
          </div>
        </div>
      )}
    </PageWrap>
  );
}

export default WhoIsIn;
