// Loads car_bookings and exposes it plus refresh/CRUD helpers — shared by
// every Car Booking page rather than each one rolling its own fetch.
import { useCallback, useEffect, useState } from "react";
import { listRows, insertRow, insertRows, updateRow } from "../../lib/staffApi.js";

function useCarBookings() {
  const [bookings, setBookings] = useState(null); // null = still loading
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const rows = await listRows("car_bookings", "?select=*&order=date.asc,start_time.asc");
      setBookings(rows);
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { bookings, error, reload, insertRow, insertRows, updateRow };
}

export { useCarBookings };
