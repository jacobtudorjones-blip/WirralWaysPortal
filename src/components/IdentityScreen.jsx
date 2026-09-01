import { useState } from "react";
import { CGL, APPROVERS } from "../data/rooms.js";
import { norm } from "../lib/helpers.js";
import { nameFromEmail } from "../lib/nameFromEmail.js";
import { listRows } from "../lib/staffApi.js";
import { inp, lbl } from "../styles/shared.js";

function IdentityScreen({ onIdentify }) {
  const [email, setEmail] = useState("");
  const [err,   setErr]   = useState("");
  const [checking, setChecking] = useState(false);

  async function proceed() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setErr("Please enter your work email address."); return; }
    if (!trimmed.endsWith("@cgl.org.uk")) { setErr("Please use your CGL email address — it should end in @cgl.org.uk."); return; }
    if (!/^[^\s@]+@cgl\.org\.uk$/.test(trimmed)) { setErr("That doesn't look like a valid CGL email address."); return; }
    const parsedName = nameFromEmail(trimmed);
    let isApprover = APPROVERS.some(a => norm(a.email) === norm(trimmed));
    // Also check the Staff Portal directory (staff_users, role='admin') —
    // so admins added there (including via bulk-add) get approver rights
    // here too, without needing a separate edit to the hardcoded list
    // above. Additive only, and fails silently to APPROVERS-only if the
    // staff_users table doesn't exist yet or Supabase is unreachable —
    // this must never block someone from continuing to the app.
    if (!isApprover) {
      setChecking(true);
      try {
        const rows = await listRows("staff_users", "?select=role&email=eq."+encodeURIComponent(trimmed)+"&active=is.true");
        if (rows[0]?.role === "admin") isApprover = true;
      } catch (e) { console.error("Staff directory approver check failed (falling back to APPROVERS only)", e); }
      setChecking(false);
    }
    onIdentify({ name: parsedName, email: trimmed, isApprover });
  }

  const parsedPreview = email.includes("@") ? nameFromEmail(email) : "";

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg, "+(CGL.blackcurrant)+" 0%, #3d0f47 60%, #1a0820 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{position:"fixed",top:-120,right:-120,width:400,height:400,borderRadius:"50%",background:(CGL.neon)+"18",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:-80,left:-80,width:300,height:300,borderRadius:"50%",background:(CGL.saffron)+"14",pointerEvents:"none"}}/>

      <div style={{background:"rgba(255,255,255,0.97)",borderRadius:20,maxWidth:420,width:"100%",overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}}>
        <div style={{background:CGL.blackcurrant,padding:"32px 32px 28px",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-30,right:-30,width:140,height:140,borderRadius:"50%",background:(CGL.neon)+"20"}}/>
          <div style={{position:"absolute",bottom:-20,left:-20,width:100,height:100,borderRadius:"50%",background:(CGL.saffron)+"20"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:56,height:56,borderRadius:14,background:(CGL.neon)+"22",border:"2px solid "+(CGL.neon)+"44",marginBottom:14}}>
              <span style={{fontSize:26}}>🏢</span>
            </div>
            <div style={{color:CGL.white,fontSize:22,fontWeight:800,letterSpacing:-0.5,marginBottom:4}}>Wirral Ways</div>
            <div style={{color:CGL.orchid,fontSize:13,fontWeight:600,letterSpacing:1.5}}>ROOM BOOKING</div>
          </div>
        </div>

        <div style={{padding:"32px 32px 28px"}}>
          <div style={{fontSize:18,fontWeight:800,color:CGL.blackcurrant,marginBottom:6}}>Welcome</div>
          <div style={{fontSize:14,color:"#666",marginBottom:24,lineHeight:1.6}}>Enter your CGL email address to get started. We'll pick up your name automatically.</div>

          {err&&<div style={{background:"#fdecea",color:"#b71c1c",padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13,fontWeight:600}}>{err}</div>}

          <div style={{marginBottom: parsedPreview ? 10 : 24}}>
            <label style={lbl}>Work email</label>
            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&proceed()}
              placeholder="firstname.lastname@cgl.org.uk"
              style={inp}
              onFocus={e=>e.target.style.borderColor=CGL.blackcurrant}
              onBlur={e=>e.target.style.borderColor=CGL.lavender}
              autoFocus
            />
          </div>

          {/* Live name preview */}
          {parsedPreview && (
            <div style={{background:CGL.lavender+"55",border:"1px solid "+(CGL.lavender),borderRadius:8,padding:"10px 14px",marginBottom:24,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>👋</span>
              <div>
                <div style={{fontSize:12,color:CGL.blackcurrant,fontWeight:700}}>We'll book as:</div>
                <div style={{fontSize:15,fontWeight:800,color:CGL.blackcurrant}}>{parsedPreview}</div>
              </div>
            </div>
          )}

          <button onClick={proceed} disabled={checking} style={{width:"100%",background:"linear-gradient(135deg, "+(CGL.blackcurrant)+", "+(CGL.amethyst)+")",color:CGL.white,border:"none",borderRadius:10,padding:"14px 0",fontSize:15,fontWeight:800,cursor:checking?"default":"pointer",letterSpacing:0.3,transition:"opacity 0.2s",opacity:checking?0.7:1}}
            onMouseOver={e=>{if(!checking)e.target.style.opacity="0.9";}} onMouseOut={e=>{if(!checking)e.target.style.opacity="1";}}>
            {checking?"Checking…":"Continue →"}
          </button>
          <div style={{textAlign:"center",fontSize:12,color:"#999",marginTop:16}}>Your email is used only to manage your bookings.</div>
        </div>
      </div>
    </div>
  );
}

export default IdentityScreen;
