// Record your own leave and non-working days, plus (if you manage people,
// or are an admin) the same for whoever you're allowed to edit — see
// lib/permissions.js's canEditPerson. Visible read-only elsewhere too:
// WhoIsIn shows a plain "on leave today" list so any staff member can see
// it without needing edit access.
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import { useLeave } from "../lib/useLeave.js";
import { canEditPerson } from "../lib/permissions.js";
import EmailGate from "../components/EmailGate.jsx";
import PersonAvailabilityCard from "../components/PersonAvailabilityCard.jsx";
import PageWrap from "../components/PageWrap.jsx";

function Leave() {
  return (
    <EmailGate
      storageKey="ww_staff_general_email"
      allow={() => true}
      title="Leave & availability"
      subtitle="Enter your work email to record or view leave and non-working days."
    >
      {user => <LeaveBody currentUser={user} />}
    </EmailGate>
  );
}

function LeaveBody({ currentUser }) {
  const { users, editUser } = useStaffUsers();
  const { leave, error, addLeave, removeLeave, leaveByUser } = useLeave();
  const [search, setSearch] = useState("");

  const editable = users
    .filter(u => canEditPerson(currentUser, u))
    .filter(u => !search.trim() || u.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (a.id === currentUser.id ? -1 : b.id === currentUser.id ? 1 : a.name.localeCompare(b.name)));

  async function toggleDay(person, day) {
    const days = person.non_working_days || [];
    const next = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    await editUser(person.id, { non_working_days: next });
  }

  return (
    <PageWrap title="Leave & availability" subtitle="Record leave and non-working days." maxWidth={720}>
      {editable.length > 5 && (
        <input
          placeholder="Search name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, width: 220, marginBottom: 14 }}
        />
      )}

      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {editable.map(person => (
        <PersonAvailabilityCard
          key={person.id}
          person={person}
          isSelf={person.id === currentUser.id}
          canEdit={true}
          leaveRows={leaveByUser(person.id)}
          onToggleDay={day => toggleDay(person, day)}
          onAddLeave={({ startDate, endDate, reason }) => addLeave({ userId: person.id, startDate, endDate, reason, recordedBy: currentUser.id })}
          onRemoveLeave={id => removeLeave(id)}
        />
      ))}

      {editable.length === 0 && (
        <div style={{ color: "#6b7280", fontSize: 13, fontStyle: "italic" }}>Nothing to show.</div>
      )}
    </PageWrap>
  );
}

export default Leave;
