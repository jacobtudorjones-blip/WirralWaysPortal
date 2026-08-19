import { CGL } from "../data/rooms.js";

function HelpModal({ isApprover, onClose }) {
  const sections = isApprover ? [
    { icon:"🏠", title:"Rooms tab", body:"Browse all rooms across all sites. Filter by site, room type, or access level. Click any room card to see its details and request it. The floor plans tab shows a schedule view per room." },
    { icon:"📅", title:"My bookings", body:"See all your own bookings, plus any you've made on someone else's behalf. You can check in, cancel, or (for confirmed bookings) edit from here." },
    { icon:"📊", title:"Daily view", body:"A full timetable grid for a site on a given day. Green slots are free — click one to go straight to a booking request for that room. Amber means awaiting approval, coloured means confirmed." },
    { icon:"✅", title:"Approvals", body:"New room requests from the team land here. Approve or reject each one — you can add a reason when rejecting. Approved requests fire a confirmation email to the requester automatically." },
    { icon:"📋", title:"All bookings", body:"Full searchable list of every booking in the system. Filter by site, room type, or access. You can approve, reject, edit, check in, or cancel any booking from here." },
    { icon:"✏️", title:"Editing bookings", body:"On any confirmed future booking, click Edit. You can change the title or time. For recurring bookings you'll be asked whether to change just this one, this and all future, or the entire series." },
    { icon:"❌", title:"Cancelling recurring bookings", body:"When cancelling a recurring booking you'll be asked: just this one, from here onwards, or the whole series. Non-recurring bookings cancel immediately." },
    { icon:"📈", title:"Analytics", body:"Usage stats across all rooms — check-in rate, peak times, peak days, and most popular rooms. Useful for reviewing how well the booking system reflects actual usage." },
    { icon:"🔁", title:"Auto-approval", body:"As an admin, your bookings are automatically confirmed — no approval needed. Bookings made by non-admin staff go into a pending queue for you to review." },
    { icon:"🕐", title:"Check-in & auto-release", body:"Staff can check in from 15 minutes before their booking starts. If no one checks in within 30 minutes of the start time, the room is automatically released and anyone on the waitlist for that slot is notified by email." },
    { icon:"🔔", title:"Waitlist", body:"When a slot is already booked, staff can click the 🔔 bell icon on that slot to join the waitlist. If the booking is cancelled or auto-released, they get an email straight away so they can request it." },
    { icon:"📅", title:"Calendar export", body:"Any confirmed booking has a 📅 .ics button. Clicking it downloads a calendar file that can be opened in Outlook or Google Calendar to add the booking directly to their calendar." },
    { icon:"📝", title:"Booking notes", body:"The booking form has an optional 'Additional requirements' field. Use it for things like room setup preferences, equipment needs, or session type notes. It shows on the booking card and is included in reminder emails." },
  ] : [
    { icon:"🏠", title:"Finding a room", body:"Go to the Rooms tab and browse by site or room type. Click any room to see details, then click 'Request this room' to submit a booking. You'll get an email once it's been approved." },
    { icon:"📅", title:"My bookings", body:"All your room requests are listed here — pending, confirmed, and past. You can check in to confirmed bookings or cancel ones you no longer need." },
    { icon:"📊", title:"Daily view", body:"Shows all rooms at a site on a given day as a timetable. Green slots are free, amber means a request is awaiting approval, coloured means confirmed. Click any green slot to request that room." },
    { icon:"⏳", title:"The approval process", body:"All room requests go to an approver before they're confirmed. You'll receive an email either way. Approvals usually happen the same day." },
    { icon:"🔁", title:"Recurring bookings", body:"When requesting a room, tick 'Recurring booking' to set up a repeating series — weekly, fortnightly, monthly, or a specific day of the month (like every last Monday). The series is open-ended by default." },
    { icon:"👤", title:"Booking for someone else", body:"Tick 'I'm booking this for someone else' and enter their CGL email. The booking will appear on their profile when they sign in, with your name shown as the requester." },
    { icon:"✅", title:"Checking in", body:"You can check in from 15 minutes before your booking starts. If you don't check in within 30 minutes of the start time, the room may be automatically released for someone else to use." },
    { icon:"🔔", title:"Waitlist", body:"If a slot you want is already taken, click the 🔔 bell icon on it. You'll get an email if it becomes free — either because the booking was cancelled or because no one checked in. It's first come, first served." },
    { icon:"📅", title:"Add to your calendar", body:"Every confirmed booking has a 📅 .ics button. Click it to download a calendar file you can open in Outlook or Google Calendar to add it directly to your diary." },
    { icon:"📝", title:"Additional requirements", body:"When making a booking there's an optional notes field. Use it to flag things like room setup, equipment needs or anything the approver should know. It shows on your booking and is included in your reminder email." },
    { icon:"⏰", title:"Reminder emails", body:"You'll automatically get a reminder email the day before any confirmed booking. No action needed — it just arrives in your inbox." },
    { icon:"📈", title:"Analytics", body:"The Analytics tab shows usage data across all rooms — popular rooms, peak times, and how often bookings are actually used. Available to everyone." },
    { icon:"❌", title:"Cancelling", body:"You can cancel any upcoming confirmed or pending booking from My bookings. For recurring bookings you'll be asked whether to cancel just this date or the whole series." },
  ];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1010,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:20,maxWidth:560,width:"100%",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{background:CGL.blackcurrant,padding:"22px 26px",flexShrink:0}}>
          <div style={{color:CGL.orchid,fontSize:10,fontWeight:800,letterSpacing:1.5,marginBottom:4}}>{isApprover?"ADMIN GUIDE":"USER GUIDE"}</div>
          <div style={{color:"white",fontSize:20,fontWeight:800}}>How to use Room Booking</div>
          <div style={{color:CGL.lavender,fontSize:13,marginTop:4}}>
            {isApprover ? "You're signed in as an admin — you can approve, edit and manage all bookings." : "Everything you need to get started with booking rooms at Wirral Ways."}
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"20px 26px",flex:1}}>
          {sections.map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:18,paddingBottom:18,borderBottom:i<sections.length-1?"1px solid "+(CGL.lavender):"none"}}>
              <div style={{fontSize:24,flexShrink:0,width:36,textAlign:"center"}}>{s.icon}</div>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:CGL.blackcurrant,marginBottom:4}}>{s.title}</div>
                <div style={{fontSize:13,color:"#555",lineHeight:1.7}}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 26px",borderTop:"1px solid "+(CGL.lavender),flexShrink:0,textAlign:"right"}}>
          <button onClick={onClose} style={{background:CGL.blackcurrant,color:"white",border:"none",borderRadius:10,padding:"10px 28px",cursor:"pointer",fontWeight:800,fontSize:14,fontFamily:"inherit"}}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
