import { CGL } from "../data/rooms.js";
import { formatDateTime } from "../lib/helpers.js";

function AuditRow({ entry, isLast }) {
  const col = {booking_requested:CGL.ocean,booking_approved:"#1a7a4a",booking_rejected:CGL.raspberry,booking_cancelled:"#888",booking_checked_in:CGL.amethyst,admin_login:CGL.saffron,admin_logout:"#aaa"}[entry.action]||"#555";
  return (
    <div style={{display:"flex",gap:14,paddingBottom:isLast?0:16,position:"relative",fontFamily:"'Nunito',system-ui,sans-serif"}}>
      {!isLast&&<div style={{position:"absolute",left:11,top:24,bottom:0,width:1,background:CGL.lavender}}/>}
      <div style={{width:22,height:22,borderRadius:"50%",background:col+"22",border:"2px solid "+(col),flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:col}}/>
      </div>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <span style={{fontSize:12,fontWeight:700,color:"#1a1a2e"}}>{entry.description}</span>
          <span style={{fontSize:10,color:"#aaa",flexShrink:0,marginLeft:8}}>{formatDateTime(entry.timestamp)}</span>
        </div>
        <div style={{fontSize:11,color:"#555",marginTop:1}}>By {entry.actor}</div>
        {entry.note&&<div style={{fontSize:11,color:"#666",marginTop:3,fontStyle:"italic",background:CGL.grey,borderRadius:5,padding:"4px 8px"}}>"{entry.note}"</div>}
      </div>
    </div>
  );
}

export default AuditRow;
