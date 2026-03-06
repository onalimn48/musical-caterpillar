import { useMemo } from "react";

export default function ConfettiBurst({
  show,
  count = 40,
  zIndex = 999,
  durationMin = 1.4,
  durationMax = 2.4,
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: -12 - Math.random() * 18,
        width: 6 + Math.random() * 8,
        height: 6 + Math.random() * 8,
        hue: Math.random() * 360,
        radius: Math.random() > 0.5 ? "50%" : "2px",
        duration: durationMin + Math.random() * (durationMax - durationMin),
        delay: Math.random() * 0.5,
      })),
    [count, durationMax, durationMin],
  );

  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex }}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          style={{
            position: "absolute",
            left: `${piece.left}%`,
            top: piece.top,
            width: piece.width,
            height: piece.height,
            background: `hsl(${piece.hue},75%,55%)`,
            borderRadius: piece.radius,
            animation: `cfall ${piece.duration}s ease-in ${piece.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
