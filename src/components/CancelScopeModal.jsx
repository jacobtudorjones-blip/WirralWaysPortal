import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { formatDateShort } from "../lib/helpers.js";

function CancelScopeModal({ booking, onConfirm, onClose }) {
  const room = ROOMS[booking.roomId];
  const [scope, setScope] = useState("one");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1002,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:400,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}}>
        <div style={{background:CGL.raspberry,padding:"18px 24px",color:"white"}}>
          <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,marginBottom:3}}>CANCEL RECURRING BOOKING</div>
          <div style={{fontSize:17,fontWeight:800}}>{room.icon} {room.name}</div>
        </div>
        <div style={{padding:24}}>
          <div style={{fontSize:14,color:"#555",marginBottom:16}}>This is part of a recurring series. Which bookings do you want to cancel?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {val:"one",   label:"Just this one",               sub:formatDateShort(booking.date)+" only"},
              {val:"future",label:"This and all future bookings", sub:"From "+formatDateShort(booking.date)+" onwards"},
              {val:"all",   label:"The entire series",            sub:"All occurrences cancelled"},
            ].map(opt=>(
              <label key={opt.val} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",borderRadius:8,border:"1.5px solid "+(scope===opt.val?CGL.raspberry:CGL.lavender),background:scope===opt.val?"#fdecea":"white",transition:"all 0.15s"}}>
                <input type="radio" name="scope" value={opt.val} checked={scope===opt.val} onChange={()=>setScope(opt.val)} style={{marginTop:2,accentColor:CGL.raspberry}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a1a2e"}}>{opt.label}</div>
                  <div style={{fontSize:11,color:"#888"}}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid "+(CGL.lavender),display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"transparent",color:"#888",border:"1px solid "+(CGL.lavender),borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Back</button>
          <button onClick={()=>onConfirm(scope)} style={{background:CGL.raspberry,color:"white",border:"none",borderRadius:8,padding:"9px 24px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>Confirm cancellation</button>
        </div>
      </div>
    </div>
  );
}

export default CancelScopeModal;
