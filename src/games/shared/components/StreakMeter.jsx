import { sharedTheme } from "../styles/theme.js";

export default function StreakMeter({
  label = "Streak",
  value,
  caption,
  accent = "#7c3aed",
  children,
  style,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        width: "100%",
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: sharedTheme.radius.md,
          background: "rgba(255,255,255,.86)",
          border: `1px solid ${accent}22`,
          color: "#374151",
          boxShadow: sharedTheme.shadow.soft,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>{label}</span>
        {value !== undefined ? <span style={{ fontSize: 13, fontWeight: 800 }}>{value}</span> : null}
        {caption ? <span style={{ fontSize: 11, color: sharedTheme.colors.muted }}>{caption}</span> : null}
      </div>
      {children}
    </div>
  );
}
