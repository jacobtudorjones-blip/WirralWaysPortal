import { CGL, ROOMS } from "../data/rooms.js";
import { formatDateShort, formatTime } from "../lib/helpers.js";

function LoginNotificationsModal({ data, onClose, onGoToApprovals }) {
  const { notifs, identity } = data;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1010,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:20,maxWidth:480,width:"100%",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{background:CGL.blackcurrant,padding:"22px 26px"}}>
          <div style={{color:CGL.orchid,fontSize:10,fontWeight:800,letterSpacing:1.5,marginBottom:4}}>WELCOME BACK</div>
          <div style={{color:"white",fontSize:20,fontWeight:800}}>Hi {identity.name.split(" ")[0]} 👋</div>
          <div style={{color:CGL.lavender,fontSize:13,marginTop:3}}>Here's what's happened since you were last here.</div>
        </div>
        <div style={{padding:"20px 26px"}}>
          {notifs.map((n,i)=>{
            if(n.type==="approvals") return (
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",borderRadius:12,background:CGL.saffron+"15",border:"1.5px solid "+(CGL.saffron)+"44",marginBottom:12}}>
                <div style={{fontSize:26,flexShrink:0}}>📋</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#1a1a2e",marginBottom:3}}>
                    {n.count} booking request{n.count!==1?"s":""} waiting for your approval
                  </div>
                  <div style={{fontSize:12,color:"#666"}}>Head to the Approvals tab to review and action them.</div>
                </div>
                <button onClick={()=>{onGoToApprovals();onClose();}} style={{background:CGL.saffron,color:"white",border:"none",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:"inherit",flexShrink:0}}>Review →</button>
              </div>
            );
            if(n.type==="approved") return (
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",borderRadius:12,background:"#f0fdf4",border:"1.5px solid #86efac",marginBottom:12}}>
                <div style={{fontSize:26,flexShrink:0}}>✅</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:"#1a1a2e",marginBottom:3}}>
                    {n.bookings.length} booking{n.bookings.length!==1?"s":""} approved in the last 7 days
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:4}}>
                    {n.bookings.slice(0,3).map(b=>(
                      <div key={b.id} style={{fontSize:12,color:"#555"}}>
                        <span style={{fontWeight:700}}>{ROOMS[b.roomId]?.name}</span> — {formatDateShort(b.date)}, {formatTime(b.startTime)}–{formatTime(b.endTime)}
                      </div>
                    ))}
                    {n.bookings.length>3&&<div style={{fontSize:12,color:"#aaa"}}>…and {n.bookings.length-3} more</div>}
                  </div>
                </div>
              </div>
            );
            if(n.type==="rejected") return (
              <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"14px 16px",borderRadius:12,background:"#fdecea",border:"1.5px solid "+(CGL.raspberry)+"44",marginBottom:12}}>
                <div style={{fontSize:26,flexShrink:0}}>❌</div>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:"#1a1a2e",marginBottom:3}}>
                    {n.bookings.length} booking request{n.bookings.length!==1?"s":""} could not be approved
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:3,marginTop:4}}>
                    {n.bookings.slice(0,3).map(b=>(
                      <div key={b.id} style={{fontSize:12,color:"#555"}}>
                        <span style={{fontWeight:700}}>{ROOMS[b.roomId]?.name}</span> — {formatDateShort(b.date)}
                        {b.rejectionNote&&<span style={{color:CGL.raspberry}}> · {b.rejectionNote}</span>}
                      </div>
                    ))}
                    {n.bookings.length>3&&<div style={{fontSize:12,color:"#aaa"}}>…and {n.bookings.length-3} more</div>}
                  </div>
                </div>
              </div>
            );
            return null;
          })}
        </div>
        <div style={{padding:"14px 26px",borderTop:"1px solid "+(CGL.lavender),textAlign:"right"}}>
          <button onClick={onClose} style={{background:CGL.blackcurrant,color:"white",border:"none",borderRadius:10,padding:"10px 28px",cursor:"pointer",fontWeight:800,fontSize:14,fontFamily:"inherit"}}>Got it</button>
        </div>
      </div>
    </div>
  );
}

export default LoginNotificationsModal;
