import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { norm, todayStr, formatDateShort, formatTime } from "../lib/helpers.js";
import { generateICS } from "../lib/ics.js";
import { inp } from "../styles/shared.js";
import StatusBadge from "./StatusBadge.jsx";

function BookingCard({ booking, onCancel, onCheckIn, isApprover, onApprove, onReject, onEdit, currentUser }) {
  const room = ROOMS[booking.roomId];
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const isPast = booking.date < todayStr();
  const isOwn = norm(booking.email) === norm(currentUser?.email);
  const borderColor = booking.status==="confirmed"?room.color:booking.status==="pending"?CGL.saffron:booking.status==="rejected"?CGL.raspberry:"#ccc";

  return (
    <div style={{background:booking.status==="cancelled"||booking.status==="rejected"?"#fafafa":"white",border:"1px solid "+(CGL.lavender),borderLeft:"4px solid "+(borderColor),borderRadius:10,padding:"14px 16px",marginBottom:10,opacity:booking.status==="cancelled"||booking.status==="rejected"?0.6:1,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:6}}>
            <span style={{background:room.color,color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:12,display:"flex",alignItems:"center",gap:4}}>
              {room.icon&&<span style={{fontSize:12}}>{room.icon}</span>}{room.name}
            </span>
            <span style={{fontSize:10,color:room.color,fontWeight:700}}>{room.site}</span>
            <StatusBadge status={booking.status}/>
            {booking.checkedIn&&<span style={{fontSize:10,color:"#1a7a4a",background:"#e8f5ee",padding:"2px 7px",borderRadius:10,fontWeight:700}}>✓ Checked in</span>}
            {booking.isRecurring&&<span style={{fontSize:10,color:"#666",border:"1px solid "+(CGL.lavender),padding:"2px 7px",borderRadius:10}}>🔁 Recurring</span>}
          </div>
          <div style={{fontWeight:800,fontSize:15,color:"#1a1a2e",marginBottom:3}}>{booking.title}</div>
          <div style={{fontSize:12,color:"#333",marginBottom:1}}>{formatDateShort(booking.date)} &bull; {formatTime(booking.startTime)}–{formatTime(booking.endTime)}</div>
          <div style={{fontSize:12,color:"#444"}}>{booking.bookedBy}{booking.bookedForOther&&booking.requestedBy&&<span style={{color:CGL.saffron}}> — requested by {booking.requestedBy}</span>}</div>
          {booking.approvedBy&&<div style={{fontSize:11,color:"#146237",marginTop:3,fontWeight:600}}>Approved by {booking.approvedBy}</div>}
          {booking.notes&&<div style={{fontSize:11,color:"#666",marginTop:4,background:"#f8f5fc",borderRadius:6,padding:"4px 8px",fontStyle:"italic"}}>📝 {booking.notes}</div>}
          {booking.rejectionNote&&<div style={{fontSize:11,color:CGL.raspberry,marginTop:4,background:"#fdecea",borderRadius:6,padding:"3px 8px",fontWeight:600}}>Reason: {booking.rejectionNote}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
          {isApprover&&booking.status==="pending"&&(<>
            <button onClick={()=>onApprove(booking.id)} style={{background:"linear-gradient(135deg,#1a7a4a,#2ecc71)",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Approve</button>
            <button onClick={()=>setShowReject(s=>!s)} style={{background:"transparent",color:CGL.raspberry,border:"1px solid "+(CGL.raspberry)+"55",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Reject</button>
          </>)}
          {isApprover&&booking.status==="confirmed"&&!isPast&&onEdit&&(
            <button onClick={()=>onEdit(booking)} style={{background:"linear-gradient(135deg,"+(CGL.ocean)+","+(CGL.space)+")",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Edit</button>
          )}
          {booking.status==="confirmed"&&!isPast&&!booking.checkedIn&&(isApprover||isOwn)&&(
            <button onClick={()=>onCheckIn(booking.id)} style={{background:"linear-gradient(135deg,"+(CGL.ocean)+","+(CGL.sky)+")",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Check in</button>
          )}
          {booking.status==="confirmed"&&(isApprover||isOwn)&&(
            <button onClick={()=>generateICS(booking)} style={{background:"transparent",color:CGL.amethyst,border:"1px solid "+(CGL.amethyst)+"55",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}} title="Add to calendar">📅 .ics</button>
          )}
          {(booking.status==="confirmed"||booking.status==="pending")&&!isPast&&(isApprover||isOwn)&&(
            <button onClick={()=>onCancel(booking.id)} style={{background:"transparent",color:"#888",border:"1px solid #ddd",borderRadius:7,padding:"7px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>Cancel</button>
          )}
        </div>
      </div>
      {showReject&&(
        <div style={{marginTop:10,display:"flex",gap:8}}>
          <input value={rejectNote} onChange={e=>setRejectNote(e.target.value)} placeholder="Reason for rejection (optional)"
            style={{...inp,fontSize:12,padding:"8px 11px"}}/>
          <button onClick={()=>{onReject(booking.id,rejectNote);setShowReject(false);setRejectNote("");}}
            style={{background:CGL.raspberry,color:"white",border:"none",borderRadius:7,padding:"8px 14px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit",flexShrink:0}}>Confirm</button>
        </div>
      )}
    </div>
  );
}

export default BookingCard;
