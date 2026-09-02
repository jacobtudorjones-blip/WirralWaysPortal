// Who can edit whose leave / non-working-days profile:
//   - everyone can edit their own
//   - a manager can edit their direct reports (targetUser.manager_id === currentUser.id)
//   - an admin can edit anyone
//
// Same caveat as everywhere else in this app (see README's security
// notes): this is a client-side UI check, not real authorization — RLS on
// staff_leave/staff_users allows anon read/write, so it's not enforced
// server-side. It stops the UI from offering edit controls it shouldn't,
// not a determined person calling the API directly.
function canEditPerson(currentUser, targetUser) {
  if (!currentUser || !targetUser) return false;
  if (currentUser.id === targetUser.id) return true;
  if (currentUser.role === "admin") return true;
  if (currentUser.role === "manager" && targetUser.manager_id === currentUser.id) return true;
  return false;
}

export { canEditPerson };
