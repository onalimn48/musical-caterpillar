import { memo } from "react";

export function PrizeIcon({ prize, size = 84, muted = false }) {
  const [main, dark, light] = prize.colors;
  const stroke = muted ? "#425063" : dark;
  const fill = muted ? "#1a2130" : main;
  const shine = muted ? "#2b3447" : light;
  const scale = size / 84;
  const wrap = child => (
    <svg viewBox="0 0 84 84" width={size} height={size} aria-hidden="true">
      <g transform={`scale(${scale}) translate(${(84 / scale - 84) / 2},${(84 / scale - 84) / 2})`}>{child}</g>
    </svg>
  );
  switch (prize.kind) {
    case "scroll":
      return wrap(
        <>
          <rect x="18" y="18" width="48" height="42" rx="7" fill={fill} stroke={stroke} strokeWidth="4"/>
          <path d="M22 26 C18 18, 18 14, 25 12 C31 14, 31 18, 28 26" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
          <path d="M56 60 C53 68, 53 72, 60 74 C66 72, 66 68, 62 60" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/>
          <line x1="28" y1="30" x2="57" y2="30" stroke={shine} strokeWidth="3"/>
          <line x1="28" y1="39" x2="54" y2="39" stroke={shine} strokeWidth="3"/>
          <line x1="28" y1="48" x2="50" y2="48" stroke={shine} strokeWidth="3"/>
        </>
      );
    case "gem":
      return wrap(
        <>
          <path d="M42 10 L64 26 L56 58 L42 74 L28 58 L20 26 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round"/>
          <path d="M42 10 L42 74 M20 26 L64 26 M28 58 L56 58 M28 26 L42 58 L56 26" fill="none" stroke={shine} strokeWidth="3" opacity="0.9"/>
        </>
      );
    case "crown":
      return wrap(
        <>
          <path d="M15 58 L22 26 L34 42 L42 18 L50 42 L62 26 L69 58 Z" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round"/>
          <rect x="17" y="58" width="50" height="11" rx="4" fill={shine} stroke={stroke} strokeWidth="4"/>
          <circle cx="22" cy="24" r="4" fill={shine}/>
          <circle cx="42" cy="16" r="5" fill={shine}/>
          <circle cx="62" cy="24" r="4" fill={shine}/>
        </>
      );
    case "chalice":
      return wrap(
        <>
          <path d="M24 18 H60 V28 C60 42, 52 52, 42 56 C32 52, 24 42, 24 28 Z" fill={fill} stroke={stroke} strokeWidth="4"/>
          <rect x="38" y="56" width="8" height="12" rx="3" fill={shine} stroke={stroke} strokeWidth="4"/>
          <rect x="28" y="68" width="28" height="7" rx="3" fill={fill} stroke={stroke} strokeWidth="4"/>
        </>
      );
    case "orb":
      return wrap(
        <>
          <circle cx="42" cy="36" r="20" fill={fill} stroke={stroke} strokeWidth="4"/>
          <ellipse cx="35" cy="30" rx="8" ry="5" fill={shine} opacity="0.9"/>
          <rect x="35" y="58" width="14" height="6" rx="3" fill={shine} stroke={stroke} strokeWidth="4"/>
          <rect x="28" y="64" width="28" height="8" rx="3" fill={fill} stroke={stroke} strokeWidth="4"/>
        </>
      );
    case "mask":
      return wrap(
        <>
          <path d="M18 28 C26 16, 58 16, 66 28 L60 52 C53 60, 31 60, 24 52 Z" fill={fill} stroke={stroke} strokeWidth="4"/>
          <ellipse cx="31" cy="38" rx="6" ry="5" fill="#0b0f18"/>
          <ellipse cx="53" cy="38" rx="6" ry="5" fill="#0b0f18"/>
          <path d="M32 50 C38 54, 46 54, 52 50" fill="none" stroke={shine} strokeWidth="3" strokeLinecap="round"/>
        </>
      );
    case "idol":
      return wrap(
        <>
          <rect x="28" y="18" width="28" height="42" rx="7" fill={fill} stroke={stroke} strokeWidth="4"/>
          <circle cx="42" cy="28" r="6" fill={shine}/>
          <rect x="35" y="37" width="14" height="16" rx="5" fill={shine} opacity="0.65"/>
          <rect x="24" y="60" width="36" height="10" rx="4" fill={fill} stroke={stroke} strokeWidth="4"/>
        </>
      );
    case "cameo":
      return wrap(
        <>
          <ellipse cx="42" cy="40" rx="18" ry="24" fill={fill} stroke={stroke} strokeWidth="4"/>
          <path d="M38 28 C43 29, 47 34, 48 40 C48 48, 44 53, 37 56" fill="none" stroke={shine} strokeWidth="3" strokeLinecap="round"/>
          <circle cx="42" cy="14" r="5" fill={shine} stroke={stroke} strokeWidth="3"/>
        </>
      );
    case "vase":
      return wrap(
        <>
          <path d="M32 16 H52 V24 C52 30, 48 34, 48 38 C48 46, 56 50, 56 60 C56 69, 50 74, 42 74 C34 74, 28 69, 28 60 C28 50, 36 46, 36 38 C36 34, 32 30, 32 24 Z" fill={fill} stroke={stroke} strokeWidth="4"/>
          <path d="M32 30 C38 34, 46 34, 52 30" fill="none" stroke={shine} strokeWidth="3"/>
          <path d="M30 53 C36 49, 48 49, 54 53" fill="none" stroke={shine} strokeWidth="3"/>
        </>
      );
    case "medallion":
      return wrap(
        <>
          <circle cx="42" cy="40" r="18" fill={fill} stroke={stroke} strokeWidth="4"/>
          <circle cx="42" cy="40" r="9" fill={shine}/>
          <path d="M36 58 L30 74 L42 68 L54 74 L48 58" fill={fill} stroke={stroke} strokeWidth="4" strokeLinejoin="round"/>
        </>
      );
    case "painting":
    default:
      return wrap(
        <>
          <rect x="18" y="16" width="48" height="52" rx="4" fill={stroke} stroke="#1f1208" strokeWidth="4"/>
          <rect x="24" y="22" width="36" height="40" rx="3" fill={fill}/>
          <circle cx="36" cy="35" r="7" fill={shine}/>
          <path d="M27 56 L38 42 L46 49 L57 34 L57 56 Z" fill={shine} opacity="0.78"/>
        </>
      );
  }
}

export const PrizeCaseScene = memo(function PrizeCaseScene({ prize }) {
  return (
    <svg viewBox="0 0 260 150" width="260" height="150" aria-hidden="true">
      <defs>
        <linearGradient id="casePedestalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4150"/>
          <stop offset="100%" stopColor="#1c2029"/>
        </linearGradient>
        <linearGradient id="caseGlassGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf6ff" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#9ec6ff" stopOpacity="0.08"/>
        </linearGradient>
      </defs>
      <ellipse cx="130" cy="130" rx="76" ry="13" fill="#000" opacity="0.28"/>
      <ellipse cx="130" cy="115" rx="38" ry="9" fill="#4a5365" opacity="0.42"/>
      <path d="M98 108 Q130 100 162 108 L156 124 Q130 130 104 124 Z" fill="url(#casePedestalGrad)" stroke="#0f1218" strokeWidth="3"/>
      <ellipse cx="130" cy="108" rx="32" ry="7" fill="#2d3340" stroke="#5a6478" strokeWidth="2"/>
      <ellipse cx="130" cy="100" rx="26" ry="5.5" fill="#1b2029" opacity="0.95"/>
      <g opacity="0.96">
        <path d="M92 34 L168 34 L164 42 L96 42 Z" fill="#ecf7ff" opacity="0.2"/>
        <rect x="92" y="40" width="76" height="60" rx="4" fill="url(#caseGlassGrad)" stroke="#cfe7ff" strokeWidth="2.4"/>
        <path d="M100 48 L100 96" stroke="#eef8ff" strokeWidth="1.8" opacity="0.28"/>
        <path d="M160 48 L160 96" stroke="#eef8ff" strokeWidth="1.8" opacity="0.22"/>
        <path d="M98 48 L158 48" stroke="#ffffff" strokeWidth="1.6" opacity="0.18"/>
      </g>
      <path d="M95 41 L88 54 L98 70 L108 52 Z" fill="#d8efff" fillOpacity="0.18" stroke="#d8efff" strokeWidth="1.6" strokeOpacity="0.72"/>
      <path d="M110 42 L119 73 L103 96 L94 65 Z" fill="#d8efff" fillOpacity="0.14" stroke="#d8efff" strokeWidth="1.6" strokeOpacity="0.68"/>
      <path d="M120 43 L132 61 L126 95 L113 72 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.6" strokeOpacity="0.62"/>
      <path d="M138 42 L151 58 L145 88 L132 68 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.6" strokeOpacity="0.66"/>
      <path d="M152 40 L166 52 L160 78 L146 62 Z" fill="#d8efff" fillOpacity="0.14" stroke="#d8efff" strokeWidth="1.6" strokeOpacity="0.72"/>
      <path d="M172 108 L182 116 L176 126 L164 120 Z" fill="#d8efff" fillOpacity="0.16" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.65"/>
      <path d="M84 112 L94 121 L88 129 L76 121 Z" fill="#d8efff" fillOpacity="0.14" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.6"/>
      <path d="M188 101 L196 109 L190 118 L180 111 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.3" strokeOpacity="0.54"/>
      <path d="M72 100 L81 108 L74 116 L64 109 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.3" strokeOpacity="0.52"/>
      <path d="M110 92 L118 104" stroke="#d8efff" strokeWidth="1.7" opacity="0.62"/>
      <path d="M130 84 L136 98" stroke="#d8efff" strokeWidth="1.7" opacity="0.62"/>
      <path d="M149 90 L158 103" stroke="#d8efff" strokeWidth="1.7" opacity="0.62"/>
      <g transform="translate(130 79)">
        <PrizeIcon prize={prize} size={82}/>
      </g>
      <ellipse cx="130" cy="95" rx="30" ry="9" fill="#8fd4ff" opacity="0.08"/>
      <text x="130" y="142" textAnchor="middle" fontSize="11" fill="#ffd889" fontFamily="monospace" letterSpacing="2.2">
        CASE CRACKED
      </text>
    </svg>
  );
});

export const PrizeVictoryScene = memo(function PrizeVictoryScene({
  prize,
  burglarFigure: BurglarFigure,
  basePose,
}) {
  const celebratePose = {
    ...basePose,
    tr: [-4, [0, -26]],
    hd: [1, -34, -4],
    aL: [[-8, -24], [-18, -56], [-10, -88]],
    aR: [[8, -24], [18, -56], [10, -88]],
    lL: [[0, 0], [-10, 28], [-8, 56]],
    lR: [[0, 0], [12, 28], [10, 56]],
    gY: -2,
  };
  return (
    <svg viewBox="0 0 320 190" width="320" height="190" aria-hidden="true">
      <defs>
        <linearGradient id="victoryPedestalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4150"/>
          <stop offset="100%" stopColor="#1c2029"/>
        </linearGradient>
        <linearGradient id="victoryGlassGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eaf6ff" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#9ec6ff" stopOpacity="0.08"/>
        </linearGradient>
        <linearGradient id="victoryFloorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#626b78"/>
          <stop offset="100%" stopColor="#3a414d"/>
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="164" rx="116" ry="22" fill="#0a0d12" opacity="0.18"/>
      <path d="M30 152 Q160 134 290 152 L302 184 Q160 194 18 184 Z" fill="url(#victoryFloorGrad)" opacity="0.96"/>
      <path d="M42 154 Q160 140 278 154" fill="none" stroke="#a9b5c4" strokeWidth="2.2" opacity="0.28"/>
      <path d="M34 168 Q160 154 286 168" fill="none" stroke="#20262f" strokeWidth="2" opacity="0.28"/>
      <ellipse cx="176" cy="156" rx="88" ry="14" fill="#000" opacity="0.18"/>
      <g opacity="0.96" transform="translate(-6 2)">
        <ellipse cx="66" cy="126" rx="28" ry="7" fill="#4a5365" opacity="0.42"/>
        <path d="M42 120 Q66 112 90 120 L85 133 Q66 138 47 133 Z" fill="url(#victoryPedestalGrad)" stroke="#0f1218" strokeWidth="3"/>
        <ellipse cx="66" cy="119" rx="22" ry="5.5" fill="#2d3340" stroke="#5a6478" strokeWidth="2"/>
        <ellipse cx="66" cy="112" rx="17" ry="4" fill="#1b2029" opacity="0.95"/>
        <path d="M40 56 L92 56 L89 62 L43 62 Z" fill="#ecf7ff" opacity="0.2"/>
        <rect x="40" y="60" width="52" height="50" rx="4" fill="url(#victoryGlassGrad)" stroke="#cfe7ff" strokeWidth="2.2"/>
        <path d="M46 66 L46 104" stroke="#eef8ff" strokeWidth="1.5" opacity="0.26"/>
        <path d="M86 66 L86 104" stroke="#eef8ff" strokeWidth="1.5" opacity="0.2"/>
        <path d="M45 68 L89 68" stroke="#ffffff" strokeWidth="1.4" opacity="0.16"/>
        <path d="M43 61 L37 72 L45 86 L53 71 Z" fill="#d8efff" fillOpacity="0.16" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.7"/>
        <path d="M54 62 L61 87 L49 106 L42 80 Z" fill="#d8efff" fillOpacity="0.13" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.68"/>
        <path d="M64 63 L74 79 L69 104 L59 84 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.62"/>
        <path d="M78 62 L89 74 L84 95 L73 82 Z" fill="#d8efff" fillOpacity="0.13" stroke="#d8efff" strokeWidth="1.4" strokeOpacity="0.68"/>
        <path d="M95 120 L103 127 L98 135 L88 129 Z" fill="#d8efff" fillOpacity="0.14" stroke="#d8efff" strokeWidth="1.2" strokeOpacity="0.6"/>
        <path d="M28 122 L36 129 L31 136 L21 130 Z" fill="#d8efff" fillOpacity="0.12" stroke="#d8efff" strokeWidth="1.2" strokeOpacity="0.56"/>
      </g>
      <g transform="translate(166 132)">
        <BurglarFigure pose={celebratePose} curName="run_a" prevName="run_a" flash={false} hitFlash={false}/>
        <g style={{animation:"prizeLift 1.15s cubic-bezier(.2,.7,.2,1) forwards"}}>
          <g transform="translate(0,-88)">
            <PrizeIcon prize={prize} size={84}/>
          </g>
        </g>
      </g>
      <text x="196" y="34" textAnchor="middle" fontSize="12" fill="#ffd889" fontFamily="monospace" letterSpacing="2.2">
        PRIZE SECURED
      </text>
    </svg>
  );
});

export const HeistFinaleScene = memo(function HeistFinaleScene({
  prize,
  burglarFigure: BurglarFigure,
  basePose,
  prizeByLevel,
}) {
  const finalePose = {
    ...basePose,
    tr: [-2, [0, -24]],
    hd: [0, -32, -6],
    aL: [[-8, -24], [-26, -60], [-22, -98]],
    aR: [[8, -24], [28, -60], [24, -98]],
    lL: [[0, 0], [-16, 24], [-22, 50]],
    lR: [[0, 0], [18, 24], [24, 50]],
    gY: -4,
  };
  const confetti = Array.from({ length: 22 }, (_, index) => ({
    x: 26 + index * 13,
    y: 18 + (index % 5) * 10,
    rot: (index % 7) * 17 - 40,
    col: ["#ff6f61", "#ffd889", "#7ce7ff", "#44ff88", "#ff8bd8"][index % 5],
  }));
  return (
    <svg viewBox="0 0 360 230" width="360" height="230" aria-hidden="true">
      <defs>
        <radialGradient id="finaleGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffd889" stopOpacity="0.38"/>
          <stop offset="100%" stopColor="#ffd889" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="finaleFloorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a7380"/>
          <stop offset="100%" stopColor="#3c434f"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="230" rx="18" fill="#090611"/>
      <ellipse cx="180" cy="64" rx="118" ry="54" fill="url(#finaleGlow)"/>
      {confetti.map((piece, index) => (
        <rect
          key={index}
          x={piece.x}
          y={piece.y}
          width="7"
          height="15"
          rx="2"
          fill={piece.col}
          transform={`rotate(${piece.rot} ${piece.x + 3.5} ${piece.y + 7.5})`}
          opacity="0.9"
        />
      ))}
      <ellipse cx="180" cy="194" rx="136" ry="26" fill="#06080c" opacity="0.22"/>
      <path d="M42 178 Q180 154 318 178 L332 214 Q180 226 28 214 Z" fill="url(#finaleFloorGrad)" opacity="0.98"/>
      <path d="M56 180 Q180 160 304 180" fill="none" stroke="#bcc6d3" strokeWidth="2.3" opacity="0.26"/>
      <path d="M46 194 Q180 174 314 194" fill="none" stroke="#1f252e" strokeWidth="2" opacity="0.3"/>
      <ellipse cx="184" cy="182" rx="104" ry="18" fill="#000" opacity="0.2"/>
      <path d="M94 186 Q120 164 146 178 Q168 156 194 170 Q214 150 236 170 Q260 158 284 186 Z" fill="#8b949f" opacity="0.92"/>
      <path d="M100 180 Q124 160 148 172 Q168 152 192 164 Q214 146 236 164 Q258 154 278 180 Z" fill="#b8c0ca" opacity="0.95"/>
      <g transform="translate(122 168)">
        <PrizeIcon prize={prizeByLevel[16]} size={54}/>
      </g>
      <g transform="translate(210 162)">
        <PrizeIcon prize={prizeByLevel[22]} size={48}/>
      </g>
      <g transform="translate(166 146)">
        <PrizeIcon prize={prizeByLevel[28]} size={62}/>
      </g>
      <g transform="translate(180 154)">
        <BurglarFigure pose={finalePose} curName="run_a" prevName="run_a" flash={false} hitFlash={false}/>
        <g style={{animation:"prizeLift 1.15s cubic-bezier(.2,.7,.2,1) forwards"}}>
          <g transform="translate(0,-98)">
            <PrizeIcon prize={prize} size={90}/>
          </g>
        </g>
      </g>
      <text x="180" y="34" textAnchor="middle" fontSize="15" fill="#ffd889" fontFamily="monospace" letterSpacing="3">
        THE HEIST IS COMPLETE
      </text>
      <text x="180" y="206" textAnchor="middle" fontSize="11" fill="#fff3d1" fontFamily="monospace" letterSpacing="2">
        ONE LAST SCORE FOR THE TREASURE ROOM
      </text>
    </svg>
  );
});
