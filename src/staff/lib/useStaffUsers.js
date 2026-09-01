// Loads and caches the staff directory (staff_users table) for the portal.
// Used by the name pickers on every sign-in/out screen and by the User
// Management admin page.
import { useState, useEffect, useCallback } from "react";
import { listRows, insertRow, updateRow, deleteRow } from "../../lib/staffApi.js";

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

  const activeUsers = users.filter(u => u.active !== false);
  const managerName = id => {
    const m = users.find(u => u.id === id);
    return m ? m.name : "";
  };

  return { users, activeUsers, loading, error, refresh, addUser, editUser, removeUser, managerName };
}

export { useStaffUsers };
