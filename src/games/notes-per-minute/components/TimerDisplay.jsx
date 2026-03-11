export default function TimerDisplay({ timeLeft, durationSeconds }) {
  const pct = durationSeconds > 0 ? timeLeft / durationSeconds : 0;
  const color = pct > 0.5 ? "rgba(99,102,241,0.8)" : pct > 0.2 ? "rgba(251,191,36,0.8)" : "rgba(248,113,113,0.8)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={17} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <circle
          cx={20}
          cy={20}
          r={17}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeDasharray={`${pct * 106.8} 106.8`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dasharray 0.1s linear" }}
        />
      </svg>
      <div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Time</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", color }}>
          {Math.ceil(timeLeft)}
        </div>
      </div>
    </div>
  );
}
