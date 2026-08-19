// Shared inline style objects used by form-like components.
import { CGL } from "../data/rooms.js";

const inp = {width:"100%",padding:"11px 14px",borderRadius:8,border:"1.5px solid "+(CGL.lavender),fontFamily:"'Nunito',system-ui,sans-serif",fontSize:14,color:"#1a1a2e",background:"#fff",boxSizing:"border-box",outline:"none",transition:"border-color 0.2s"};
const lbl = {fontSize:11,fontWeight:700,color:CGL.blackcurrant,letterSpacing:0.8,marginBottom:5,display:"block",textTransform:"uppercase"};

export { inp, lbl };
