import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MusicalCaterpillarMeter
 * - Drop this into your .jsx file.
 * - Props:
 *    progress: number (0..10)   // how many correct in the current “set”
 *    triggerButterfly: number   // token value that changes when the butterfly animation should fire
 *    streak: number             // total streak for milestone variants
 *    streakMilestone: object    // current milestone payload { tier, streak }
 *
 * Notes:
 * - Caterpillar stays hidden until butterfly exits (3s hang + exit anim).
 * - Hat is nudged LEFT (translateX = -12). Tweak that number if needed.
 */
export default function MusicalCaterpillarMeter({
  progress = 0,
  triggerButterfly = false,
  streak = 0,
  streakMilestone = null,
  butterflyRemaining = null,
  milestoneScopeKey = "default",
  width = 360,
  height = 190,
}) {


 
  const [evolving, setEvolving] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlaySvgKey, setOverlaySvgKey] = useState(0);
  const [butterflyPhase, setButterflyPhase] = useState("hidden"); // hidden | enter | idle | exit
  const timersRef = useRef([]);
  const [celebrate, setCelebrate] = useState(false);
  const lastTriggerRef = useRef(triggerButterfly);
  const [tierMessage, setTierMessage] = useState(null);
  const lastShownTierRef = useRef(null);
  const prevMilestoneTierRef = useRef(null);

  const tierMessages = useMemo(() => ({
    shimmer: "Great job — Shimmer Streak!",
    fire: "You’re on fire!",
    star: "Amazing job — Star Streak!",
    legendary: "Incredible playing — Legendary Streak!",
    diamond: "Brilliant work — Diamond Streak!",
    rainbow: "Fantastic job — Rainbow Streak!",
    cosmic: "You’re doing amazing — Cosmic Streak!",
    ultra: "Wow — Ultra Streak!",
    mythic: "Unbelievable — Mythic Streak!",
  }), []);

  const milestoneTier = useMemo(() => {
    if (streakMilestone?.tier) return streakMilestone.tier;
    if (streak >= 500) return "mythic";
    if (streak >= 400) return "ultra";
    if (streak >= 300) return "cosmic";
    if (streak >= 200) return "rainbow";
    if (streak >= 150) return "diamond";
    if (streak >= 100) return "legendary";
    if (streak >= 50) return "star";
    if (streak >= 25) return "fire";
    if (streak >= 10) return "shimmer";
    return "base";
  }, [streak, streakMilestone]);

  const variant = useMemo(() => {
    const variants = {
      base: {
        halo: "#EAF7FF",
        shadow: "#0E1822",
        shadowOpacity: "0.18",
        segColors: ["#22C55E", "#34D399", "#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#F97316", "#F59E0B", "#84CC16"],
        headFill: "#22C55E",
        hatBand: "#2FD06F",
        cheek: "#FF6B6B",
        badge: null,
        glow: "transparent",
        badgeBg: "#ffffff",
        ringDash: "14 10",
        ringOpacity: "0.55",
        sparkleCount: 0,
      },
      shimmer: {
        halo: "#F6F6D9",
        shadow: "#C9D46A",
        shadowOpacity: "0.16",
        segColors: ["#CFE7A2", "#D8EDB0", "#E1F2BF", "#E8F5CA", "#EEF8D8", "#F4F9E1", "#E8F5CA", "#E1F2BF", "#D8EDB0", "#CFE7A2"],
        headFill: "#D4E7A3",
        hatBand: "#F2EDBE",
        cheek: "#F7E9BF",
        badge: null,
        glow: "#E7E38A",
        badgeBg: "#FFFDE8",
        ringDash: "16 12",
        ringOpacity: "0.24",
        sparkleCount: 1,
      },
      fire: {
        halo: "#FED7AA",
        shadow: "#F97316",
        shadowOpacity: "0.26",
        segColors: ["#F97316", "#FB923C", "#F59E0B", "#EF4444", "#F97316", "#FB923C", "#F59E0B", "#EF4444", "#F97316", "#FDBA74"],
        headFill: "#F97316",
        hatBand: "#FBBF24",
        cheek: "#FB7185",
        badge: "🔥 Fire",
        glow: "#F97316",
        badgeBg: "#FFF1E8",
        ringDash: "14 10",
        ringOpacity: "0.55",
        sparkleCount: 0,
      },
      star: {
        halo: "#FFF08D",
        shadow: "#EAB308",
        shadowOpacity: "0.28",
        segColors: ["#FDE047", "#FACC15", "#F59E0B", "#FDE047", "#FACC15", "#FEF08A", "#F59E0B", "#FDE047", "#FACC15", "#FEF08A"],
        headFill: "#FACC15",
        hatBand: "#FFE35C",
        cheek: "#FDE68A",
        badge: "⭐ Star",
        glow: "#FDE047",
        badgeBg: "#FFF9D8",
        ringDash: "6 10",
        ringOpacity: "0.62",
        sparkleCount: 3,
      },
      legendary: {
        halo: "#FFD978",
        shadow: "#D97706",
        shadowOpacity: "0.32",
        segColors: ["#B45309", "#D97706", "#F59E0B", "#FBBF24", "#FDE68A", "#F59E0B", "#D97706", "#B45309", "#FBBF24", "#FDE68A"],
        headFill: "#D97706",
        hatBand: "#FDE68A",
        cheek: "#FCD34D",
        badge: "👑 Legendary",
        glow: "#F59E0B",
        badgeBg: "#FFF3C4",
        ringDash: "22 8",
        ringOpacity: "0.62",
        sparkleCount: 3,
      },
      diamond: {
        halo: "#CFFAFE",
        shadow: "#06B6D4",
        shadowOpacity: "0.25",
        segColors: ["#06B6D4", "#67E8F9", "#A5F3FC", "#E0F2FE", "#93C5FD", "#06B6D4", "#67E8F9", "#A5F3FC", "#E0F2FE", "#C4B5FD"],
        headFill: "#06B6D4",
        hatBand: "#A5F3FC",
        cheek: "#BAE6FD",
        badge: "💎 Diamond",
        glow: "#67E8F9",
        badgeBg: "#E9FCFF",
        ringDash: "10 8",
        ringOpacity: "0.55",
        sparkleCount: 3,
      },
      rainbow: {
        halo: "#F8D8FF",
        shadow: "#EC4899",
        shadowOpacity: "0.24",
        segColors: ["#FB7185", "#FB923C", "#FACC15", "#4ADE80", "#38BDF8", "#818CF8", "#C084FC", "#F472B6", "#FB923C", "#FACC15"],
        segIdleColors: ["#FBC6D2", "#FCD3B8", "#FDE68A", "#BBF7D0", "#BAE6FD", "#C7D2FE", "#DDD6FE", "#FBCFE8", "#FED7AA", "#FEF3C7"],
        headFill: "#F472B6",
        hatBand: "#C084FC",
        cheek: "#FDA4AF",
        badge: "🌈 Rainbow",
        glow: "#EC4899",
        badgeBg: "#FFF0FB",
        ringDash: "18 10",
        ringOpacity: "0.5",
        sparkleCount: 3,
      },
      cosmic: {
        halo: "#D8D0FF",
        shadow: "#5B21B6",
        shadowOpacity: "0.34",
        segColors: ["#312E81", "#4338CA", "#5B21B6", "#6D28D9", "#7C3AED", "#8B5CF6", "#4338CA", "#312E81", "#6D28D9", "#A78BFA"],
        headFill: "#4C1D95",
        hatBand: "#A78BFA",
        cheek: "#C4B5FD",
        badge: "🌌 Cosmic",
        glow: "#8B5CF6",
        badgeBg: "#F3EEFF",
        ringDash: "6 14",
        ringOpacity: "0.42",
        sparkleCount: 2,
      },
      ultra: {
        halo: "#9BE7FF",
        shadow: "#06B6D4",
        shadowOpacity: "0.38",
        segColors: ["#67E8F9", "#22D3EE", "#06B6D4", "#38BDF8", "#67E8F9", "#22D3EE", "#06B6D4", "#38BDF8", "#67E8F9", "#A5F3FC"],
        headFill: "#06B6D4",
        hatBand: "#A5F3FC",
        cheek: "#BAE6FD",
        badge: "⚡ Ultra",
        glow: "#22D3EE",
        badgeBg: "#E6FCFF",
        ringDash: "28 6",
        ringOpacity: "0.68",
        sparkleCount: 2,
      },
      mythic: {
        halo: "#FFE9A8",
        shadow: "#CA8A04",
        shadowOpacity: "0.42",
        segColors: ["#CA8A04", "#F59E0B", "#FDE68A", "#EC4899", "#8B5CF6", "#22D3EE", "#CA8A04", "#F59E0B", "#FDE68A", "#FFF7AE"],
        headFill: "#CA8A04",
        hatBand: "#FFF7AE",
        cheek: "#FCD34D",
        badge: "👑 Mythic",
        glow: "#FDE68A",
        badgeBg: "#FFF7D1",
        ringDash: "36 8",
        ringOpacity: "0.72",
        sparkleCount: 6,
      },
    };
    return variants[milestoneTier] || variants.base;
  }, [milestoneTier]);

  const ornamentPalette = useMemo(() => {
    if (milestoneTier === "rainbow") {
      return ["#FB7185", "#FB923C", "#FACC15", "#4ADE80", "#38BDF8", "#818CF8", "#C084FC"];
    }
    if (milestoneTier === "mythic") {
      return ["#FDE68A", "#F59E0B", "#EC4899", "#8B5CF6", "#22D3EE", "#FFF7AE"];
    }
    if (milestoneTier === "ultra") {
      return ["#67E8F9", "#22D3EE", "#38BDF8"];
    }
    return [variant.glow];
  }, [milestoneTier, variant.glow]);

  const clampProgress = Math.max(0, Math.min(10, Math.floor(progress)));
  const prevProgressRef = useRef(clampProgress);
  const segments = useMemo(() => {
    const startX = 70,
      startY = 110,
      dx = 28;
    return Array.from({ length: 10 }).map((_, i) => ({
      i,
      x: startX + i * dx,
      y: startY + Math.sin(i * 0.6) * 8,
    }));
  }, []);

  const ornamentAnchors = useMemo(() => ({
    shimmerFarLeft: { x: 238, y: 50 },
    shimmerLowLeft: { x: 270, y: 132 },
    headLeft: { x: 286, y: 52 },
    headRight: { x: 395, y: 54 },
    aboveBody: { x: 214, y: 44 },
    rearTop: { x: 110, y: 72 },
    rearLow: { x: 86, y: 146 },
    midRight: { x: 262, y: 156 },
  }), []);

  const ornamentKeysByTier = useMemo(() => ({
    shimmer: ["shimmerFarLeft", "shimmerLowLeft"],
    fire: ["rearTop", "rearLow", "midRight"],
    star: ["headLeft", "headRight", "aboveBody"],
    legendary: ["headLeft", "aboveBody", "headRight"],
    diamond: ["headRight", "rearTop", "midRight"],
    rainbow: ["headLeft", "aboveBody", "headRight"],
    cosmic: ["rearTop", "headRight"],
    ultra: ["headRight", "midRight"],
    mythic: ["headLeft", "aboveBody", "headRight", "rearTop", "midRight", "rearLow"],
  }), []);

  function clearTimers() {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }

  // Kick off evolution when triggerButterfly flips true
  useEffect(() => {
    if (!triggerButterfly) {
      lastTriggerRef.current = triggerButterfly;
      return;
    }
    if (triggerButterfly <= lastTriggerRef.current) return;
    lastTriggerRef.current = triggerButterfly;
    if (evolving) return;

    setEvolving(true);
    clearTimers();

    // fresh overlay SVG (re-mount) so CSS animations always restart reliably
    setOverlaySvgKey((k) => k + 1);
    setButterflyPhase("hidden");
    setShowOverlay(true);

    // timeline:
    // 0ms: start (caterpillar spin is CSS via class)
    // 420ms: hide caterpillar (opacity via class)
    // 650ms: show pop + butterfly enter
    // 650ms + 750ms: butterfly idle
    // 650ms + 3000ms: butterfly exit
    // exit + 380ms: hide overlay, show caterpillar w/ poof
    // total ~ 650 + 3000 + 380 = 4030ms after stage switch

    timersRef.current.push(
      setTimeout(() => {
        setButterflyPhase("enter");
      }, 650)
    );

    timersRef.current.push(
      setTimeout(() => {
        setButterflyPhase("idle");
      }, 650 + 750)
    );

    timersRef.current.push(
      setTimeout(() => {
        setButterflyPhase("exit");
      }, 650 + 3000)
    );

    timersRef.current.push(
      setTimeout(() => {
        setShowOverlay(false);
        setButterflyPhase("hidden");
        // allow caterpillar to return now
        setEvolving(false);
      }, 650 + 3000 + 380)
    );

    return () => clearTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerButterfly]);

  useEffect(() => {
    const prev = prevProgressRef.current;
    const curr = clampProgress;
    if (evolving || showOverlay) {
      prevProgressRef.current = curr;
      return;
    }
    const wrapped = prev >= 9 && curr === 0;
    const increased = curr > prev;
    if (increased && !wrapped) {
      setCelebrate(false);
      requestAnimationFrame(() => setCelebrate(true));
      const t = setTimeout(() => setCelebrate(false), 700);
      timersRef.current.push(t);
    }
    prevProgressRef.current = curr;
  }, [clampProgress, evolving, showOverlay]);

  useEffect(() => {
    const milestoneTierName = streakMilestone?.tier || null;
    const scopeTierKey = milestoneTierName ? `${milestoneScopeKey}:${milestoneTierName}` : null;
    const prevTierKey = prevMilestoneTierRef.current;
    prevMilestoneTierRef.current = scopeTierKey;
    if (!scopeTierKey || prevTierKey === scopeTierKey || lastShownTierRef.current === scopeTierKey) return;
    const message = tierMessages[milestoneTierName];
    if (!message) return;

    lastShownTierRef.current = scopeTierKey;
    setTierMessage(message);
    const t = setTimeout(() => setTierMessage(null), 2800);
    timersRef.current.push(t);
  }, [milestoneScopeKey, streakMilestone, tierMessages]);

  // Face growth with progress (0..10)
  const smilePath = useMemo(() => {
    const p = clampProgress;
    const centerX = 340;
    const baseY = 125;
    const w = 10 + p * 4;
    const h = 8 + p * 2;
    return `M${centerX - w} ${baseY} Q${centerX} ${baseY + h} ${centerX + w} ${baseY}`;
  }, [clampProgress]);

  const cheekRadius = useMemo(() => (7.5 + clampProgress * 0.35).toFixed(2), [clampProgress]);
  const cheekOpacity = useMemo(() => (0.28 + clampProgress * 0.01).toFixed(2), [clampProgress]);

  // CSS flags
  const caterpillarHidden = evolving || showOverlay; // important: stays hidden until overlay ends
  const motionClass = celebrate ? "mc-jump" : "mc-idle";
  const meterClass = [
    triggerButterfly && (evolving || showOverlay) ? "to-cocoon" : "",
    !showOverlay && !evolving && triggerButterfly ? "returning" : "", // quick poof when it returns
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div style={{ position: "relative", width, height, overflow: "visible", paddingTop: 24 }}>
      <style>{`
        @keyframes mcTierToast {
          0% { opacity: 0; transform: translateX(-50%) translateY(6px) scale(.96); }
          14% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          82% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(.98); }
        }
      `}</style>
      {tierMessage && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 10,
            transform: "translateX(-50%)",
            padding: "8px 14px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.94)",
            border: `2px solid ${milestoneTier === "base" ? "#d1d5db" : variant.glow}`,
            boxShadow: "0 8px 20px rgba(14,24,34,0.12)",
            color: "#0E1822",
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            animation: "mcTierToast 2.8s ease forwards",
            zIndex: 4,
          }}
        >
          {tierMessage}
        </div>
      )}
      <svg
        id="mc-meter"
        className={meterClass}
        viewBox="0 -20 568 240"
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <style>{`
          :root { --stroke: #0E1822; }

          .mc-tier-ring { animation: mcRingPulse 2.4s ease-in-out infinite; transform-origin: 210px 105px; }
          .mc-tier-sparkle { animation: mcSparkle 1.8s ease-in-out infinite; transform-origin: center; }
          .mc-tier-float { animation: mcFloatAccent 2.2s ease-in-out infinite; transform-origin: center; }
          .mc-tier-diamond { animation: mcDiamondDrift 2s ease-in-out infinite; transform-origin: center; }
          .mc-tier-ultra { animation: mcUltraSurge 1.45s ease-in-out infinite; transform-origin: center; }
          .mc-tier-flame { animation: mcFlameFlicker .8s ease-in-out infinite; transform-origin: center; }
          .mc-tier-shimmer { animation: mcShimmerSweep 2.8s ease-in-out infinite; transform-origin: center; }

          .mc-idle { animation: mcIdle 2.6s ease-in-out infinite; transform-origin: 55% 92%; }
          .mc-jump { animation: mcJump 650ms cubic-bezier(.2,.9,.2,1) 1 both; transform-origin: 55% 92%; }
          .mc-blink{ animation: mcBlink 4.2s infinite; transform-origin: center; }
          .mc-pop { animation: mcPop .34s cubic-bezier(.2,.9,.2,1) 1; transform-origin: center; }

          .legs { opacity: 0; }
          .legs.legs-on { opacity: 1; }

          /* Transformation: spin/shrink away */
          #mc-meter.to-cocoon #caterpillar {
            animation: spinShrink 520ms cubic-bezier(.2,.9,.2,1) 1 forwards;
            transform-origin: 340px 105px;
          }

          /* Return poof */
          #mc-meter.returning #caterpillar {
            animation: poofIn 420ms cubic-bezier(.2,.9,.2,1) 1;
            transform-origin: 340px 105px;
          }

          @keyframes mcIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          @keyframes mcBlink{ 0%,92%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.05)} }
          @keyframes mcPop { 0%{transform:scale(.7)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }
          @keyframes mcJump{
            0%{transform:translateY(0) scaleY(1) scaleX(1)}
            25%{transform:translateY(0) scaleY(.9) scaleX(1.04)}
            60%{transform:translateY(-28px) scaleY(1.05) scaleX(.98)}
            85%{transform:translateY(0) scaleY(.95) scaleX(1.03)}
            100%{transform:translateY(0) scaleY(1) scaleX(1)}
          }
          @keyframes mcRingPulse{
            0%,100%{opacity:.22; transform:scale(1)}
            50%{opacity:.4; transform:scale(1.05)}
          }
          @keyframes mcSparkle{
            0%,100%{opacity:.45; transform:scale(.95) rotate(0deg)}
            50%{opacity:1; transform:scale(1.1) rotate(8deg)}
          }
          @keyframes mcFloatAccent{
            0%,100%{transform:translateY(0)}
            50%{transform:translateY(-9px)}
          }
          @keyframes mcDiamondDrift{
            0%,100%{transform:translate3d(0,0,0) scale(1) rotate(0deg); opacity:.82}
            50%{transform:translate3d(3px,-11px,0) scale(1.06) rotate(4deg); opacity:1}
          }
          @keyframes mcUltraSurge{
            0%,100%{transform:translate3d(0,0,0) scale(1) rotate(0deg); opacity:.82}
            25%{transform:translate3d(4px,-8px,0) scale(1.08) rotate(8deg); opacity:1}
            50%{transform:translate3d(-3px,-15px,0) scale(1.16) rotate(-7deg); opacity:.96}
            75%{transform:translate3d(5px,-7px,0) scale(1.06) rotate(10deg); opacity:1}
          }
          @keyframes mcFlameFlicker{
            0%,100%{transform:scale(1) translateY(0) rotate(-2deg); opacity:.82}
            40%{transform:scale(1.06,.93) translateY(-4px) rotate(3deg); opacity:1}
            70%{transform:scale(.98,1.08) translateY(-7px) rotate(-5deg); opacity:.94}
          }
          @keyframes mcShimmerSweep{
            0%{opacity:0; transform:translateX(-34px)}
            20%{opacity:.55}
            50%{opacity:.95; transform:translateX(0)}
            80%{opacity:.55}
            100%{opacity:0; transform:translateX(34px)}
          }

          @keyframes spinShrink{
            0%   { transform: translateY(0) rotate(0deg) scale(1); opacity:1; }
            40%  { transform: translateY(8px) rotate(220deg) scale(.9); }
            70%  { transform: translateY(12px) rotate(520deg) scale(.35); opacity:1; }
            100% { transform: translateY(12px) rotate(720deg) scale(.05); opacity:0; }
          }

          @keyframes poofIn{
            0%   { transform: translateY(10px) scale(.2); opacity:0; }
            65%  { transform: translateY(-6px) scale(1.12); opacity:1; }
            100% { transform: translateY(0) scale(1); opacity:1; }
          }
        `}</style>

        <defs>
          <radialGradient id="mcHalo" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor={variant.halo} />
            <stop offset="100%" stopColor={variant.halo} stopOpacity="0" />
          </radialGradient>

          <filter id="mcShadow" filterUnits="userSpaceOnUse" x="20" y="-14" width="536" height="258">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor={variant.shadow} floodOpacity={variant.shadowOpacity} />
          </filter>
        </defs>

        <circle cx="210" cy="105" r="95" fill="url(#mcHalo)" />
        <ellipse cx="205" cy="190" rx="170" ry="14" fill="#0E1822" opacity="0.08" />

        <g
          id="caterpillar"
          style={{ opacity: caterpillarHidden ? 0 : 1 }}
        >
          <g id="caterpillar-motion" className={motionClass}>
          <g id="caterpillar-art" filter="url(#mcShadow)">
          <g id="meter-ornaments">
            {milestoneTier !== "base" && (
              <>
                <ellipse
                  className="mc-tier-ring"
                  cx="210"
                  cy="105"
                  rx="128"
                  ry="54"
                  fill="none"
                  stroke={variant.glow}
                  strokeOpacity={variant.ringOpacity}
                  strokeWidth="6"
                  strokeDasharray={variant.ringDash}
                />
                {variant.badge && (
                  <g transform="translate(214 32)">
                    <g className={milestoneTier === "fire" ? "mc-tier-flame" : "mc-tier-float"}>
                      <rect x="-42" y="-14" width="84" height="28" rx="14" fill={variant.badgeBg} stroke={variant.glow} strokeWidth="2.5" />
                      <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0E1822">
                        {variant.badge}
                      </text>
                    </g>
                  </g>
                )}
              </>
            )}
            {milestoneTier === "shimmer" && (
              <>
                <g className="mc-tier-shimmer" opacity="0.5">
                  <ellipse cx="188" cy="104" rx="70" ry="32" fill="#FFFDE8" transform="rotate(-12 188 104)" />
                </g>
                {(ornamentKeysByTier.shimmer || []).map((key, i) => {
                  const anchor = ornamentAnchors[key];
                  return (
                    <g key={key} transform={`translate(${anchor.x} ${anchor.y})`}>
                      <g
                        className="mc-tier-sparkle"
                        style={{ animationDelay: `${i * 0.28}s` }}
                      >
                        <path
                          d="M0 -8 L2.8 -2.8 L8 0 L2.8 2.8 L0 8 L-2.8 2.8 L-8 0 L-2.8 -2.8 Z"
                          fill="#E7E38A"
                          fillOpacity="0.95"
                          stroke="#0E1822"
                          strokeWidth="1.8"
                        />
                      </g>
                    </g>
                  );
                })}
              </>
            )}
            {milestoneTier === "legendary" && (
              <ellipse
                className="mc-tier-ring"
                cx="210"
                cy="105"
                rx="112"
                ry="46"
                fill="none"
                stroke="#FDE68A"
                strokeOpacity="0.5"
                strokeWidth="4"
                strokeDasharray="10 14"
              />
            )}
            {milestoneTier === "mythic" && (
              <>
                <ellipse
                  className="mc-tier-ring"
                  cx="210"
                  cy="105"
                  rx="140"
                  ry="62"
                  fill="none"
                  stroke="#FFF7AE"
                  strokeOpacity="0.56"
                  strokeWidth="5"
                  strokeDasharray="12 12"
                />
                <ellipse
                  className="mc-tier-ring"
                  cx="210"
                  cy="105"
                  rx="116"
                  ry="44"
                  fill="none"
                  stroke="#22D3EE"
                  strokeOpacity="0.34"
                  strokeWidth="4"
                  strokeDasharray="8 18"
                />
              </>
            )}
            {(milestoneTier === "star" || milestoneTier === "legendary" || milestoneTier === "diamond" || milestoneTier === "rainbow" || milestoneTier === "cosmic" || milestoneTier === "ultra" || milestoneTier === "mythic") && (
              <g>
                {(ornamentKeysByTier[milestoneTier] || []).slice(0, variant.sparkleCount).map((key, i) => {
                  const anchor = ornamentAnchors[key];
                  const ornamentColor = ornamentPalette[i % ornamentPalette.length];
                  return (
                    <g key={key} transform={`translate(${anchor.x} ${anchor.y})`}>
                      <g
                        className={milestoneTier === "diamond" ? "mc-tier-diamond" : milestoneTier === "ultra" ? "mc-tier-ultra" : "mc-tier-sparkle"}
                        style={{ animationDelay: `${i * 0.18}s` }}
                      >
                        <path
                          d={milestoneTier === "ultra" ? "M0 -14 L6 0 L0 14 L-6 0 Z" : milestoneTier === "legendary" ? "M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" : milestoneTier === "mythic" ? "M0 -16 L5 -5 L16 0 L5 5 L0 16 L-5 5 L-16 0 L-5 -5 Z" : "M0 -12 L3.5 -3.5 L12 0 L3.5 3.5 L0 12 L-3.5 3.5 L-12 0 L-3.5 -3.5 Z"}
                          fill={ornamentColor}
                          fillOpacity={milestoneTier === "ultra" ? "1" : "0.98"}
                          stroke="#0E1822"
                          strokeWidth={milestoneTier === "ultra" || milestoneTier === "mythic" ? "2.8" : "2.4"}
                        />
                        {milestoneTier === "mythic" && (
                          <circle cx="0" cy="0" r="4.5" fill="#FFF7AE" fillOpacity="0.9" stroke="#0E1822" strokeWidth="1.6" />
                        )}
                      </g>
                    </g>
                  );
                })}
              </g>
            )}
            {milestoneTier === "fire" && (
              <g>
                {(ornamentKeysByTier.fire || []).map((key, i) => {
                  const anchor = ornamentAnchors[key];
                  return (
                    <g key={key} transform={`translate(${anchor.x} ${anchor.y})`}>
                      <g className="mc-tier-flame" style={{ animationDelay: `${i * 0.12}s` }} opacity="0.92">
                        <path
                          d="M1 16 C-10 11,-11 0,-7 -9 C-4 -16,2 -18,4 -27 C8 -22,10 -14,13 -9 C18 -16,25 -15,27 -7 C30 1,26 8,20 12 C18 16,16 20,11 21 C8 19,7 16,5 14 C4 17,3 18,1 16Z"
                          fill="#FB923C"
                          stroke="#0E1822"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 12 C6 7,7 0,10 -5 C12 -10,15 -12,16 -19 C19 -15,20 -10,22 -6 C24 -3,24 4,19 9 C16 11,13 14,10 12Z"
                          fill="#FDE68A"
                          fillOpacity="0.95"
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
          {/* segments */}
          <g id="segments">
            {segments.map((p) => {
              const filled = p.i < clampProgress;
              const fill = filled
                ? variant.segColors[p.i]
                : milestoneTier === "rainbow" && variant.segIdleColors
                ? variant.segIdleColors[p.i]
                : "#E5E7EB";
              const hipY = p.y + 10;
              const footY = p.y + 40;

              const legPath = (xHip, xFoot) => `M${xHip} ${hipY} Q${xHip} ${p.y + 28} ${xFoot} ${footY}`;
              const hipArc = (cx) => `M${cx - 6} ${hipY + 2} Q${cx} ${hipY - 6} ${cx + 6} ${hipY + 2}`;

              return (
                <g key={p.i}>
                  {/* legs (visible when filled) */}
                  <g className={`legs ${filled ? "legs-on" : ""}`}>
                    <path d={hipArc(p.x - 12)} fill="none" stroke="var(--stroke)" strokeWidth="7" strokeLinecap="round" />
                    <path d={hipArc(p.x + 12)} fill="none" stroke="var(--stroke)" strokeWidth="7" strokeLinecap="round" />
                    <path d={legPath(p.x - 12, p.x - 18)} fill="none" stroke="var(--stroke)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={legPath(p.x + 12, p.x + 18)} fill="none" stroke="var(--stroke)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx={p.x - 18} cy={footY} r="4" fill="var(--stroke)" />
                    <circle cx={p.x + 18} cy={footY} r="4" fill="var(--stroke)" />
                  </g>

                  <circle cx={p.x} cy={p.y} r="30" fill={fill} stroke="var(--stroke)" strokeWidth="9" />
                </g>
              );
            })}
          </g>

          {/* head */}
          <g id="head">
            <circle cx="340" cy="105" r="60" fill={variant.headFill} stroke="var(--stroke)" strokeWidth="10" />

            <g className="mc-blink">
              <ellipse cx="322" cy="102" rx="14" ry="17" fill="#0E1822" />
              <ellipse cx="360" cy="102" rx="14" ry="17" fill="#0E1822" />
            </g>
            <circle cx="317" cy="96" r="5" fill="#fff" />
            <circle cx="355" cy="96" r="5" fill="#fff" />

            <circle cx="305" cy="120" r={cheekRadius} fill={variant.cheek} opacity={cheekOpacity} />
            <circle cx="375" cy="120" r={cheekRadius} fill={variant.cheek} opacity={cheekOpacity} />

            <path d={smilePath} fill="none" stroke="#0E1822" strokeWidth="8" strokeLinecap="round" />
          </g>

          {/* HAT (nudged left) — tweak translateX here */}
          <g id="hat" transform="translate(-12 0) rotate(-10 350 40)">
            <ellipse cx="350" cy="60" rx="65" ry="14" fill="#101A24" stroke="var(--stroke)" strokeWidth="8" />
            <rect x="310" y="5" width="80" height="55" rx="12" fill="#101A24" stroke="var(--stroke)" strokeWidth="8" />
            <rect x="310" y="35" width="80" height="14" rx="7" fill={variant.hatBand} />
          </g>

          <g id="streak-counter" transform="translate(410 92)">
            <rect
              x="-6"
              y="-18"
              width="74"
              height="32"
              rx="14"
              fill={variant.badgeBg}
              stroke={milestoneTier === "base" ? "#d1d5db" : variant.glow}
              strokeWidth="2.5"
            />
            <text x="31" y="3" textAnchor="middle" fontSize="15" fontWeight="800" fill="#0E1822">
              x{streak}
            </text>
          </g>
          <g id="butterfly-helper" transform="translate(441 132)">
            <rect
              x="-38"
              y="-15"
              width="76"
              height="30"
              rx="15"
              fill="rgba(255,255,255,0.92)"
              stroke={milestoneTier === "base" ? "#d1d5db" : variant.glow}
              strokeWidth="2"
            />
            <text x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0E1822">
              {`🦋 in ${butterflyRemaining}`}
            </text>
          </g>
          </g>
          </g>
        </g>
      </svg>

      {/* EVOLUTION OVERLAY (rendered only during reward) */}
      {showOverlay && (
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: width * 0.36,
            top: height * 0.5,
            width: 240,
            height: 240,
            transform: "translate(-50%, -50%)",
          }}
        >
          <svg
            key={overlaySvgKey}
            width="240"
            height="240"
            viewBox="0 0 240 240"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <style>{`
              .cocoon { animation: cocoonWiggle 420ms ease-in-out infinite; transform-origin: 130px 150px; }
              .cocoon-in { animation: cocoonIn 360ms cubic-bezier(.2,.9,.2,1) 1; }

              .pop { animation: popBurst 420ms cubic-bezier(.2,.9,.2,1) 1; transform-origin: 130px 150px; }

              .bf-enter { animation: bfEnter 700ms cubic-bezier(.2,.9,.2,1) 1 forwards; transform-origin: 130px 150px; }
              .bf-idle { animation: bfHover 1.8s ease-in-out infinite; transform-origin: 130px 150px; }
              .bf-exit { animation: bfExit 360ms cubic-bezier(.2,.9,.2,1) 1 forwards; transform-origin: 130px 150px; }

              .wingL { transform-origin: 130px 150px; animation: flapL .14s ease-in-out infinite; }
              .wingR { transform-origin: 130px 150px; animation: flapR .14s ease-in-out infinite; }
              .spark { animation: sparkle 1.1s ease-out 1; transform-origin: center; }

              @keyframes cocoonIn{
                0%{ transform: translate(0,30px) scale(.2); opacity:0; }
                100%{ transform: translate(0,0) scale(1); opacity:1; }
              }
              @keyframes cocoonWiggle{
                0%,100%{ transform: rotate(-4deg); }
                50%{ transform: rotate(5deg); }
              }
              @keyframes popBurst{
                0%{ opacity:0; transform:scale(.2); }
                20%{ opacity:1; transform:scale(1); }
                100%{ opacity:0; transform:scale(1.8); }
              }

              @keyframes bfEnter{
                0%   { transform: translate(0,30px) scale(.25) rotate(-18deg); opacity:0; }
                55%  { transform: translate(0,-12px) scale(1.18) rotate(10deg); opacity:1; }
                100% { transform: translate(10px,-22px) scale(1.05) rotate(-6deg); opacity:1; }
              }
              @keyframes bfHover{
                0%,100% { transform: translate(10px,-22px) rotate(-6deg); }
                50%     { transform: translate(14px,-28px) rotate(6deg); }
              }
              @keyframes bfExit{
                0%   { transform: translate(10px,-22px) scale(1.05) rotate(-6deg); opacity:1; }
                100% { transform: translate(24px,-60px) scale(.6) rotate(18deg); opacity:0; }
              }

              @keyframes flapL{ 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(28deg)} }
              @keyframes flapR{ 0%,100%{transform:rotate(22deg)} 50%{transform:rotate(-28deg)} }

              @keyframes sparkle{
                0%{ transform: translate(0,0) scale(.2); opacity:0; }
                15%{ opacity:.95; }
                100%{ transform: translate(0,-40px) scale(1.2); opacity:0; }
              }
            `}</style>

            {/* cocoon */}
            <g id="cocoonStage" className="cocoon cocoon-in" transform="translate(-12 -14) scale(1.22)" style={{ opacity: butterflyPhase === "hidden" ? 1 : 0 }}>
              <path
                d="M130 120 C112 130,110 160,130 178 C150 160,148 130,130 120Z"
                fill="#F5F3FF"
                stroke="#0E1822"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path d="M116 138 Q130 146 144 138" fill="none" stroke="#0E1822" strokeWidth="4" strokeLinecap="round" opacity=".25" />
              <path d="M114 152 Q130 160 146 152" fill="none" stroke="#0E1822" strokeWidth="4" strokeLinecap="round" opacity=".25" />
              <path d="M116 166 Q130 174 144 166" fill="none" stroke="#0E1822" strokeWidth="4" strokeLinecap="round" opacity=".25" />
            </g>

            {/* pop (brief) */}
            <g
              id="popStage"
              className="pop"
              style={{
                display: butterflyPhase === "enter" ? "block" : "none",
                opacity: butterflyPhase === "enter" ? 1 : 0,
              }}
            >
              <circle cx="130" cy="150" r="22" fill="#FDE047" />
              <path d="M130 110 L130 92" stroke="#0E1822" strokeWidth="6" strokeLinecap="round" />
              <path d="M130 208 L130 190" stroke="#0E1822" strokeWidth="6" strokeLinecap="round" />
              <path d="M90 150 L72 150" stroke="#0E1822" strokeWidth="6" strokeLinecap="round" />
              <path d="M188 150 L170 150" stroke="#0E1822" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* butterfly */}
            <g
              id="butterflyStage"
              className={
                butterflyPhase === "enter"
                  ? "bf-enter"
                  : butterflyPhase === "idle"
                  ? "bf-idle"
                  : butterflyPhase === "exit"
                  ? "bf-exit"
                  : ""
              }
              style={{
                display: butterflyPhase === "hidden" ? "none" : "block",
                opacity: butterflyPhase === "hidden" ? 0 : 1,
              }}
            >
              <g className="spark" transform="translate(98 154)">
                <path
                  d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z"
                  fill="#FDE047"
                  stroke="#0E1822"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </g>
              <g className="spark" style={{ animationDelay: ".08s" }} transform="translate(162 150)">
                <path
                  d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3 Z"
                  fill="#FDE047"
                  stroke="#0E1822"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </g>

              <g className="wingL">
                <path
                  d="M130 150 C86 92, 40 102, 44 152 C48 206, 104 214, 124 180 C132 166, 134 160, 130 150Z"
                  fill="#A78BFA"
                  stroke="#0E1822"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
              </g>
              <g className="wingR">
                <path
                  d="M130 150 C174 92, 220 102, 216 152 C212 206, 156 214, 136 180 C128 166, 126 160, 130 150Z"
                  fill="#60A5FA"
                  stroke="#0E1822"
                  strokeWidth="6"
                  strokeLinejoin="round"
                />
              </g>

              <path
                d="M130 124 C120 136,120 170,130 182 C140 170,140 136,130 124Z"
                fill="#111827"
                stroke="#0E1822"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path d="M126 122 Q116 110 108 106" fill="none" stroke="#0E1822" strokeWidth="4" strokeLinecap="round" />
              <path d="M134 122 Q144 110 152 106" fill="none" stroke="#0E1822" strokeWidth="4" strokeLinecap="round" />

              {/* butterfly hat (leave as-is unless you want it nudged too) */}
              <g transform="translate(0,0) rotate(-8 150 85)">
                <ellipse cx="150" cy="98" rx="40" ry="10" fill="#101A24" stroke="#0E1822" strokeWidth="5" />
                <rect x="125" y="60" width="50" height="38" rx="9" fill="#101A24" stroke="#0E1822" strokeWidth="5" />
                <rect x="125" y="82" width="50" height="10" rx="5" fill="#2FD06F" />
              </g>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
