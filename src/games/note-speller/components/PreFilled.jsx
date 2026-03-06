import { LINE_GAP, STAFF_H, STAFF_W, TOP_LINE_Y } from "../data/staff.js";

export default function PreFilled({ letter, dark }) {
  return (
    <div style={{
      width: STAFF_W, height: STAFF_H, display: "flex", alignItems: "center",
      justifyContent: "center", position: "relative",
    }}>
      <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
        style={{ position: "absolute", top: 0, left: 0 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="5" y1={TOP_LINE_Y + i * LINE_GAP} x2="95" y2={TOP_LINE_Y + i * LINE_GAP}
            stroke={dark ? "#3a3050" : "#d6cfc7"} strokeWidth=".8" strokeDasharray="4 3" />
        ))}
      </svg>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: dark ? "linear-gradient(135deg,#312e81,#3730a3)" : "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
        border: dark ? "2px solid #4f46e5" : "2px solid #a5b4fc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 700, color: dark ? "#a5b4fc" : "#4338ca",
        fontFamily: "'Fredoka',sans-serif",
        zIndex: 1, boxShadow: dark ? "0 2px 6px rgba(79,70,229,.3)" : "0 2px 6px rgba(67,56,202,.15)",
      }}>{letter}</div>
    </div>
  );
}
