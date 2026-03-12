export default function StepBadgeMenu({ laneColor, step, onToggleAccent, onCycleGate }) {
  if (!step?.noteName) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onToggleAccent();
        }}
        style={{
          borderRadius: 999,
          border: step.accent ? `1px solid ${laneColor}` : "1px solid rgba(255,255,255,.16)",
          background: step.accent ? `${laneColor}22` : "rgba(15,23,42,.24)",
          color: "white",
          padding: "4px 8px",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {step.accent ? "Accent On" : "Accent"}
      </button>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onCycleGate();
        }}
        style={{
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,.16)",
          background: "rgba(15,23,42,.24)",
          color: "white",
          padding: "4px 8px",
          fontSize: 10,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {step.gateLabel}
      </button>
    </div>
  );
}
