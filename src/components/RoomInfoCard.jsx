import { useState } from "react";
import { CGL } from "../data/rooms.js";

function RoomInfoCard({ room, onRequest, onView }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{background:"white",borderRadius:12,border:"1.5px solid "+(CGL.lavender),borderTop:"4px solid "+(room.color),overflow:"hidden",boxShadow:"0 2px 8px rgba(94,27,109,0.06)",transition:"box-shadow 0.2s",cursor:onView?"pointer":"default"}}
      onClick={onView}
      onMouseOver={e=>e.currentTarget.style.boxShadow="0 6px 20px rgba(94,27,109,0.12)"}
      onMouseOut={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(94,27,109,0.06)"}>
      <div style={{padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            {room.icon&&<span style={{fontSize:18,lineHeight:1}}>{room.icon}</span>}
            <div style={{fontWeight:800,fontSize:14,color:"#1a1a2e",lineHeight:1.3}}>{room.name}</div>
          </div>
          {room.staffOnly&&<span style={{background:CGL.lavender,color:CGL.amethyst,fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:10,letterSpacing:0.5,flexShrink:0,marginLeft:6}}>STAFF ONLY</span>}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:room.color,marginBottom:8}}>{room.type}</div>

        {/* Key info row */}
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:10}}>
          <span style={{fontSize:11,color:"#555",display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:13}}>👥</span> {room.capacity === "TBC" ? "Capacity TBC" : "Up to "+(room.capacity)}
          </span>
          {room.av && room.av!=="None" && room.av!=="TBC" && (
            <span style={{fontSize:11,color:"#555",display:"flex",alignItems:"center",gap:3}}>
              <span style={{fontSize:13}}>📺</span> {room.av}
            </span>
          )}
        </div>

        {/* Expandable detail */}
        <button onClick={e=>{e.stopPropagation();setExpanded(x=>!x);}} style={{background:"none",border:"none",color:room.color,fontSize:11,fontWeight:700,cursor:"pointer",padding:0,marginBottom:expanded?8:0,fontFamily:"inherit"}}>
          {expanded?"▲ Less info":"▼ More info"}
        </button>

        {expanded&&(
          <div style={{background:CGL.grey,borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:12,color:"#444",lineHeight:1.7}}>
            <div><strong>Capacity:</strong> {room.capacity}{room.capacity !== "TBC" ? " people" : ""}</div>
            <div><strong>AV equipment:</strong> {room.av||"None listed"}</div>
            <div><strong>Accessibility:</strong> {room.accessibility||"Details to be confirmed"}</div>
            {room.notes&&<div><strong>Notes:</strong> {room.notes}</div>}
            {room.isPlaceholder&&<div style={{marginTop:6,color:CGL.amethyst,fontSize:11,fontStyle:"italic"}}>Floor plan: placeholder — to be updated</div>}
          </div>
        )}

        <button onClick={e=>{e.stopPropagation();onRequest();}} style={{width:"100%",background:"linear-gradient(135deg, "+(room.color)+", "+(room.color)+"cc)",color:"white",border:"none",borderRadius:8,padding:"9px 0",fontSize:12,fontWeight:800,cursor:"pointer",letterSpacing:0.3,transition:"opacity 0.15s",fontFamily:"'Nunito',system-ui,sans-serif"}}
          onMouseOver={e=>e.target.style.opacity="0.85"} onMouseOut={e=>e.target.style.opacity="1"}>
          Request this room
        </button>
      </div>
    </div>
  );
}

export default RoomInfoCard;
