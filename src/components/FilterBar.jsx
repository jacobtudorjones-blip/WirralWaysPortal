import { CGL, SITE_COLOR, ROOM_LIST, SITES } from "../data/rooms.js";

function FilterBar({ filters, onChange }) {
  const availTypes = ["all",...Array.from(new Set(
    ROOM_LIST.filter(r=>filters.site==="all"||r.site===filters.site).map(r=>r.type)
  )).sort()];

  const chip = (active, color, label, onClick) => (
    <button onClick={onClick} style={{background:active?color:"white",color:active?"white":color,border:"1.5px solid "+(active?color:CGL.lavender),borderRadius:20,padding:"5px 13px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",fontFamily:"'Nunito',system-ui,sans-serif"}}>
      {label}
    </button>
  );

  return (
    <div style={{background:"white",borderRadius:12,padding:"16px 18px",marginBottom:16,border:"1px solid "+(CGL.lavender),boxShadow:"0 1px 4px rgba(94,27,109,0.06)"}}>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1.2,marginBottom:8,textTransform:"uppercase"}}>Site</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {chip(filters.site==="all",CGL.blackcurrant,"All sites",()=>onChange({...filters,site:"all",type:"all"}))}
          {SITES.map(s=>chip(filters.site===s,SITE_COLOR[s],s,()=>onChange({...filters,site:s,type:"all"})))}
        </div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1.2,marginBottom:8,textTransform:"uppercase"}}>Room type</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {availTypes.map(t=>chip(filters.type===t,CGL.ocean,t==="all"?"All types":t,()=>onChange({...filters,type:t})))}
        </div>
      </div>
      <div>
        <div style={{fontSize:10,fontWeight:800,color:CGL.blackcurrant,letterSpacing:1.2,marginBottom:8,textTransform:"uppercase"}}>Access</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {chip(filters.staffOnly==="all",CGL.blackcurrant,"All rooms",()=>onChange({...filters,staffOnly:"all"}))}
          {chip(filters.staffOnly==="public",CGL.raspberry,"Client accessible",()=>onChange({...filters,staffOnly:"public"}))}
          {chip(filters.staffOnly==="staff",CGL.amethyst,"Staff only",()=>onChange({...filters,staffOnly:"staff"}))}
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
