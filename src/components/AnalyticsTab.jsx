import { useState } from "react";
import { CGL, SITE_COLOR, ROOMS, SITES } from "../data/rooms.js";
import { formatTime } from "../lib/helpers.js";
import { lbl } from "../styles/shared.js";

function AnalyticsTab({ bookings }) {
  const [site, setSite] = useState("all");
  const [period, setPeriod] = useState("all");

  const now = new Date();
  const periodStart = period==="30d" ? new Date(now-30*86400000).toISOString().slice(0,10)
                    : period==="90d" ? new Date(now-90*86400000).toISOString().slice(0,10) : null;

  const past = bookings.filter(b=>{
    if(b.status!=="confirmed"&&b.status!=="unused") return false;
    if(b.date >= now.toISOString().slice(0,10)) return false;
    if(site!=="all"&&ROOMS[b.roomId]?.site!==site) return false;
    if(periodStart&&b.date<periodStart) return false;
    return true;
  });

  const total = past.length;
  const checkedIn = past.filter(b=>b.checkedIn).length;
  const used = past.filter(b=>b.usageStatus==="used").length;
  const unused = past.filter(b=>b.usageStatus==="unused").length;
  const unknown = total - checkedIn - used - unused;
  const checkInRate = total ? Math.round(checkedIn/total*100) : 0;
  const usedRate = total ? Math.round((checkedIn+used)/total*100) : 0;

  // Peak times
  const byHour = {};
  past.forEach(b=>{ const h=parseInt(b.startTime); byHour[h]=(byHour[h]||0)+1; });
  const peakHour = Object.entries(byHour).sort((a,b)=>b[1]-a[1])[0];

  // Peak days
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const byDay = {};
  past.forEach(b=>{ const d=new Date(b.date+"T00:00:00").getDay(); byDay[d]=(byDay[d]||0)+1; });
  const peakDay = Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];

  // Popular rooms
  const byRoom = {};
  past.forEach(b=>{ byRoom[b.roomId]=(byRoom[b.roomId]||0)+1; });
  const topRooms = Object.entries(byRoom).sort((a,b)=>b[1]-a[1]).slice(0,8);

  const chipStyle = (active, color="#5e1b6d") => ({
    background:active?color:"white", color:active?"white":color,
    border:"1.5px solid "+(active?color:CGL.lavender),
    borderRadius:20, padding:"4px 13px", fontSize:11, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s",
  });

  const statCard = (val, label, color, sub) => (
    <div style={{background:"white",borderRadius:12,padding:"16px 18px",border:"1px solid "+(CGL.lavender),flex:1,minWidth:120}}>
      <div style={{fontSize:28,fontWeight:800,color}}>{val}</div>
      <div style={{fontSize:12,fontWeight:700,color:"#555",marginTop:2}}>{label}</div>
      {sub&&<div style={{fontSize:11,color:"#aaa",marginTop:2}}>{sub}</div>}
    </div>
  );

  return (
    <div style={{fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:800,color:CGL.blackcurrant,marginBottom:4}}>Analytics</div>
        <div style={{fontSize:14,color:"#666"}}>Room usage patterns based on past confirmed bookings.</div>
      </div>

      {/* Filters */}
      <div style={{background:"white",borderRadius:12,padding:"14px 16px",marginBottom:16,border:"1px solid "+(CGL.lavender),display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Site</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button style={chipStyle(site==="all")} onClick={()=>setSite("all")}>All sites</button>
            {SITES.map(s=><button key={s} style={chipStyle(site===s,SITE_COLOR[s])} onClick={()=>setSite(s)}>{s}</button>)}
          </div>
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Period</div>
          <div style={{display:"flex",gap:6}}>
            {[["all","All time"],["90d","Last 90 days"],["30d","Last 30 days"]].map(([v,l])=>(
              <button key={v} style={chipStyle(period===v)} onClick={()=>setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {total===0?(
        <div style={{textAlign:"center",padding:"60px 20px",background:"white",borderRadius:14,border:"1px solid "+(CGL.lavender),color:"#aaa"}}>
          <div style={{fontSize:32,marginBottom:10}}>📊</div>
          <div style={{fontSize:15,fontWeight:700}}>No past bookings to analyse yet.</div>
          <div style={{fontSize:13,marginTop:6}}>Data will appear once bookings have passed.</div>
        </div>
      ):(
        <>
          {/* Summary stats */}
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
            {statCard(total,         "Total bookings",  CGL.blackcurrant)}
            {statCard(checkedIn,     "Checked in",      "#1a7a4a",      (checkInRate)+"% rate")}
            {statCard(used,          "Confirmed used",  CGL.ocean,       "Self-reported")}
            {statCard(unused,        "Not used",        CGL.raspberry,   "Self-reported")}
            {statCard(unknown,       "Unknown",         "#aaa",          "No response")}
          </div>

          {/* Usage rate bar */}
          <div style={{background:"white",borderRadius:14,padding:"18px 20px",marginBottom:16,border:"1px solid "+(CGL.lavender)}}>
            <div style={{fontSize:13,fontWeight:800,color:CGL.blackcurrant,marginBottom:10}}>Usage breakdown</div>
            <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:28,marginBottom:8}}>
              {checkedIn>0&&<div style={{flex:checkedIn,background:"#1a7a4a",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"white",fontWeight:800}}>{checkedIn}</span></div>}
              {used>0&&<div style={{flex:used,background:CGL.ocean,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"white",fontWeight:800}}>{used}</span></div>}
              {unused>0&&<div style={{flex:unused,background:CGL.raspberry,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"white",fontWeight:800}}>{unused}</span></div>}
              {unknown>0&&<div style={{flex:unknown,background:"#e0e0e0",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:10,color:"#888",fontWeight:800}}>{unknown}</span></div>}
            </div>
            <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
              {[["#1a7a4a","Checked in"],["#0081c1","Used (self-reported)"],["#b52372","Not used"],["#e0e0e0","Unknown"]].map(([col,lbl])=>(
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                  <span style={{fontSize:11,color:"#666",fontWeight:600}}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14,marginBottom:16}}>
            {/* Peak times */}
            <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid "+(CGL.lavender)}}>
              <div style={{fontSize:13,fontWeight:800,color:CGL.blackcurrant,marginBottom:12}}>Bookings by hour</div>
              {Object.entries(byHour).sort((a,b)=>parseInt(a[0])-parseInt(b[0])).map(([h,cnt])=>(
                <div key={h} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <div style={{fontSize:11,color:"#888",width:48,fontWeight:700,flexShrink:0}}>{formatTime((String(h).padStart(2,"0"))+":00")}</div>
                  <div style={{flex:1,background:CGL.lavender,borderRadius:4,height:14,overflow:"hidden"}}>
                    <div style={{width:(Math.round(cnt/Math.max(...Object.values(byHour))*100))+"%",background:CGL.blackcurrant,height:"100%",borderRadius:4,transition:"width 0.3s"}}/>
                  </div>
                  <div style={{fontSize:11,color:"#555",fontWeight:700,width:24,textAlign:"right"}}>{cnt}</div>
                </div>
              ))}
              {peakHour&&<div style={{marginTop:10,fontSize:12,color:CGL.blackcurrant,fontWeight:700}}>📈 Peak: {formatTime((String(peakHour[0]).padStart(2,"0"))+":00")} ({peakHour[1]} bookings)</div>}
            </div>

            {/* Peak days */}
            <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid "+(CGL.lavender)}}>
              <div style={{fontSize:13,fontWeight:800,color:CGL.blackcurrant,marginBottom:12}}>Bookings by day</div>
              {[1,2,3,4,5,6,0].map(d=>{
                const cnt = byDay[d]||0;
                const max = Math.max(...Object.values(byDay),1);
                return (
                  <div key={d} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                    <div style={{fontSize:11,color:"#888",width:32,fontWeight:700,flexShrink:0}}>{DAYS[d].slice(0,3)}</div>
                    <div style={{flex:1,background:CGL.lavender,borderRadius:4,height:14,overflow:"hidden"}}>
                      <div style={{width:(Math.round(cnt/max*100))+"%",background:CGL.amethyst,height:"100%",borderRadius:4,transition:"width 0.3s"}}/>
                    </div>
                    <div style={{fontSize:11,color:"#555",fontWeight:700,width:24,textAlign:"right"}}>{cnt}</div>
                  </div>
                );
              })}
              {peakDay&&<div style={{marginTop:10,fontSize:12,color:CGL.blackcurrant,fontWeight:700}}>📈 Peak: {DAYS[parseInt(peakDay[0])]} ({peakDay[1]} bookings)</div>}
            </div>
          </div>

          {/* Popular rooms */}
          <div style={{background:"white",borderRadius:14,padding:"18px 20px",border:"1px solid "+(CGL.lavender)}}>
            <div style={{fontSize:13,fontWeight:800,color:CGL.blackcurrant,marginBottom:12}}>Most used rooms</div>
            {topRooms.map(([roomId,cnt],i)=>{
              const room = ROOMS[roomId];
              if(!room) return null;
              const roomPast = past.filter(b=>b.roomId===roomId);
              const roomChecked = roomPast.filter(b=>b.checkedIn).length;
              const roomUsed = roomPast.filter(b=>b.usageStatus==="used").length;
              const roomUnused = roomPast.filter(b=>b.usageStatus==="unused").length;
              return (
                <div key={roomId} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<topRooms.length-1?"1px solid "+(CGL.lavender):"none"}}>
                  <div style={{fontSize:22,width:30,textAlign:"center"}}>{room.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div>
                        <span style={{fontWeight:800,fontSize:13,color:room.color}}>{room.name}</span>
                        <span style={{fontSize:11,color:"#aaa",marginLeft:6}}>{room.site}</span>
                      </div>
                      <span style={{fontSize:12,fontWeight:800,color:CGL.blackcurrant}}>{cnt} bookings</span>
                    </div>
                    <div style={{display:"flex",borderRadius:4,overflow:"hidden",height:8}}>
                      {roomChecked>0&&<div style={{flex:roomChecked,background:"#1a7a4a"}}/>}
                      {roomUsed>0&&<div style={{flex:roomUsed,background:CGL.ocean}}/>}
                      {roomUnused>0&&<div style={{flex:roomUnused,background:CGL.raspberry}}/>}
                      {(cnt-roomChecked-roomUsed-roomUnused)>0&&<div style={{flex:cnt-roomChecked-roomUsed-roomUnused,background:"#e0e0e0"}}/>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default AnalyticsTab;
