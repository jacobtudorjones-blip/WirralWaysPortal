// Real room photo for the Floor Plans tab's detail panel (App.jsx) — falls
// back to the original "coming soon" placeholder if the room has no photo
// yet (room.image 404s — see data/rooms.js's `image` field comment for the
// public/rooms/<slug>.jpg convention). Its own component, not inline JSX
// in App.jsx, specifically so it can hold its own useState for the
// onError fallback; App.jsx passes key={room.id} at the call site so
// switching rooms resets the fallback state instead of carrying a stale
// "failed" flag over from the previous room.
import { useState } from "react";
import { CGL } from "../data/rooms.js";

function RoomPhoto({ room }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = room.image && !imageFailed;

  if (showImage) {
    return (
      <img
        src={room.image}
        alt={room.name}
        onError={() => setImageFailed(true)}
        style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 12, display: "block" }}
      />
    );
  }
  return (
    <div style={{ background: "linear-gradient(135deg," + CGL.blackcurrant + "08," + CGL.amethyst + "10)", border: "2px dashed " + CGL.lavender, borderRadius: 12, padding: "48px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
      <div style={{ fontWeight: 800, fontSize: 16, color: CGL.blackcurrant, marginBottom: 8 }}>No photo yet</div>
      <div style={{ fontSize: 13, color: "#999", lineHeight: 1.7 }}>Add one at <code>public/rooms/{room.slug}.jpg</code> and it'll show here automatically.</div>
    </div>
  );
}

export default RoomPhoto;
