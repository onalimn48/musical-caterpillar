import { CLEF_HINTS, getClefSymbol, getClefTitle } from "../data/clefs.js";

export default function StaffHint({ clef, onClose }) {
  const hint = CLEF_HINTS[clef] || CLEF_HINTS.treble;
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1001,
      fontFamily: "'Fredoka',sans-serif",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 24, padding: "24px 28px", maxWidth: 380, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", textAlign: "center",
      }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: "#5b21b6", margin: "0 0 16px", fontSize: 20 }}>
          {getClefSymbol(clef)} {getClefTitle(clef)} Notes
        </h3>

        <svg width="320" height="160" viewBox="0 0 320 160" style={{ marginBottom: 12 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1="10" y1={40 + i * 16} x2="310" y2={40 + i * 16} stroke="#8d7e72" strokeWidth="1.2" />
          ))}

          {clef === "treble" ? (
            <>
              <text x="22" y={40 + 4.82 * 16} fontSize="148" fill="#5a4a3a" fontFamily="'Noto Music','Segoe UI Symbol',serif" textAnchor="middle">𝄞</text>
            </>
          ) : (
            <>
              <text
                x={clef === "alto" ? "22" : "32"}
                y={40 + (clef === "alto" ? 4.03 : 3.3) * 16}
                fontSize={clef === "alto" ? "96" : "79"}
                fill="#5a4a3a"
                fontFamily="'Noto Music','Segoe UI Symbol',serif"
                textAnchor="middle"
              >
                {getClefSymbol(clef)}
              </text>
            </>
          )}

          {hint.lines.map((note, i) => {
            const color = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"][i];
            return (
              <g key={`line-${note}-${i}`}>
                <circle cx={60 + i * 55} cy={40 + (4 - i) * 16} rx="8" ry="6" fill={color} />
                <text x={60 + i * 55} y={40 + (4 - i) * 16 + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
              </g>
            );
          })}

          {hint.spaces.map((note, i) => {
            const color = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981"][i];
            return (
              <g key={`space-${note}-${i}`}>
                <circle cx={80 + i * 55} cy={40 + (3.5 - i) * 16} rx="8" ry="6" fill={color} opacity="0.85" />
                <text x={80 + i * 55} y={40 + (3.5 - i) * 16 + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
              </g>
            );
          })}
        </svg>

        <div style={{ background: "#f5f3ff", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>
            📏 Lines (bottom to top)
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            {hint.lineMnemonic}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>
            📐 Spaces (bottom to top)
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
            {hint.spaceMnemonic}
          </div>
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: 10, borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white",
          fontSize: 15, fontWeight: 600, fontFamily: "'Fredoka',sans-serif", cursor: "pointer",
        }}>Got it!</button>
      </div>
    </div>
  );
}
