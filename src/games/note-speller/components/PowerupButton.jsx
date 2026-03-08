import { useState } from "react";

export default function PowerupBtn({ powerup, count, score, onBuy, onUse, disabled }) {
  const [hovered, setHovered] = useState(false);
  const canBuy = score >= powerup.cost;
  const hasOne = count > 0;
  return (
    <div className="note-speller-powerup-item" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative", flex: "0 0 auto" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && !disabled && (
        <div className="note-speller-powerup-tooltip" style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#1f2937", color: "#fff", fontSize: 11, fontWeight: 500, fontFamily: "'Fredoka',sans-serif",
          padding: "5px 9px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.25)", pointerEvents: "none",
        }}>
          {powerup.desc}
          <div className="note-speller-powerup-tooltip-arrow" style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid #1f2937",
          }} />
        </div>
      )}
      <button
        className="note-speller-powerup-button"
        onClick={() => { if (hasOne && !disabled) onUse(powerup.id); else if (canBuy && !disabled) onBuy(powerup.id); }}
        disabled={disabled || (!hasOne && !canBuy)}
        style={{
          width: 50, height: 50, borderRadius: 12, position: "relative",
          border: hasOne ? "2.5px solid #f59e0b" : canBuy ? "2.5px solid #7c3aed44" : "2.5px solid #e5e7eb",
          background: hasOne ? "linear-gradient(135deg,#fffbeb,#fef3c7)" : canBuy ? "linear-gradient(135deg,#f5f3ff,#ede9fe)" : "#f9fafb",
          cursor: disabled || (!hasOne && !canBuy) ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : (!hasOne && !canBuy) ? 0.35 : 1,
          transform: hovered && !disabled && (hasOne || canBuy) ? "scale(1.1)" : "scale(1)",
          transition: "all .15s ease", fontSize: 22, lineHeight: 1,
        }}>
        {powerup.icon}
        {hasOne && <span style={{
          position: "absolute", top: -6, right: -6, background: "#f59e0b", color: "white",
          borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Fredoka',sans-serif",
        }}>{count}</span>}
        {!hasOne && (
          <span
            className="note-speller-powerup-cost-badge"
            style={{
              position: "absolute",
              left: "50%",
              bottom: -7,
              transform: "translateX(-50%)",
              background: canBuy ? "#7c3aed" : "#64748b",
              color: "white",
              borderRadius: 999,
              padding: "1px 5px",
              fontSize: 8,
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: "'Fredoka',sans-serif",
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(15,23,42,.18)",
            }}
          >
            ⭐{powerup.cost}
          </span>
        )}
      </button>
      <div className={`note-speller-powerup-label ${hasOne ? "is-owned" : "is-priced"}`} style={{ fontSize: 9, color: hasOne ? "#f59e0b" : "#9ca3af", fontWeight: 600, fontFamily: "'Fredoka',sans-serif", textAlign: "center" }}>
        {hasOne ? "Use" : `⭐${powerup.cost}`}
      </div>
    </div>
  );
}
