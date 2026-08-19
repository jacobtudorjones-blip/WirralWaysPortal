import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { formatDateShort, formatTime } from "../lib/helpers.js";

function MissedCheckInModal({ missed, onRespond, onDone }) {
  const [responses, setResponses] = useState({});
  const allAnswered = missed.every(b => responses[b.id]);
  function respond(id, answer) { setResponses(r=>({...r,[id]:answer})); }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1010,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:20,maxWidth:500,width:"100%",maxHeight:"88vh",display:"flex",flexDirection:"column",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{background:CGL.saffron,padding:"22px 26px",flexShrink:0}}>
          <div style={{color:"rgba(0,0,0,0.5)",fontSize:10,fontWeight:800,letterSpacing:1.5,marginBottom:4}}>ROOM USAGE CHECK</div>
          <div style={{color:"#1a1a2e",fontSize:19,fontWeight:800}}>Did you use these rooms?</div>
          <div style={{color:"rgba(0,0,0,0.55)",fontSize:13,marginTop:4}}>You had bookings that weren't checked in to. Please let us know what happened.</div>
        </div>
        <div style={{overflowY:"auto",padding:"16px 26px",flex:1}}>
          {missed.map(b=>{
            const room = ROOMS[b.roomId];
            const ans = responses[b.id];
            return (
              <div key={b.id} style={{marginBottom:14,padding:"14px 16px",borderRadius:12,border:"1.5px solid "+(ans==="used"?"#1a7a4a":ans==="unused"?CGL.raspberry:CGL.lavender),background:ans==="used"?"#f0fdf4":ans==="unused"?"#fdecea":"#fafafa",transition:"all 0.2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{background:room.color,color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:10}}>{room.icon} {room.name}</span>
                  <span style={{fontSize:10,color:"#888",fontWeight:600}}>{room.site}</span>
                </div>
                <div style={{fontWeight:700,fontSize:13,color:"#1a1a2e",marginBottom:2}}>{b.title}</div>
                <div style={{fontSize:12,color:"#666",marginBottom:10}}>{formatDateShort(b.date)} &bull; {formatTime(b.startTime)}–{formatTime(b.endTime)}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>respond(b.id,"used")}
                    style={{flex:1,background:ans==="used"?"#1a7a4a":"white",color:ans==="used"?"white":"#1a7a4a",border:"1.5px solid #1a7a4a",borderRadius:8,padding:"8px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>
                    ✓ I used this room
                  </button>
                  <button onClick={()=>respond(b.id,"unused")}
                    style={{flex:1,background:ans==="unused"?CGL.raspberry:"white",color:ans==="unused"?"white":CGL.raspberry,border:"1.5px solid "+(CGL.raspberry),borderRadius:8,padding:"8px 0",fontSize:12,cursor:"pointer",fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>
                    ✗ I didn't use it
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:"14px 26px",borderTop:"1px solid "+(CGL.lavender),flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>allAnswered&&onDone(responses)} disabled={!allAnswered}
            style={{background:allAnswered?CGL.blackcurrant:"#ccc",color:"white",border:"none",borderRadius:10,padding:"10px 28px",cursor:allAnswered?"pointer":"default",fontWeight:800,fontSize:14,fontFamily:"inherit"}}>
            {allAnswered ? "Submit" : (missed.filter(b=>!responses[b.id]).length)+" left to answer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissedCheckInModal;
