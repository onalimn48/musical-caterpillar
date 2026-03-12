export default function ToolDrawer({
  title = "More Tools",
  hint,
  accent = "#86efac",
  open = false,
  onToggle,
  children,
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12))",
        border: "1px solid rgba(255,255,255,.12)",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          color: "white",
          textAlign: "left",
          padding: "16px 18px",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: accent, marginBottom: 4 }}>
              {title}
            </div>
            {hint ? <div style={{ fontSize: 13, color: "rgba(226,232,240,.7)", lineHeight: 1.45 }}>{hint}</div> : null}
          </div>
          <div style={{ fontSize: 18, color: accent }}>{open ? "−" : "+"}</div>
        </div>
      </button>
      {open ? (
        <div style={{ padding: "0 18px 18px" }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
