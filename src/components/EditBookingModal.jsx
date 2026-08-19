import { useState } from "react";
import { CGL, ROOMS } from "../data/rooms.js";
import { formatDateShort } from "../lib/helpers.js";
import { inp, lbl } from "../styles/shared.js";

function EditBookingModal({ booking, bookings, onSave, onClose, isRecurringGroup }) {
  const room = ROOMS[booking.roomId];
  const [form, setForm] = useState({
    title:     booking.title,
    startTime: booking.startTime,
    endTime:   booking.endTime,
    applyTo:   isRecurringGroup ? "one" : "one",
  });
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  function save() {
    if(!form.title.trim())        { setError("Please enter a title."); return; }
    if(form.startTime>=form.endTime){ setError("End time must be after start time."); return; }
    onSave(booking.id, form.applyTo, { title:form.title, startTime:form.startTime, endTime:form.endTime });
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1002,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:440,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}}>
        <div style={{background:room.color,padding:"18px 24px"}}>
          <div style={{fontSize:10,fontWeight:800,color:"rgba(255,255,255,0.6)",letterSpacing:1.5,marginBottom:3}}>EDIT BOOKING</div>
          <div style={{color:"white",fontSize:17,fontWeight:800}}>{room.icon} {room.name} &bull; {formatDateShort(booking.date)}</div>
        </div>
        <div style={{padding:24}}>
          {error&&<div style={{background:"#fdecea",color:CGL.raspberry,padding:"10px 14px",borderRadius:8,marginBottom:14,fontSize:13,fontWeight:600}}>{error}</div>}

          <div style={{marginBottom:14}}>
            <label style={lbl}>Booking title</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)} style={inp}
              onFocus={e=>e.target.style.borderColor=room.color} onBlur={e=>e.target.style.borderColor=CGL.lavender}/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:isRecurringGroup?16:0}}>
            <div>
              <label style={lbl}>Start time</label>
              <input type="time" value={form.startTime} onChange={e=>set("startTime",e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>End time</label>
              <input type="time" value={form.endTime} onChange={e=>set("endTime",e.target.value)} style={inp}/>
            </div>
          </div>

          {isRecurringGroup&&(
            <div style={{marginTop:4}}>
              <label style={lbl}>Apply changes to</label>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {val:"one",   label:"Just this booking",          sub:"Only "+formatDateShort(booking.date)+" is changed"},
                  {val:"all",   label:"All bookings in this series", sub:"Every occurrence is updated"},
                  {val:"future",label:"This and all future bookings",sub:"From "+formatDateShort(booking.date)+" onwards"},
                ].map(opt=>(
                  <label key={opt.val} style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"10px 12px",borderRadius:8,border:"1.5px solid "+(form.applyTo===opt.val?room.color:CGL.lavender),background:form.applyTo===opt.val?room.color+"0d":"white",transition:"all 0.15s"}}>
                    <input type="radio" name="applyTo" value={opt.val} checked={form.applyTo===opt.val} onChange={()=>set("applyTo",opt.val)} style={{marginTop:2,accentColor:room.color}}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#1a1a2e"}}>{opt.label}</div>
                      <div style={{fontSize:11,color:"#888"}}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid "+(CGL.lavender),display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"transparent",color:"#888",border:"1px solid "+(CGL.lavender),borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={save} style={{background:room.color,color:"white",border:"none",borderRadius:8,padding:"9px 24px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

export default EditBookingModal;
