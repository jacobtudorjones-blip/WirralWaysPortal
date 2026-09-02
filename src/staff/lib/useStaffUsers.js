// Loads and caches the staff directory (staff_users table) for the portal.
// Used by the name pickers on every sign-in/out screen and by the User
// Management admin page.
import { useState, useEffect, useCallback } from "react";
import { listRows, insertRow, insertRows, updateRow, deleteRow } from "../../lib/staffApi.js";

function useStaffUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listRows("staff_users", "?select=*&order=name.asc");
      setUsers(rows);
      setError(null);
    } catch (e) {
      console.error("useStaffUsers refresh error", e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function addUser(user) {
    const created = await insertRow("staff_users", user);
    await refresh();
    return created;
  }
  async function editUser(id, patch) {
    const updated = await updateRow("staff_users", id, patch);
    await refresh();
    return updated;
  }
  async function removeUser(id) {
    await deleteRow("staff_users", id);
    await refresh();
  }
  // Mass-add: adds genuinely NEW people only. Never touches someone
  // already in the directory — an earlier version upserted by email
  // (onConflict: "email", merge-duplicates), so re-pasting a list that
  // happened to include an existing person's email (e.g. themselves,
  // without explicitly writing their real role) silently overwrote their
  // role/site/manager with whatever — or whatever default — was on that
  // line. That's how an admin got locked out of their own account. Don't
  // reintroduce an upsert here; existing rows are skipped, full stop —
  // edit them individually (editUser) if something about them needs to
  // change.
  //
  // rows: [{ name, email, role, active, managerRef? }] — managerRef (an
  // email, or a name unique in the directory) is resolved to a real
  // manager_id in a second pass, after the insert, against the full
  // directory as it now stands — so a manager listed earlier in the same
  // paste resolves correctly even though they didn't have an id yet when
  // this batch was typed.
  async function bulkAddUsers(rows) {
    const existing = await listRows("staff_users", "?select=id,name,email");
    const existingEmails = new Set(existing.map(u => u.email.toLowerCase()));
    const newRows = rows.filter(r => !existingEmails.has(r.email.toLowerCase()));
    const skipped = rows.filter(r => existingEmails.has(r.email.toLowerCase()));

    if (newRows.length === 0) {
      return { created: [], skipped };
    }

    const toInsert = newRows.map(({ managerRef, ...r }) => r);
    const created = await insertRows("staff_users", toInsert);
    const createdByEmail = new Map(created.map(u => [u.email.toLowerCase(), u]));

    const needsManager = newRows.filter(r => r.managerRef && createdByEmail.has(r.email.toLowerCase()));
    if (needsManager.length > 0) {
      const all = [...existing, ...created];
      const idByEmail = new Map(all.map(u => [u.email.toLowerCase(), u.id]));
      const idsByName = new Map();
      for (const u of all) {
        const key = u.name.toLowerCase();
        idsByName.set(key, (idsByName.get(key) || []).concat(u.id));
      }
      const updates = [];
      for (const r of needsManager) {
        const self = createdByEmail.get(r.email.toLowerCase());
        const ref = r.managerRef.trim().toLowerCase();
        const managerId = ref.includes("@")
          ? idByEmail.get(ref) || null
          : (idsByName.get(ref) || []).length === 1 ? idsByName.get(ref)[0] : null;
        if (managerId && managerId !== self.id) updates.push(updateRow("staff_users", self.id, { manager_id: managerId }));
      }
      await Promise.all(updates);
    }

    await refresh();
    return { created, skipped };
  }

  const activeUsers = users.filter(u => u.active !== false);
  const managerName = id => {
    const m = users.find(u => u.id === id);
    return m ? m.name : "";
  };

  return { users, activeUsers, loading, error, refresh, addUser, editUser, removeUser, bulkAddUsers, managerName };
}

export { useStaffUsers };
