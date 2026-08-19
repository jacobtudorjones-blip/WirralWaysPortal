import { useState } from "react";
import { CGL, ROOMS, ROOM_LIST, SITES } from "../data/rooms.js";
import { todayStr, formatDateShort, formatTime, hasConflict } from "../lib/helpers.js";
import { inp, lbl } from "../styles/shared.js";

// Three modes:
//   "dates"  — same room, multiple specific dates you pick
//   "rooms"  — multiple rooms on the same day
//   "range"  — same room, every day in a date range

function BulkBookingForm({ bookings, onBook, onClose, currentUser }) {
  const [mode, setMode]         = useState("dates");
  const [title, setTitle]       = useState("");
  const [startTime, setStart]   = useState("09:00");
  const [endTime, setEnd]       = useState("10:00");
  const [notes, setNotes]       = useState("");
  const [error, setError]       = useState("");

  // Mode: dates — pick room once, add multiple dates
  const [roomId, setRoomId]     = useState(ROOM_LIST[0].id);
  const [pickedDates, setPicked]= useState([]);
  const [dateInput, setDateIn]  = useState(todayStr());

  // Mode: rooms — pick a date, add multiple rooms
  const [sharedDate, setShared] = useState(todayStr());
  const [pickedRooms, setRooms] = useState([]);

  // Mode: range — pick room, start date, end date, weekdays
  const [rangeRoom, setRangeRoom]   = useState(ROOM_LIST[0].id);
  const [rangeStart, setRangeStart] = useState(todayStr());
  const [rangeEnd, setRangeEnd]     = useState(todayStr());
  const [weekdays, setWeekdays]     = useState([1,2,3,4,5]); // Mon-Fri default

  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function toggleDay(d) { setWeekdays(w=>w.includes(d)?w.filter(x=>x!==d):[...w,d].sort()); }
  function addDate() {
    if(!dateInput) return;
    if(pickedDates.includes(dateInput)) return;
    setPicked(d=>[...d,dateInput].sort());
    setDateIn("");
  }
  function addRoom(rid) { if(!pickedRooms.includes(rid)) setRooms(r=>[...r,rid]); }
  function removeRoom(rid) { setRooms(r=>r.filter(x=>x!==rid)); }

  // Preview: compute what will be booked
  function getPreview() {
    if(mode==="dates") {
      return pickedDates.map(d=>({roomId, date:d}));
    }
    if(mode==="rooms") {
      return pickedRooms.map(rid=>({roomId:rid, date:sharedDate}));
    }
    if(mode==="range") {
      const out=[], end=new Date(rangeEnd+"T00:00:00");
      let cur=new Date(rangeStart+"T00:00:00");
      while(cur<=end) {
        if(weekdays.includes(cur.getDay())) out.push({roomId:rangeRoom, date:cur.toISOString().slice(0,10)});
        cur.setDate(cur.getDate()+1);
      }
      return out;
    }
    return [];
  }

  const preview = getPreview();

  function submit() {
    setError("");
    if(!title.trim())          { setError("Please enter a title for these bookings."); return; }
    if(!startTime||!endTime)   { setError("Please set a start and end time."); return; }
    if(startTime>=endTime)     { setError("End time must be after start time."); return; }
    if(preview.length===0)     { setError("No bookings to submit — add some dates or rooms first."); return; }
    if(preview.length>60)      { setError("That's more than 60 bookings at once. Please split into smaller batches."); return; }
    // Check conflicts
    for(const p of preview) {
      if(hasConflict(bookings, p.roomId, p.date, startTime, endTime)) {
        setError("Conflict: "+(ROOMS[p.roomId]?.name)+" is already booked on "+(formatDateShort(p.date))+" at that time.");
        return;
      }
    }
    onBook(preview, title, startTime, endTime, notes);
  }

  const roomsBySite = SITES.reduce((acc,s)=>{
    const rooms=ROOM_LIST.filter(r=>r.site===s);
    if(rooms.length) acc[s]=rooms;
    return acc;
  },{});

  const modeBtn = (m, label, icon) => (
    <button onClick={()=>setMode(m)} style={{flex:1,padding:"12px 8px",border:"2px solid "+(mode===m?CGL.blackcurrant:CGL.lavender),borderRadius:10,background:mode===m?CGL.blackcurrant:"white",color:mode===m?"white":"#555",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <span style={{fontSize:20}}>{icon}</span>{label}
    </button>
  );

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:560,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",maxHeight:"92vh",overflowY:"auto"}}>

        {/* Header */}
        <div style={{background:"linear-gradient(135deg,"+(CGL.blackcurrant)+","+(CGL.amethyst)+")",padding:"22px 24px 18px",borderRadius:"16px 16px 0 0",position:"sticky",top:0,zIndex:1}}>
          <div style={{fontSize:10,fontWeight:800,color:CGL.orchid,letterSpacing:1.5,marginBottom:4}}>WIRRAL WAYS — BULK REQUEST</div>
          <div style={{color:"white",fontSize:19,fontWeight:800,marginBottom:2}}>Book multiple rooms or dates</div>
          <div style={{fontSize:12,color:(CGL.lavender)+"cc"}}>Booking as: {currentUser.name} &bull; {currentUser.email}</div>
        </div>

        <div style={{padding:24}}>
          {/* Mode selector */}
          <div style={{marginBottom:20}}>
            <label style={lbl}>What do you want to do?</label>
            <div style={{display:"flex",gap:8}}>
              {modeBtn("dates",  "Same room,\nmultiple dates", "📅")}
              {modeBtn("rooms",  "Multiple rooms,\nsame day",      "🚪")}
              {modeBtn("range",  "Room across\na date range",     "📆")}
            </div>
          </div>

          {error&&<div style={{background:"#fdecea",color:CGL.raspberry,padding:"10px 14px",borderRadius:8,marginBottom:14,fontSize:13,fontWeight:600}}>{error}</div>}

          {/* Shared fields */}
          <div style={{marginBottom:14}}>
            <label style={lbl}>What are these bookings for? *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Group session, Drop-in clinic" style={inp}
              onFocus={e=>e.target.style.borderColor=CGL.blackcurrant} onBlur={e=>e.target.style.borderColor=CGL.lavender}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={lbl}>Start time *</label>
              <input type="time" value={startTime} onChange={e=>setStart(e.target.value)} style={inp}/>
            </div>
            <div>
              <label style={lbl}>End time *</label>
              <input type="time" value={endTime} onChange={e=>setEnd(e.target.value)} style={inp}/>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={lbl}>Additional requirements <span style={{fontWeight:400,color:"#aaa",textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)}
              placeholder="e.g. Need projector, clinical sessions — no interruptions"
              rows={2} style={{...inp,resize:"vertical",lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor=CGL.blackcurrant} onBlur={e=>e.target.style.borderColor=CGL.lavender}/>
          </div>

          {/* ── MODE: SAME ROOM, MULTIPLE DATES ── */}
          {mode==="dates"&&(<>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Room</label>
              <select value={roomId} onChange={e=>setRoomId(e.target.value)} style={inp}>
                {Object.entries(roomsBySite).map(([site,rooms])=>(
                  <optgroup key={site} label={site}>
                    {rooms.map(r=><option key={r.id} value={r.id}>{r.icon} {r.name}{r.staffOnly?" (staff only)":""}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Add dates</label>
              <div style={{display:"flex",gap:8}}>
                <input type="date" value={dateInput} min={todayStr()} onChange={e=>setDateIn(e.target.value)} style={{...inp,flex:1}}/>
                <button onClick={addDate} style={{background:CGL.blackcurrant,color:"white",border:"none",borderRadius:8,padding:"0 18px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit",flexShrink:0}}>Add</button>
              </div>
            </div>
            {pickedDates.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {pickedDates.map(d=>(
                  <div key={d} style={{background:CGL.blackcurrant+"14",border:"1px solid "+(CGL.blackcurrant)+"33",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:12,fontWeight:700,color:CGL.blackcurrant}}>{formatDateShort(d)}</span>
                    <button onClick={()=>setPicked(p=>p.filter(x=>x!==d))} style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontWeight:800,fontSize:14,lineHeight:1,padding:0}}>×</button>
                  </div>
                ))}
              </div>
            )}
          </>)}

          {/* ── MODE: MULTIPLE ROOMS, SAME DAY ── */}
          {mode==="rooms"&&(<>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Date</label>
              <input type="date" value={sharedDate} min={todayStr()} onChange={e=>setShared(e.target.value)} style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Add rooms</label>
              <select onChange={e=>{ if(e.target.value) addRoom(e.target.value); e.target.value=""; }} style={inp} defaultValue="">
                <option value="" disabled>Select a room to add…</option>
                {Object.entries(roomsBySite).map(([site,rooms])=>(
                  <optgroup key={site} label={site}>
                    {rooms.filter(r=>!pickedRooms.includes(r.id)).map(r=><option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {pickedRooms.length>0&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {pickedRooms.map(rid=>{
                  const r=ROOMS[rid];
                  return (
                    <div key={rid} style={{background:r.color+"14",border:"1px solid "+(r.color)+"33",borderRadius:8,padding:"4px 10px",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:12}}>{r.icon}</span>
                      <span style={{fontSize:12,fontWeight:700,color:r.color}}>{r.name}</span>
                      <button onClick={()=>removeRoom(rid)} style={{background:"none",border:"none",cursor:"pointer",color:"#aaa",fontWeight:800,fontSize:14,lineHeight:1,padding:0}}>×</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>)}

          {/* ── MODE: DATE RANGE ── */}
          {mode==="range"&&(<>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Room</label>
              <select value={rangeRoom} onChange={e=>setRangeRoom(e.target.value)} style={inp}>
                {Object.entries(roomsBySite).map(([site,rooms])=>(
                  <optgroup key={site} label={site}>
                    {rooms.map(r=><option key={r.id} value={r.id}>{r.icon} {r.name}{r.staffOnly?" (staff only)":""}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <div>
                <label style={lbl}>From</label>
                <input type="date" value={rangeStart} min={todayStr()} onChange={e=>setRangeStart(e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={lbl}>To</label>
                <input type="date" value={rangeEnd} min={rangeStart} onChange={e=>setRangeEnd(e.target.value)} style={inp}/>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Which days of the week?</label>
              <div style={{display:"flex",gap:6}}>
                {[0,1,2,3,4,5,6].map(d=>(
                  <button key={d} onClick={()=>toggleDay(d)} style={{flex:1,padding:"8px 4px",border:"1.5px solid "+(weekdays.includes(d)?CGL.blackcurrant:CGL.lavender),borderRadius:8,background:weekdays.includes(d)?CGL.blackcurrant:"white",color:weekdays.includes(d)?"white":"#888",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11}}>
                    {DAY_NAMES[d]}
                  </button>
                ))}
              </div>
            </div>
          </>)}

          {/* Preview */}
          {preview.length>0&&(
            <div style={{background:CGL.blackcurrant+"0d",border:"1px solid "+(CGL.blackcurrant)+"22",borderRadius:10,padding:"12px 14px",marginBottom:4}}>
              <div style={{fontSize:11,fontWeight:800,color:CGL.blackcurrant,letterSpacing:0.5,marginBottom:8,textTransform:"uppercase"}}>
                Preview — {preview.length} booking{preview.length!==1?"s":""}
              </div>
              <div style={{maxHeight:160,overflowY:"auto",display:"flex",flexWrap:"wrap",gap:5}}>
                {preview.slice(0,40).map((p,i)=>{
                  const r=ROOMS[p.roomId];
                  return (
                    <div key={i} style={{background:r.color+"18",border:"1px solid "+(r.color)+"33",borderRadius:6,padding:"3px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                      <span>{r.icon}</span>
                      <span style={{fontWeight:700,color:r.color}}>{r.name}</span>
                      <span style={{color:"#888"}}>{formatDateShort(p.date)}</span>
                    </div>
                  );
                })}
                {preview.length>40&&<div style={{fontSize:11,color:"#aaa",padding:"3px 6px"}}>…and {preview.length-40} more</div>}
              </div>
              <div style={{fontSize:11,color:"#888",marginTop:8,fontWeight:600}}>All at {formatTime(startTime)}–{formatTime(endTime)}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 24px",borderTop:"1px solid "+(CGL.lavender),display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"white",borderRadius:"0 0 16px 16px"}}>
          <button onClick={onClose} style={{background:"transparent",color:"#888",border:"1px solid "+(CGL.lavender),borderRadius:8,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={submit} disabled={preview.length===0} style={{background:preview.length>0?"linear-gradient(135deg,"+(CGL.blackcurrant)+","+(CGL.amethyst)+")":"#ccc",color:"white",border:"none",borderRadius:8,padding:"10px 24px",cursor:preview.length>0?"pointer":"default",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>
            Submit {preview.length>0?(preview.length)+" request"+(preview.length!==1?"s":""):""} →
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkBookingForm;
