import { useState } from "react";

export default function NoteBtn({ note, onPick, disabled, gold }) {
  const [hovered, setHovered] = useState(false);
  const borderColor = gold ? "#f59e0b" : "#5b21b6";
  const bg1 = gold ? (hovered ? "#fef3c7" : "#fffbeb") : (hovered ? "#ddd6fe" : "#ede9fe");
  const bg2 = gold ? (hovered ? "#fde68a" : "#fef3c7") : (hovered ? "#c4b5fd" : "#ddd6fe");
  const textColor = gold ? "#92400e" : "#5b21b6";
  return (
    <button onClick={() => onPick(note)} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: "clamp(44px, 12vw, 56px)", height: "clamp(44px, 12vw, 56px)", borderRadius: "50%", border: `3px solid ${borderColor}`,
        background: `linear-gradient(135deg,${bg1},${bg2})`, color: textColor,
        fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700, fontFamily: "'Fredoka',sans-serif",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.3 : 1,
        transform: hovered && !disabled ? "scale(1.12)" : "scale(1)",
        transition: "all .15s ease", boxShadow: `0 3px 10px ${borderColor}22`,
        WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
        minWidth: 44, minHeight: 44,
      }}>{note}</button>
  );
}
