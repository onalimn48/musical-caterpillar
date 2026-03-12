export default function MissionCard({
  eyebrow = "Mission",
  title,
  goal,
  prompt,
  successText,
  accent = "#fef08a",
  actions = null,
  style,
}) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 18,
        background: "linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12))",
        border: "1px solid rgba(255,255,255,.12)",
        boxShadow: "0 14px 28px rgba(15,23,42,.16)",
        ...style,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: accent, marginBottom: 10 }}>
        {eyebrow}
      </div>
      <div style={{ fontSize: 22, color: "white", marginBottom: 10, lineHeight: 1.1 }}>{title}</div>
      {goal ? (
        <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,.8)", marginBottom: 10 }}>
          {goal}
        </div>
      ) : null}
      {prompt ? (
        <div style={{ borderRadius: 16, padding: "12px 14px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,.52)", marginBottom: 4 }}>
            Try This
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#f8fafc" }}>{prompt}</div>
        </div>
      ) : null}
      {successText ? (
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.7)" }}>
          Success check: <span style={{ color: accent }}>{successText}</span>
        </div>
      ) : null}
      {actions ? <div style={{ marginTop: 14 }}>{actions}</div> : null}
    </div>
  );
}
