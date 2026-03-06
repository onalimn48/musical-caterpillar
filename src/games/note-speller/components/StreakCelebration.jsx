export default function StreakCelebration({ milestone }) {
  if (!milestone) return null;
  const { tier, streak, emoji, title, color } = milestone;

  const particleCount = tier === "legendary" ? 60 : tier === "diamond" ? 50 : tier === "star" ? 45 : 30;
  const palettes = {
    fire: ["#f97316", "#ef4444", "#fbbf24", "#dc2626", "#fb923c", "#f59e0b"],
    star: ["#eab308", "#fde047", "#facc15", "#fbbf24", "#f59e0b", "#fef08a"],
    legendary: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"],
    diamond: ["#06b6d4", "#a5f3fc", "#e0f2fe", "#c084fc", "#ddd6fe", "#f0f9ff"],
  };
  const colors = palettes[tier] || palettes.fire;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1002 }}>
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
        animation: "milestoneFlash 1.5s ease-out forwards",
      }} />

      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        animation: "milestonePop 2.5s ease-out forwards",
        zIndex: 1003,
      }}>
        <div style={{ fontSize: tier === "legendary" ? 72 : 60, lineHeight: 1, animation: "milestoneSpin 0.8s ease-out" }}>
          {emoji}
        </div>
        <div style={{
          fontSize: tier === "legendary" ? 32 : 26, fontWeight: 800,
          color, textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
          fontFamily: "'Fredoka',sans-serif",
          letterSpacing: 3,
        }}>{title}</div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: "#fff",
          textShadow: "0 2px 8px rgba(0,0,0,.5)",
          fontFamily: "'Fredoka',sans-serif",
          marginTop: 4,
        }}>{streak} notes perfect!</div>
      </div>

      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 80 + Math.random() * 200;
        const size = 4 + Math.random() * (tier === "legendary" ? 10 : 7);
        const c = colors[i % colors.length];
        return (
          <div key={i} style={{
            position: "absolute",
            left: "50%", top: "50%",
            width: size, height: size,
            background: c,
            borderRadius: Math.random() > 0.4 ? "50%" : tier === "diamond" ? "2px" : "3px",
            boxShadow: `0 0 ${size}px ${c}88`,
            transform: "translate(-50%, -50%)",
            animation: `milestoneBurst ${1 + Math.random() * 0.8}s ease-out ${Math.random() * 0.3}s forwards`,
            "--burst-x": `${Math.cos(angle) * dist}px`,
            "--burst-y": `${Math.sin(angle) * dist}px`,
            opacity: 0,
          }} />
        );
      })}

      {(tier === "star" || tier === "legendary" || tier === "diamond") && (
        <>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 20, height: 20,
            borderRadius: "50%",
            border: `3px solid ${color}`,
            transform: "translate(-50%, -50%)",
            animation: "milestoneRing 1.2s ease-out 0.2s forwards",
            opacity: 0,
          }} />
          {tier !== "star" && (
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              width: 20, height: 20,
              borderRadius: "50%",
              border: `2px solid ${colors[1]}`,
              transform: "translate(-50%, -50%)",
              animation: "milestoneRing 1.4s ease-out 0.4s forwards",
              opacity: 0,
            }} />
          )}
        </>
      )}

      {tier === "legendary" && (
        <div style={{
          position: "absolute", left: "50%", top: "55%",
          width: 300, height: 150,
          transform: "translate(-50%, -50%)",
          borderRadius: "150px 150px 0 0",
          border: "6px solid transparent",
          borderTop: "6px solid #ef4444",
          boxShadow: `
            inset 0 3px 0 #f97316,
            inset 0 6px 0 #eab308,
            inset 0 9px 0 #22c55e,
            inset 0 12px 0 #3b82f6,
            inset 0 15px 0 #8b5cf6
          `,
          animation: "milestoneRainbow 2s ease-out 0.3s both",
          opacity: 0,
        }} />
      )}
    </div>
  );
}
