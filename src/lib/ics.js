// Builds an .ics calendar file for a confirmed booking — used both by the
// "Add to calendar" download button (BookingCard) and as an email
// attachment on booking-confirmed emails (see App.jsx's buildEmail/
// icsAttachment and netlify/functions/send-email.js).
import { ROOMS } from "../data/rooms.js";

function buildICS(booking) {
  const room = ROOMS[booking.roomId];
  const dtStart = booking.date.replace(/-/g,"") + "T" + booking.startTime.replace(":","") + "00";
  const dtEnd   = booking.date.replace(/-/g,"") + "T" + booking.endTime.replace(":","")   + "00";
  const uid     = (booking.id)+"@wirralways.org.uk";
  const notes   = booking.notes ? "\\nRequirements: "+(booking.notes) : "";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wirral Ways//Room Booking//EN",
    "BEGIN:VEVENT",
    "UID:"+(uid),
    "DTSTAMP:"+(new Date().toISOString().replace(/[-:]/g,"").slice(0,15))+"Z",
    "DTSTART:"+(dtStart),
    "DTEND:"+(dtEnd),
    "SUMMARY:"+(booking.title)+" — "+(room.name),
    "DESCRIPTION:Room: "+(room.name)+" ("+(room.site)+")\\nBooked by: "+(booking.bookedBy)+(notes),
    "LOCATION:"+(room.name)+"\\, "+(room.site)+"\\, Wirral Ways",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

// Triggers a browser download of the .ics file (the "📅 .ics" button on a booking card).
function generateICS(booking) {
  const ics = buildICS(booking);
  const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = (booking.title.replace(/[^a-z0-9]/gi,"_"))+"_"+(booking.date)+".ics";
  a.click();
  URL.revokeObjectURL(url);
}

export { buildICS, generateICS };
