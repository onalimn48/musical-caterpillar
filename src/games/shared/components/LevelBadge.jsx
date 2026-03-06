import { sharedTheme } from "../styles/theme.js";

export default function LevelBadge({
  icon,
  title,
  subtitle,
  progress = 0,
  progressLabel,
  accent = "#7c3aed",
  background = sharedTheme.colors.panel,
  style,
}) {
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background,
        backdropFilter: "blur(8px)",
        borderRadius: sharedTheme.radius.sm,
        padding: "4px 10px",
        border: `1.5px solid ${accent}33`,
        boxShadow: sharedTheme.shadow.soft,
        ...style,
      }}
    >
      {icon ? <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: accent, fontSize: 11 }}>{title}</span>
          {subtitle ? <span style={{ fontWeight: 600, color: "#374151", fontSize: 10 }}>{subtitle}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 60, height: 3, borderRadius: 2, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: accent, width: `${pct}%`, transition: "width .3s ease" }} />
          </div>
          {progressLabel ? <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 500 }}>{progressLabel}</span> : null}
        </div>
      </div>
    </div>
  );
}
