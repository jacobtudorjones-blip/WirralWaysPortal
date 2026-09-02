// Shared "where is this person right now" logic across all four
// attendance tables — used so signing in somewhere new (an office site,
// WFH, outreach, or working elsewhere) automatically closes out wherever
// they were before, instead of leaving them appearing signed in two
// places at once (e.g. Price Street AND Market Street simultaneously).
//
// Only works for a matched user_id — someone who typed a free-text name
// instead of picking themselves from the NamePicker can't be linked
// across tables, so nothing gets auto-closed for them. That's an
// accepted limitation, not a bug: there's no reliable way to know "this
// free-text name" is the same person as an earlier free-text entry.
import { listRows, updateRow } from "../../lib/staffApi.js";

const OPEN_TABLES = [
  { table: "staff_sign_ins", timeCol: "sign_out_time" },
  { table: "staff_wfh", timeCol: "returned_time" },
  { table: "staff_elsewhere", timeCol: "returned_time" },
  { table: "staff_outreach", timeCol: "returned_time" },
];

// Finds this user's open record (if any) across all four tables and
// closes it. Always call this BEFORE inserting the new record — it
// checks every table unconditionally (including the one you're about to
// insert into), which is correct precisely because the new row doesn't
// exist yet when this runs, so there's nothing for it to wrongly close.
// (An earlier version tried to skip the destination table to be "safe" —
// that was actually wrong: switching between two office sites both use
// staff_sign_ins, so skipping it meant the old site's record never got
// found. Don't reintroduce that.) Returns the closed record's
// {table, id}, or null if nothing was open.
async function closeAnyOpenRecordForUser(userId) {
  if (!userId) return null;
  for (const { table, timeCol } of OPEN_TABLES) {
    const rows = await listRows(table, "?select=id&user_id=eq." + userId + "&" + timeCol + "=is.null&limit=1");
    if (rows[0]) {
      await updateRow(table, rows[0].id, { [timeCol]: new Date().toISOString() });
      return { table, id: rows[0].id };
    }
  }
  return null;
}

export { closeAnyOpenRecordForUser };
