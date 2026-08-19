import { useState } from "react";
import { CGL, SITE_COLOR, ROOM_LIST, SITES } from "../data/rooms.js";
import { todayStr, formatDateShort, formatTime } from "../lib/helpers.js";
import { slotToMins } from "../lib/slots.js";
import BookingPopover from "./BookingPopover.jsx";

function WeeklyView({ bookings, onRequest, currentUser, onWaitlist, onApprove, onReject }) {
  // Default to current week Mon
  function getWeekStart(d) {
    const dt = new Date(d+"T00:00:00");
    const day = dt.getDay();
    const diff = (day===0?-6:1-day);
    const mon = new Date(dt); mon.setDate(dt.getDate()+diff);
    return mon.toISOString().slice(0,10);
  }
  const [weekStart, setWeekStart] = useState(()=>getWeekStart(todayStr()));
  const [site, setSite]           = useState("Price Street");
  const [typeFilter, setType]     = useState("all");
  const [popover, setPopover]     = useState(null); // {booking, x, y}

  // Build 7 days Mon-Sun
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart+"T00:00:00");
    d.setDate(d.getDate()+i);
    return d.toISOString().slice(0,10);
  });

  const siteRooms   = ROOM_LIST.filter(r=>r.site===site&&(typeFilter==="all"||r.type===typeFilter));
  const availTypes  = ["all",...Array.from(new Set(ROOM_LIST.filter(r=>r.site===site).map(r=>r.type))).sort()];
  const DAY_ABBR    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const today       = todayStr();

  function prevWeek(){ const d=new Date(weekStart+"T00:00:00"); d.setDate(d.getDate()-7); setWeekStart(d.toISOString().slice(0,10)); }
  function nextWeek(){ const d=new Date(weekStart+"T00:00:00"); d.setDate(d.getDate()+7); setWeekStart(d.toISOString().slice(0,10)); }
  function goToday() { setWeekStart(getWeekStart(todayStr())); }

  function getBookingsForCell(roomId, date) {
    return bookings.filter(b=>b.roomId===roomId&&b.date===date&&(b.status==="confirmed"||b.status==="pending"));
  }

  function handleCellClick(e, bk) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Position popover: prefer right, fall back to left if near right edge
    const x = rect.right + 8 < window.innerWidth - 280 ? rect.right + 8 : rect.left - 260;
    const y = Math.min(rect.top, window.innerHeight - 320);
    setPopover({booking:bk, x, y});
  }

  const chipStyle = (active,color="#5e1b6d")=>({
    background:active?color:"white",color:active?"white":color,
    border:"1.5px solid "+(active?color:CGL.lavender),
    borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,
    cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
  });

  // Week label
  const weekEnd = days[6];
  const weekLabel = new Date(weekStart+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short"})
    + " – " + new Date(weekEnd+"T00:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});

  return (
    <div style={{fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:800,color:CGL.blackcurrant,marginBottom:4}}>Weekly view</div>
        <div style={{fontSize:14,color:"#444"}}>All rooms at a site across the week. Click any booking to approve or view details.</div>
      </div>

      {/* Controls */}
      <div style={{background:"white",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid "+CGL.lavender,display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Week nav */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Week</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={prevWeek} style={{background:"white",border:"1.5px solid "+CGL.lavender,borderRadius:7,padding:"6px 11px",cursor:"pointer",fontWeight:800,fontSize:13,color:CGL.blackcurrant,fontFamily:"inherit"}}>‹</button>
            <div style={{fontWeight:700,fontSize:13,color:"#1a1a2e",minWidth:170,textAlign:"center"}}>{weekLabel}</div>
            <button onClick={nextWeek} style={{background:"white",border:"1.5px solid "+CGL.lavender,borderRadius:7,padding:"6px 11px",cursor:"pointer",fontWeight:800,fontSize:13,color:CGL.blackcurrant,fontFamily:"inherit"}}>›</button>
            <button onClick={goToday} style={{background:CGL.lavender,color:CGL.blackcurrant,border:"none",borderRadius:7,padding:"6px 12px",cursor:"pointer",fontWeight:700,fontSize:11,fontFamily:"inherit"}}>Today</button>
          </div>
        </div>
        {/* Site */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Site</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SITES.map(s=><button key={s} style={chipStyle(site===s,SITE_COLOR[s])} onClick={()=>{setSite(s);setType("all");}}>{s}</button>)}
          </div>
        </div>
        {/* Type */}
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Room type</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {availTypes.map(t=><button key={t} style={chipStyle(typeFilter===t,CGL.ocean)} onClick={()=>setType(t)}>{t==="all"?"All types":t}</button>)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
        {[
          {bg:SITE_COLOR[site]+"28",border:SITE_COLOR[site],label:"Confirmed"},
          {bg:"#fff3cd",border:"#d4a017",label:"Awaiting approval"},
          {bg:"#dcfce7",border:"#4ade80",label:"Free (click to book)"},
        ].map(l=>(
          <div key={l.label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:12,height:12,borderRadius:3,background:l.bg,border:"1.5px solid "+l.border}}/>
            <span style={{fontSize:11,color:"#444",fontWeight:600}}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {siteRooms.length===0?(
        <div style={{textAlign:"center",padding:40,background:"white",borderRadius:14,border:"1px solid "+CGL.lavender,color:"#666"}}>No rooms match your filters.</div>
      ):(
        <div style={{background:"white",borderRadius:14,border:"1px solid "+CGL.lavender,overflow:"auto",boxShadow:"0 2px 12px rgba(94,27,109,0.06)"}}>
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:600}}>
            <thead>
              <tr style={{background:CGL.blackcurrant}}>
                <th style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:800,color:"#e8d5f0",letterSpacing:0.8,width:150,position:"sticky",left:0,background:CGL.blackcurrant,zIndex:2,borderRight:"1px solid rgba(255,255,255,0.15)"}}>
                  ROOM
                </th>
                {days.map((d,i)=>{
                  const isToday = d===today;
                  const dt = new Date(d+"T00:00:00");
                  return (
                    <th key={d} style={{padding:"8px 6px",textAlign:"center",fontSize:11,fontWeight:800,color:isToday?"#fbbf24":"#e8d5f0",borderLeft:"1px solid rgba(255,255,255,0.1)",minWidth:100,background:isToday?CGL.amethyst:CGL.blackcurrant}}>
                      <div>{DAY_ABBR[i]}</div>
                      <div style={{fontSize:13,fontWeight:800,color:isToday?"#fef3c7":"white"}}>{dt.getDate()}</div>
                      {isToday&&<div style={{fontSize:9,color:"#fbbf24",letterSpacing:0.5}}>TODAY</div>}
                    </th>
                  );
                })}
              </tr>
              {/* Day summary row */}
              <tr style={{background:"#f5f0fb",borderBottom:"2px solid "+CGL.lavender}}>
                <td style={{padding:"8px 12px",position:"sticky",left:0,background:"#f5f0fb",zIndex:1,borderRight:"1px solid "+CGL.lavender}}>
                  <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:0.8,textTransform:"uppercase"}}>Day overview</div>
                  <div style={{fontSize:9,color:"#555",fontWeight:600,marginTop:1}}>08:00 – 19:00</div>
                </td>
                {days.map(d=>{
                  const isToday = d===today;
                  const DAY_START = 8*60;   // 480 mins
                  const DAY_END   = 19*60;  // 1140 mins
                  const DAY_SPAN  = DAY_END - DAY_START; // 660 mins
                  const bookedCount = siteRooms.filter(r=>
                    bookings.some(b=>b.roomId===r.id&&b.date===d&&(b.status==="confirmed"||b.status==="pending"))
                  ).length;
                  const freeCount = siteRooms.length - bookedCount;
                  return (
                    <td key={d} style={{padding:"6px 6px",borderLeft:"1px solid "+CGL.lavender,background:isToday?"#ede8f8":"#f5f0fb",verticalAlign:"top",minWidth:100}}>
                      {/* Fraction summary */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant}}>{bookedCount}/{siteRooms.length} booked</span>
                        {freeCount>0
                          ? <span style={{fontSize:9,color:"#1a7a4a",fontWeight:700}}>{freeCount} free</span>
                          : <span style={{fontSize:9,color:CGL.raspberry,fontWeight:700}}>Full</span>
                        }
                      </div>
                      {/* Per-room mini Gantt */}
                      <div style={{display:"flex",flexDirection:"column",gap:2}}>
                        {siteRooms.map(r=>{
                          const roomBks = bookings.filter(b=>b.roomId===r.id&&b.date===d&&(b.status==="confirmed"||b.status==="pending"));
                          return (
                            <div key={r.id} style={{position:"relative",height:6,borderRadius:3,background:"#e2d9f0",overflow:"hidden"}} title={r.name}>
                              {roomBks.map(bk=>{
                                const sMin = slotToMins(bk.startTime);
                                const eMin = slotToMins(bk.endTime);
                                const left = Math.max(0,((sMin-DAY_START)/DAY_SPAN)*100);
                                const width = Math.min(100-left,((eMin-sMin)/DAY_SPAN)*100);
                                const isPending = bk.status==="pending";
                                return (
                                  <div key={bk.id} style={{
                                    position:"absolute",top:0,height:"100%",
                                    left:left+"%",width:width+"%",
                                    background:isPending?"#d4a017":r.color,
                                    borderRadius:3,minWidth:2
                                  }} title={(isPending?"Pending: ":"")+bk.title+" "+bk.startTime+"–"+bk.endTime}/>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      {/* Hour tick marks */}
                      <div style={{position:"relative",height:8,marginTop:3}}>
                        {[8,10,12,14,16,18].map(h=>{
                          const left = ((h*60-DAY_START)/DAY_SPAN)*100;
                          return (
                            <div key={h} style={{position:"absolute",left:left+"%",top:0,fontSize:7,color:"#888",fontWeight:600,transform:"translateX(-50%)",lineHeight:1}}>
                              {h}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {siteRooms.map((room,ri)=>{
                const rowBg = ri%2===0?"white":"#faf8fd";
                return (
                  <tr key={room.id} style={{borderBottom:"1px solid "+CGL.lavender}}>
                    <td style={{padding:"8px 12px",position:"sticky",left:0,background:rowBg,zIndex:1,borderRight:"1px solid "+CGL.lavender}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {room.icon&&<span style={{fontSize:14}}>{room.icon}</span>}
                        <div>
                          <div style={{fontWeight:800,fontSize:12,color:room.color,lineHeight:1.2}}>{room.name}</div>
                          <div style={{fontSize:10,color:"#555",fontWeight:600}}>{room.type}</div>
                        </div>
                      </div>
                    </td>
                    {days.map(d=>{
                      const cellBks = getBookingsForCell(room.id, d);
                      const isToday = d===today;
                      return (
                        <td key={d} style={{verticalAlign:"top",padding:3,background:isToday?"#faf5ff":rowBg,borderLeft:"1px solid "+CGL.lavender,minWidth:100}}>
                          {cellBks.length===0?(
                            <div
                              onClick={()=>onRequest(room.id)}
                              style={{height:52,borderRadius:6,background:"#dcfce7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.1s"}}
                              onMouseOver={e=>e.currentTarget.style.background="#bbf7d0"}
                              onMouseOut={e=>e.currentTarget.style.background="#dcfce7"}
                              title={"Book "+room.name+" on "+formatDateShort(d)}>
                              <span style={{fontSize:16,opacity:0.5}}>+</span>
                            </div>
                          ):(
                            <div style={{display:"flex",flexDirection:"column",gap:2}}>
                              {cellBks.map(bk=>{
                                const isPendingBk = bk.status==="pending";
                                return (
                                  <div key={bk.id}
                                    onClick={e=>handleCellClick(e,bk)}
                                    style={{borderRadius:6,padding:"4px 6px",
                                      background:isPendingBk?"#fff3cd":room.color+"22",
                                      border:"1.5px solid "+(isPendingBk?"#d4a017":room.color),
                                      cursor:"pointer",transition:"opacity 0.1s"}}
                                    onMouseOver={e=>e.currentTarget.style.opacity="0.8"}
                                    onMouseOut={e=>e.currentTarget.style.opacity="1"}>
                                    <div style={{fontSize:10,fontWeight:800,color:isPendingBk?"#7a5c00":room.color,lineHeight:1.3,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:90}}>
                                      {isPendingBk?"⏳ ":""}{bk.title}
                                    </div>
                                    <div style={{fontSize:9,color:isPendingBk?"#7a5c00":room.color,fontWeight:600}}>
                                      {formatTime(bk.startTime)}–{formatTime(bk.endTime)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{fontSize:11,color:"#555",marginTop:8,fontWeight:600}}>Tip: click any green cell to request that room. Click any booking to view details{currentUser?.isApprover?" or approve/reject":""} .</div>

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

export default WeeklyView;
