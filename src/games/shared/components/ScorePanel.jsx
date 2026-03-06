import { sharedTheme } from "../styles/theme.js";

export default function ScorePanel({
  icon,
  label,
  value,
  tone = "violet",
  style,
  valueStyle,
  labelStyle,
}) {
  const palette = sharedTheme.tones[tone] || sharedTheme.tones.violet;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        borderRadius: sharedTheme.radius.md,
        padding: "4px 12px",
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        boxShadow: sharedTheme.shadow.soft,
        ...style,
      }}
    >
      {icon ? <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {label ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              opacity: 0.78,
              lineHeight: 1.1,
              ...labelStyle,
            }}
          >
            {label}
          </span>
        ) : null}
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            ...valueStyle,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
