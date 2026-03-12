const SHAPE_MAP = {
  sine: "smooth",
  triangle: "pointed",
  square: "chunky",
  sawtooth: "spiky",
};

function sampleWave(shape, phase) {
  if (shape === "chunky") {
    return phase < 0.5 ? 1 : -1;
  }

  if (shape === "pointed") {
    return 1 - 4 * Math.abs(phase - 0.5);
  }

  if (shape === "spiky") {
    return 1 - 2 * phase;
  }

  return Math.sin(phase * Math.PI * 2);
}

export default function CaterpillarAvatar({
  oscType,
  brightness,
  tailGlow,
  snap,
  isSinging,
  wavePhase = 0,
  waveSpeed = 1,
  title = "Synth caterpillar",
}) {
  const shape = SHAPE_MAP[oscType] || "smooth";
  const glowAlpha = Math.min(0.45, 0.14 + tailGlow * 0.28);
  const shellHue = Math.round(84 + brightness * 48);
  const shellColor = `hsl(${shellHue} 74% ${48 + brightness * 10}%)`;
  const bellyColor = `hsl(${Math.max(38, shellHue - 28)} 88% 68%)`;
  const spikeColor = `hsl(${Math.max(20, shellHue - 40)} 88% 42%)`;
  const segmentCount = 4 + Math.round(tailGlow * 7);
  const spacing = 34 + (1 - snap) * 12;
  const baseWaveHeight = 12 + brightness * 9;
  const snapTension = 0.84 + snap * 0.28;
  const glowDots = 2 + Math.round(brightness * 4);
  const headLeft = 84;
  const bodyStart = 154;
  const motionAmount = isSinging ? 1 : 0.24;
  const pulseTail = 0.16 + tailGlow * 0.3;
  const fitScale = 0.94 - tailGlow * 0.08 - snap * 0.04;
  const fitOffsetX = -12 - tailGlow * 34 - snap * 14;

  return (
    <div
      aria-label={title}
      style={{
        position: "relative",
        width: "min(94vw, 620px)",
        maxWidth: "100%",
        height: 270,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        margin: "0 auto",
        filter: `drop-shadow(0 14px 30px rgba(15,23,42,.22)) drop-shadow(0 0 32px rgba(251,191,36,${glowAlpha}))`,
        transform: `translateX(${fitOffsetX}px) scale(${fitScale})`,
        transformOrigin: "left center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "14% 8% 1%",
          borderRadius: "50%",
          background: `radial-gradient(circle at center, rgba(255,255,255,.6), rgba(255,255,255,0) 68%)`,
          opacity: 0.36 + brightness * 0.42,
        }}
      />
      {Array.from({ length: segmentCount }).map((_, index) => {
        const phase = segmentCount === 1 ? 0 : index / (segmentCount - 1);
        const distanceFromHead = phase;
        const travelFront = Math.min(1.05, wavePhase);
        const lagBehindFront = travelFront - distanceFromHead;
        const isInsidePulse = lagBehindFront >= 0 && lagBehindFront <= pulseTail;
        const envelope = isInsidePulse ? 1 - lagBehindFront / pulseTail : 0;
        const localPulsePhase = isInsidePulse ? lagBehindFront / pulseTail : 1;
        const directionalWave = sampleWave(shape, Math.min(0.98, localPulsePhase * 0.7 + 0.12));
        const waveSample = directionalWave * envelope * motionAmount;
        const taper = 1 - index / (segmentCount + 3);
        const width = 54 + taper * 18 + brightness * 3;
        const height = 56 + Math.abs(waveSample) * 20 + taper * 18 + tailGlow * 6;
        const laneSpacing = shape === "pointed"
          ? spacing + 8
          : spacing + 4 + tailGlow * 6;
        const left = bodyStart + index * laneSpacing;
        const verticalLift = waveSample * baseWaveHeight * snapTension;
        const rotate = shape === "chunky" ? -2 + waveSample * 4 : shape === "pointed" ? -6 + waveSample * 9 : -4 + waveSample * 6;
        const trianglePointsUp = index % 2 === 0;
        const borderRadius = shape === "chunky"
          ? "8px"
          : shape === "pointed"
            ? "0"
            : shape === "spiky"
              ? "0"
              : "50%";
        const clipPath = shape === "pointed"
          ? trianglePointsUp
            ? "polygon(50% 0%, 100% 100%, 0% 100%)"
            : "polygon(0% 0%, 100% 0%, 50% 100%)"
          : shape === "spiky"
            ? "polygon(50% 0%, 58% 10%, 70% 2%, 74% 16%, 88% 8%, 84% 24%, 100% 26%, 90% 40%, 100% 50%, 90% 60%, 100% 74%, 84% 76%, 88% 92%, 74% 84%, 70% 98%, 58% 90%, 50% 100%, 42% 90%, 30% 98%, 26% 84%, 12% 92%, 16% 76%, 0% 74%, 10% 60%, 0% 50%, 10% 40%, 0% 26%, 16% 24%, 12% 8%, 26% 16%, 30% 2%, 42% 10%)"
          : "none";

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left,
              bottom: 70 + verticalLift,
              width,
              height,
              transform: `translateX(-50%) rotate(${rotate}deg) scaleX(${0.94 + (1 - snap) * 0.22})`,
              borderRadius,
              clipPath,
              background: `linear-gradient(180deg, ${shellColor}, hsl(${shellHue} 84% ${38 + brightness * 9}%))`,
              border: "2px solid rgba(15,23,42,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: shape === "pointed" ? "46%" : shape === "spiky" ? "64%" : shape === "chunky" ? "66%" : "72%",
                height: shape === "pointed" ? "18%" : shape === "spiky" ? "64%" : shape === "chunky" ? "30%" : "38%",
                borderRadius: shape === "pointed" ? "0" : shape === "chunky" ? "4px" : 999,
                clipPath: shape === "pointed"
                  ? trianglePointsUp
                    ? "polygon(50% 100%, 82% 0%, 18% 0%)"
                    : "polygon(18% 100%, 82% 100%, 50% 0%)"
                  : "none",
                background: bellyColor,
                opacity: 0.84,
                marginTop: shape === "pointed" ? "41%" : shape === "spiky" ? "10%" : shape === "chunky" ? "26%" : "22%",
              }}
            />
            {brightness > 0.28 ? (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: `${18 + brightness * 16}%`,
                  height: `${14 + brightness * 18}%`,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, rgba(254,240,138,.9), rgba(254,240,138,0))`,
                  opacity: 0.35 + brightness * 0.4,
                }}
              />
            ) : null}
            {shape === "spiky" ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  clipPath: "polygon(50% 0%, 58% 10%, 70% 2%, 74% 16%, 88% 8%, 84% 24%, 100% 26%, 90% 40%, 100% 50%, 90% 60%, 100% 74%, 84% 76%, 88% 92%, 74% 84%, 70% 98%, 58% 90%, 50% 100%, 42% 90%, 30% 98%, 26% 84%, 12% 92%, 16% 76%, 0% 74%, 10% 60%, 0% 50%, 10% 40%, 0% 26%, 16% 24%, 12% 8%, 26% 16%, 30% 2%, 42% 10%)",
                  background: `linear-gradient(180deg, ${spikeColor}, hsl(${Math.max(20, shellHue - 40)} 88% 34%))`,
                  opacity: 0.42,
                  pointerEvents: "none",
                }}
              />
            ) : null}
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: 48, left: 44, right: 34, height: 18, borderRadius: 999, background: "rgba(15,23,42,.08)" }} />
      <div
        style={{
          position: "absolute",
          left: headLeft,
          bottom: 106 + snap * 8,
          width: 112,
          height: 92,
          borderRadius: "52% 48% 46% 54%",
          background: `linear-gradient(180deg, hsl(${shellHue} 78% ${58 + brightness * 6}%), hsl(${shellHue} 78% ${44 + brightness * 8}%))`,
          border: "2px solid rgba(15,23,42,.16)",
        }}
      >
        <div style={{ position: "absolute", left: 20, top: 24, width: 16, height: 16, borderRadius: "50%", background: "#0f172a" }} />
        <div style={{ position: "absolute", right: 22, top: 24, width: 16, height: 16, borderRadius: "50%", background: "#0f172a" }} />
        <div style={{
          position: "absolute",
          left: 48,
          top: 60,
          width: isSinging ? 20 + snap * 10 : 14 + snap * 4,
          height: isSinging ? 12 + snap * 6 : 7 + snap * 3,
          borderRadius: "0 0 18px 18px",
          background: "#7c2d12",
          border: "2px solid rgba(15,23,42,.18)",
          transform: `rotate(${-2 - snap * 3}deg)`,
        }} />
        <div
          style={{
            position: "absolute",
            left: 42,
            top: 57,
            width: 10,
            height: 6,
            borderBottom: "2px solid rgba(15,23,42,.2)",
            borderRadius: "0 0 10px 10px",
            transform: "rotate(-4deg)",
          }}
        />
        <div style={{ position: "absolute", left: 26, top: -28, width: 4, height: 30, background: "#0f172a", transform: "rotate(-18deg)", borderRadius: 999 }} />
        <div style={{ position: "absolute", right: 28, top: -28, width: 4, height: 30, background: "#0f172a", transform: "rotate(18deg)", borderRadius: 999 }} />
        <div style={{ position: "absolute", left: 14, top: -40, width: 20, height: 20, background: "#f59e0b", borderRadius: "50%", boxShadow: "0 0 18px rgba(245,158,11,.35)" }} />
        <div style={{ position: "absolute", right: 18, top: -44, width: 18, height: 18, background: "#fb7185", borderRadius: "50%", boxShadow: "0 0 18px rgba(251,113,133,.25)" }} />
      </div>
      {Array.from({ length: glowDots }).map((_, index) => (
        <div
          key={`glow-${index}`}
          style={{
            position: "absolute",
            left: 180 + index * 76,
            top: 34 + (index % 2) * 22,
            width: 12 + brightness * 14,
            height: 12 + brightness * 14,
            borderRadius: "50%",
            background: index % 2 === 0 ? "rgba(254,240,138,.9)" : "rgba(103,232,249,.72)",
            boxShadow: `0 0 ${16 + brightness * 22}px rgba(254,240,138,.42)`,
            opacity: 0.24 + brightness * 0.48,
          }}
        />
      ))}
      {Array.from({ length: 4 }).map((_, index) => {
        const rayLength = 10 + snap * 10;
        const angle = -28 + index * 18;
        return (
          <div
            key={`ray-${index}`}
            style={{
              position: "absolute",
              left: 164,
              top: 138,
              width: rayLength,
              height: 4 + snap * 2,
              borderRadius: 999,
              background: `linear-gradient(90deg, rgba(255,255,255,${0.75 - index * 0.1}), rgba(255,255,255,0))`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: "left center",
              opacity: isSinging ? 0.18 + snap * 0.2 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
