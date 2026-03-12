import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef, memo, useMemo } from "react";
import HeistMuseumBackground from "./HeistMuseumBackground.jsx";
import RhythmLane from "./components/RhythmLane.jsx";
import { HeistGameplayScene } from "./components/HeistGameplayScene.jsx";
import { HeistMenuPanel, StartControls } from "./components/HeistShellPanels.jsx";
import {
  HeistFinaleScene,
  PrizeCaseScene,
  PrizeIcon,
  PrizeVictoryScene,
} from "./components/HeistPrizeScenes.jsx";
import {
  EndlessUnlockOverlay,
  GameHud,
  TreasureRoomOverlay,
} from "./components/HeistHudOverlays.jsx";
import { NotationLabOverlay } from "./components/HeistDebugTools.jsx";
import {
  DEFAULT_TIME_SIGNATURE,
  getTimeSignatureLabel,
  getBeatsPerBar,
  getActiveNoteValuesLabel,
  createHeistRhythmData,
  getLevelTeachingIntro,
} from "./heist-rhythm-data.js";
import { useHeistRunState } from "./useHeistRunState.js";
import finaleEngraverUrl from "./FinaleEngraver.otf";
import finaleMaestroUrl from "./FinaleMaestro.otf";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const W = 720, H = 360, GROUND_Y = 278, BURGLAR_X = 150;
const SPEED = 3.5;       // world-px per frame @ 60fps — needs to be fast enough that
                          // obstacles visibly travel in from the right
const DEFAULT_BPM = 90;
const RHYTHM_TRAVEL_BEATS = 4;
const RHYTHM_WINDOW_RATIO = 0.22;
const PRESS_HOLD_ACCURATE_RELEASE_BEATS = 1 / 3;
const HOLD_TOO_EARLY_EXTRA_BEATS = 0.25;
const ACCURATE_HIT_MAX_MS = 48;
const ACCURATE_HIT_MIN_MS = 24;
const COLLISION_RADIUS = 36;
const APPROACH_BEAM_BACK = 170;
const APPROACH_BEAM_FRONT = 14;
const HIT_ZONE_HALF_HEIGHT = 10;
const EMITTER_HEAD_W = 14;
const EMITTER_HEAD_H = 28;
const LASER_WALL_X = 92;
const LASER_APERTURE_X = 72;
const LASER_PLATE_W = 12;
const LASER_PLATE_H = 58;
const LASER_ARM_LEN = 14;
const RHYTHM_HIT_X = 86;
const RHYTHM_SPAWN_X = W - 28;
const RHYTHM_LANE_Y = 72;
const MAX_LIVES = 3;
const MISS_LIMIT  = 5;   // consecutive missed beats → burglar fails to dodge
const OBSTACLE_AT_BEAT = 4;
const COUNT_IN_LEAD_BEATS = 1;
const DEV_MODE = false;
const FORCE_FULL_UNLOCK = false;
const ENDLESS_BPM_STEP_MS = 30000;
const ENDLESS_BPM_STEP = 5;
const ENDLESS_BASE_BPM = 100;
const USE_TEMPLATE_BEAMS = true;
const PRESS_HOLD_STYLES = new Set(["half_hold", "measure_rest", "endless_hold"]);
const MUSIC_NOTATION_FONT_FAMILY = '"FinaleEngraverLocal","FinaleMaestroLocal","Finale Engraver","Finale Maestro","Maestro","Bravura","Academico","Apple Symbols","Arial Unicode MS","STIXGeneral",serif';
const STANDALONE_EIGHTH_FLAG_PATH = "M8.7 -27 C15.8 -26.2, 17.2 -19.2, 13.2 -14.9 C16.8 -15.6, 17.9 -11.1, 15.6 -7.8 C12.9 -9.5, 10.8 -11, 8.7 -12.2 Z";

// OBSTACLE_AT_BEAT = 4 → obstacle spawns 4 beats ahead of the burglar using
// the active level tempo. Level authors only change authored data; controls,
// scroll speed, obstacle meanings, and collision rules stay shared.

const bpmToBeatMs = bpm => 60000 / bpm;
const beatMsToPxPerBeat = beatMs => SPEED * (beatMs / (1000 / 60));
const beatMsToTravelMs = beatMs => beatMs * RHYTHM_TRAVEL_BEATS;
const beatMsToWindowMs = beatMs => Math.round(beatMs * RHYTHM_WINDOW_RATIO);
const beatMsToAccurateHoldReleaseMs = beatMs => Math.round(beatMs * PRESS_HOLD_ACCURATE_RELEASE_BEATS);
const beatMsToAccurateWindowMs = beatMs => Math.min(ACCURATE_HIT_MAX_MS, Math.max(ACCURATE_HIT_MIN_MS, Math.round(beatMs * 0.075)));
const {
  MOVE_TEMPLATES,
  PHRASES,
  PHRASE_BY_ID,
  LEVEL_THEME_PRESETS,
  LEVELS,
  PRIZE_BY_LEVEL,
  ENDLESS_BLUEPRINTS,
  makePhrase,
  clampCampaignLevel,
  getCampaignLevelDef,
} = createHeistRhythmData({ obstacleAtBeat: OBSTACLE_AT_BEAT });
// and is scheduled in world space, so it always has several beats of lead time.

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────────────────────────────────────
let _ctx = null;
const ac = () => {
  if (!_ctx) _ctx = new (window.AudioContext||window.webkitAudioContext)();
  if (_ctx.state==="suspended") _ctx.resume();
  return _ctx;
};
const kick = () => {
  const c=ac(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);
  o.frequency.setValueAtTime(160,c.currentTime);
  o.frequency.exponentialRampToValueAtTime(40,c.currentTime+0.1);
  g.gain.setValueAtTime(1,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.22);
  o.start();o.stop(c.currentTime+0.25);
};
const snare = () => {
  const c=ac(),sz=c.sampleRate*0.1,b=c.createBuffer(1,sz,c.sampleRate);
  const d=b.getChannelData(0);for(let i=0;i<sz;i++)d[i]=Math.random()*2-1;
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  f.type="highpass";f.frequency.value=1800;
  s.buffer=b;s.connect(f);f.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(0.55,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.12);
  s.start();s.stop(c.currentTime+0.14);
};
const hat = (acc) => {
  const c=ac(),sz=Math.floor(c.sampleRate*0.03),b=c.createBuffer(1,sz,c.sampleRate);
  const d=b.getChannelData(0);for(let i=0;i<sz;i++)d[i]=Math.random()*2-1;
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  f.type="highpass";f.frequency.value=9000;
  s.buffer=b;s.connect(f);f.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(acc?0.28:0.14,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.03);
  s.start();s.stop(c.currentTime+0.04);
};
const tapSound = (timing = "on_time") => {
  const c=ac(),o=c.createOscillator(),g=c.createGain();
  const baseFreq = timing === "early" ? 760 : timing === "late" ? 980 : 880;
  o.type = timing === "on_time" ? "triangle" : "sine";
  o.frequency.setValueAtTime(baseFreq, c.currentTime);
  if (timing === "early") {
    o.frequency.exponentialRampToValueAtTime(baseFreq * 0.88, c.currentTime + 0.06);
  } else if (timing === "late") {
    o.frequency.exponentialRampToValueAtTime(baseFreq * 1.08, c.currentTime + 0.06);
  }
  o.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(timing === "on_time" ? 0.22 : 0.18,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.06);
  o.start();o.stop(c.currentTime+0.2);
};
const wrongTapSound = () => {
  const c=ac(),o=c.createOscillator(),g=c.createGain();
  o.type="square";o.frequency.setValueAtTime(240,c.currentTime);
  o.frequency.exponentialRampToValueAtTime(170,c.currentTime+0.08);
  o.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(0.18,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.12);
  o.start();o.stop(c.currentTime+0.14);
};
const hitSound = () => {
  const c=ac(),o=c.createOscillator(),g=c.createGain();
  o.frequency.value=65;o.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(0.9,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.38);
  o.start();o.stop(c.currentTime+0.42);
};

// ─────────────────────────────────────────────────────────────────────────────
// EASING
// ─────────────────────────────────────────────────────────────────────────────
const eIO  = t=>t<0.5?2*t*t:-1+(4-2*t)*t;
const eIn  = t=>t*t*t;
const eBnc = t=>{
  if(t<1/2.75)return 7.5625*t*t;
  if(t<2/2.75){t-=1.5/2.75;return 7.5625*t*t+0.75;}
  if(t<2.5/2.75){t-=2.25/2.75;return 7.5625*t*t+0.9375;}
  t-=2.625/2.75;return 7.5625*t*t+0.984375;
};

// ─────────────────────────────────────────────────────────────────────────────
// POSES
// Each pose: tr=[bodyRotDeg,[offsetX,offsetY]], hd=[dx,dy,rot],
//   aL/aR/lL/lR = [[shoulder/hip],[elbow/knee],[hand/foot]]
//   gY = Y offset of the whole body group (negative=up, positive=down/crouch)
//   bodyTop = approx px above ground of the TOP of the body (head) while in this pose
//   bodyBot = approx px above ground of the BOTTOM (feet) while in this pose
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  //                                                                                                              gY    clearH clearL
  run_a:      {tr:[-12,[0,-28]],   hd:[4,-44,-8],    aL:[[-8,-22],[-30,-42],[-36,-24]],aR:[[8,-22],[26,-4],[22,18]],   lL:[[0,0],[-14,28],[-8,56]],   lR:[[0,0],[16,22],[26,48]],   gY:0,   clearH:0,   clearL:88},
  run_b:      {tr:[10,[0,-28]],    hd:[-4,-44,7],    aL:[[-8,-22],[-20,-4],[-16,18]],  aR:[[8,-22],[30,-42],[34,-22]],lL:[[0,0],[-18,22],[-24,48]],  lR:[[0,0],[14,28],[8,56]],    gY:0,   clearH:0,   clearL:88},
  jump_open:  {tr:[-24,[0,-38]],   hd:[7,-56,-18],   aL:[[-8,-28],[-36,-50],[-50,-34]],aR:[[8,-28],[36,-50],[50,-34]],lL:[[0,0],[-28,4],[-46,-8]],   lR:[[0,0],[28,4],[46,-8]],    gY:-98, clearH:98,  clearL:208},
  jump_tuck:  {tr:[-56,[0,-18]],   hd:[26,-10,84],   aL:[[-5,-14],[-16,-2],[-8,10]],   aR:[[5,-14],[16,-2],[8,10]],  lL:[[0,0],[-6,-2],[-2,10]],    lR:[[0,0],[6,-2],[2,10]],     gY:-74, clearH:74,  clearL:150},
  dive:       {tr:[-82,[6,-16]],   hd:[20,-28,-76],  aL:[[0,-10],[-8,8],[-6,28]],      aR:[[0,-10],[36,-20],[52,-14]],lL:[[0,0],[-4,-22],[-2,-46]],  lR:[[0,0],[6,-20],[16,-42]],  gY:6,   clearH:0,   clearL:22},
  slide_low:  {tr:[-72,[4,-12]],   hd:[16,-22,-68],  aL:[[0,-8],[-6,6],[-4,20]],       aR:[[0,-8],[30,-14],[44,-10]],lL:[[0,0],[-24,8],[-42,6]],    lR:[[0,0],[24,6],[46,4]],     gY:12,  clearH:0,   clearL:18},
  duck_low:   {tr:[8,[0,-16]],     hd:[4,-26,12],    aL:[[-6,-12],[-26,4],[-24,22]],   aR:[[6,-12],[26,4],[24,22]],  lL:[[0,0],[-24,10],[-32,28]],  lR:[[0,0],[24,10],[32,28]],   gY:10,  clearH:0,   clearL:36},
  duck_crawl: {tr:[15,[-4,-12]],   hd:[-10,-22,20],  aL:[[-4,-10],[-26,0],[-36,12]],   aR:[[4,-10],[16,2],[22,16]],  lL:[[0,0],[-16,14],[-30,10]],  lR:[[0,0],[20,12],[38,8]],    gY:16,  clearH:0,   clearL:24},
  windmill_a: {tr:[50,[-4,-22]],   hd:[-16,2,44],  aL:[[-8,-18],[-32,-6],[-44,10]],  aR:[[6,-14],[24,-28],[36,-42]],lL:[[0,0],[22,-14],[38,-28]],  lR:[[0,0],[-20,-18],[-34,-36]],gY:-64, clearH:64,  clearL:156},
  windmill_b: {tr:[-50,[4,-22]],   hd:[16,2,-44],  aL:[[-6,-14],[-24,-28],[-36,-42]],aR:[[8,-18],[32,-6],[44,10]], lL:[[0,0],[-22,-14],[-38,-28]],lR:[[0,0],[20,-18],[34,-36]], gY:-64,  clearH:64,  clearL:156},
  headspin:   {tr:[180,[0,-50]],   hd:[28,-28,86],   aL:[[-8,-36],[-28,-20],[-32,-2]], aR:[[8,-36],[28,-20],[32,-2]],lL:[[0,0],[-14,-18],[-10,-38]],lR:[[0,0],[14,-18],[10,-38]], gY:-58,  clearH:58,  clearL:160},
  freeze:     {tr:[-66,[-8,-40]],  hd:[12,-56,-60],  aL:[[-4,-28],[-24,-12],[-28,8]],  aR:[[6,-28],[8,-2],[6,20]],   lL:[[0,0],[20,-18],[38,-32]],  lR:[[0,0],[-18,-16],[-30,-30]],gY:-54, clearH:54,  clearL:122},
  whoops:     {tr:[22,[4,-26]],    hd:[-8,-42,20],   aL:[[-8,-22],[-28,-8],[-24,16]],  aR:[[8,-22],[24,-34],[30,-10]],lL:[[0,0],[-16,22],[-22,48]],  lR:[[0,0],[18,16],[28,40]],  gY:4,   clearH:0,   clearL:84},
  caught:     {tr:[25,[0,-26]],    hd:[-6,-20,30],   aL:[[-8,-22],[-32,-38],[-28,-16]],aR:[[8,-22],[34,-28],[38,-6]],lL:[[0,0],[-12,26],[-6,52]],   lR:[[0,0],[18,22],[16,48]],   gY:0,   clearH:0,   clearL:88},
};

const POSE_CLEARANCE = {
  run_a:      { clearH: 0,  clearL: 88 },
  run_b:      { clearH: 0,  clearL: 88 },
  jump_open:  { clearH: 98, clearL: 208 },
  jump_tuck:  { clearH: 74, clearL: 150 },
  duck_low:   { clearH: 0,  clearL: 36 },
  duck_crawl: { clearH: 0,  clearL: 24 },
  slide_low:  { clearH: 0,  clearL: 18 },
  windmill_a: { clearH: 64, clearL: 156 },
  windmill_b: { clearH: 64, clearL: 156 },
  headspin:   { clearH: 58, clearL: 160 },
  freeze:     { clearH: 54, clearL: 122 },
  whoops:     { clearH: 0,  clearL: 84 },
};

const GATED_MOVE_POSES = new Set([
  "jump_open",
  "jump_tuck",
  "duck_low",
  "duck_crawl",
  "slide_low",
  "windmill_a",
  "windmill_b",
  "headspin",
  "freeze",
]);

const PEAK_POSE_TO_OBSTACLE = {
  jump_open: "laser_low",
  freeze: "guard_patrol",
  duck_low: "laser_high",
  duck_crawl: "laser_high",
  slide_low: "laser_high",
  windmill_a: "laser_gap",
  windmill_b: "laser_gap",
  headspin: "laser_gap",
  jump_tuck: "laser_sandwich",
};

// ─────────────────────────────────────────────────────────────────────────────
// Fixed obstacle definitions. Beam Y positions are constants, not pose-derived.
const OBSTACLE_DEFS = {
  laser_low: {
    col: "#ff0040",
    laserYs: [{ y1: GROUND_Y - 54 }],
    visualAnchor: "left_wall",
    mountPattern: ["left"],
  },
  laser_high: {
    col: "#ff6600",
    laserYs: [{ y1: GROUND_Y - 110 }],
    visualAnchor: "right_wall",
    mountPattern: ["right"],
  },
  laser_gap: {
    col: "#ff2288",
    laserYs: [{ y1: GROUND_Y - 130 }, { y1: GROUND_Y - 32 }],
    visualAnchor: "paired_walls",
    mountPattern: ["left", "right"],
  },
  laser_sandwich: {
    col: "#ff0088",
    laserYs: [{ y1: GROUND_Y - 148 }, { y1: GROUND_Y - 58 }],
    visualAnchor: "staggered_walls",
    mountPattern: ["right", "left"],
  },
  guard_patrol: {
    col: "#f5e642",
    isGuard: true,
    patrolBeats: 1.5,
  },
};

function poseClears(poseName, obsType) {
  const clearance = POSE_CLEARANCE[poseName];
  if (!clearance) return false;
  const { clearH, clearL } = clearance;
  switch (obsType) {
    case "laser_low":      return clearH >= 18;
    case "laser_high":     return clearL <= 44;
    case "laser_gap":      return clearH >= 26 && clearL <= 165;
    case "laser_sandwich": return clearH >= 56 && clearL <= 165;
    case "guard_patrol":   return poseName === "freeze";
    default:               return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POSE INTERPOLATION
// ─────────────────────────────────────────────────────────────────────────────
const lN  = (a,b,t)=>a+(b-a)*t;
const lP  = ([ax,ay],[bx,by],t)=>[ax+(bx-ax)*t,ay+(by-ay)*t];
const lPs = (a,b,t)=>a.map((p,i)=>lP(p,b[i],t));
const lA  = (a,b,t)=>{ const d=((b-a+540)%360)-180; return a+d*t; };

function blendPose(A,B,t) {
  if(!A||!B) return B||A;
  const e=eIO(Math.min(t,1));
  return {
    tr: [lA(A.tr[0],B.tr[0],e),lP(A.tr[1],B.tr[1],e)],
    hd: [lN(A.hd[0],B.hd[0],e),lN(A.hd[1],B.hd[1],e),lA(A.hd[2],B.hd[2],e)],
    aL: lPs(A.aL,B.aL,e), aR: lPs(A.aR,B.aR,e),
    lL: lPs(A.lL,B.lL,e), lR: lPs(A.lR,B.lR,e),
    gY: lN(A.gY,B.gY,e),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BURGLAR RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function Limb({pts,w,col,hi}) {
  const d=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <g>
      <path d={d} fill="none" stroke="#000" strokeWidth={w+4} strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} fill="none" stroke={hi}  strokeWidth={1.2} strokeLinecap="butt" strokeLinejoin="miter" opacity={0.45}/>
    </g>
  );
}
const FEMALE_BURGLAR_SCALE = 0.165;
const FEMALE_BURGLAR_HEAD_DROP = 0;
const FEMALE_BURGLAR_RIG = {
  torsoPivot: [400, 330],
  headCenter: [400, 230],
  headPivot: [400, 230],
  viewerLeftArm: { upper: [274, 356], elbow: [263, 466], hand: [260, 608] },
  viewerRightArm: { upper: [526, 356], elbow: [537, 466], hand: [540, 608] },
  viewerLeftLeg: { hip: [358, 520], knee: [356, 650], foot: [356, 770] },
  viewerRightLeg: { hip: [442, 520], knee: [444, 650], foot: [444, 770] },
};

function matrixFromSegment(srcA, srcB, dstA, dstB) {
  const sdx = srcB[0] - srcA[0];
  const sdy = srcB[1] - srcA[1];
  const ddx = dstB[0] - dstA[0];
  const ddy = dstB[1] - dstA[1];
  const sl = Math.hypot(sdx, sdy) || 1;
  const dl = Math.hypot(ddx, ddy) || 1;
  const scale = dl / sl;
  const angle = Math.atan2(ddy, ddx) - Math.atan2(sdy, sdx);
  const cos = Math.cos(angle) * scale;
  const sin = Math.sin(angle) * scale;
  const a = cos;
  const b = sin;
  const c = -sin;
  const d = cos;
  const e = dstA[0] - (a * srcA[0] + c * srcA[1]);
  const f = dstA[1] - (b * srcA[0] + d * srcA[1]);
  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;
}

function matrixFromPivot(srcPivot, dstPivot, rotationDeg, scale = FEMALE_BURGLAR_SCALE) {
  const angle = rotationDeg * Math.PI / 180;
  const cos = Math.cos(angle) * scale;
  const sin = Math.sin(angle) * scale;
  const a = cos;
  const b = sin;
  const c = -sin;
  const d = cos;
  const e = dstPivot[0] - (a * srcPivot[0] + c * srcPivot[1]);
  const f = dstPivot[1] - (b * srcPivot[0] + d * srcPivot[1]);
  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`;
}

function HideBox({mode, progress, beatPulse, hitFlash, jumpFigure}) {
  const eased = eIO(Math.max(0, Math.min(progress, 1)));
  const wobble = beatPulse && mode === "hidden" ? -3.1 : 0;
  const wobbleX = beatPulse && mode === "hidden" ? -1.8 : 0;
  const tapeCol = hitFlash ? "#ffe0ab" : "#e8d4a8";
  const labelCol = hitFlash ? "#fff2d8" : "#f7f0dc";
  const exitDrop = mode === "exit" ? eased * 20 : 0;
  const crateOpacity = mode === "exit" ? Math.max(0, 1 - eased * 3.4) : 1;
  return (
    <g transform={`translate(${wobbleX},0) rotate(${wobble})`}>
      <ellipse cx={0} cy={6} rx={38} ry={9} fill="#000" opacity={0.24}/>

      {jumpFigure}

      <g opacity={crateOpacity} transform={`translate(0,${exitDrop.toFixed(1)})`}>
        <path d="M-38 -52 L-18 -68 L18 -68 L38 -52 L38 14 L-38 14 Z"
          fill="#9d7445" stroke="#5a3b1d" strokeWidth="3.2" strokeLinejoin="round"/>
        <path d="M-38 -52 L-18 -68 L-18 -48 L-38 -30 Z"
          fill="#8b6235" stroke="#5a3b1d" strokeWidth="3.2" strokeLinejoin="round"/>
        <path d="M38 -52 L18 -68 L18 -48 L38 -30 Z"
          fill="#7b532a" stroke="#5a3b1d" strokeWidth="3.2" strokeLinejoin="round"/>
        <path d="M-38 -52 L38 -52" fill="none" stroke="#c69357" strokeWidth="2.2" opacity={0.7}/>
        <rect x={-38} y={-20} width={76} height={34} fill="#ad8050" stroke="#5a3b1d" strokeWidth="3.2" rx="2"/>
        <rect x={-4.5} y={-52} width={9} height={66} fill={tapeCol} opacity={0.92}/>
        <rect x={-38} y={-3} width={76} height={8} fill={tapeCol} opacity={0.72}/>
        <rect x={-25} y={-10} width={50} height={20} rx={2} fill={labelCol} stroke="#82684e" strokeWidth="1.8"/>
        <text x={0} y={-1.5} textAnchor="middle" fontSize={7.2} fontWeight="bold" letterSpacing={1.1}
          fill="#5a3b1d" fontFamily="monospace">ART SUPPLIES</text>
        <line x1={-23} y1={-25} x2={23} y2={-25} stroke="#5a3b1d" strokeWidth={2.1} opacity={0.48}/>
        <line x1={-27} y1={-42} x2={-12} y2={-57} stroke="#d4a15f" strokeWidth={4.5} strokeLinecap="round"/>
        <line x1={27} y1={-42} x2={12} y2={-57} stroke="#d4a15f" strokeWidth={4.5} strokeLinecap="round"/>
        <line x1={-11} y1={-63} x2={-3} y2={-78} stroke="#8bc3ff" strokeWidth={3.5} strokeLinecap="round"/>
        <line x1={0} y1={-63} x2={6} y2={-79} stroke="#ff8899" strokeWidth={3.5} strokeLinecap="round"/>
        <line x1={10} y1={-63} x2={16} y2={-77} stroke="#8fe0a4" strokeWidth={3.5} strokeLinecap="round"/>
        {mode !== "hidden" && (
          <path d="M-38 -52 L-18 -68 L0 -58 L18 -68 L38 -52"
            fill="none" stroke="#5a3b1d" strokeWidth="3.2" strokeLinejoin="round" opacity={0.85 + eased * 0.15}/>
        )}
      </g>
    </g>
  );
}

function RigBurglarFigure({pose, curName, prevName, flash, hitFlash, opacity = 1, showShadow = true}) {
  const accent=hitFlash?"#ffd17b":"#ff5bb9";
  const glow=flash?`drop-shadow(0 0 12px ${accent}) drop-shadow(0 0 24px ${accent}55)`:`drop-shadow(0 4px 10px #00000055)`;
  const [tRot,[tX,tY]]=pose.tr;
  const hx=tX+pose.hd[0], hy=tY+pose.hd[1];
  const headAngle = pose.hd[2] * Math.PI / 180;
  const headPivotOffsetY = (FEMALE_BURGLAR_RIG.headPivot[1] - FEMALE_BURGLAR_RIG.headCenter[1]) * FEMALE_BURGLAR_SCALE;
  const headPivotX = hx - Math.sin(headAngle) * headPivotOffsetY;
  const headPivotY = hy + Math.cos(headAngle) * headPivotOffsetY + FEMALE_BURGLAR_HEAD_DROP;
  const isWindmillPose = curName === "windmill_a" || curName === "windmill_b" || prevName === "windmill_a" || prevName === "windmill_b";
  const isHeadspinPose = curName === "headspin" || prevName === "headspin";
  const torsoY = isWindmillPose
    ? tY - 10
    : isHeadspinPose
      ? tY + 18
      : tY;
  const viewerLeftArm = pose.aL;
  const viewerRightArm = pose.aR;
  const viewerLeftLeg = pose.lL;
  const viewerRightLeg = pose.lR;
  const leftHandAngle = Math.atan2(viewerLeftArm[2][1]-viewerLeftArm[1][1], viewerLeftArm[2][0]-viewerLeftArm[1][0]) * 180 / Math.PI;
  const rightHandAngle = Math.atan2(viewerRightArm[2][1]-viewerRightArm[1][1], viewerRightArm[2][0]-viewerRightArm[1][0]) * 180 / Math.PI;
  const leftFootAngle = Math.atan2(viewerLeftLeg[2][1]-viewerLeftLeg[1][1], viewerLeftLeg[2][0]-viewerLeftLeg[1][0]) * 180 / Math.PI;
  const rightFootAngle = Math.atan2(viewerRightLeg[2][1]-viewerRightLeg[1][1], viewerRightLeg[2][0]-viewerRightLeg[1][0]) * 180 / Math.PI;
  return (
    <g style={{filter:glow, opacity}}>
      {showShadow && <ellipse cx={0} cy={6} rx={24} ry={5} fill="#000" opacity={0.24}/>}

      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerLeftLeg.hip, FEMALE_BURGLAR_RIG.viewerLeftLeg.knee, viewerLeftLeg[0], viewerLeftLeg[1])}>
        <rect x="332" y="520" width="52" height="138" rx="26" fill="#111318" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerRightLeg.hip, FEMALE_BURGLAR_RIG.viewerRightLeg.knee, viewerRightLeg[0], viewerRightLeg[1])}>
        <rect x="416" y="520" width="52" height="138" rx="26" fill="#111318" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerLeftLeg.knee, FEMALE_BURGLAR_RIG.viewerLeftLeg.foot, viewerLeftLeg[1], viewerLeftLeg[2])}>
        <rect x="332" y="650" width="48" height="126" rx="24" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerRightLeg.knee, FEMALE_BURGLAR_RIG.viewerRightLeg.foot, viewerRightLeg[1], viewerRightLeg[2])}>
        <rect x="420" y="650" width="48" height="126" rx="24" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.viewerLeftLeg.foot, viewerLeftLeg[2], leftFootAngle * 0.45, FEMALE_BURGLAR_SCALE)}>
        <path d="M323 770 C332 752, 379 752, 400 773 L406 800 L330 800 C321 800, 315 790, 323 770 Z" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M334 781 H396" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round"/>
      </g>
      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.viewerRightLeg.foot, viewerRightLeg[2], rightFootAngle * 0.45, FEMALE_BURGLAR_SCALE)}>
        <path d="M411 770 C420 752, 467 752, 488 773 L494 800 L418 800 C409 800, 403 790, 411 770 Z" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M422 781 H484" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round"/>
      </g>

      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.torsoPivot, [tX, torsoY], tRot)}>
        <polygon points="330,330 470,330 495,520 305,520" fill="#111318" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="320" y="348" width="160" height="16" rx="8" fill="#fff7ef" stroke="#3b2f2a" strokeWidth="6"/>
        <rect x="320" y="376" width="160" height="16" rx="8" fill="#fff7ef" stroke="#3b2f2a" strokeWidth="6"/>
        <rect x="320" y="404" width="160" height="16" rx="8" fill="#fff7ef" stroke="#3b2f2a" strokeWidth="6"/>
        <rect x="320" y="432" width="160" height="16" rx="8" fill="#fff7ef" stroke="#3b2f2a" strokeWidth="6"/>
        <rect x="320" y="460" width="160" height="16" rx="8" fill="#fff7ef" stroke="#3b2f2a" strokeWidth="6"/>
        <ellipse cx="400" cy="520" rx="95" ry="24" fill="#e9d9c6" opacity={0.45}/>
      </g>

      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerLeftArm.upper, FEMALE_BURGLAR_RIG.viewerLeftArm.elbow, viewerLeftArm[0], viewerLeftArm[1])}>
        <rect x="247" y="356" width="54" height="122" rx="27" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerRightArm.upper, FEMALE_BURGLAR_RIG.viewerRightArm.elbow, viewerRightArm[0], viewerRightArm[1])}>
        <rect x="499" y="356" width="54" height="122" rx="27" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerLeftArm.elbow, FEMALE_BURGLAR_RIG.viewerLeftArm.hand, viewerLeftArm[1], viewerLeftArm[2])}>
        <rect x="238" y="466" width="50" height="112" rx="25" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromSegment(FEMALE_BURGLAR_RIG.viewerRightArm.elbow, FEMALE_BURGLAR_RIG.viewerRightArm.hand, viewerRightArm[1], viewerRightArm[2])}>
        <rect x="512" y="466" width="50" height="112" rx="25" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.viewerLeftArm.hand, viewerLeftArm[2], leftHandAngle, FEMALE_BURGLAR_SCALE)}>
        <ellipse cx="260" cy="608" rx="30" ry="27" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
      </g>
      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.viewerRightArm.hand, viewerRightArm[2], rightHandAngle, FEMALE_BURGLAR_SCALE)}>
        <ellipse cx="540" cy="608" rx="30" ry="27" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
      </g>

      <g transform={matrixFromPivot(FEMALE_BURGLAR_RIG.headPivot, [headPivotX, headPivotY], pose.hd[2], FEMALE_BURGLAR_SCALE)}>
        <circle cx="335" cy="188" r="42" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
        <circle cx="465" cy="188" r="42" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6"/>
        <circle cx="335" cy="192" r="19" fill="#d99e95" stroke="#3b2f2a" strokeWidth="6"/>
        <circle cx="465" cy="192" r="19" fill="#d99e95" stroke="#3b2f2a" strokeWidth="6"/>
        <path d="M300 205 C300 130, 500 130, 500 205 L492 250 C485 290, 448 325, 400 330 C352 325, 315 290, 308 250 Z" fill="#8a5d42" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M285 165 C310 120, 490 120, 515 165 L500 205 C470 180, 330 180, 300 205 Z" fill="#22304a" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="400" cy="103" r="28" fill="#22304a" stroke="#3b2f2a" strokeWidth="6"/>
        <circle cx="400" cy="103" r="10" fill="#7b8aa3"/>
        <path d="M310 208 C345 180, 455 180, 490 208 L486 244 C458 222, 342 222, 314 244 Z" fill="#111318" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <ellipse cx="360" cy="236" rx="24" ry="28" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
        <ellipse cx="440" cy="236" rx="24" ry="28" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
        <circle cx="366" cy="242" r="10" fill="#2a201c"/>
        <circle cx="434" cy="242" r="10" fill="#2a201c"/>
        <circle cx="370" cy="237" r="3.5" fill="#ffffff"/>
        <circle cx="438" cy="237" r="3.5" fill="#ffffff"/>
        <ellipse cx="400" cy="276" rx="58" ry="42" fill="#c8926d" stroke="#3b2f2a" strokeWidth="6"/>
        <ellipse cx="400" cy="267" rx="17" ry="11" fill="#3b2f2a" stroke="#3b2f2a" strokeWidth="6"/>
        <path d="M400 278 L400 294" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round"/>
        <path d="M367 300 C384 322, 430 323, 449 304" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="384" y="300" width="13" height="19" rx="3" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
        <rect x="402" y="300" width="13" height="19" rx="3" fill="#fffdf7" stroke="#3b2f2a" strokeWidth="6"/>
        <path d="M345 216 C353 203, 369 198, 382 201" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M455 216 C447 203, 431 198, 418 201" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M348 330 C365 348, 435 348, 452 330" fill="#6b3f2f" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M322 164 C340 145, 360 140, 376 142" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M478 164 C460 145, 440 140, 424 142" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M320 171 C334 170, 350 176, 362 187" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M480 171 C466 170, 450 176, 438 187" fill="none" stroke="#3b2f2a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </g>
  );
}

function Burglar({curName,prevName,t,flash,hitFlash, boxMode="idle", boxT=0}) {
  const A=P[prevName]||P.run_a, B=P[curName]||P.run_a;
  const pose=t>=1?B:blendPose(A,B,t);
  if (boxMode !== "idle") {
    let jumpFigure = null;
    if (boxMode === "enter") {
      const enterT = Math.max(0, Math.min(boxT, 1));
      const jumpPose = blendPose(P.jump_open, P.jump_tuck, enterT);
      const leapY = -86 + enterT * 74;
      const leapX = -14 + enterT * 18;
      jumpFigure = (
        <g transform={`translate(${leapX.toFixed(1)},${leapY.toFixed(1)})`}>
          <RigBurglarFigure
            pose={jumpPose}
            curName="jump_open"
            prevName="jump_tuck"
            flash={flash}
            hitFlash={hitFlash}
            opacity={1}
            showShadow={false}
          />
        </g>
      );
    } else if (boxMode === "exit") {
      const exitT = Math.max(0, Math.min(boxT, 1));
      const jumpBlend = Math.min(exitT * 1.08, 1);
      const jumpPose = blendPose(P.jump_open, B, jumpBlend);
      const leapY = -Math.sin(Math.min(exitT, 1) * Math.PI) * 82 - 8;
      const leapX = exitT * 28;
      jumpFigure = (
        <g transform={`translate(${leapX.toFixed(1)},${leapY.toFixed(1)})`}>
          <RigBurglarFigure
            pose={jumpPose}
            curName="jump_open"
            prevName={curName}
            flash={flash}
            hitFlash={hitFlash}
            opacity={0.34 + exitT * 0.66}
            showShadow={false}
          />
        </g>
      );
    }
    return <HideBox mode={boxMode} progress={boxT} beatPulse={flash} hitFlash={hitFlash} jumpFigure={jumpFigure}/>;
  }

  return <RigBurglarFigure pose={pose} curName={curName} prevName={prevName} flash={flash} hitFlash={hitFlash}/>;
}

const BurglarActor = memo(forwardRef(function BurglarActor({ flash, hitFlash, beatMs }, ref) {
  const [curName, setCurName] = useState("run_a");
  const [prevName, setPrevName] = useState("run_a");
  const [poseT, setPoseT] = useState(1);
  const [burgY, setBurgY] = useState(0);
  const [boxMode, setBoxMode] = useState("idle");
  const [boxT, setBoxT] = useState(0);

  const curNameRef = useRef("run_a");
  const prevNameRef = useRef("run_a");
  const burgYRef = useRef(0);
  const boxModeRef = useRef("idle");
  const yAnimRef = useRef(null);
  const poseAnimRef = useRef(null);
  const boxAnimRef = useRef(null);

  function cancelAnimations() {
    cancelAnimationFrame(yAnimRef.current);
    cancelAnimationFrame(poseAnimRef.current);
    cancelAnimationFrame(boxAnimRef.current);
  }

  function animY(from, to, dur, ef) {
    cancelAnimationFrame(yAnimRef.current);
    const t0 = performance.now();
    const tick = now => {
      const frac = Math.min((now - t0) / dur, 1);
      burgYRef.current = from + (to - from) * ef(frac);
      setBurgY(burgYRef.current);
      if (frac < 1) yAnimRef.current = requestAnimationFrame(tick);
    };
    yAnimRef.current = requestAnimationFrame(tick);
  }

  function triggerBoxMode(mode, dur = beatMs * 0.44) {
    cancelAnimationFrame(boxAnimRef.current);
    boxModeRef.current = mode;
    setBoxMode(mode);
    if (mode === "idle") {
      setBoxT(0);
      return;
    }
    if (mode === "hidden") {
      setBoxT(1);
      return;
    }
    setBoxT(0);
    const t0 = performance.now();
    const tick = now => {
      const frac = Math.min((now - t0) / dur, 1);
      setBoxT(frac);
      if (frac < 1) boxAnimRef.current = requestAnimationFrame(tick);
    };
    boxAnimRef.current = requestAnimationFrame(tick);
  }

  function goToPose(name) {
    prevNameRef.current = curNameRef.current;
    curNameRef.current = name;
    setPrevName(prevNameRef.current);
    setCurName(name);
    setPoseT(0);
    cancelAnimationFrame(poseAnimRef.current);
    const isJumpPose = name === "jump_open" || name === "jump_tuck";
    const t0 = performance.now();
    const dur = isJumpPose ? beatMs * 0.08 : beatMs * 0.22;
    const tick = now => {
      const frac = Math.min((now - t0) / dur, 1);
      setPoseT(frac);
      if (frac < 1) poseAnimRef.current = requestAnimationFrame(tick);
    };
    poseAnimRef.current = requestAnimationFrame(tick);
    const pd = P[name];
    if (!pd) return;
    if (name === "jump_open" || name === "jump_tuck") animY(burgYRef.current, pd.gY, beatMs * 0.16, eIO);
    else if (name === "freeze") animY(burgYRef.current, 0, beatMs * 0.14, eIO);
    else if (pd.gY < -16) animY(burgYRef.current, pd.gY * 0.86, beatMs * 0.18, eIO);
    else if (pd.gY > 4) animY(burgYRef.current, pd.gY * 0.55, beatMs * 0.16, eIn);
    else animY(burgYRef.current, 0, beatMs * 0.20, eBnc);
  }

  function reset() {
    cancelAnimations();
    curNameRef.current = "run_a";
    prevNameRef.current = "run_a";
    boxModeRef.current = "idle";
    burgYRef.current = 0;
    setCurName("run_a");
    setPrevName("run_a");
    setPoseT(1);
    setBurgY(0);
    setBoxMode("idle");
    setBoxT(0);
  }

  useImperativeHandle(ref, () => ({
    goToPose,
    triggerBoxMode,
    reset,
  }), []);

  useEffect(() => () => {
    cancelAnimations();
  }, []);

  return (
    <g transform={`translate(0,${burgY})`}>
      <Burglar curName={curName} prevName={prevName} t={poseT} flash={flash} hitFlash={hitFlash} boxMode={boxMode} boxT={boxT}/>
    </g>
  );
}));

// ─────────────────────────────────────────────────────────────────────────────
// OBSTACLE VIEW — renders beams based on stored laserYs
// ─────────────────────────────────────────────────────────────────────────────
function buildLaserVisualLayout(obs) {
  const pattern = obs.mountPattern && obs.mountPattern.length ? obs.mountPattern : ["left"];
  return (obs.laserYs || []).map((beam, index) => {
    const sourceSide = pattern[index % pattern.length] || "left";
    const targetSide = sourceSide === "left" ? "right" : "left";
    return {
      y: beam.y1,
      sourceSide,
      targetSide,
      sourceX: sourceSide === "left" ? -LASER_APERTURE_X : LASER_APERTURE_X,
      targetX: targetSide === "left" ? -LASER_APERTURE_X : LASER_APERTURE_X,
    };
  });
}

function getLaserMountMetrics(side, y) {
  const wallX = side === "left" ? -LASER_WALL_X : LASER_WALL_X;
  const apertureX = side === "left" ? -LASER_APERTURE_X : LASER_APERTURE_X;
  const plateX = side === "left" ? wallX - LASER_PLATE_W : wallX;
  const armX = side === "left" ? wallX : wallX - LASER_ARM_LEN;
  const innerFaceX = apertureX + (side === "left" ? EMITTER_HEAD_W / 2 - 1.8 : -(EMITTER_HEAD_W / 2 - 1.8));
  const socketX = side === "left" ? wallX - 10 : wallX;
  return { y, wallX, apertureX, plateX, armX, innerFaceX, socketX };
}

const ObsView = memo(function ObsView({obs}) {
  const col = obs.hit ? "#ff8800" : obs.col;
  const alpha = obs.hit ? 0.35 : 1;
  const approachCol = obs.hit ? "#ffb066" : "#ffd6e6";
  const hitZoneCol = obs.hit ? "#fff0cc" : "#ffffff";
  const metalCol = obs.hit ? "#4a3220" : "#1a1a2e";
  const trimCol = obs.hit ? "#ffcc88" : "#8fe7ff";
  const coreCol = obs.hit ? "#fff6dc" : "#ffffff";
  const laserLayout = buildLaserVisualLayout(obs);

  const Mount = ({side, y, role}) => {
    const { apertureX, armX, innerFaceX, plateX, socketX } = getLaserMountMetrics(side, y);
    const accentCol = role === "source" ? trimCol : "#667596";
    const glowOpacity = role === "source" ? 0.2 : 0.1;
    return (
      <g opacity={alpha}>
        <rect x={socketX} y={y - 34} width={20} height={68} rx={4} fill="#0b0d1a" opacity={0.72}/>
        <rect x={plateX} y={y - LASER_PLATE_H / 2} width={LASER_PLATE_W} height={LASER_PLATE_H} rx={3} fill={metalCol} stroke="#050510" strokeWidth={1.2}/>
        <rect x={armX} y={y - 5} width={LASER_ARM_LEN} height={10} rx={4} fill={metalCol} stroke={accentCol} strokeWidth={1}/>
        <rect x={apertureX - EMITTER_HEAD_W / 2} y={y - EMITTER_HEAD_H / 2} width={EMITTER_HEAD_W} height={EMITTER_HEAD_H} rx={4}
          fill={metalCol} stroke={accentCol} strokeWidth={1.2}/>
        <line x1={apertureX - EMITTER_HEAD_W / 2 + 1.5} y1={y - 9} x2={apertureX + EMITTER_HEAD_W / 2 - 1.5} y2={y - 9}
          stroke={accentCol} strokeWidth={1} opacity={0.55}/>
        <rect x={innerFaceX - 1.2} y={y - 10} width={2.4} height={20} rx={1.2} fill={role === "source" ? coreCol : accentCol} opacity={0.95}/>
        <circle cx={innerFaceX} cy={y} r={9} fill={col} opacity={glowOpacity}/>
        <circle cx={innerFaceX} cy={y} r={role === "source" ? 4.6 : 3.4} fill={role === "source" ? hitZoneCol : "#d9e9ff"} opacity={0.95}/>
        <circle cx={innerFaceX} cy={y} r={role === "source" ? 2 : 1.5} fill={coreCol}/>
      </g>
    );
  };
  const Beam = ({beam, beamIdx}) => {
    const beamGlowId = `beam-glow-${obs.id}-${beamIdx}`;
    const beamCoreId = `beam-core-${obs.id}-${beamIdx}`;
    const beamHotId = `beam-hot-${obs.id}-${beamIdx}`;
    const impactId = `beam-impact-${obs.id}-${beamIdx}`;
    const beamStart = Math.min(beam.sourceX, beam.targetX);
    const beamEnd = Math.max(beam.sourceX, beam.targetX);
    const hitPct = ((0 - beamStart) / Math.max(beamEnd - beamStart, 1)) * 100;
    const nearHitStart = `${Math.max(hitPct - 11, 0)}%`;
    const nearHitEnd = `${Math.min(hitPct + 11, 100)}%`;
    return (
      <g opacity={alpha}>
        <defs>
          <linearGradient id={beamGlowId} gradientUnits="userSpaceOnUse" x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y}>
            <stop offset="0%" stopColor={approachCol} stopOpacity="0.08"/>
            <stop offset={nearHitStart} stopColor={col} stopOpacity="0.34"/>
            <stop offset={`${hitPct}%`} stopColor={hitZoneCol} stopOpacity="0.95"/>
            <stop offset={nearHitEnd} stopColor={col} stopOpacity="0.34"/>
            <stop offset="100%" stopColor={approachCol} stopOpacity="0.08"/>
          </linearGradient>
          <linearGradient id={beamCoreId} gradientUnits="userSpaceOnUse" x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y}>
            <stop offset="0%" stopColor={coreCol} stopOpacity="0.12"/>
            <stop offset={nearHitStart} stopColor={coreCol} stopOpacity="0.38"/>
            <stop offset={`${hitPct}%`} stopColor={coreCol} stopOpacity="1"/>
            <stop offset={nearHitEnd} stopColor={coreCol} stopOpacity="0.38"/>
            <stop offset="100%" stopColor={coreCol} stopOpacity="0.12"/>
          </linearGradient>
          <linearGradient id={beamHotId} gradientUnits="userSpaceOnUse" x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y}>
            <stop offset="0%" stopColor={hitZoneCol} stopOpacity="0"/>
            <stop offset={nearHitStart} stopColor={hitZoneCol} stopOpacity="0.16"/>
            <stop offset={`${hitPct}%`} stopColor={hitZoneCol} stopOpacity="1"/>
            <stop offset={nearHitEnd} stopColor={hitZoneCol} stopOpacity="0.16"/>
            <stop offset="100%" stopColor={hitZoneCol} stopOpacity="0"/>
          </linearGradient>
          <radialGradient id={impactId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={coreCol} stopOpacity="0.95"/>
            <stop offset="45%" stopColor={hitZoneCol} stopOpacity="0.6"/>
            <stop offset="100%" stopColor={col} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={approachCol} strokeWidth={2.2}
          strokeDasharray="14 8" opacity={0.12} strokeLinecap="round"/>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={`url(#${beamGlowId})`} strokeWidth={22}
          opacity={0.34} strokeLinecap="round"/>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={col} strokeWidth={10}
          opacity={0.14} strokeLinecap="round"/>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={col} strokeWidth={4.8}
          opacity={0.82} strokeLinecap="round"/>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={`url(#${beamHotId})`} strokeWidth={2.8}
          opacity={0.95} strokeLinecap="round" style={{animation:"dk .16s linear infinite"}}/>
        <line x1={beam.sourceX} y1={beam.y} x2={beam.targetX} y2={beam.y} stroke={`url(#${beamCoreId})`} strokeWidth={1.2}
          opacity={0.95} strokeLinecap="round"/>
        <rect x={-COLLISION_RADIUS} y={beam.y-HIT_ZONE_HALF_HEIGHT} width={COLLISION_RADIUS*2} height={HIT_ZONE_HALF_HEIGHT*2} rx={4} fill={hitZoneCol} opacity={0.08}/>
        <rect x={-7} y={beam.y-22} width={14} height={44} rx={6} fill={col} opacity={0.1}/>
        <circle cx={0} cy={beam.y} r={22} fill={`url(#${impactId})`} opacity={0.98}/>
        <line x1={0} y1={beam.y-22} x2={0} y2={beam.y+22} stroke={hitZoneCol} strokeWidth={3.2} opacity={0.98}/>
        <line x1={-2} y1={beam.y-18} x2={2} y2={beam.y+18} stroke={coreCol} strokeWidth={1.2} opacity={0.96}/>
      </g>
    );
  };

  if (laserLayout.length === 0) return null;
  return (
    <g>
      {laserLayout.map((beam,i) => (
        <g key={i}>
          <Mount side={beam.sourceSide} y={beam.y} role="source"/>
          <Mount side={beam.targetSide} y={beam.y} role="receiver"/>
          <Beam beam={beam} beamIdx={i}/>
        </g>
      ))}
    </g>
  );
});

const GuardView = memo(function GuardView({obs}) {
  const headX = 0;
  const headY = GROUND_Y - 56;
  const coneId = `guard-cone-${obs.id}`;
  const innerConeId = `guard-inner-cone-${obs.id}`;
  const sweepMs = obs.windowMs || 900;
  return (
    <g>
      <defs>
        <radialGradient id={coneId} cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#f5e642" stopOpacity="0.18"/>
          <stop offset="60%" stopColor="#f5e642" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#f5e642" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={innerConeId} cx="0%" cy="50%" r="100%">
          <stop offset="0%" stopColor="#fff4a8" stopOpacity="0.09"/>
          <stop offset="100%" stopColor="#f5e642" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <g style={{animation:`sweep ${sweepMs}ms ease-in-out infinite`, transformOrigin:`${headX}px ${headY}px`}}>
        <path d={`M${headX-1},${headY} L${headX-180},${headY-35} L${headX-180},${headY+35} Z`} fill={`url(#${coneId})`}/>
        <path d={`M${headX-1},${headY} L${headX-180},${headY-18} L${headX-180},${headY+18} Z`} fill={`url(#${innerConeId})`}/>
      </g>
      <g>
        <circle cx={0} cy={GROUND_Y - 62} r={14} fill="#0a0a14" stroke="#2a2a44" strokeWidth={1.2}/>
        <rect x={-11} y={GROUND_Y - 48} width={22} height={36} rx={6} fill="#0a0a14" stroke="#2a2a44" strokeWidth={1.2}/>
        <rect x={-10} y={GROUND_Y - 12} width={8} height={12} rx={2} fill="#0a0a14" stroke="#2a2a44" strokeWidth={1.2}/>
        <rect x={2} y={GROUND_Y - 12} width={8} height={12} rx={2} fill="#0a0a14" stroke="#2a2a44" strokeWidth={1.2}/>
        <line x1={5} y1={GROUND_Y - 44} x2={13} y2={GROUND_Y - 26} stroke="#2a2a44" strokeWidth={1.2} strokeLinecap="round"/>
        <circle cx={13} cy={GROUND_Y - 26} r={3} fill="#f5e642" opacity={0.75}/>
      </g>
    </g>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// CHOREOGRAPHY SCHEDULER
// This is the heart of the new system.
// We pre-plan a queue of sequences. Each sequence knows:
//   - which beats it occupies
//   - whether it has an obstacle and when/where it arrives
// The burglar always knows exactly what he's doing 4-8 beats ahead.
// ─────────────────────────────────────────────────────────────────────────────

let _oid = 0;
let _rid = 0;

function resetRunIds() {
  _oid = 0;
  _rid = 0;
}

function laneBaseXForTime(hitTime, originTime, travelMs) {
  const laneW = RHYTHM_SPAWN_X - RHYTHM_HIT_X;
  return RHYTHM_HIT_X + ((hitTime - originTime) / travelMs) * laneW;
}

function primeLaneNotes(notes, originTime, travelMs) {
  notes.forEach(note => {
    note.travelMs = note.travelMs || travelMs;
    note.laneBaseX = laneBaseXForTime(note.hitTime, originTime, note.travelMs);
  });
  return notes;
}

const LaserObstacleLayer = memo(function LaserObstacleLayer({ obstacles, worldLayerRef }) {
  return (
    <g ref={worldLayerRef} transform="translate(0,0)">
      {obstacles.map(obs => (
        <g key={obs.id} transform={`translate(${obs.x},0)`}>
          <ObsView obs={obs}/>
        </g>
      ))}
    </g>
  );
});

const GuardFallbackLayer = memo(function GuardFallbackLayer({ obstacles, worldLayerRef, visible }) {
  if (!visible) return null;
  return (
    <g ref={worldLayerRef} transform="translate(0,0)">
      {obstacles.map(obs => (
        <g key={obs.id} transform={`translate(${obs.x},0)`}>
          <GuardView obs={obs}/>
        </g>
      ))}
    </g>
  );
});

// Build the obstacle object for a sequence, given the world position the obstacle
// should arrive at the burglar (BURGLAR_X in screen = worldX + BURGLAR_X)
function buildObstacle(seq, worldXAtHit, beatMs) {
  const obsType = seq.peakPose ? PEAK_POSE_TO_OBSTACLE[seq.peakPose] : null;
  const def = obsType ? OBSTACLE_DEFS[obsType] : null;
  if (!obsType || !def) return null;
  const obs = {
    id: _oid++,
    x: worldXAtHit,
    type: obsType,
    col: def.col,
    isGuard: Boolean(def.isGuard),
    laserYs: def.laserYs,
    visualAnchor: def.visualAnchor || null,
    mountPattern: def.mountPattern || null,
    seqName: seq.name,
    hit: false,
    resolved: false,
    lastDist: null,
  };
  if (def.isGuard) {
    obs.windowMs = def.patrolBeats * beatMs;
    obs.spawnTime = performance.now();
  }
  return obs;
}

function buildRhythmNotes(events, startTime, beatMs, prefix = null, phraseMeta = null) {
  const notes = [];
  const groupIds = new Map();
  const travelMs = beatMsToTravelMs(beatMs);
  const pxPerBeat = (RHYTHM_SPAWN_X - RHYTHM_HIT_X) / RHYTHM_TRAVEL_BEATS;
  const phraseInstanceId = phraseMeta?.instanceId || prefix || `phrase-${_rid++}`;
  const phraseSpanBeats = phraseMeta?.spanBeats || Math.max(...events.map(event => event.at + (event.durationBeats || 1)), 0);
  const absoluteStartBeat = phraseMeta?.absoluteStartBeat || 0;
  events.forEach((event, eventIdx) => {
    const hitTime = startTime + event.at * beatMs;
    let groupId = null;
    if (event.groupKey) {
      groupId = groupIds.get(event.groupKey);
      if (!groupId) {
        groupId = prefix ? `${prefix}-group-${event.groupKey}` : `group-${_rid++}`;
        groupIds.set(event.groupKey, groupId);
      }
    }
    const note = {
      id: prefix ? `${prefix}-${eventIdx}` : _rid++,
      hitTime,
      kind: event.kind,
      hit: false,
      missed: false,
      durationBeats: event.durationBeats || 1,
      groupId,
      groupLabel: event.groupLabel || null,
      beamCount: event.beamCount || 0,
      accent: event.accent || null,
      holdStyle: event.holdStyle || null,
      travelMs,
      pxPerBeat,
      beatInPhrase: event.at,
      phraseInstanceId,
      phraseSpanBeats,
      absoluteBeatInRun: absoluteStartBeat + event.at,
    };
    if (event.kind === "hold") {
      note.holdStartTime = hitTime;
      note.holdEndTime = hitTime + note.durationBeats * beatMs;
      note.earlyReleaseNotified = false;
      note.requiresPressHold = PRESS_HOLD_STYLES.has(event.holdStyle || "");
      if (note.requiresPressHold) {
        const holdWindowMs = beatMsToWindowMs(beatMs);
        const accurateReleaseGraceMs = beatMsToAccurateHoldReleaseMs(beatMs);
        const tooEarlyReleaseExtraMs = Math.round(beatMs * HOLD_TOO_EARLY_EXTRA_BEATS);
        note.pressWindowStart = note.holdStartTime - holdWindowMs;
        note.pressWindowEnd = note.holdStartTime + holdWindowMs;
        note.accurateHoldEndTime = note.holdEndTime - accurateReleaseGraceMs;
        note.requiredHoldEndTime = note.accurateHoldEndTime - tooEarlyReleaseExtraMs;
        note.freezeStartTime = note.holdStartTime;
        note.freezeEndTime = note.requiredHoldEndTime;
        note.quietStartTime = null;
        note.quietEndTime = null;
        note.holdStartedAt = null;
      } else {
        note.freezeStartTime = note.holdStartTime;
        note.freezeEndTime = note.holdEndTime + beatMs * 0.1;
        note.quietStartTime = note.holdStartTime;
        note.quietEndTime = note.holdEndTime + beatMs * 0.1;
      }
    }
    notes.push(note);
  });
  return notes;
}

function buildNotationPreviewNotes(events, prefix = "notation", startX = 48, pxPerBeat = 84, spanBeats = null, absoluteStartBeat = 0) {
  const groupIds = new Map();
  const phraseSpanBeats = spanBeats || Math.max(...events.map(event => event.at + (event.durationBeats || 1)), 0);
  return events.map((event, index) => {
    let groupId = null;
    if (event.groupKey) {
      groupId = groupIds.get(event.groupKey);
      if (!groupId) {
        groupId = `${prefix}-group-${event.groupKey}`;
        groupIds.set(event.groupKey, groupId);
      }
    }
    const laneBaseX = startX + event.at * pxPerBeat;
    return {
      id: `${prefix}-${index}`,
      kind: event.kind,
      at: event.at,
      durationBeats: event.durationBeats || 1,
      holdStyle: event.holdStyle || null,
      groupId,
      groupLabel: event.groupLabel || null,
      beamCount: event.beamCount || 0,
      accent: event.accent || null,
      laneBaseX,
      x: laneBaseX,
      hit: false,
      missed: false,
      hitTime: event.at,
      pxPerBeat,
      beatInPhrase: event.at,
      phraseInstanceId: prefix,
      phraseSpanBeats,
      absoluteBeatInRun: absoluteStartBeat + event.at,
    };
  });
}

function buildLevelNotationPreview(levelDef, prefix = `level-${levelDef.level}`, startX = 48, pxPerBeat = 84) {
  let absoluteStartBeat = 0;
  const notes = [];
  levelDef.phraseIds.forEach((phraseId, phraseIndex) => {
    const phrase = PHRASE_BY_ID[phraseId];
    if (!phrase) return;
    notes.push(
      ...buildNotationPreviewNotes(
        phrase.rhythmEvents,
        `${prefix}-phrase-${phraseIndex}-${phrase.id}`,
        startX,
        pxPerBeat,
        phrase.spanBeats,
        absoluteStartBeat
      )
    );
    absoluteStartBeat += phrase.spanBeats;
  });
  return {
    notes,
    spanBeats: absoluteStartBeat,
  };
}

function getLevelPreviewPxPerBeat(spanBeats) {
  return 84;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function BurglarGame() {
  const [threeBgReady, setThreeBgReady] = useState(false);
  const [museumBgVersion, setMuseumBgVersion] = useState(0);
  const [treasureRoomOpen, setTreasureRoomOpen] = useState(false);
  const [notationLabOpen, setNotationLabOpen] = useState(false);
  const [hoveredTreasureLevel, setHoveredTreasureLevel] = useState(null);
  const resetMuseumScene = useCallback(() => {
    setThreeBgReady(false);
    setMuseumBgVersion(version => version + 1);
  }, []);

  const {
    rhythmRender,
    laserObsRender,
    guardObsRender,
    metersCovered,
    lives,
    score,
    gameOver,
    started,
    countingIn,
    countInBeat,
    countInRender,
    countInPreviewRender,
    beatFlash,
    hitFlash,
    beatIdx,
    moveLabel,
    moveCol,
    missFlash,
    tooEarlyFlash,
    spottedFlash,
    guardClearFlash,
    tapGood,
    nextLabel,
    rhythmMisses,
    currentLevel,
    stageTitle,
    stageAccent,
    phaseText,
    coaching,
    currentBpm,
    endlessMode,
    endlessStealValue,
    levelBanner,
    endlessLeaderboard,
    selectedStartLevel,
    selectedMenuMode,
    treasureRoomRecords,
    levelClearPhase,
    levelCompleteOverlay,
    teachingOverlay,
    endlessUnlockNoticeOpen,
    wxRef,
    burglarActorRef,
    laserWorldRef,
    guardWorldRef,
    rhythmMotionRef,
    currentLevelDefRef,
    curSeqRef,
    currentBeatMs,
    getLevelTempoPct,
    getAdjustedCampaignBpm,
    setSelectedStartLevelValue,
    setSelectedMenuModeValue,
    setLevelTempoOverrideValue,
    startSelectedMenuMode,
    previewLevelClearOverlay,
    handleInputPress,
    handleInputRelease,
    returnToMenu,
    setEndlessUnlockNoticeOpen,
    effectiveHighestUnlockedLevel,
  } = useHeistRunState({
    DEFAULT_TIME_SIGNATURE,
    LEVELS,
    PHRASE_BY_ID,
    LEVEL_THEME_PRESETS,
    PRIZE_BY_LEVEL,
    ENDLESS_BLUEPRINTS,
    makePhrase,
    clampCampaignLevel,
    getCampaignLevelDef,
    getLevelTeachingIntro,
    DEV_MODE,
    FORCE_FULL_UNLOCK,
    MAX_LIVES,
    MISS_LIMIT,
    RHYTHM_WINDOW_RATIO,
    COUNT_IN_LEAD_BEATS,
    ENDLESS_BASE_BPM,
    ENDLESS_BPM_STEP_MS,
    ENDLESS_BPM_STEP,
    BURGLAR_X,
    RHYTHM_HIT_X,
    RHYTHM_SPAWN_X,
    SPEED,
    GATED_MOVE_POSES,
    poseClears,
    buildObstacle,
    buildRhythmNotes,
    primeLaneNotes,
    bpmToBeatMs,
    beatMsToTravelMs,
    beatMsToAccurateWindowMs,
    beatMsToPxPerBeat,
    getTimeSignatureLabel,
    getBeatsPerBar,
    tapSound,
    wrongTapSound,
    hitSound,
    hat,
    kick,
    snare,
    resetMuseumScene,
    resetIds: resetRunIds,
  });

  const handleMuseumReady = useCallback(() => {
    setThreeBgReady(true);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const beat4=beatIdx%4;
  const rhythmPct=Math.max(0,1-rhythmMisses/MISS_LIMIT);
  const rhythmHeartsRemaining = Math.max(0, MISS_LIMIT - rhythmMisses);
  const laneNotes = countingIn ? [...countInPreviewRender, ...countInRender] : rhythmRender;
  const showMenuScreen = !started && !countingIn && !gameOver && !levelCompleteOverlay;
  const endlessUnlocked = effectiveHighestUnlockedLevel >= LEVELS.length;
  const showMenuModeToggle = DEV_MODE || endlessUnlocked;
  const isMenuEndlessSelection = showMenuScreen && showMenuModeToggle && selectedMenuMode === "endless";
  const menuLevelDef = getCampaignLevelDef(selectedStartLevel);
  const menuLevelTempoPct = getLevelTempoPct(menuLevelDef);
  const menuLevelAdjustedBpm = getAdjustedCampaignBpm(menuLevelDef);
  const displayLevelDef = showMenuScreen ? menuLevelDef : currentLevelDefRef.current || LEVELS[0];
  const displayStageAccent = isMenuEndlessSelection
    ? LEVEL_THEME_PRESETS.endless.accent
    : endlessMode ? stageAccent : LEVEL_THEME_PRESETS[displayLevelDef.stageKey].accent;
  const displayStageTitle = isMenuEndlessSelection
    ? "Arcade / Endless"
    : endlessMode ? stageTitle : displayLevelDef.title;
  const displayCoaching = isMenuEndlessSelection
    ? "Procedural full vocabulary"
    : endlessMode ? coaching : (showMenuScreen ? displayLevelDef.coaching : coaching);
  const displayBpm = isMenuEndlessSelection
    ? ENDLESS_BASE_BPM
    : endlessMode ? currentBpm : (showMenuScreen ? menuLevelAdjustedBpm : currentBpm);
  const displayPhaseText = isMenuEndlessSelection
    ? "ENDLESS PATTERN 0"
    : showMenuScreen ? `PHRASE 0/${displayLevelDef.phraseIds.length}` : phaseText;
  const levelLabel = (endlessMode || isMenuEndlessSelection) ? "ENDLESS" : `LEVEL ${String(displayLevelDef.level).padStart(2, "0")}`;
  const activeTheme = LEVEL_THEME_PRESETS[(endlessMode || isMenuEndlessSelection) ? "endless" : displayLevelDef.stageKey];
  const hoveredTreasureRecord = hoveredTreasureLevel ? treasureRoomRecords[hoveredTreasureLevel] : null;
  const activeHudLevelDef = showMenuScreen ? displayLevelDef : currentLevelDefRef.current || displayLevelDef;
  const activeHudPhrase = showMenuScreen
    ? PHRASE_BY_ID[displayLevelDef.phraseIds[0]]
    : curSeqRef.current;
  const displayTimeSignature = getTimeSignatureLabel(activeHudLevelDef);
  const [displayTimeSigTop, displayTimeSigBottom] = displayTimeSignature.split("/");
  const displayBeatsPerBar = getBeatsPerBar(displayTimeSignature);
  const displayActiveNoteValues = getActiveNoteValuesLabel(activeHudPhrase?.rhythmEvents);
  const rhythmLaneProps = useMemo(() => ({
    layout: { width: W, laneY: RHYTHM_LANE_Y, hitX: RHYTHM_HIT_X, spawnX: RHYTHM_SPAWN_X },
    notation: {
      useTemplateBeams: USE_TEMPLATE_BEAMS,
      musicNotationFontFamily: MUSIC_NOTATION_FONT_FAMILY,
      standaloneEighthFlagPath: STANDALONE_EIGHTH_FLAG_PATH,
    },
  }), []);
  const renderPrizeVictoryScene = useCallback(
    prize => <PrizeVictoryScene prize={prize} burglarFigure={RigBurglarFigure} basePose={P.run_a}/>,
    []
  );
  const renderHeistFinaleScene = useCallback(
    prize => <HeistFinaleScene prize={prize} burglarFigure={RigBurglarFigure} basePose={P.run_a} prizeByLevel={PRIZE_BY_LEVEL}/>,
    []
  );
  const renderPrizeCaseScene = useCallback(prize => <PrizeCaseScene prize={prize}/>, []);
  const renderTreasurePrizeIcon = useCallback((prize, muted) => <PrizeIcon prize={prize} muted={muted}/>, []);
  const handleStartOrInputPress = useCallback(() => {
    if (!started && !countingIn && !gameOver && !levelCompleteOverlay) {
      startSelectedMenuMode();
      return;
    }
    handleInputPress("button");
  }, [countingIn, gameOver, handleInputPress, levelCompleteOverlay, startSelectedMenuMode, started]);
  const notationPreviewEntries = useMemo(() => {
    if (!notationLabOpen) return [];
    return [
      ...PHRASES.map(phrase => ({
        id: phrase.id,
        title: phrase.id,
        tag: `PHRASE · ${phrase.levelHint}`,
        notes: buildNotationPreviewNotes(phrase.rhythmEvents, `phrase-${phrase.id}`, 48, 84, phrase.spanBeats),
        spanBeats: phrase.spanBeats,
        beatsPerBar: getBeatsPerBar(DEFAULT_TIME_SIGNATURE),
      })),
      ...ENDLESS_BLUEPRINTS.map(blueprint => ({
        id: blueprint.id,
        title: blueprint.id,
        tag: `ENDLESS · ${blueprint.levelHint}`,
        spanBeats: Math.max(...blueprint.rhythmEvents.map(event => event.at + (event.durationBeats || 1)), 0),
        notes: buildNotationPreviewNotes(
          blueprint.rhythmEvents,
          `blueprint-${blueprint.id}`,
          48,
          84,
          Math.max(...blueprint.rhythmEvents.map(event => event.at + (event.durationBeats || 1)), 0)
        ),
        beatsPerBar: getBeatsPerBar(DEFAULT_TIME_SIGNATURE),
      })),
    ];
  }, [notationLabOpen]);
  const levelNotationPreviewEntries = useMemo(() => {
    if (!notationLabOpen) return [];
    return LEVELS.map(levelDef => {
      const spanBeats = levelDef.phraseIds.reduce((sum, phraseId) => sum + (PHRASE_BY_ID[phraseId]?.spanBeats || 0), 0);
      const pxPerBeat = getLevelPreviewPxPerBeat(spanBeats);
      const levelPreview = buildLevelNotationPreview(levelDef, `level-${levelDef.level}`, 48, pxPerBeat);
      return {
        id: `level-${levelDef.level}`,
        title: `LEVEL ${String(levelDef.level).padStart(2, "0")} · ${levelDef.title}`,
        tag: `LEVEL FLOW · ${levelDef.coaching}`,
        notes: levelPreview.notes,
        spanBeats: levelPreview.spanBeats,
        beatsPerBar: getBeatsPerBar(getTimeSignatureLabel(levelDef)),
        pxPerBeat,
        previewWidth: Math.max(960, 104 + levelPreview.spanBeats * pxPerBeat),
      };
    });
  }, [notationLabOpen]);

  return (
    <div style={{background:"#03030b",minHeight:"100dvh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"flex-start",fontFamily:"'Courier New',monospace",
      padding:"max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))",
      gap:10,overflowX:"hidden",touchAction:"manipulation"}}>
      <style>{`
        @font-face {
          font-family: "FinaleEngraverLocal";
          src: url("${finaleEngraverUrl}") format("opentype");
          font-display: swap;
        }
        @font-face {
          font-family: "FinaleMaestroLocal";
          src: url("${finaleMaestroUrl}") format("opentype");
          font-display: swap;
        }
        @keyframes dk  {to{stroke-dashoffset:-11;}}
        @keyframes bp  {0%{transform:scale(1.7);opacity:1}100%{transform:scale(1);opacity:.1}}
        @keyframes lb  {0%{opacity:0;transform:scale(.4) translateY(12px)}15%{opacity:1;transform:scale(1.15) translateY(0)}75%{opacity:1}100%{opacity:0;transform:scale(.85)}}
        @keyframes sh  {0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(9px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
        @keyframes mf  {0%,100%{opacity:0}20%,80%{opacity:1}}
        @keyframes tr  {0%{transform:scale(1.1);opacity:.9}100%{transform:scale(1.6);opacity:0}}
        @keyframes sweep { 0%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} 100%{transform:rotate(-6deg)} }
        @keyframes prizeLift {
          0% { transform: translateY(28px) rotate(-10deg) scale(.84); opacity: 0; }
          55% { transform: translateY(-4px) rotate(3deg) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{textAlign:"center",width:"min(100%, 720px)"}}>
        <div style={{fontSize:"clamp(6px, 1.9vw, 7px)",letterSpacing:"clamp(3px, 1.2vw, 6px)",color:"#0e0e28",marginBottom:2}}>MUSICAL CATERPILLAR</div>
        <div style={{fontSize:"clamp(16px, 4.6vw, 18px)",letterSpacing:"clamp(1.2px, 0.5vw, 2.6px)",color:"#ff3366",textShadow:"0 0 18px #ff336666"}}>BEARGLAR: A RHYTHM HEIST</div>
      </div>

      <HeistGameplayScene
        width={W}
        height={H}
        worldXRef={wxRef}
        museumBgVersion={museumBgVersion}
        guardObsRender={guardObsRender}
        handleMuseumReady={handleMuseumReady}
        activeTheme={activeTheme}
        gameplayActive={started || countingIn}
        hitFlash={hitFlash}
        rhythmLane={(
          <RhythmLane
            notes={laneNotes}
            motionRef={rhythmMotionRef}
            showWaitHint={!endlessMode && currentLevel <= 2}
            showHoldHint={!endlessMode && (currentLevel === 4 || currentLevel === 7)}
            beatsPerBar={displayBeatsPerBar}
            {...rhythmLaneProps}
          />
        )}
        laserObstacleLayer={<LaserObstacleLayer obstacles={laserObsRender} worldLayerRef={laserWorldRef}/>}
        guardFallbackLayer={<GuardFallbackLayer obstacles={guardObsRender} worldLayerRef={guardWorldRef} visible={!threeBgReady}/>}
        burglar={<BurglarActor ref={burglarActorRef} flash={beatFlash} hitFlash={hitFlash} beatMs={currentBeatMs()}/>}
        tapGood={tapGood}
        rhythmHitX={RHYTHM_HIT_X}
        rhythmLaneY={RHYTHM_LANE_Y}
        moveLabel={moveLabel}
        moveCol={moveCol}
        burglarX={BURGLAR_X}
        groundY={GROUND_Y}
        guardClearFlash={guardClearFlash}
        spottedFlash={spottedFlash}
        tooEarlyFlash={tooEarlyFlash}
        missFlash={missFlash}
        levelBanner={levelBanner}
        teachingOverlay={teachingOverlay}
        gameHud={{
          width: W,
          height: H,
          missLimit: MISS_LIMIT,
          beat4,
          levelLabel,
          stageTitle: displayStageTitle,
          stageAccent: displayStageAccent,
          score,
          currentBpm: displayBpm,
          timeSignature: displayTimeSignature,
          activeNoteValues: displayActiveNoteValues,
          phaseText: displayPhaseText,
          coaching: displayCoaching,
          metersCovered,
          rhythmPct,
          rhythmHeartsRemaining,
          nextLabel,
          gameOver,
          endlessMode,
          endlessStealValue,
        }}
        startOverlay={{
          width: W,
          height: H,
          started,
          levelCompleteOverlay,
          gameOver,
          countingIn,
          laneY: RHYTHM_LANE_Y,
          displayTimeSigTop,
          displayTimeSigBottom,
          countInBeat,
          levelLabel,
          displayStageTitle,
          displayBpm,
          displayCoaching,
          effectiveHighestUnlockedLevel,
        }}
        levelCompleteOverlayProps={{
          width: W,
          height: H,
          levelCompleteOverlay,
          countingIn,
          gameOver,
          levelClearPhase,
          renderPrizeVictoryScene,
          renderHeistFinaleScene,
          renderPrizeCaseScene,
        }}
        gameOver={gameOver}
        score={score}
        metersCovered={metersCovered}
        levelLabel={levelLabel}
        endlessMode={endlessMode}
        endlessStealValue={endlessStealValue}
        endlessLeaderboard={endlessLeaderboard}
        HeistMuseumBackground={HeistMuseumBackground}
      />

      <StartControls
        started={started}
        countingIn={countingIn}
        gameOver={gameOver}
        levelCompleteOverlay={levelCompleteOverlay}
        isMenuEndlessSelection={isMenuEndlessSelection}
        selectedStartLevel={selectedStartLevel}
        displayStageTitle={displayStageTitle}
        displayBpm={displayBpm}
        beatFlash={beatFlash}
        handleStartOrInputPress={handleStartOrInputPress}
        handleInputRelease={handleInputRelease}
        returnToMenu={returnToMenu}
      />

      <HeistMenuPanel
        showMenuScreen={showMenuScreen}
        showMenuModeToggle={showMenuModeToggle}
        selectedMenuMode={selectedMenuMode}
        displayStageAccent={displayStageAccent}
        setSelectedMenuModeValue={setSelectedMenuModeValue}
        DEV_MODE={DEV_MODE}
        previewLevelClearOverlay={previewLevelClearOverlay}
        menuLevelDef={menuLevelDef}
        setNotationLabOpen={setNotationLabOpen}
        isMenuEndlessSelection={isMenuEndlessSelection}
        levelLabel={levelLabel}
        displayStageTitle={displayStageTitle}
        effectiveHighestUnlockedLevel={effectiveHighestUnlockedLevel}
        LEVELS={LEVELS}
        selectedStartLevel={selectedStartLevel}
        setSelectedStartLevelValue={setSelectedStartLevelValue}
        displayLevelDef={displayLevelDef}
        menuLevelAdjustedBpm={menuLevelAdjustedBpm}
        menuLevelTempoPct={menuLevelTempoPct}
        setLevelTempoOverrideValue={setLevelTempoOverrideValue}
        displayCoaching={displayCoaching}
        treasureRoomRecords={treasureRoomRecords}
        setHoveredTreasureLevel={setHoveredTreasureLevel}
        setTreasureRoomOpen={setTreasureRoomOpen}
        endlessLeaderboard={endlessLeaderboard}
      />

      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",justifyContent:"center",width:"min(100%, 720px)"}}>
        <span style={{fontSize:"clamp(8px, 2.4vw, 9px)",color:"#1a1a38",letterSpacing:"clamp(1px, 0.4vw, 2px)"}}>TAP ALONG →</span>
        <div style={{display:"flex",gap:4}}>
          {[0,1,2,3].map(i=>(
            <div key={i} style={{width:11,height:11,borderRadius:2,
              background:i===beat4?"#ff3366":"#161630",transition:"background 0.05s"}}/>
          ))}
        </div>
        <span style={{fontSize:"clamp(8px, 2.4vw, 9px)",color:"#1a1a38",letterSpacing:"clamp(1px, 0.4vw, 2px)",textAlign:"center"}}>→ LASERS FIT HIS MOVES</span>
      </div>

      <TreasureRoomOverlay
        treasureRoomOpen={treasureRoomOpen}
        setTreasureRoomOpen={setTreasureRoomOpen}
        setHoveredTreasureLevel={setHoveredTreasureLevel}
        hoveredTreasureRecord={hoveredTreasureRecord}
        levels={LEVELS}
        prizeByLevel={PRIZE_BY_LEVEL}
        treasureRoomRecords={treasureRoomRecords}
        renderPrizeIcon={renderTreasurePrizeIcon}
        renderPrizeCaseScene={renderPrizeCaseScene}
      />

      <EndlessUnlockOverlay
        open={showMenuScreen && endlessUnlockNoticeOpen}
        onClose={() => setEndlessUnlockNoticeOpen(false)}
      />

      <NotationLabOverlay
        notationLabOpen={notationLabOpen}
        setNotationLabOpen={setNotationLabOpen}
        levelNotationPreviewEntries={levelNotationPreviewEntries}
        notationPreviewEntries={notationPreviewEntries}
        RhythmLane={RhythmLane}
        laneProps={rhythmLaneProps}
        width={W}
        height={H}
        laneY={RHYTHM_LANE_Y}
      />
    </div>
  );
}
