import { useState } from "react";
import { CGL, ROOMS, ROOM_LIST, SITES } from "../data/rooms.js";
import { todayStr, formatDateShort, formatTime, hasConflict, getRecurrenceDates } from "../lib/helpers.js";
import { addToWaitlist } from "../lib/waitlist.js";
import { nameFromEmail } from "../lib/nameFromEmail.js";
import { inp, lbl } from "../styles/shared.js";
import DaySchedulePicker from "./DaySchedulePicker.jsx";

function BookingForm({ preRoom, bookings, onBook, onClose, currentUser }) {
  const defaultRoom = preRoom || ROOM_LIST[0].id;
  const [form, setForm] = useState({
    roomId:defaultRoom, title:"",
    date:todayStr(), startTime:"", endTime:"",
    isRecurring:false, recurrencePattern:"weekly", recurrenceUntil:"",
    nthWeekdayNth: 1, nthWeekdayDay: 1,
    bookingForOther: false, bookingForEmail: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function handleWaitlistFromForm(bk) {
    const room = ROOMS[bk.roomId];
    const ok = await addToWaitlist(bk.roomId, bk.date, bk.startTime, bk.endTime, currentUser.email, currentUser.name);
    alert(ok
      ? "You're on the waitlist. We'll email " + currentUser.email + " if " + room.name + " on " + formatDateShort(bk.date) + " at " + formatTime(bk.startTime) + " becomes free."
      : "You're already on the waitlist for that slot.");
  }

  function submit() {
    if(!form.title){setError("Please enter what this booking is for.");return;}
    if(!form.date){setError("Please select a date.");return;}
    if(!form.startTime||!form.endTime||form.startTime===form.endTime){setError("Please select a time slot on the schedule below.");return;}
    if(form.startTime>=form.endTime){setError("End time must be after start time.");return;}
    if(form.bookingForOther){
      if(!form.bookingForEmail.trim()){setError("Please enter the email address of the person you are booking for.");return;}
      if(!form.bookingForEmail.trim().toLowerCase().endsWith("@cgl.org.uk")){setError("The email address for the other person must end in @cgl.org.uk.");return;}
    }
    const nthWd = form.recurrencePattern === "nth_weekday"
      ? { nth: parseInt(form.nthWeekdayNth), weekday: parseInt(form.nthWeekdayDay) }
      : null;
    const dates = form.isRecurring&&form.recurrenceUntil ? getRecurrenceDates(form.date,form.recurrencePattern,form.recurrenceUntil,nthWd) : [form.date];
    for(const d of dates){
      if(hasConflict(bookings,form.roomId,d,form.startTime,form.endTime)){setError("There's already a confirmed booking in "+(ROOMS[form.roomId].name)+" at that time on "+(formatDateShort(d))+".");return;}
    }
    onBook(form,dates);
  }

  const roomsBySite = SITES.reduce((acc,s)=>{
    const rooms=ROOM_LIST.filter(r=>r.site===s);
    if(rooms.length) acc[s]=rooms;
    return acc;
  },{});

  const selectedRoom = ROOMS[form.roomId];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:16,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:500,boxShadow:"0 24px 80px rgba(0,0,0,0.25)",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{background:CGL.blackcurrant,padding:"22px 24px 18px",borderRadius:"16px 16px 0 0",position:"sticky",top:0,zIndex:1}}>
          <div style={{fontSize:10,fontWeight:800,color:CGL.orchid,letterSpacing:1.5,marginBottom:4}}>WIRRAL WAYS</div>
          <div style={{color:"white",fontSize:19,fontWeight:800,marginBottom:2}}>Request a room</div>
          <div style={{fontSize:12,color:(CGL.lavender)+"cc"}}>Your request will go to an approver before it's confirmed. You'll get an email either way.</div>
        </div>
        <div style={{padding:24}}>
          {/* Who's booking */}
          <div style={{background:CGL.lavender+"44",borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:13}}>
            <span style={{fontWeight:700,color:CGL.blackcurrant}}>Booking as: </span>
            <span style={{color:"#444"}}>{currentUser.name} &bull; {currentUser.email}</span>
          </div>

          {/* Booking for someone else toggle */}
          <div style={{marginBottom:16}}>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 14px",background:form.bookingForOther?CGL.saffron+"15":CGL.lavender+"22",borderRadius:8,border:"1px solid "+(form.bookingForOther?CGL.saffron+"66":CGL.lavender)}}>
              <input type="checkbox" checked={form.bookingForOther} onChange={e=>set("bookingForOther",e.target.checked)} style={{width:17,height:17,accentColor:CGL.saffron}}/>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:form.bookingForOther?CGL.saffron:"#555"}}>I'm booking this for someone else</div>
                <div style={{fontSize:11,color:"#888"}}>The room will appear on their profile when they sign in</div>
              </div>
            </label>
            {form.bookingForOther&&(
              <div style={{marginTop:8,padding:"12px 14px",background:"white",borderRadius:8,border:"1.5px solid "+(CGL.saffron)+"55"}}>
                <label style={{...lbl,color:CGL.saffron}}>Their CGL email address *</label>
                <input
                  type="email"
                  value={form.bookingForEmail}
                  onChange={e=>set("bookingForEmail",e.target.value.toLowerCase())}
                  placeholder="firstname.lastname@cgl.org.uk"
                  style={inp}
                  onFocus={e=>e.target.style.borderColor=CGL.saffron}
                  onBlur={e=>e.target.style.borderColor=CGL.lavender}
                />
                {form.bookingForEmail.includes("@")&&(
                  <div style={{fontSize:11,color:CGL.saffron,marginTop:5,fontWeight:600}}>
                    Will show on: {nameFromEmail(form.bookingForEmail)}'s bookings
                  </div>
                )}
              </div>
            )}
          </div>

          {error&&<div style={{background:"#fdecea",color:CGL.raspberry,padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13,fontWeight:600}}>{error}</div>}

          <div style={{marginBottom:16}}>
            <label style={lbl}>Room</label>
            <select value={form.roomId} onChange={e=>set("roomId",e.target.value)} style={inp}>
              {Object.entries(roomsBySite).map(([site,rooms])=>(
                <optgroup key={site} label={site}>
                  {rooms.map(r=><option key={r.id} value={r.id}>{r.name} — {r.type}{r.staffOnly?" (staff only)":""}{r.capacity !== "TBC" ? " — up to "+(r.capacity) : ""}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedRoom&&(
            <div style={{background:selectedRoom.color+"10",border:"1px solid "+(selectedRoom.color)+"33",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#444",lineHeight:1.7}}>
              <span style={{fontWeight:700,color:selectedRoom.color}}>{selectedRoom.name}</span> &bull; Capacity: {selectedRoom.capacity} &bull; AV: {selectedRoom.av}
              {selectedRoom.staffOnly&&<span style={{marginLeft:8,background:CGL.lavender,color:CGL.amethyst,fontSize:10,fontWeight:800,padding:"1px 7px",borderRadius:10}}>STAFF ONLY</span>}
              {selectedRoom.notes&&<div style={{marginTop:3,color:"#444"}}>{selectedRoom.notes}</div>}
            </div>
          )}

          <div style={{marginBottom:16}}>
            <label style={lbl}>What's this booking for? *</label>
            <input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Group session, 1-to-1, Team meeting" style={inp}
              onFocus={e=>e.target.style.borderColor=CGL.blackcurrant} onBlur={e=>e.target.style.borderColor=CGL.lavender}/>
          </div>

          <div style={{marginBottom:16}}>
            <label style={lbl}>Date *</label>
            <input type="date" value={form.date} min={todayStr()} onChange={e=>set("date",e.target.value)} style={inp}/>
          </div>

          {/* Visual time picker */}
          <DaySchedulePicker
            date={form.date}
            roomId={form.roomId}
            bookings={bookings}
            startTime={form.startTime}
            endTime={form.endTime}
            onChange={(s,e)=>setForm(f=>({...f,startTime:s,endTime:e}))}
            currentUser={currentUser}
            onWaitlist={handleWaitlistFromForm}
          />

          <div style={{marginBottom:16}}>
            <label style={lbl}>Additional requirements <span style={{fontWeight:400,color:"#aaa",textTransform:"none",letterSpacing:0}}>(optional)</span></label>
            <textarea value={form.notes} onChange={e=>set("notes",e.target.value)}
              placeholder="e.g. Need projector set up, clinical session — no interruptions, tables in U-shape"
              rows={2}
              style={{...inp,resize:"vertical",lineHeight:1.5}}
              onFocus={e=>e.target.style.borderColor=CGL.blackcurrant}
              onBlur={e=>e.target.style.borderColor=CGL.lavender}
            />
          </div>

          <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:form.isRecurring?14:0,padding:"10px 14px",background:CGL.lavender+"33",borderRadius:8}}>
            <input type="checkbox" checked={form.isRecurring} onChange={e=>set("isRecurring",e.target.checked)} style={{width:17,height:17,accentColor:CGL.blackcurrant}}/>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:CGL.blackcurrant}}>Recurring booking</div>
              <div style={{fontSize:11,color:"#666"}}>Same time, multiple dates</div>
            </div>
          </label>

          {form.isRecurring&&(
            <div style={{background:CGL.grey,borderRadius:10,padding:16,marginTop:4}}>
              <div style={{marginBottom:12}}>
                <label style={lbl}>Repeat pattern</label>
                <select value={form.recurrencePattern} onChange={e=>set("recurrencePattern",e.target.value)} style={inp}>
                  <option value="weekly">Every week</option>
                  <option value="fortnightly">Every two weeks</option>
                  <option value="monthly">Same date each month</option>
                  <option value="nth_weekday">Specific day of the month</option>
                </select>
              </div>

              {/* Outlook-style nth weekday picker */}
              {form.recurrencePattern==="nth_weekday"&&(
                <div style={{marginBottom:12}}>
                  <label style={lbl}>Which day?</label>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:13,color:"#555",fontWeight:600}}>The</span>
                    <select value={form.nthWeekdayNth} onChange={e=>set("nthWeekdayNth",e.target.value)}
                      style={{...inp,width:"auto",padding:"9px 12px"}}>
                      <option value={1}>1st</option>
                      <option value={2}>2nd</option>
                      <option value={3}>3rd</option>
                      <option value={4}>4th</option>
                      <option value={-1}>Last</option>
                    </select>
                    <select value={form.nthWeekdayDay} onChange={e=>set("nthWeekdayDay",e.target.value)}
                      style={{...inp,width:"auto",padding:"9px 12px"}}>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                    <span style={{fontSize:13,color:"#555",fontWeight:600}}>of the month</span>
                  </div>
                  {/* Preview of what this means */}
                  {form.recurrenceUntil&&(()=>{
                    const nthWd={nth:parseInt(form.nthWeekdayNth),weekday:parseInt(form.nthWeekdayDay)};
                    const preview=getRecurrenceDates(form.date,"nth_weekday",form.recurrenceUntil,nthWd).slice(0,3);
                    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                    const nths={1:"1st",2:"2nd",3:"3rd",4:"4th","-1":"last"};
                    if(!preview.length) return null;
                    return (
                      <div style={{marginTop:8,background:CGL.blackcurrant+"10",borderRadius:7,padding:"8px 12px",fontSize:12,color:CGL.blackcurrant}}>
                        <strong>{nths[form.nthWeekdayNth]} {days[form.nthWeekdayDay]} of each month</strong>
                        <div style={{color:"#666",marginTop:3}}>
                          First few dates: {preview.map(d=>new Date(d+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})).join(" · ")}
                          {getRecurrenceDates(form.date,"nth_weekday",form.recurrenceUntil,nthWd).length>3&&" …"}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label style={lbl}>Repeat until</label>
                <input type="date" value={form.recurrenceUntil} min={form.date} onChange={e=>set("recurrenceUntil",e.target.value)} style={inp}/>
              </div>

              {/* Session count preview for non-nth patterns */}
              {form.recurrencePattern!=="nth_weekday"&&form.recurrenceUntil&&(()=>{
                const count=getRecurrenceDates(form.date,form.recurrencePattern,form.recurrenceUntil).length;
                return count>1?(
                  <div style={{marginTop:8,fontSize:12,color:CGL.blackcurrant,background:CGL.blackcurrant+"10",borderRadius:7,padding:"7px 12px"}}>
                    This will create <strong>{count} bookings</strong>
                  </div>
                ):null;
              })()}
            </div>
          )}
        </div>
        <div style={{padding:"16px 24px",borderTop:"1px solid "+(CGL.lavender),display:"flex",gap:10,justifyContent:"flex-end",position:"sticky",bottom:0,background:"white",borderRadius:"0 0 16px 16px"}}>
          <button onClick={onClose} style={{background:"transparent",color:"#888",border:"1px solid "+(CGL.lavender),borderRadius:8,padding:"10px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={submit} style={{background:"linear-gradient(135deg,"+(CGL.blackcurrant)+","+(CGL.amethyst)+")",color:"white",border:"none",borderRadius:8,padding:"10px 24px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>Submit request</button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
