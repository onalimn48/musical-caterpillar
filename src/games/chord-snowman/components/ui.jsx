import { useMemo } from "react";
import ConfettiBurst from "../../shared/components/ConfettiBurst.jsx";
import {
  STAFF_W,
  STAFF_H,
  TOP_Y,
  LG,
  CLEF_PATH,
} from "../data/staff.js";
import { ff } from "../data/theme.js";
import { TRAINING_LEVELS, INTERVAL_DB, SONG_SNIPPETS } from "../data/intervals.js";
import {
  shortDisplay,
  isAccidental,
  accidentalSymbol,
  getNotePos,
  getLedgers,
  noteToMidi,
  midiToChromatic,
  getStreakTier,
  getStreakBonus,
} from "../state/gameLogic.js";

const posY = pos => TOP_Y + 4 * LG - pos * (LG / 2);

export function NoteOnStaff({ name, octave, highlight, showLabel, ghost, showAccidental }) {
  const pos = getNotePos(name, octave);
  const ny = posY(pos);
  const nx = 70;
  const ledgers = getLedgers(pos);
  const lc = "#a09484";
  const cc = "#6b5c4f";
  const acc = isAccidental(name);
  const fill = highlight === "correct" ? "#22c55e" : highlight === "wrong" ? "#ef4444" : ghost ? "rgba(139,92,246,0.25)" : "#2d1810";
  const stemUp = pos < 4;
  const staffBottom = TOP_Y + 4 * LG;
  // Label just below staff for on/above-staff notes, just below notehead for below-staff notes
  const labelY = pos >= 0 ? staffBottom + 18 : ny + 22;
  return (
    <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
      style={{ opacity: ghost ? 0.35 : 1, transition: "opacity .3s" }}>
      {[0,1,2,3,4].map(i => <line key={i} x1="5" y1={TOP_Y+i*LG} x2="105" y2={TOP_Y+i*LG} stroke={lc} strokeWidth="1"/>)}
      <g transform={`translate(6,${TOP_Y-1.31*LG}) scale(${LG*6.89/4066})`}><path d={CLEF_PATH} fill={cc} transform="translate(-984,-5608)"/></g>
      {ledgers.map((lp,i)=><line key={`l${i}`} x1={nx-14} y1={posY(lp)} x2={nx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
      {acc && showAccidental !== false && !ghost && (
        <text x={nx - 22} y={ny + 5} fontSize="16" fontWeight="700" fill={fill} fontFamily="serif">{accidentalSymbol(name)}</text>
      )}
      <ellipse cx={nx} cy={ny} rx="7.5" ry="5.5" fill={fill} transform={`rotate(-12,${nx},${ny})`}/>
      {stemUp
        ? <line x1={nx+7} y1={ny} x2={nx+7} y2={ny-30} stroke={fill} strokeWidth="1.8"/>
        : <line x1={nx-7} y1={ny} x2={nx-7} y2={ny+30} stroke={fill} strokeWidth="1.8"/>}
      {showLabel && (
        <text x={nx} y={labelY} textAnchor="middle" fontSize="14" fontWeight="700"
          fill={highlight==="correct"?"#22c55e":highlight==="wrong"?"#ef4444":"#6b7280"} fontFamily={ff}>
          {shortDisplay(name)}
        </text>
      )}
    </svg>
  );
}

// Interactive dual-note staff
export function DualStaff({ startName, startOct, targetName, targetOct, highlight, showTarget, earOnly, showGhost }) {
  const sp = getNotePos(startName, startOct);
  const sy = posY(sp);
  const sx = earOnly ? 55 : 75;
  const tx = earOnly ? 55 : 140;
  const sLedgers = getLedgers(sp);
  const lc = "#a09484";
  const cc = "#6b5c4f";
  const sAcc = isAccidental(startName);
  const w = earOnly ? 110 : 260;
  const staffBottom = TOP_Y + 4 * LG;
  const sLabelY = sp >= 0 ? staffBottom + 18 : sy + 22;

  let tContent = null;
  if (showTarget && targetName) {
    const tp = getNotePos(targetName, targetOct);
    const ty = posY(tp);
    const tLedgers = getLedgers(tp);
    const tAcc = isAccidental(targetName);
    const clr = highlight === "correct" ? "#22c55e" : highlight === "wrong" ? "#ef4444" : "#c4b5fd";
    const stemUp = tp < 4;
    const tLabelY = tp >= 0 ? staffBottom + 18 : ty + 22;
    tContent = (
      <g style={{animation: highlight==="correct" ? "popIn .3s ease" : undefined}}>
        {tLedgers.map((lp,i)=><line key={`tl${i}`} x1={tx-14} y1={posY(lp)} x2={tx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
        {tAcc && <text x={tx-22} y={ty+5} fontSize="16" fontWeight="700" fill={clr} fontFamily="serif">{accidentalSymbol(targetName)}</text>}
        <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" fill={clr} transform={`rotate(-12,${tx},${ty})`}/>
        {stemUp
          ? <line x1={tx+7} y1={ty} x2={tx+7} y2={ty-30} stroke={clr} strokeWidth="1.8"/>
          : <line x1={tx-7} y1={ty} x2={tx-7} y2={ty+30} stroke={clr} strokeWidth="1.8"/>}
        <text x={tx} y={tLabelY} textAnchor="middle" fontSize="13" fontWeight="700" fill={clr} fontFamily={ff}>{shortDisplay(targetName)}</text>
      </g>
    );
  } else if (showGhost && targetName) {
    // Ghost note: semi-transparent hint of where the answer goes
    const tp = getNotePos(targetName, targetOct);
    const ty = posY(tp);
    const tLedgers = getLedgers(tp);
    const ghostClr = "rgba(139,92,246,0.25)";
    const stemUp = tp < 4;
    tContent = (
      <g style={{opacity: 0.4}}>
        {tLedgers.map((lp,i)=><line key={`gl${i}`} x1={tx-14} y1={posY(lp)} x2={tx+14} y2={posY(lp)} stroke={lc} strokeWidth="1" opacity="0.4"/>)}
        <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" fill={ghostClr} transform={`rotate(-12,${tx},${ty})`}/>
        {stemUp
          ? <line x1={tx+7} y1={ty} x2={tx+7} y2={ty-30} stroke={ghostClr} strokeWidth="1.8"/>
          : <line x1={tx-7} y1={ty} x2={tx-7} y2={ty+30} stroke={ghostClr} strokeWidth="1.8"/>}
      </g>
    );
  }

  return (
    <svg width={w} height={STAFF_H} viewBox={`0 0 ${w} ${STAFF_H}`}>
      {[0,1,2,3,4].map(i=><line key={i} x1="5" y1={TOP_Y+i*LG} x2={w-5} y2={TOP_Y+i*LG} stroke={lc} strokeWidth="1"/>)}
      <g transform={`translate(4,${TOP_Y-1.31*LG}) scale(${LG*6.89/4066})`}><path d={CLEF_PATH} fill={cc} transform="translate(-984,-5608)"/></g>
      {!earOnly && (
        <>
          {sLedgers.map((lp,i)=><line key={`sl${i}`} x1={sx-14} y1={posY(lp)} x2={sx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
          {sAcc && <text x={sx-22} y={sy+5} fontSize="16" fontWeight="700" fill="#2d1810" fontFamily="serif">{accidentalSymbol(startName)}</text>}
          <ellipse cx={sx} cy={sy} rx="7.5" ry="5.5" fill="#2d1810" transform={`rotate(-12,${sx},${sy})`}/>
          {sp < 4
            ? <line x1={sx+7} y1={sy} x2={sx+7} y2={sy-30} stroke="#2d1810" strokeWidth="1.8"/>
            : <line x1={sx-7} y1={sy} x2={sx-7} y2={sy+30} stroke="#2d1810" strokeWidth="1.8"/>}
          <text x={sx} y={sLabelY} textAnchor="middle" fontSize="13" fontWeight="700" fill="#6b5c4f" fontFamily={ff}>{shortDisplay(startName)}</text>
        </>
      )}
      {showTarget && tContent}
      {!showTarget && showGhost && tContent}
      {!showTarget && !showGhost && !earOnly && (
        <text x={tx} y={TOP_Y+2*LG+5} textAnchor="middle" fontSize="28" fontWeight="700" fill="#c4b5fd" fontFamily={ff} style={{animation:"pulse 1.5s ease-in-out infinite"}}>?</text>
      )}
      {earOnly && !showTarget && (
        <text x={55} y={TOP_Y+2*LG+5} textAnchor="middle" fontSize="22" fontWeight="700" fill="#c4b5fd" fontFamily={ff} style={{animation:"pulse 1.5s ease-in-out infinite"}}>🎧</text>
      )}
    </svg>
  );
}

// ═══ SNOWMAN ═══
export function Snowman({ root, third, fifth, complete, bouncing, index, chordName }) {
  const by = 180;
  const delay = (index||0) * 0.15;
  const style = bouncing ? { animation: `snowBounce .6s ease-in-out ${delay}s infinite alternate` } : {};
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", ...style }}>
      <svg width="100" height="200" viewBox="0 0 100 200">
        <ellipse cx="50" cy={by+5} rx="35" ry="5" fill="rgba(0,0,0,0.08)"/>
        {/* Base — root */}
        <circle cx="50" cy={by-30} r="32" fill="white" stroke="#d1d5db" strokeWidth="2"/>
        <text x="50" y={by-25} textAnchor="middle" fontSize="14" fontWeight="700" fill="#6366f1" fontFamily={ff}>{root}</text>
        <text x="50" y={by-10} textAnchor="middle" fontSize="9" fill="#a5b4fc" fontFamily={ff}>root</text>
        {/* Middle — 3rd */}
        {third ? (
          <g style={{animation:"popIn .4s ease"}}>
            <circle cx="50" cy={by-80} r="26" fill="white" stroke="#d1d5db" strokeWidth="2"/>
            <text x="50" y={by-76} textAnchor="middle" fontSize="14" fontWeight="700" fill="#8b5cf6" fontFamily={ff}>{third}</text>
            <text x="50" y={by-62} textAnchor="middle" fontSize="9" fill="#c4b5fd" fontFamily={ff}>3rd</text>
            <circle cx="50" cy={by-85} r="2.5" fill="#374151"/><circle cx="50" cy={by-78} r="2.5" fill="#374151"/>
            <line x1="24" y1={by-82} x2="6" y2={by-95} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="76" y1={by-82} x2="94" y2={by-95} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        ) : (
          <g><circle cx="50" cy={by-80} r="26" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 4"/>
          <text x="50" y={by-74} textAnchor="middle" fontSize="12" fill="#d1d5db" fontFamily={ff}>3rd?</text></g>
        )}
        {/* Head — 5th */}
        {fifth ? (
          <g style={{animation:"popIn .4s ease"}}>
            <circle cx="50" cy={by-122} r="20" fill="white" stroke="#d1d5db" strokeWidth="2"/>
            <circle cx="44" cy={by-127} r="2.5" fill="#1f2937"/><circle cx="56" cy={by-127} r="2.5" fill="#1f2937"/>
            <polygon points={`50,${by-122} 62,${by-120} 50,${by-118}`} fill="#f97316"/>
            <path d={`M 43 ${by-116} Q 50 ${by-110} 57 ${by-116}`} fill="none" stroke="#374151" strokeWidth="1.5"/>
            <rect x="37" y={by-148} width="26" height="16" rx="2" fill="#1e1b4b"/>
            <rect x="33" y={by-134} width="34" height="5" rx="2" fill="#1e1b4b"/>
            <rect x="40" y={by-145} width="20" height="2.5" rx="1" fill="#a78bfa" opacity="0.5"/>
            <text x="50" y={by-108} textAnchor="middle" fontSize="9" fill="#c4b5fd" fontFamily={ff}>5th</text>
          </g>
        ) : (
          <g><circle cx="50" cy={by-122} r="20" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 4"/>
          <text x="50" y={by-118} textAnchor="middle" fontSize="12" fill="#d1d5db" fontFamily={ff}>5th?</text></g>
        )}
      </svg>
      {complete && (
        <div style={{marginTop:-8,padding:"3px 12px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:13,fontWeight:700,fontFamily:ff,animation:"popIn .3s ease",whiteSpace:"nowrap"}}>
          {chordName}
        </div>
      )}
    </div>
  );
}

// ═══ MELTING SNOWMAN for Chord Ear Training ═══
export function MeltingSnowman({ meltStage, maxStages }) {
  // meltStage: 0 = fully intact, maxStages = fully melted
  const pct = meltStage / maxStages; // 0 to 1
  const by = 170;
  // Progressive melting: hat droops, face sags, body puddles
  const headR = 20 - pct * 8;
  const midR = 26 - pct * 10;
  const baseR = 32 - pct * 6;
  const headY = by - 122 + pct * 40;
  const midY = by - 80 + pct * 25;
  const baseY = by - 30 + pct * 8;
  const puddleRx = 35 + pct * 20;
  const puddleRy = 5 + pct * 8;
  const opacity = Math.max(0, 1 - pct * 0.3);

  return (
    <svg width="100" height="200" viewBox="0 0 100 200" style={{transition:"all .5s ease"}}>
      {/* Puddle grows as snowman melts */}
      <ellipse cx="50" cy={by + 10} rx={puddleRx} ry={puddleRy} fill="rgba(147,197,253,0.3)" style={{transition:"all .5s"}}/>
      {/* Shadow */}
      <ellipse cx="50" cy={by + 5} rx="35" ry="5" fill="rgba(0,0,0,0.08)"/>
      {/* Base */}
      <circle cx="50" cy={baseY} r={baseR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>
      {/* Middle */}
      {pct < 0.9 && <circle cx="50" cy={midY} r={midR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>}
      {/* Arms */}
      {pct < 0.7 && <>
        <line x1="24" y1={midY - 2} x2="6" y2={midY - 15} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" style={{transition:"all .5s"}}/>
        <line x1="76" y1={midY - 2} x2="94" y2={midY - 15} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" style={{transition:"all .5s"}}/>
      </>}
      {/* Head */}
      {pct < 0.8 && <circle cx="50" cy={headY} r={headR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>}
      {/* Face */}
      {pct < 0.6 && <>
        <circle cx="44" cy={headY - 4} r="2.5" fill="#1f2937" style={{transition:"all .5s"}}/>
        <circle cx="56" cy={headY - 4} r="2.5" fill="#1f2937" style={{transition:"all .5s"}}/>
        <polygon points={`50,${headY} 60,${headY + 2} 50,${headY + 4}`} fill="#f97316" style={{transition:"all .5s"}}/>
        {pct < 0.3 ?
          <path d={`M 43 ${headY + 7} Q 50 ${headY + 13} 57 ${headY + 7}`} fill="none" stroke="#374151" strokeWidth="1.5"/> :
          <path d={`M 43 ${headY + 10} Q 50 ${headY + 6} 57 ${headY + 10}`} fill="none" stroke="#374151" strokeWidth="1.5"/>
        }
      </>}
      {/* Hat */}
      {pct < 0.5 && <>
        <rect x="37" y={headY - 28 + pct * 10} width="26" height="16" rx="2" fill="#1e1b4b" style={{transition:"all .5s",transform:`rotate(${pct * 15}deg)`,transformOrigin:"50px " + (headY - 20) + "px"}}/>
        <rect x="33" y={headY - 14 + pct * 6} width="34" height="5" rx="2" fill="#1e1b4b" style={{transition:"all .5s"}}/>
      </>}
      {/* Fully melted - just a puddle with hat */}
      {pct >= 0.9 && <>
        <ellipse cx="50" cy={by + 5} rx="40" ry="10" fill="rgba(200,220,255,0.5)"/>
        <rect x="38" y={by - 8} width="24" height="14" rx="2" fill="#1e1b4b"/>
        <rect x="34" y={by + 4} width="32" height="4" rx="2" fill="#1e1b4b"/>
        <polygon points="55,172 63,170 55,168" fill="#f97316"/>
      </>}
    </svg>
  );
}

// ═══ EFFECTS ═══
export function Snowflakes({ count = 30 }) {
  const f = useMemo(() => Array.from({length:count},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*8,dur:4+Math.random()*6,size:3+Math.random()*6,op:0.3+Math.random()*0.5})),[count]);
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {f.map(s=><div key={s.id} style={{position:"absolute",left:`${s.left}%`,top:-10,width:s.size,height:s.size,borderRadius:"50%",background:"white",opacity:s.op,animation:`snowfall ${s.dur}s linear ${s.delay}s infinite`}}/>)}
    </div>
  );
}

export function Confetti({ show }) {
  return <ConfettiBurst show={show} />;
}

export function NoteBtn({ note, onClick, disabled, highlight, small }) {
  const bg = highlight==="correct" ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : highlight==="wrong" ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : highlight==="hint" ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
    : "linear-gradient(135deg,#6366f1,#8b5cf6)";
  const sz = small ? 42 : 52;
  return (
    <button onClick={()=>!disabled&&onClick(note)} disabled={disabled}
      style={{width:sz,height:sz,borderRadius:small?10:14,border:highlight==="hint"?"2px solid #c4b5fd":"none",background:disabled?"#374151":bg,color:disabled?"#6b7280":"white",fontSize:small?16:22,fontWeight:700,fontFamily:ff,cursor:disabled?"default":"pointer",boxShadow:highlight==="hint"?"0 0 16px rgba(167,139,250,.5)":disabled?"none":"0 4px 12px rgba(99,102,241,0.3)",transition:"all .15s",transform:highlight?"scale(1.1)":"scale(1)",animation:highlight==="hint"?"pulse 1.2s ease-in-out infinite":undefined}}>
      {shortDisplay(note)}
    </button>
  );
}

// Button for accidentals mode — shows enharmonic pair (Gb/F#) on one key
export function EnharmonicBtn({ primary, alt, onClick, disabled, highlight }) {
  const isNatural = !alt;
  const bg = highlight==="correct" ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : highlight==="wrong" ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : highlight==="hint" ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
    : isNatural ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
    : "linear-gradient(135deg,#3730a3,#4f46e5)";
  return (
    <button onClick={()=>!disabled&&onClick(primary)} disabled={disabled}
      style={{minWidth:isNatural?44:56,height:52,borderRadius:12,border:highlight==="hint"?"2px solid #c4b5fd":isNatural?"none":"1px solid rgba(139,92,246,.3)",background:disabled?"#374151":bg,color:disabled?"#6b7280":"white",fontWeight:700,fontFamily:ff,cursor:disabled?"default":"pointer",boxShadow:highlight==="hint"?"0 0 16px rgba(167,139,250,.5)":disabled?"none":"0 4px 12px rgba(99,102,241,0.3)",transition:"all .15s",transform:highlight?"scale(1.08)":"scale(1)",padding:"4px 6px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,animation:highlight==="hint"?"pulse 1.2s ease-in-out infinite":undefined}}>
      {isNatural ? (
        <span style={{fontSize:20}}>{primary}</span>
      ) : (
        <>
          <span style={{fontSize:13,lineHeight:1.1}}>{primary}</span>
          <span style={{fontSize:10,lineHeight:1,opacity:.7,color:highlight?"white":"#c4b5fd"}}>{alt}</span>
        </>
      )}
    </button>
  );
}

// ═══ STREAK MILESTONE CELEBRATION ═══
export function StreakCelebration({ milestone }) {
  if (!milestone) return null;
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,pointerEvents:"none",animation:"fadeIn .2s ease"}}>
      <div style={{background:"rgba(0,0,0,.6)",borderRadius:20,padding:"16px 28px",textAlign:"center",animation:"popIn .4s ease",pointerEvents:"none"}}>
        <div style={{fontSize:36,marginBottom:4}}>{milestone.label.split(" ")[0]}</div>
        <div style={{color:"white",fontSize:18,fontWeight:700,fontFamily:ff}}>{milestone.label}</div>
        <div style={{color:"#a5b4fc",fontSize:12,marginTop:4,fontFamily:ff}}>Streak bonus active!</div>
      </div>
    </div>
  );
}

// ═══ WINTER CATERPILLAR ═══
export function WinterCaterpillar({ streak, shiver }) {
  const segs = Math.min(streak, 10);
  const tier = getStreakTier(streak);
  const hasScarf   = streak >= 3;
  const hasCocoa   = streak >= 5;
  const hasMittens = streak >= 8;
  const hasTophat  = streak >= 10;
  const hasSkates  = streak >= 15;
  const isIce      = streak >= 20;
  const hasCampfire= streak >= 25;
  const hasCrown   = streak >= 30;

  const segColor = (i) => {
    if (isIce && hasCampfire) return i % 2 === 0 ? "#67e8f9" : "#fdba74";
    if (isIce) return i % 2 === 0 ? "#a5f3fc" : "#67e8f9";
    if (hasTophat) return i % 2 === 0 ? "#e0e7ff" : "#c7d2fe";
    return i % 2 === 0 ? "#a5b4fc" : "#818cf8";
  };

  const headFill = hasCrown ? "#c084fc" : isIce ? "#06b6d4" : hasTophat ? "#e0e7ff" : "#6366f1";
  const headStroke = hasCrown ? "#7c3aed" : isIce ? "#0891b2" : hasTophat ? "#a5b4fc" : "#4338ca";
  const glowColor = hasCampfire ? "rgba(249,115,22,.4)" : isIce ? "rgba(6,182,212,.3)" : hasCrown ? "rgba(192,132,252,.4)" : "none";

  const w = 460;
  const h = 170;
  const hx = 60; // head center x
  const hy = 80; // head center y
  const hr = 36; // head radius
  const segR = hasTophat ? 22 : 18;
  const segGap = 34;

  const shiverAnim = shiver ? "catShiver .3s ease" : undefined;

  return (
    <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{animation:shiverAnim,overflow:"visible"}}>
        {/* Glow */}
        {glowColor !== "none" && (
          <ellipse cx={w/2} cy={hy+16} rx={w*0.4} ry={40} fill={glowColor} style={{animation:"pulse 2s ease-in-out infinite"}}/>
        )}

        {/* Skates track */}
        {hasSkates && (
          <line x1={hx-20} y1={h-8} x2={w-10} y2={h-8} stroke="#bae6fd" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.5"/>
        )}

        {/* Body segments */}
        {Array.from({length:segs},(_,i)=>{
          const si = segs - 1 - i;
          const sx = hx + hr + 12 + si * segGap;
          const sy = hy + 12;
          return (
            <g key={i}>
              <circle cx={sx} cy={sy} r={segR} fill={segColor(si)}
                stroke={isIce?"#0891b2":hasTophat?"#a5b4fc":"#6366f1"} strokeWidth="2.5"
                style={{animation:`segBob .8s ease-in-out ${si*0.08}s infinite alternate`}}/>
              {hasMittens && (si === 0 || si === segs-1) && (
                <g>
                  <ellipse cx={sx-segR+3} cy={sy+segR+5} rx={5.5} ry={7} fill="#6366f1" stroke="#4338ca" strokeWidth="1.2"/>
                  <ellipse cx={sx+segR-3} cy={sy+segR+5} rx={5.5} ry={7} fill="#6366f1" stroke="#4338ca" strokeWidth="1.2"/>
                  <rect x={sx-segR} y={sy+segR+1} width={7} height={3.5} rx={1.5} fill="#818cf8"/>
                  <rect x={sx+segR-7} y={sy+segR+1} width={7} height={3.5} rx={1.5} fill="#818cf8"/>
                </g>
              )}
              {hasSkates && (
                <g>
                  <line x1={sx-8} y1={sy+segR+3} x2={sx+9} y2={sy+segR+3} stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round"/>
                  <line x1={sx-9} y1={sy+segR+7} x2={sx+10} y2={sy+segR+7} stroke="#0891b2" strokeWidth="2" strokeLinecap="round"/>
                </g>
              )}
            </g>
          );
        })}

        {/* Head */}
        <circle cx={hx} cy={hy} r={hr} fill={headFill} stroke={headStroke} strokeWidth="2.5"/>
        {/* Eyes */}
        <circle cx={hx-11} cy={hy-8} r={6.5} fill="white"/>
        <circle cx={hx+11} cy={hy-8} r={6.5} fill="white"/>
        <circle cx={hx-9} cy={hy-7} r={3.2} fill="#1e1b4b"/>
        <circle cx={hx+13} cy={hy-7} r={3.2} fill="#1e1b4b"/>
        {/* Eye shine */}
        <circle cx={hx-7.5} cy={hy-9.5} r={1.5} fill="white"/>
        <circle cx={hx+14.5} cy={hy-9.5} r={1.5} fill="white"/>
        {isIce && <>
          <circle cx={hx-7} cy={hy-10.5} r={1} fill="#67e8f9"/>
          <circle cx={hx+15} cy={hy-10.5} r={1} fill="#67e8f9"/>
        </>}
        {/* Rosy cheeks */}
        <circle cx={hx-20} cy={hy+5} r={5.5} fill="#f9a8d4" opacity=".35"/>
        <circle cx={hx+20} cy={hy+5} r={5.5} fill="#f9a8d4" opacity=".35"/>
        {/* Smile */}
        <path d={`M ${hx-11} ${hy+11} Q ${hx} ${hy+23} ${hx+11} ${hy+11}`} fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round"/>

        {/* ── ITEMS ── */}

        {/* Scarf */}
        {hasScarf && (
          <g>
            <rect x={hx-24} y={hy+hr-7} width={48} height={12} rx={4} fill="#ef4444"/>
            <rect x={hx+18} y={hy+hr+2} width={10} height={22} rx={4} fill="#ef4444"/>
            <line x1={hx-20} y1={hy+hr-2} x2={hx+20} y2={hy+hr-2} stroke="#dc2626" strokeWidth="1.8"/>
            <line x1={hx-20} y1={hy+hr+1} x2={hx+20} y2={hy+hr+1} stroke="#b91c1c" strokeWidth="1" opacity=".5"/>
            {[0,1,2].map(i => <line key={i} x1={hx+20+i*3} y1={hy+hr+22} x2={hx+20+i*3} y2={hy+hr+28} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>)}
          </g>
        )}

        {/* Crown or Top hat */}
        {hasCrown ? (
          <g>
            <rect x={hx-22} y={hy-hr-2} width={44} height={6} rx={3} fill="#7c3aed"/>
            <polygon points={`${hx-20},${hy-hr} ${hx-13},${hy-hr-24} ${hx-6},${hy-hr}`} fill="#c084fc" stroke="#a855f7" strokeWidth="1.5"/>
            <polygon points={`${hx-7},${hy-hr} ${hx},${hy-hr-32} ${hx+7},${hy-hr}`} fill="#e9d5ff" stroke="#a855f7" strokeWidth="1.5"/>
            <polygon points={`${hx+6},${hy-hr} ${hx+13},${hy-hr-24} ${hx+20},${hy-hr}`} fill="#c084fc" stroke="#a855f7" strokeWidth="1.5"/>
            <circle cx={hx} cy={hy-hr-22} r={3} fill="white" style={{animation:"pulse 1s ease-in-out infinite"}}/>
            <circle cx={hx-13} cy={hy-hr-15} r={2} fill="#fbbf24" style={{animation:"pulse 1.2s ease-in-out .3s infinite"}}/>
            <circle cx={hx+13} cy={hy-hr-15} r={2} fill="#fbbf24" style={{animation:"pulse 1.2s ease-in-out .6s infinite"}}/>
          </g>
        ) : hasTophat ? (
          <g>
            <rect x={hx-20} y={hy-hr-30} width={40} height={30} rx={4} fill="#1e1b4b"/>
            <rect x={hx-26} y={hy-hr-4} width={52} height={8} rx={4} fill="#1e1b4b"/>
            <rect x={hx-16} y={hy-hr-22} width={32} height={5} rx={2} fill={isIce?"#67e8f9":"#a78bfa"} opacity=".5"/>
            <circle cx={hx+8} cy={hy-hr-18} r={3} fill="#16a34a"/>
            <circle cx={hx+14} cy={hy-hr-18} r={3} fill="#16a34a"/>
            <circle cx={hx+11} cy={hy-hr-21} r={2.5} fill="#ef4444"/>
          </g>
        ) : null}

        {/* Hot cocoa */}
        {hasCocoa && segs > 0 && (
          <g>
            <rect x={hx+hr+8} y={hy-20} width={22} height={28} rx={5} fill="#92400e" stroke="#78350f" strokeWidth="1.5"/>
            <rect x={hx+hr+6} y={hy-22} width={26} height={6} rx={3} fill="#78350f"/>
            <path d={`M ${hx+hr+30} ${hy-14} Q ${hx+hr+40} ${hy-6} ${hx+hr+30} ${hy+4}`} fill="none" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round"/>
            <ellipse cx={hx+hr+19} cy={hy-17} rx={9} ry={3} fill="#5c2d0e"/>
            <path d={`M ${hx+hr+14} ${hy-26} Q ${hx+hr+18} ${hy-38} ${hx+hr+13} ${hy-46}`} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.8" style={{animation:"steamFloat 2s ease-in-out infinite"}}/>
            <path d={`M ${hx+hr+22} ${hy-26} Q ${hx+hr+26} ${hy-36} ${hx+hr+20} ${hy-44}`} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" style={{animation:"steamFloat 2s ease-in-out .6s infinite"}}/>
            <circle cx={hx+hr+15} cy={hy-18} r={4} fill="#fef3c7" stroke="#fbbf24" strokeWidth=".8"/>
            <circle cx={hx+hr+23} cy={hy-17} r={3.5} fill="#fef3c7" stroke="#fbbf24" strokeWidth=".8"/>
          </g>
        )}

        {/* Campfire glow particles */}
        {hasCampfire && (
          <g>
            {[0,1,2,3,4,5].map(i => {
              const px = hx + 55 + i * 40;
              const py = hy + 32 + Math.sin(i) * 8;
              return <circle key={i} cx={px} cy={py} r={3.5} fill="#f97316" opacity=".5"
                style={{animation:`sparkleFloat 1.5s ease-in-out ${i*0.25}s infinite`}}/>;
            })}
          </g>
        )}

        {/* Snowflake trail for crown */}
        {hasCrown && (
          <g>
            {[0,1,2,3].map(i => {
              const px = hx + hr + 20 + segs * segGap + i * 22;
              return <text key={i} x={px} y={hy + 8 + Math.sin(i*2)*10} fontSize="18" fill="white" opacity={0.35 + i * 0.12}
                style={{animation:`sparkleFloat 2s ease-in-out ${i*0.35}s infinite`}}>❄</text>;
            })}
          </g>
        )}
      </svg>

      {/* Streak label */}
      {streak > 0 && (
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2}}>
          <span style={{fontSize:14,color:tier?tier.color:"#818cf8",fontWeight:600,fontFamily:ff}}>
            {streak} streak{tier ? ` · ${tier.label}` : ""}
          </span>
          {getStreakBonus(streak).label && (
            <span style={{fontSize:13,color:"#22c55e",fontWeight:700,background:"rgba(34,197,94,.12)",borderRadius:8,padding:"2px 10px",fontFamily:ff}}>
              {getStreakBonus(streak).label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ EXPLANATION OVERLAY ═══
export function ExplanationOverlay({
  level,
  onStart,
  onPlaySong,
  onPlaySeparate,
  onPlayTogether,
}) {
  const lv = TRAINING_LEVELS[level];
  const iv = INTERVAL_DB[lv.intervalIdx];
  const dir = lv.direction;
  // Example: C4 up by this interval
  const exStart = "C";
  const exOct = dir === "down" ? 5 : 4;
  const exMidi = noteToMidi(exStart, exOct);
  const exTargetMidi = dir === "up" ? exMidi + iv.half : exMidi - iv.half;
  const exTarget = midiToChromatic(exTargetMidi);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:20,animation:"fadeIn .3s ease"}}>
      <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 32px",maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",textAlign:"center",animation:"slideIn .4s ease"}}>
        <div style={{fontSize:40,marginBottom:8}}>{iv.emoji}</div>
        <h2 style={{color:"white",margin:"0 0 4px",fontSize:24}}>{iv.name}</h2>
        <div style={{color:"#a5b4fc",fontSize:14,marginBottom:4}}>{iv.half} half step{iv.half!==1?"s":""} · {dir === "up" ? "Going up ⬆" : "Going down ⬇"}</div>

        <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.6,margin:"12px 0 16px"}}>{iv.desc}</p>

        {/* Example on staff */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
          <div style={{background:"white",borderRadius:14,padding:"4px 12px",display:"inline-block"}}>
            <DualStaff startName={exStart} startOct={exOct} targetName={exTarget.name} targetOct={exTarget.octave} highlight="correct" showTarget={true}/>
          </div>
        </div>

        <div style={{color:"#818cf8",fontSize:13,marginBottom:6}}>
          Example: {exStart} {dir === "up" ? "→" : "←"} {shortDisplay(exTarget.name)} ({iv.name} {dir})
        </div>

        {/* Song reference */}
        <div style={{background:"rgba(99,102,241,.12)",borderRadius:12,padding:"8px 16px",marginBottom:16}}>
          <div style={{color:"#a5b4fc",fontSize:11,marginBottom:2}}>Remember this sound from:</div>
          <div style={{color:"white",fontSize:15,fontWeight:600,marginBottom:6}}>{dir==="up" ? iv.songUp : iv.songDown}</div>
          {SONG_SNIPPETS[iv.short + "_" + dir] && (
            <button onClick={() => onPlaySong(lv.intervalIdx, dir)}
              style={{padding:"8px 16px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.1)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              🎶 Hear It
            </button>
          )}
        </div>

        {/* Audio buttons */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={() => onPlaySeparate(exStart, exOct, exTarget.name, exTarget.octave)}
            style={{padding:"8px 16px",borderRadius:10,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
            🎵 Hear Separately
          </button>
          <button onClick={() => onPlayTogether(exStart, exOct, exTarget.name, exTarget.octave)}
            style={{padding:"8px 16px",borderRadius:10,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
            🎶 Hear Together
          </button>
        </div>

        <button onClick={onStart}
          style={{padding:"12px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>
          Start Practice →
        </button>
      </div>
    </div>
  );
}
