// One-off date-range leave (annual leave, sick, etc.) — see
// supabase/staff-portal-schema.sql's staff_leave table. Recurring
// non-working-days live directly on the staff_users row instead (see
// useStaffUsers.editUser, which already covers updating any column
// there, non_working_days included).
import { useState, useEffect, useCallback } from "react";
import { listRows, insertRow, deleteRow } from "../../lib/staffApi.js";
import { todayStr } from "../../lib/helpers.js";

function useLeave() {
  const [leave, setLeave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listRows("staff_leave", "?select=*&order=start_date.asc");
      setLeave(rows);
      setError(null);
    } catch (e) {
      console.error("useLeave refresh error", e);
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function addLeave({ userId, startDate, endDate, reason, recordedBy }) {
    const created = await insertRow("staff_leave", {
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      recorded_by: recordedBy || null,
    });
    await refresh();
    return created;
  }
  async function removeLeave(id) {
    await deleteRow("staff_leave", id);
    await refresh();
  }

  const leaveByUser = userId => leave.filter(l => l.user_id === userId);
  // ISO date strings compare correctly as plain strings (YYYY-MM-DD).
  const isOnLeaveToday = userId => {
    const today = todayStr();
    return leave.some(l => l.user_id === userId && l.start_date <= today && l.end_date >= today);
  };
  const onLeaveToday = () => {
    const today = todayStr();
    return leave.filter(l => l.start_date <= today && l.end_date >= today);
  };

  return { leave, loading, error, refresh, addLeave, removeLeave, leaveByUser, isOnLeaveToday, onLeaveToday };
}

export { useLeave };
