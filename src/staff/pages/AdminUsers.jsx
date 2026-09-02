// User Management — the core new feature: add staff, and record their
// manager (a self-referencing link into this same directory).
import { useState } from "react";
import { CGL } from "../../data/rooms.js";
import { useStaffUsers } from "../lib/useStaffUsers.js";
import EmailGate from "../components/EmailGate.jsx";
import UserFormModal from "../components/UserFormModal.jsx";
import BulkAddUsersModal from "../components/BulkAddUsersModal.jsx";
import PageWrap from "../components/PageWrap.jsx";

function AdminUsers() {
  return (
    <EmailGate
      storageKey="ww_staff_admin_email"
      allow={u => u.role === "admin"}
      title="Admin sign in"
      subtitle="Only accounts with the admin role can manage the staff directory."
    >
      {() => <UsersBody />}
    </EmailGate>
  );
}

function UsersBody() {
  const { users, loading, error, addUser, editUser, removeUser, bulkAddUsers, managerName } = useStaffUsers();
  const [modal, setModal] = useState(null); // "new" | user object | null
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  async function handleSave(fields) {
    if (modal === "new") await addUser({ ...fields, active: true });
    else await editUser(modal.id, fields);
    setModal(null);
  }
  async function handleBulkSave(rows) {
    return bulkAddUsers(rows); // { created, skipped } — modal shows the result and closes itself
  }

  const filtered = users.filter(u =>
    !search.trim() ||
    u.name.toLowerCase().includes(search.trim().toLowerCase()) ||
    u.email.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <PageWrap title="Manage users" subtitle="Add staff and record who their manager is." backTo="/staff/admin" maxWidth={920}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, width: 240 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setBulkOpen(true)} style={{ background: "#fff", color: CGL.blackcurrant, border: "1.5px solid " + CGL.blackcurrant, borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}>
            ⇈ Bulk add
          </button>
          <button onClick={() => setModal("new")} style={{ background: CGL.blackcurrant, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>
            + Add user
          </button>
        </div>
      </div>

      {error && <div style={{ color: CGL.neon, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#faf8fc" }}>
              {["Name", "Email", "Site", "Role", "Manager", "Status", ""].map(h => (
                <th key={h} style={{ padding: "9px 12px", color: CGL.blackcurrant, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 18, textAlign: "center", color: "#6b7280", fontStyle: "italic" }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 18, textAlign: "center", color: "#6b7280" }}>No users found</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} style={{ borderTop: "1px solid #f3f4f6", opacity: u.active === false ? 0.5 : 1 }}>
                <td style={{ padding: "9px 12px", fontWeight: 700 }}>{u.name}</td>
                <td style={{ padding: "9px 12px", color: "#6b7280" }}>{u.email}</td>
                <td style={{ padding: "9px 12px" }}>{u.site || "—"}</td>
                <td style={{ padding: "9px 12px", textTransform: "capitalize" }}>{u.role}</td>
                <td style={{ padding: "9px 12px" }}>{u.manager_id ? managerName(u.manager_id) : "—"}</td>
                <td style={{ padding: "9px 12px" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: u.active === false ? "#f3f4f6" : "#dcfce7", color: u.active === false ? "#6b7280" : "#16a34a",
                  }}>{u.active === false ? "Inactive" : "Active"}</span>
                </td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  <button onClick={() => setModal(u)} style={{ border: "none", background: "none", color: CGL.blackcurrant, fontWeight: 700, fontSize: 12, cursor: "pointer", marginRight: 10 }}>Edit</button>
                  <button onClick={() => editUser(u.id, { active: u.active === false })} style={{ border: "none", background: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", marginRight: 10 }}>
                    {u.active === false ? "Reactivate" : "Deactivate"}
                  </button>
                  <button onClick={() => setConfirmDelete(u)} style={{ border: "none", background: "none", color: CGL.neon, fontSize: 12, cursor: "pointer" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserFormModal
          users={users}
          editing={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {bulkOpen && (
        <BulkAddUsersModal users={users} onSave={handleBulkSave} onClose={() => setBulkOpen(false)} />
      )}

      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "26px 24px", maxWidth: 340, width: "100%", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 6px" }}>Delete {confirmDelete.name}?</h3>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 18 }}>
              This removes them from the directory permanently. Anyone who has them set as their manager will show "—" instead.
              Consider Deactivate instead if you just want to hide them from pickers.
            </p>
            <button
              onClick={async () => { await removeUser(confirmDelete.id); setConfirmDelete(null); }}
              style={{ width: "100%", background: CGL.neon, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}
            >Delete permanently</button>
            <button onClick={() => setConfirmDelete(null)} style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: 11, color: "#6b7280", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </PageWrap>
  );
}

export default AdminUsers;
