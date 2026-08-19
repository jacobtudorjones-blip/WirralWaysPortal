// Waitlist: lets a user register interest in a room/date/time that is
// already booked, and notifies everyone waiting once it frees up.
import { loadKey, saveKey } from "./storage.js";
import { ROOMS } from "../data/rooms.js";
import { sendEmail } from "./email.js";

async function loadWaitlist() { return await loadKey("ww_waitlist_v1") || []; }
async function saveWaitlist(wl) { await saveKey("ww_waitlist_v1", wl); }
async function addToWaitlist(roomId, date, startTime, endTime, email, name) {
  const wl = await loadWaitlist();
  const already = wl.some(w=>w.roomId===roomId&&w.date===date&&w.startTime===startTime&&w.email===email);
  if(already) return false;
  wl.push({id:Math.random().toString(36).slice(2,10), roomId, date, startTime, endTime, email, name, addedAt:new Date().toISOString()});
  await saveWaitlist(wl);
  return true;
}
async function notifyWaitlist(roomId, date, startTime, endTime, title) {
  const wl = await loadWaitlist();
  const matches = wl.filter(w=>w.roomId===roomId&&w.date===date&&w.startTime===startTime);
  if(!matches.length) return;
  const room = ROOMS[roomId];
  for(const w of matches) {
    await sendEmail(
      w.email,
      "Room now available — "+(room.name)+", "+(new Date(date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})),
      "Hi "+(w.name.split(" ")[0])+",\n\nA room you were waiting for has just become available.\n\nRoom: "+(room.name)+" ("+(room.site)+")\nDate: "+(new Date(date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))+"\nTime: "+(startTime)+"–"+(endTime)+"\n\nLog in to rooms.wirralways.org.uk to request it now — it's first come, first served.\n\nWirral Ways Room Booking"
    );
  }
  // Remove notified entries
  await saveWaitlist(wl.filter(w=>!(w.roomId===roomId&&w.date===date&&w.startTime===startTime)));
}

export { loadWaitlist, saveWaitlist, addToWaitlist, notifyWaitlist };
