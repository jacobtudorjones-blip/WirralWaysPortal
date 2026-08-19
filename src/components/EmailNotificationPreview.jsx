import { CGL } from "../data/rooms.js";

function EmailNotificationPreview({ data, onClose }) {
  const { to, subject, body, type } = data;
  const headerColor = type==="rejected" ? CGL.raspberry : type==="confirmed" ? "#1a7a4a" : CGL.blackcurrant;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1001,padding:20,fontFamily:"'Nunito',system-ui,sans-serif"}}>
      <div style={{background:"white",borderRadius:16,maxWidth:520,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.3)",overflow:"hidden"}}>
        <div style={{background:headerColor,padding:"20px 24px",color:"white"}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,opacity:0.7,marginBottom:4}}>EMAIL SENT TO</div>
          <div style={{fontSize:13,fontWeight:700,opacity:0.9,marginBottom:8}}>{to}</div>
          <div style={{fontSize:17,fontWeight:800}}>{subject}</div>
        </div>
        <div style={{padding:"24px",fontSize:14,color:"#333",lineHeight:1.75,whiteSpace:"pre-line"}}>{body}</div>
        <div style={{padding:"14px 24px",borderTop:"1px solid "+(CGL.lavender),display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:"#aaa"}}>Emails are sent automatically via rooms@wirralways.org.uk.</div>
          <button onClick={onClose} style={{background:CGL.blackcurrant,color:"white",border:"none",borderRadius:8,padding:"9px 20px",cursor:"pointer",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default EmailNotificationPreview;
