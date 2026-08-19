import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { formatDateShort, formatTime } from "../lib/helpers.js";
import { inp } from "../styles/shared.js";

// Quick-action popover shown when clicking a booking block in daily/weekly view
function BookingPopover({ booking, isApprover, onApprove, onReject, onClose, style }) {
  const room = ROOMS[booking.roomId];
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,zIndex:1050}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()}
        style={{position:"fixed",...style,background:"white",borderRadius:12,padding:16,
          boxShadow:"0 8px 40px rgba(0,0,0,0.22)",border:"1px solid "+CGL.lavender,
          minWidth:240,maxWidth:300,zIndex:1051,fontFamily:"'Nunito',system-ui,sans-serif"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{background:room.color,color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:10,display:"flex",alignItems:"center",gap:4}}>
            {room.icon} {room.name}
          </span>
          <span style={{fontSize:10,color:booking.status==="pending"?"#7a5c00":"#1a7a4a",fontWeight:700,background:booking.status==="pending"?"#fff3cd":"#e8f5ee",padding:"2px 7px",borderRadius:10}}>
            {booking.status==="pending"?"⏳ Awaiting approval":"✓ Confirmed"}
          </span>
        </div>
        <div style={{fontWeight:800,fontSize:14,color:"#1a1a2e",marginBottom:3}}>{booking.title}</div>
        <div style={{fontSize:12,color:"#444",marginBottom:2}}>{formatDateShort(booking.date)} &bull; {formatTime(booking.startTime)}–{formatTime(booking.endTime)}</div>
        <div style={{fontSize:12,color:"#666",marginBottom:booking.notes?6:0}}>{booking.bookedBy}</div>
        {booking.notes&&<div style={{fontSize:11,color:"#555",background:"#f8f5fc",borderRadius:6,padding:"5px 8px",marginBottom:6,fontStyle:"italic"}}>📝 {booking.notes}</div>}
        {/* Actions */}
        {isApprover&&booking.status==="pending"&&(
          <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:6}}>
            {!showReject?(
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>onApprove(booking.id)}
                  style={{flex:1,background:"linear-gradient(135deg,#1a7a4a,#2ecc71)",color:"white",border:"none",borderRadius:7,padding:"8px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                  ✓ Approve
                </button>
                <button onClick={()=>setShowReject(true)}
                  style={{flex:1,background:"transparent",color:CGL.raspberry,border:"1.5px solid "+CGL.raspberry,borderRadius:7,padding:"8px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                  ✗ Reject
                </button>
              </div>
            ):(
              <>
                <input value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                  placeholder="Reason (optional)" autoFocus
                  style={{...inp,fontSize:12,padding:"7px 10px"}}/>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setShowReject(false)}
                    style={{flex:1,background:"transparent",color:"#888",border:"1px solid #ddd",borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                    Back
                  </button>
                  <button onClick={()=>onReject(booking.id,rejectNote)}
                    style={{flex:1,background:CGL.raspberry,color:"white",border:"none",borderRadius:7,padding:"7px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit"}}>
                    Confirm reject
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPopover;
