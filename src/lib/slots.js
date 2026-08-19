// 30-minute slot helpers for the day schedule picker (08:00–19:00).
// 30-min slots from 08:00 to 19:00
const SLOTS = [];
for (let h = 8; h < 19; h++) {
  SLOTS.push((String(h).padStart(2,"0"))+":00");
  SLOTS.push((String(h).padStart(2,"0"))+":30");
}
SLOTS.push("19:00");

function slotToMins(t) {
  const [h,m] = t.split(":").map(Number);
  return h*60+m;
}
function minsToSlot(m) {
  return (String(Math.floor(m/60)).padStart(2,"0"))+":"+(m%60===0?"00":"30");
}

export { SLOTS, slotToMins, minsToSlot };
