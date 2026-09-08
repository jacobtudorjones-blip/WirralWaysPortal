// Config for the Car Booking module — one shared vehicle, so (unlike
// Room Booking) there's no site/room list here, just the vehicle itself
// and who approves requests for it.
import { CGL, APPROVERS } from "./rooms.js";

// Edit this once you know the real details — shown on the booking screens
// and in confirmation emails. Nothing else in the module depends on the
// vehicle having exactly these fields; add more (colour, fuel type,
// parking spot) if useful, they just won't be displayed until you also
// add them somewhere in src/car/.
const VEHICLE = {
  name: "The Wirral Ways car",
  registration: "", // e.g. "AB12 CDE" — left blank until known, shown only if set
  notes: "", // e.g. "Keys held at Market Street reception" — shown only if set
};

// Who approves car booking requests. Defaults to the same allowlist as
// Room Booking (src/data/rooms.js's APPROVERS) — one fewer list to keep
// in sync, on the assumption the same people are fine approving both.
// If that's wrong, replace this with its own array in the same shape
// ({ email }) rather than importing APPROVERS.
const CAR_APPROVERS = APPROVERS;

// Who the "new car booking request" notification email goes to — same
// "narrower than the full approver list" pattern as Room Booking's
// REQUEST_NOTIFY_EMAILS (src/data/rooms.js). Edit this to whoever should
// actually see the "someone wants the car" email; defaults to the same
// two addresses Room Booking uses.
const CAR_REQUEST_NOTIFY_EMAILS = ["wirral.services@cgl.org.uk", "jacob.jones2@cgl.org.uk"];

// The car's own Exchange shared-calendar mailbox — same "going forward"
// calendar sync as Room Booking's ROOM_CALENDAR_EMAIL (src/data/rooms.js),
// see that constant's comment for the full reasoning. Used by
// car/lib/carEmail.js's syncCarCalendar().
const CAR_CALENDAR_EMAIL = "Q0084.CarLog@cgl.org.uk";

export { CGL, VEHICLE, CAR_APPROVERS, CAR_REQUEST_NOTIFY_EMAILS, CAR_CALENDAR_EMAIL };
