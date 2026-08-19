function FloorPlan({ room, compact=false }) {
  const { layout } = room;
  const scale = compact ? 0.48 : 1;
  const elC = { table:"#e8ddd0",chair:"#b8a898",tv:"#2c3e50",plant:"#5a9e6a",whiteboard:"#f0ece4",window:"#b8dff0",door:"#d4b896" };
  return (
    <svg width={layout.width*scale} height={layout.height*scale} viewBox={"0 0 "+(layout.width)+" "+(layout.height)} style={{display:"block",borderRadius:6}}>
      {layout.elements.map((el,i)=>{
        if(el.type==="wall") return <rect key={i} x={el.x} y={el.y} width={el.w} height={el.h} fill="#faf7f2" stroke="#c8bfb0" strokeWidth="2.5" rx="3"/>;
        if(el.type==="table") return el.round
          ? <ellipse key={i} cx={el.x+el.w/2} cy={el.y+el.h/2} rx={el.w/2} ry={el.h/2} fill={elC.table} stroke="#a8987c" strokeWidth="1.5"/>
          : <g key={i}><rect x={el.x} y={el.y} width={el.w} height={el.h} fill={elC.table} stroke="#a8987c" strokeWidth="1.5" rx="4"/>{el.label&&<text x={el.x+el.w/2} y={el.y+el.h/2+4} textAnchor="middle" fontSize="8" fill="#8a7860" fontFamily="system-ui,sans-serif">{el.label}</text>}</g>;
        if(el.type==="chair") return <rect key={i} x={el.x} y={el.y} width={el.w} height={el.h} fill={elC.chair} stroke="#988070" strokeWidth="1" rx="4"/>;
        if(el.type==="tv") return <g key={i}><rect x={el.x} y={el.y} width={el.w} height={el.h} fill={elC.tv} stroke="#1a252f" strokeWidth="1.5" rx="2"/><rect x={el.x+3} y={el.y+3} width={el.w-6} height={el.h-6} fill="#3d5a73" rx="1"/><text x={el.x+el.w/2} y={el.y+el.h/2+4} textAnchor="middle" fontSize="6.5" fill="#90b8d0" fontFamily="monospace">{el.label||"TV"}</text></g>;
        if(el.type==="plant") return <g key={i}><ellipse cx={el.x+el.w/2} cy={el.y+el.h*.62} rx={el.w/2} ry={el.h*.38} fill="#7ab888"/><ellipse cx={el.x+el.w/2} cy={el.y+el.h*.38} rx={el.w*.42} ry={el.h*.35} fill="#5a9e6a"/><rect x={el.x+el.w*.3} y={el.y+el.h*.72} width={el.w*.4} height={el.h*.28} fill="#9b7820" rx="2"/></g>;
        if(el.type==="whiteboard") return <rect key={i} x={el.x} y={el.y} width={el.w} height={el.h} fill={elC.whiteboard} stroke="#c8c0b0" strokeWidth="1.5" rx="1"/>;
        if(el.type==="window") return <rect key={i} x={el.x} y={el.y} width={el.w} height={Math.max(el.h,6)} fill={elC.window} stroke="#80c0e0" strokeWidth="1" rx="1"/>;
        if(el.type==="door")   return <rect key={i} x={el.x} y={el.y} width={el.w} height={Math.max(el.h,6)} fill={elC.door}   stroke="#b09070" strokeWidth="1" rx="1"/>;
        return null;
      })}
    </svg>
  );
}

export default FloorPlan;
