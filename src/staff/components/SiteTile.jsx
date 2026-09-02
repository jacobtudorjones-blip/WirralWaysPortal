// A selectable site/mode tile — shows a photo if one exists at
// `image` (see data/staff.js's OFFICE_SITES), falling back to a plain
// colour badge (an icon, or the label's first letter) if there's no
// image yet or it fails to load. No image files ship with this repo —
// this degrades gracefully until real ones are added under public/sites/.
import { useState } from "react";

function SiteTile({ label, color, icon, image, onClick }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = image && !imageFailed;

  return (
    <button onClick={onClick} style={{
      background: "#fff", border: "2px solid #e5e7eb", borderRadius: 14, padding: 0, cursor: "pointer",
      display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0, fontFamily: "inherit", overflow: "hidden",
    }}>
      {showImage ? (
        <img
          src={image}
          alt=""
          onError={() => setImageFailed(true)}
          style={{ width: "100%", height: 70, objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", height: 70, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: icon ? 26 : 20, fontWeight: 800, color }}>
          {icon || label[0]}
        </div>
      )}
      <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{label}</div>
    </button>
  );
}

export default SiteTile;
