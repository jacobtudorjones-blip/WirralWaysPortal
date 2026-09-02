import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { formatTime } from "../lib/helpers.js";
import { SLOTS, slotToMins, minsToSlot } from "../lib/slots.js";
import { lbl } from "../styles/shared.js";

function DaySchedulePicker({ date, roomId, bookings, startTime, endTime, onChange, currentUser, onWaitlist }) {
  const confirmedBookings = bookings.filter(b =>
    b.roomId===roomId && b.date===date && b.status==="confirmed"
  );
  const pendingBookings = bookings.filter(b =>
    b.roomId===roomId && b.date===date && b.status==="pending"
  );

  const [dragging, setDragging]     = useState(false);
  const [dragStart, setDragStart]   = useState(null);
  const [dragEnd, setDragEnd]       = useState(null);
  const [hovered, setHovered]       = useState(null);

  const selStart = dragging && dragStart!=null
    ? minsToSlot(Math.min(slotToMins(SLOTS[dragStart]), slotToMins(SLOTS[dragEnd??dragStart])))
    : startTime;
  const selEnd = dragging && dragStart!=null
    ? minsToSlot(Math.min(slotToMins(SLOTS[Math.max(dragStart,dragEnd??dragStart)])+30, slotToMins("19:00")))
    : endTime;

  function isConfirmed(slot) {
    const sm = slotToMins(slot), em = sm+30;
    return confirmedBookings.some(b => slotToMins(b.startTime)<em && slotToMins(b.endTime)>sm);
  }
  function isPending(slot) {
    const sm = slotToMins(slot), em = sm+30;
    return !isConfirmed(slot) && pendingBookings.some(b => slotToMins(b.startTime)<em && slotToMins(b.endTime)>sm);
  }
  function isBooked(slot) { return isConfirmed(slot) || isPending(slot); }
  function isSelected(slot) {
    if(!selStart||!selEnd) return false;
    const sm = slotToMins(slot);
    return sm >= slotToMins(selStart) && sm < slotToMins(selEnd);
  }
  function slotLabel(slot) {
    const sm = slotToMins(slot), em = sm+30;
    const bk = [...confirmedBookings,...pendingBookings].find(b => slotToMins(b.startTime)<em && slotToMins(b.endTime)>sm);
    return bk ? bk.bookedBy.split(" ")[0] : null;
  }

  function handleMouseDown(i) {
    if(isBooked(SLOTS[i])) return;
    setDragging(true); setDragStart(i); setDragEnd(i);
  }
  function handleMouseEnter(i) {
    setHovered(i);
    if(dragging) setDragEnd(i);
  }
  function handleMouseUp() {
    if(dragging && dragStart!=null) {
      const lo = Math.min(dragStart, dragEnd??dragStart);
      const hi = Math.max(dragStart, dragEnd??dragStart);
      const s = SLOTS[lo];
      const eMins = Math.min(slotToMins(SLOTS[hi])+30, slotToMins("19:00"));
      onChange(s, minsToSlot(eMins));
    }
    setDragging(false); setDragStart(null); setDragEnd(null);
  }

  const room = ROOMS[roomId];
  const color = room?.color || CGL.blackcurrant;
  const hourRows = [];
  for(let i=0;i<SLOTS.length-1;i+=2) hourRows.push([i,i+1]);

  return (
    <div style={{marginBottom:16}} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <label style={lbl}>Select time — click and drag to choose your slot *</label>

      {/* Selection summary */}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,padding:"8px 12px",background:selStart&&selEnd?color+"12":CGL.grey,borderRadius:8,border:"1px solid "+(selStart&&selEnd?color+"44":CGL.lavender),transition:"all 0.2s"}}>
        {selStart&&selEnd ? (
          <>
            <span style={{fontSize:22}}>🕐</span>
            <div>
              <div style={{fontWeight:800,fontSize:14,color}}>{formatTime(selStart)} – {formatTime(selEnd)}</div>
              <div style={{fontSize:11,color:"#888"}}>
                {(()=>{const mins=slotToMins(selEnd)-slotToMins(selStart);return (Math.floor(mins/60)?Math.floor(mins/60)+"h ":"")+(mins%60?mins%60+"min":"");})()}
                {" "}selected
              </div>
            </div>
          </>
        ) : (
          <div style={{fontSize:13,color:"#aaa",fontWeight:600}}>No time selected — drag across the slots below</div>
        )}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,marginBottom:8,flexWrap:"wrap"}}>
        {[
          {bg:color+"33",  border:"1px solid "+(color),    label:"Your selection"},
          {bg:"#fee2e2",   border:"1px solid #fca5a5",      label:"Confirmed"},
          {bg:"#fff3cd",   border:"1px solid #ffc107",      label:"Awaiting approval"},
          {bg:"#f8f5fc",   border:"1px solid "+(CGL.lavender), label:"Available"},
        ].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:14,height:14,borderRadius:3,background:l.bg,border:l.border}}/>
            <span style={{fontSize:10,color:"#888",fontWeight:600}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{border:"1.5px solid "+(CGL.lavender),borderRadius:10,overflow:"hidden",userSelect:"none",cursor:"crosshair"}}>
        <div style={{display:"grid",gridTemplateColumns:"44px 1fr",background:CGL.blackcurrant}}>
          <div style={{padding:"5px 0",textAlign:"center",fontSize:9,fontWeight:800,color:CGL.orchid,letterSpacing:1}}>TIME</div>
          <div style={{padding:"5px 8px",fontSize:9,fontWeight:800,color:CGL.orchid,letterSpacing:1}}>
            {date ? new Date(date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"}) : "Select a date first"}
          </div>
        </div>
        {hourRows.map(([i0,i1])=>{
          const slot0=SLOTS[i0];
          const hour = slot0.split(":")[0];
          return (
            <div key={i0} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr",borderBottom:"1px solid "+(CGL.lavender),background:parseInt(hour)%2===0?"white":"#faf8fd"}}>
              <div style={{gridRow:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid "+(CGL.lavender),padding:"0 4px"}}>
                <span style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant}}>{formatTime(slot0)}</span>
              </div>
              {[i0,i1].map(i=>{
                const slot=SLOTS[i];
                const confirmed=isConfirmed(slot);
                const pending=isPending(slot);
                const selected=isSelected(slot);
                const isHov=hovered===i&&!confirmed&&!pending;
                const label=slotLabel(slot);
                const bgColor = confirmed ? "#fee2e2" : pending ? "#fff3cd" : selected ? color+"33" : isHov ? color+"18" : "transparent";
                const cursor = (confirmed||pending) ? "not-allowed" : "crosshair";
                // Find the actual booking for waitlist
                const sm=slotToMins(slot),em=sm+30;
                const bkForSlot = confirmed&&i===i0 ? confirmedBookings.find(b=>slotToMins(b.startTime)<em&&slotToMins(b.endTime)>sm) : null;
                return (
                  <div key={i}
                    onMouseDown={()=>handleMouseDown(i)}
                    onMouseEnter={()=>handleMouseEnter(i)}
                    style={{height:28,background:bgColor,borderLeft:i===i1?"1px dashed "+(CGL.lavender):"none",cursor,transition:"background 0.08s",display:"flex",alignItems:"center",paddingLeft:6,position:"relative"}}>
                    {confirmed&&label&&i===i0&&<span style={{fontSize:9,fontWeight:700,color:"#dc2626",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:onWaitlist?"60%":"90%"}}>🔒 {label}</span>}
                    {confirmed&&i===i0&&onWaitlist&&bkForSlot&&(
                      <button
                        onMouseDown={e=>e.stopPropagation()}
                        onClick={e=>{e.stopPropagation();onWaitlist(bkForSlot);}}
                        style={{position:"absolute",right:4,fontSize:8,fontWeight:700,color:CGL.amethyst,background:"white",border:"1px solid "+(CGL.amethyst)+"55",borderRadius:4,padding:"1px 5px",cursor:"pointer",fontFamily:"inherit",lineHeight:1.4}}
                        title="Notify me if this slot becomes free">
                        🔔
                      </button>
                    )}
                    {pending&&label&&i===i0&&<span style={{fontSize:9,fontWeight:700,color:"#7a5c00",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"90%"}}>⏳ {label}</span>}
                    {selected&&!confirmed&&!pending&&i===i0&&<span style={{fontSize:9,fontWeight:800,color,opacity:0.7}}>✓</span>}
                    {i===i1&&<span style={{position:"absolute",right:6,fontSize:9,color:"#ccc",fontWeight:600}}>:30</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div style={{fontSize:11,color:"#555",marginTop:6,fontWeight:600}}>Tip: click a single slot for a 30-minute booking, or drag across multiple slots for longer.</div>
    </div>
  );
}

export default DaySchedulePicker;
