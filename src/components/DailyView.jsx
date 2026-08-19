import { useState } from "react";
import { CGL, SITE_COLOR, ROOM_LIST, SITES } from "../data/rooms.js";
import { todayStr, formatTime } from "../lib/helpers.js";
import { slotToMins } from "../lib/slots.js";
import { inp } from "../styles/shared.js";
import BookingPopover from "./BookingPopover.jsx";

function DailyView({ bookings, onRequest, currentUser, onWaitlist, onApprove, onReject }) {
  const [date, setDate]       = useState(todayStr());
  const [site, setSite]       = useState("Price Street");
  const [typeFilter, setType] = useState("all");
  const [popover, setPopover] = useState(null);

  function handleBookingClick(e, bk) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right + 8 < window.innerWidth - 280 ? rect.right + 8 : rect.left - 260;
    const y = Math.min(rect.top, window.innerHeight - 320);
    setPopover({booking:bk, x, y});
  }

  const HOUR_SLOTS = [];
  for(let h=8;h<=18;h++) HOUR_SLOTS.push(h);
  const HALF_SLOTS = [];
  for(let h=8;h<19;h++){ HALF_SLOTS.push((String(h).padStart(2,"0"))+":00"); HALF_SLOTS.push((String(h).padStart(2,"0"))+":30"); }

  const siteRooms = ROOM_LIST.filter(r => r.site === site && (typeFilter==="all" || r.type===typeFilter));
  const availTypes = ["all", ...Array.from(new Set(ROOM_LIST.filter(r=>r.site===site).map(r=>r.type))).sort()];

  function getBooking(roomId, slotTime) {
    const sm = slotToMins(slotTime), em = sm+30;
    // confirmed takes priority over pending
    return bookings.find(b =>
      b.roomId===roomId && b.date===date &&
      (b.status==="confirmed"||b.status==="pending") &&
      slotToMins(b.startTime)<em && slotToMins(b.endTime)>sm
    );
  }
  function isFirstSlot(roomId, slotTime) {
    const bk = getBooking(roomId, slotTime);
    if(!bk) return false;
    return bk.startTime === slotTime;
  }
  function slotSpan(roomId, slotTime) {
    const bk = getBooking(roomId, slotTime);
    if(!bk) return 1;
    return Math.round((slotToMins(bk.endTime) - slotToMins(bk.startTime)) / 30);
  }
  function isFreeAllDay(roomId) {
    return !bookings.some(b => b.roomId===roomId && b.date===date && (b.status==="confirmed"||b.status==="pending"));
  }

  const chipStyle = (active, color) => ({
    background: active ? color : "white",
    color: active ? "white" : color,
    border: "1.5px solid "+(active ? color : CGL.lavender),
    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700,
    cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", transition: "all 0.12s"
  });

  return (
    <div style={{fontFamily:"'Nunito',system-ui,sans-serif"}}>
      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:800,color:CGL.blackcurrant,marginBottom:4}}>Daily view</div>
        <div style={{fontSize:14,color:"#333"}}>See all rooms at a site for a given day. Green = free, coloured = booked.</div>
      </div>

      {/* Controls */}
      <div style={{background:"white",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid "+(CGL.lavender),display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Date */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Date</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            style={{...inp,width:"auto",padding:"7px 12px",fontSize:13}}/>
        </div>
        {/* Site */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Site</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SITES.map(s=>(
              <button key={s} style={chipStyle(site===s,SITE_COLOR[s])} onClick={()=>{setSite(s);setType("all");}}>{s}</button>
            ))}
          </div>
        </div>
        {/* Room type */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Room type</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {availTypes.map(t=>(
              <button key={t} style={chipStyle(typeFilter===t,CGL.ocean)} onClick={()=>setType(t)}>{t==="all"?"All types":t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        {[
          {label:"Total rooms", val:siteRooms.length, color:CGL.blackcurrant},
          {label:"Free all day", val:siteRooms.filter(r=>isFreeAllDay(r.id)).length, color:"#1a7a4a"},
          {label:"Has bookings", val:siteRooms.filter(r=>!isFreeAllDay(r.id)).length, color:CGL.raspberry},
        ].map(s=>(
          <div key={s.label} style={{background:"white",borderRadius:10,padding:"10px 16px",border:"1px solid "+(CGL.lavender),textAlign:"center",minWidth:80}}>
            <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#444",fontWeight:700}}>{s.label}</div>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:"auto",flexWrap:"wrap"}}>
          {[
            {bg:"#dcfce7",border:"#86efac",label:"Free"},
            {bg:SITE_COLOR[site]+"33",border:SITE_COLOR[site],label:"Confirmed"},
            {bg:"#fff3cd",border:"#ffc107",label:"Awaiting approval"},
            {bg:CGL.grey,border:CGL.lavender,label:"Outside hours"},
          ].map(l=>(
            <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:14,height:14,borderRadius:3,background:l.bg,border:"1.5px solid "+(l.border)}}/>
              <span style={{fontSize:11,color:"#444",fontWeight:600}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {siteRooms.length===0 && (
        <div style={{textAlign:"center",padding:40,background:"white",borderRadius:14,border:"1px solid "+(CGL.lavender),color:"#555"}}>No rooms match your filters.</div>
      )}

      {siteRooms.length>0 && (
        <div style={{background:"white",borderRadius:14,border:"1px solid "+(CGL.lavender),overflow:"auto",boxShadow:"0 2px 12px rgba(94,27,109,0.06)"}}>
          {/* Date heading above table */}
          <div style={{padding:"14px 18px 10px",borderBottom:"1px solid "+(CGL.lavender),display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:SITE_COLOR[site],flexShrink:0}}/>
            <div style={{fontWeight:800,fontSize:17,color:CGL.blackcurrant}}>
              {new Date(date+"T00:00:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
            </div>
            <div style={{marginLeft:"auto",fontSize:12,color:"#aaa",fontWeight:600}}>{site}</div>
          </div>
          {/* Grid */}
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:700}}>
            <thead>
              <tr style={{background:CGL.blackcurrant}}>
                {/* Room name col */}
                <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:800,color:CGL.orchid,letterSpacing:0.8,width:160,position:"sticky",left:0,background:CGL.blackcurrant,zIndex:2,borderRight:"1px solid "+(CGL.amethyst)+"44"}}>
                  ROOM
                </th>
                {/* Hour headers */}
                {HOUR_SLOTS.map(h=>(
                  <th key={h} colSpan={2} style={{padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:800,color:CGL.orchid,letterSpacing:0.5,borderLeft:"1px solid "+(CGL.amethyst)+"33",minWidth:64}}>
                    {formatTime((String(h).padStart(2,"0"))+":00")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {siteRooms.map((room,ri)=>{
                const rowBg = ri%2===0 ? "white" : "#faf8fd";
                // Build cells — we need to skip slots that are covered by a booking span
                const skipSlots = new Set();
                return (
                  <tr key={room.id} style={{borderBottom:"1px solid "+(CGL.lavender)}}>
                    {/* Room name */}
                    <td style={{padding:"8px 14px",position:"sticky",left:0,background:rowBg,zIndex:1,borderRight:"1px solid "+(CGL.lavender),width:160}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {room.icon&&<span style={{fontSize:15}}>{room.icon}</span>}
                        <div>
                          <div style={{fontWeight:800,fontSize:12,color:room.color,lineHeight:1.2}}>{room.name}</div>
                          <div style={{fontSize:10,color:"#555",fontWeight:600}}>{room.type}</div>
                          {room.staffOnly&&<div style={{fontSize:9,color:CGL.amethyst,fontWeight:700}}>Staff only</div>}
                        </div>
                      </div>
                    </td>
                    {/* Time slots */}
                    {HALF_SLOTS.map((slot,si)=>{
                      if(skipSlots.has(si)) return null;
                      const bk = getBooking(room.id, slot);
                      if(bk && isFirstSlot(room.id, slot)) {
                        const span = slotSpan(room.id, slot);
                        for(let x=1;x<span;x++) skipSlots.add(si+x);
                        const isPendingBk = bk.status === "pending";
                        return (
                          <td key={slot} colSpan={span}
                            onClick={e=>handleBookingClick(e,bk)}
                            style={{background:isPendingBk?"#fff3cd":room.color+"28",borderLeft:"2px solid "+(isPendingBk?"#d4a017":room.color),padding:"3px 6px",verticalAlign:"middle",cursor:"pointer"}}>
                            <div style={{fontSize:10,fontWeight:800,color:isPendingBk?"#7a5c00":room.color,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                              {isPendingBk?"⏳ ":""}{bk.title}
                            </div>
                            <div style={{fontSize:9,color:isPendingBk?"#7a5c00":room.color,fontWeight:600,whiteSpace:"nowrap"}}>
                              {bk.bookedBy.split(" ")[0]} &bull; {formatTime(bk.startTime)}–{formatTime(bk.endTime)}{isPendingBk?" · Pending":""}
                            </div>
                          </td>
                        );
                      } else if(bk) {
                        return null; // covered by colspan
                      } else {
                        return (
                          <td key={slot}
                            title={(room.name)+" — "+(formatTime(slot))}
                            onClick={()=>onRequest(room.id)}
                            style={{background:"#dcfce7",borderLeft:slot.endsWith(":00")?"1px solid "+(CGL.lavender):"1px dashed "+(CGL.lavender)+"44",cursor:"pointer",transition:"background 0.1s",minWidth:32}}
                            onMouseOver={e=>e.currentTarget.style.background="#bbf7d0"}
                            onMouseOut={e=>e.currentTarget.style.background="#dcfce7"}>
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{fontSize:11,color:"#555",marginTop:8,fontWeight:600}}>Tip: click any green slot to request that room. Click any booking to view details{currentUser?.isApprover?" or approve/reject":""} .</div>

      {popover&&(
        <BookingPopover
          booking={popover.booking}
          isApprover={currentUser?.isApprover}
          onApprove={(id)=>{onApprove(id);setPopover(null);}}
          onReject={(id,note)=>{onReject(id,note);setPopover(null);}}
          onClose={()=>setPopover(null)}
          style={{left:popover.x,top:popover.y}}
        />
      )}
    </div>
  );
}

export default DailyView;
