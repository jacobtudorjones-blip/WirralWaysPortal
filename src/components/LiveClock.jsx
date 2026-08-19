import { useState, useEffect } from "react";
import { CGL } from "../data/rooms.js";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()), 1000); return ()=>clearInterval(t); }, []);
  const timeStr = now.toLocaleTimeString("en-GB", {hour:"2-digit", minute:"2-digit", second:"2-digit"});
  const dateStr = now.toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short", year:"numeric"});
  return (
    <div style={{textAlign:"right",lineHeight:1.3}}>
      <div style={{color:CGL.white, fontWeight:800, fontSize:15, letterSpacing:0.5}}>{timeStr}</div>
      <div style={{color:CGL.orchid, fontSize:10, fontWeight:600}}>{dateStr}</div>
    </div>
  );
}

export default LiveClock;
