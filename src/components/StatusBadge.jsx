import { CGL } from "../data/rooms.js";

function StatusBadge({ status }) {
  const map = {
    pending:      {bg:"#fff8e1",color:CGL.saffron,   label:"Awaiting approval"},
    confirmed:    {bg:"#e8f5ee",color:"#1a7a4a",     label:"Confirmed"},
    rejected:     {bg:"#fdecea",color:CGL.raspberry,  label:"Not approved"},
    cancelled:    {bg:CGL.grey,  color:"#888",         label:"Cancelled"},
    autoReleased: {bg:"#fff3e0",color:CGL.flame,      label:"Auto-released"},
    unused:       {bg:"#fdecea",color:CGL.raspberry,  label:"Not used"},
  };
  const s = map[status]||map.pending;
  return <span style={{background:s.bg,color:s.color,fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,letterSpacing:0.3,whiteSpace:"nowrap"}}>{s.label}</span>;
}

export default StatusBadge;
