import { memo, useMemo } from "react";
import RhythmLane from "./RhythmLane.jsx";

const INTRO_PREVIEW_PX_PER_BEAT = 68;
const INTRO_PREVIEW_HIT_X = 30;
const INTRO_PREVIEW_WIDTH = 336;

let previewAudioContext = null;

function getPreviewAudioContext() {
  if (typeof window === "undefined") return null;
  if (!previewAudioContext) {
    previewAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (previewAudioContext.state === "suspended") {
    previewAudioContext.resume();
  }
  return previewAudioContext;
}

function playPreviewTap(audioContext, when, frequency = 880, duration = 0.1, gainValue = 0.09) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, when);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  gain.gain.setValueAtTime(gainValue, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  oscillator.start(when);
  oscillator.stop(when + duration + 0.02);
}

function playPreviewHold(audioContext, when, durationSeconds) {
  playPreviewTap(audioContext, when, 760, Math.min(0.14, durationSeconds * 0.4), 0.09);
}

function auditionTeachingRhythm(sampleEvents, beatSeconds = 0.6) {
  const audioContext = getPreviewAudioContext();
  if (!audioContext) return;
  const startAt = audioContext.currentTime + 0.06;

  sampleEvents.forEach(event => {
    const when = startAt + event.at * beatSeconds;
    if (event.kind === "hold") {
      playPreviewHold(audioContext, when, Math.max(beatSeconds, event.durationBeats * beatSeconds));
      return;
    }
    if (event.kind === "quarter") {
      playPreviewTap(audioContext, when, 760, 0.12, 0.1);
      return;
    }
    if (event.kind === "dotted_quarter") {
      playPreviewTap(audioContext, when, 700, 0.16, 0.1);
      return;
    }
    if (event.kind === "eighth") {
      playPreviewTap(audioContext, when, 920, 0.08, 0.08);
      return;
    }
    if (event.kind === "sixteenth") {
      playPreviewTap(audioContext, when, 1060, 0.06, 0.07);
      return;
    }
    if (event.kind === "triplet") {
      playPreviewTap(audioContext, when, 980, 0.07, 0.075);
    }
  });
}

export const GameHud = memo(function GameHud({
  width,
  height,
  missLimit,
  beat4,
  levelLabel,
  stageTitle,
  stageAccent,
  score,
  currentBpm,
  timeSignature,
  activeNoteValues,
  phaseText,
  coaching,
  metersCovered,
  rhythmPct,
  rhythmHeartsRemaining,
  nextLabel,
  gameOver,
  endlessMode,
  endlessStealValue,
}) {
  return (
    <>
      <rect x={0} y={0} width={width} height={27} fill="#000" opacity={0.6}/>

      <g transform="translate(14,14)">
        {[0,1,2,3].map(i=>(
          <g key={i} transform={`translate(${i*18},0)`}>
            <circle cx={0} cy={0} r={5} fill={i===beat4?"#ff3366":"#ff336616"}
              style={i===beat4?{animation:"bp 0.5s ease-out"}:{}}/>
            {i===beat4&&<circle cx={0} cy={0} r={10} fill="#ff3366" opacity={0.1}/>}
          </g>
        ))}
        <text x={88} y={4} fontSize={7} fill="#ff336440" fontFamily="monospace" letterSpacing={2}>BEAT</text>
      </g>

      <g transform={`translate(${width/2 - 154},6)`}>
        <rect x={0} y={0} width={308} height={31} rx={4} fill="#00000088" stroke="#ffffff0a" strokeWidth={1}/>
        <text x={10} y={12.5} fontSize={8} fill="#ffffff38" fontFamily="monospace" letterSpacing={1.5}>
          {`${timeSignature} · COVERED ${String(metersCovered).padStart(4,"0")}M`}
        </text>
        <text x={118} y={12.5} fontSize={8} fill={stageAccent} fontFamily="monospace" letterSpacing={1.5}>
          {`${levelLabel} · ${stageTitle.toUpperCase()}`}
        </text>
        <text x={10} y={24.5} fontSize={7.5} fill="#ffffff33" fontFamily="monospace" letterSpacing={1.4}>
          {`${currentBpm} BPM · ${phaseText}`}
        </text>
        <text x={118} y={24.5} fontSize={7.5} fill="#7ce7ff88" fontFamily="monospace" letterSpacing={1.2}>
          {activeNoteValues}
        </text>
        <text x={192} y={24.5} fontSize={7.5} fill="#ff9966" fontFamily="monospace" letterSpacing={1.2}>
          {coaching.toUpperCase()}
        </text>
      </g>

      <text x={width/2} y={49} textAnchor="middle" fontSize={9} fill="#ffffff22" fontFamily="monospace" letterSpacing={2}>
        {`${levelLabel}   SCORE ${String(score).padStart(4, "0")}${endlessMode ? `   VALUE ${String(endlessStealValue).padStart(4, "0")}` : ""}`}
      </text>

      <g transform={`translate(${width-112},5)`}>
        {Array.from({length:missLimit},(_,i)=>(
          <text key={i} x={i*18} y={18} fontSize={13} fill={i<rhythmHeartsRemaining?"#ff3366":"#221626"}>♥</text>
        ))}
      </g>

      <g transform={`translate(14,${height-18})`}>
        <text x={0} y={0} fontSize={7} fill="#ff336444" fontFamily="monospace" letterSpacing={2}>RHYTHM</text>
        <rect x={56} y={-8} width={100} height={9} rx={2} fill="#ffffff08" stroke="#ffffff10" strokeWidth={1}/>
        <rect x={56} y={-8} width={Math.round(100*rhythmPct)} height={9} rx={2}
          fill={rhythmPct>0.6?"#44ff88":rhythmPct>0.3?"#ffaa00":"#ff3322"}/>
      </g>

      {nextLabel&&!gameOver&&(
        <g transform={`translate(${width-138},${height-22})`}>
          <rect x={0} y={0} width={132} height={18} rx={3} fill="#00000099" stroke="#ffffff08" strokeWidth={1}/>
          <text x={6} y={13} fontSize={8} fill="#ffffff30" fontFamily="monospace">NEXT: </text>
          <text x={52} y={13} fontSize={8} fontFamily="monospace" fill="#ff9966">{nextLabel}</text>
        </g>
      )}
    </>
  );
});

export const StartOverlay = memo(function StartOverlay({
  width,
  height,
  started,
  levelCompleteOverlay,
  gameOver,
  countingIn,
  laneY,
  displayTimeSigTop,
  displayTimeSigBottom,
  countInBeat,
  levelLabel,
  displayStageTitle,
  displayBpm,
  displayCoaching,
  effectiveHighestUnlockedLevel,
}) {
  if (started || levelCompleteOverlay || gameOver) return null;
  return (
    <g>
      <rect width={width} height={height} fill="#000" opacity={0.72}/>
      {countingIn ? (
        <>
          <g transform={`translate(42 ${laneY})`} style={{filter:"drop-shadow(0 0 12px #7ce7ff66)"}}>
            <text x={0} y={-8} textAnchor="middle" fontSize={20} fontWeight="bold"
              fill="#7ce7ff" fontFamily="monospace">
              {displayTimeSigTop || "4"}
            </text>
            <text x={0} y={22} textAnchor="middle" fontSize={20} fontWeight="bold"
              fill="#7ce7ff" fontFamily="monospace">
              {displayTimeSigBottom || "4"}
            </text>
          </g>
          <text x={width/2} y={height/2-8} textAnchor="middle" fontSize={68} fontWeight="bold"
            fill="#ff3366" fontFamily="monospace" letterSpacing={4}
            style={{filter:"drop-shadow(0 0 18px #ff336688)"}}>{countInBeat || "READY"}</text>
          <text x={width/2} y={height/2+28} textAnchor="middle" fontSize={11}
            fill="#ffffff55" fontFamily="monospace" letterSpacing={3}>COUNT IN</text>
        </>
      ) : (
        <>
          <text x={width/2} y={height/2-22} textAnchor="middle" fontSize={24} fontWeight="bold"
            fill="#ff3366" fontFamily="monospace" letterSpacing={4}
            style={{filter:"drop-shadow(0 0 18px #ff336688)"}}>{`${levelLabel} · ${displayStageTitle.toUpperCase()}`}</text>
          <text x={width/2} y={height/2+4} textAnchor="middle" fontSize={11}
            fill="#ffffff55" fontFamily="monospace" letterSpacing={2}>{`${displayBpm} BPM · ${displayCoaching.toUpperCase()}`}</text>
          <text x={width/2} y={height/2+26} textAnchor="middle" fontSize={9}
            fill="#ffffff44" fontFamily="monospace" letterSpacing={1.7}>
            {effectiveHighestUnlockedLevel > 1 ? `UNLOCKED THROUGH LEVEL ${String(effectiveHighestUnlockedLevel).padStart(2, "0")} · SELECT BELOW` : "FINISH NEW LEVELS TO UNLOCK START SELECT"}
          </text>
        </>
      )}
    </g>
  );
});

export const LevelCompleteOverlay = memo(function LevelCompleteOverlay({
  width,
  height,
  levelCompleteOverlay,
  countingIn,
  gameOver,
  levelClearPhase,
  renderPrizeVictoryScene,
  renderHeistFinaleScene,
  renderPrizeCaseScene,
}) {
  if (!levelCompleteOverlay || countingIn || gameOver) return null;
  return (
    <g>
      <rect width={width} height={height} fill="#000" opacity={0.76}/>
      {levelClearPhase === "celebrate" && levelCompleteOverlay.prize ? (
        <>
          <g transform={`translate(${width/2 - (levelCompleteOverlay.isCampaignFinale ? 180 : 160)},${height/2 - (levelCompleteOverlay.isCampaignFinale ? 118 : 98)})`}>
            <foreignObject x="0" y="0" width={levelCompleteOverlay.isCampaignFinale ? "360" : "320"} height={levelCompleteOverlay.isCampaignFinale ? "230" : "190"}>
              <div xmlns="http://www.w3.org/1999/xhtml" style={{display:"flex",justifyContent:"center"}}>
                {levelCompleteOverlay.isCampaignFinale
                  ? renderHeistFinaleScene(levelCompleteOverlay.prize)
                  : renderPrizeVictoryScene(levelCompleteOverlay.prize)}
              </div>
            </foreignObject>
          </g>
          <text x={width/2} y={height/2+82} textAnchor="middle" fontSize={13}
            fill="#ffd889" fontFamily="monospace" letterSpacing={2.2}>
            {levelCompleteOverlay.isCampaignFinale
              ? `HE CLAIMED THE ${levelCompleteOverlay.prize.name.toUpperCase()}`
              : `HE STOLE THE ${levelCompleteOverlay.prize.name.toUpperCase()}`}
          </text>
        </>
      ) : (
        <>
          <text x={width/2} y={height/2-52} textAnchor="middle" fontSize={12}
            fill="#7ce7ff" fontFamily="monospace" letterSpacing={3}>
            {levelCompleteOverlay.isCampaignFinale
              ? "FINAL SCORE"
              : `LEVEL ${String(levelCompleteOverlay.completedLevel).padStart(2, "0")} CLEAR`}
          </text>
          <text x={width/2} y={height/2-24} textAnchor="middle" fontSize={28} fontWeight="bold"
            fill="#fff7ef" fontFamily="monospace" letterSpacing={3}>
            {levelCompleteOverlay.isCampaignFinale
              ? "THE HEIST IS COMPLETE"
              : levelCompleteOverlay.completedTitle.toUpperCase()}
          </text>
          {levelCompleteOverlay.prize && (
            <g transform={`translate(${width/2-130},${height/2-6})`}>
              <foreignObject x="0" y="0" width="260" height="150">
                <div xmlns="http://www.w3.org/1999/xhtml" style={{display:"flex",justifyContent:"center"}}>
                  {renderPrizeCaseScene(levelCompleteOverlay.prize)}
                </div>
              </foreignObject>
            </g>
          )}
          <text x={width/2} y={height/2+6} textAnchor="middle" fontSize={12}
            fill="#44ff88" fontFamily="monospace" letterSpacing={2}>
            {levelCompleteOverlay.summary.total
              ? `${levelCompleteOverlay.summary.accuracyPct}% ACCURATE · ${levelCompleteOverlay.summary.accurate}/${levelCompleteOverlay.summary.total} ON-TIME`
              : "NO TIMED HITS TRACKED"}
          </text>
          {levelCompleteOverlay.prize && (
            <text x={width/2} y={height/2+48} textAnchor="middle" fontSize={11}
              fill="#ffd889" fontFamily="monospace" letterSpacing={2.1}>
              {`SECURED: ${levelCompleteOverlay.prize.name.toUpperCase()}`}
            </text>
          )}
          <text x={width/2} y={height/2+28} textAnchor="middle" fontSize={10}
            fill="#ffffff66" fontFamily="monospace" letterSpacing={1.8}>
            {`EARLY ${levelCompleteOverlay.summary.early} · LATE ${levelCompleteOverlay.summary.late}`}
          </text>
          <rect x={width/2-126} y={height/2+64} width={252} height={34} rx={5}
            fill="#ff336618" stroke="#ff3366" strokeWidth={1.5}/>
          <text x={width/2} y={height/2+85} textAnchor="middle" fontSize={10}
            fill="#ff3366" fontFamily="monospace" letterSpacing={2.8}>
            {levelCompleteOverlay.isCampaignFinale
              ? "TREASURE ROOM FILLED · PRESS SPACE FOR MENU"
              : `${levelCompleteOverlay.nextLabel} · PRESS SPACE TO CONTINUE`}
          </text>
        </>
      )}
    </g>
  );
});

function formatBeatCount(beat) {
  return Number.isInteger(beat) ? String(beat + 1) : (beat + 1).toFixed(2).replace(/\.00$/, "");
}

function buildIntroPreviewNotes(sampleEvents, sampleSpanBeats) {
  const pxPerBeat = INTRO_PREVIEW_PX_PER_BEAT;
  const hitX = INTRO_PREVIEW_HIT_X;

  return sampleEvents.map((event, index) => ({
    x: hitX + (event.previewAt ?? event.at) * pxPerBeat,
    laneBaseX: hitX + (event.previewAt ?? event.at) * pxPerBeat,
    id: `intro-${index}`,
    at: event.at,
    absoluteBeatInRun: event.at,
    pxPerBeat,
    hitTime: event.at,
    kind: event.kind,
    durationBeats: event.durationBeats || 1,
    holdStyle: event.holdStyle || null,
    groupId: event.groupKey ? `intro-group-${event.groupKey}` : null,
    beamCount: event.beamCount || 0,
    groupLabel: event.groupLabel || null,
    travelMs: sampleSpanBeats,
    missed: false,
    hit: false,
  }));
}

function buildIntroBeatMarkers(sampleEvents) {
  const pxPerBeat = INTRO_PREVIEW_PX_PER_BEAT;
  const hitX = INTRO_PREVIEW_HIT_X;
  const markers = [];

  sampleEvents.forEach((event, index) => {
    markers.push({
      key: `beat-${index}-start`,
      x: hitX + (event.previewAt ?? event.at) * pxPerBeat,
      label: event.beatLabel || formatBeatCount(event.at),
    });

    if (event.kind === "hold") {
      const wholeBeatCount = Math.floor(event.durationBeats || 0);
      for (let step = 1; step < wholeBeatCount; step += 1) {
        const beat = event.at + step;
        markers.push({
          key: `beat-${index}-hold-${step}`,
          x: hitX + ((event.previewAt ?? event.at) + step) * pxPerBeat,
          label: formatBeatCount(beat),
        });
      }
    }
  });

  return markers;
}

function IntroRhythmPreview({
  sampleEvents,
  sampleSpanBeats,
}) {
  const previewNotes = useMemo(
    () => buildIntroPreviewNotes(sampleEvents, sampleSpanBeats),
    [sampleEvents, sampleSpanBeats]
  );
  const beatMarkers = useMemo(
    () => buildIntroBeatMarkers(sampleEvents),
    [sampleEvents]
  );
  const laneWidth = INTRO_PREVIEW_WIDTH;
  const laneHeight = 108;

  return (
    <svg viewBox={`0 0 ${laneWidth} ${laneHeight}`} width="100%" height="108" style={{display:"block"}}>
      <rect x={0} y={6} width={laneWidth} height={94} rx={8} fill="#050812" stroke="#7ce7ff22" strokeWidth={1}/>
      <RhythmLane
        notes={previewNotes}
        beatsPerBar={4}
        layout={{ width: laneWidth, laneY: 40, hitX: INTRO_PREVIEW_HIT_X, spawnX: laneWidth - 20 }}
        notation={{ useTemplateBeams: true, musicNotationFontFamily: "serif" }}
        showHitLine={false}
        showStartBarline={false}
        showEndBarline={false}
      />
      {beatMarkers.map(marker => (
        <text
          key={marker.key}
          x={marker.x}
          y={88}
          textAnchor="middle"
          fontSize={8}
          fill="#ffd889"
          fontFamily="monospace"
          letterSpacing={0.3}
        >
          {marker.label}
        </text>
      ))}
    </svg>
  );
}

export const TeachingIntroOverlay = memo(function TeachingIntroOverlay({
  width,
  height,
  teachingOverlay,
}) {
  if (!teachingOverlay) return null;
  const cardWidth = Math.min(width - 24, 364);
  const cardHeight = Math.min(height - 24, 336);
  return (
    <g>
      <rect width={width} height={height} fill="#000" opacity={0.8}/>
      <foreignObject x={width / 2 - cardWidth / 2} y={Math.max(14, height / 2 - cardHeight / 2 - 8)} width={cardWidth} height={cardHeight}>
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          style={{
            height:"100%",
            border:"1px solid rgba(124,231,255,0.24)",
            borderRadius:"12px",
            background:"linear-gradient(180deg, rgba(6,10,18,0.97), rgba(18,8,16,0.96))",
            boxShadow:"0 0 40px rgba(0,0,0,0.45), inset 0 0 60px rgba(255,51,102,0.05)",
            padding:"clamp(14px, 4vw, 18px)",
            display:"flex",
            flexDirection:"column",
            gap:"clamp(6px, 2vw, 7px)",
            color:"#fff7ef",
            fontFamily:"monospace",
            boxSizing:"border-box",
          }}
        >
          <div style={{fontSize:"clamp(9px, 2.4vw, 10px)",letterSpacing:"clamp(1.6px, 0.8vw, 2.8px)",color:"#7ce7ff"}}>INTRODUCING</div>
          <div style={{fontSize:"clamp(18px, 5vw, 22px)",letterSpacing:"clamp(1px, 0.5vw, 1.8px)",color:"#ff3366",fontWeight:"bold",lineHeight:1.05}}>
            {teachingOverlay.title}
          </div>
          <div style={{fontSize:"clamp(10px, 2.8vw, 11px)",letterSpacing:"clamp(0.6px, 0.3vw, 1.2px)",color:"#ffd889",lineHeight:1.35}}>
            {teachingOverlay.detail}
          </div>
          <div style={{fontSize:"clamp(9px, 2.6vw, 10px)",lineHeight:"1.45",color:"#ffd889cc"}}>
            {teachingOverlay.coaching}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button
              onPointerDown={event => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                auditionTeachingRhythm(teachingOverlay.sampleEvents);
              }}
              style={{
                background:"rgba(124,231,255,0.1)",
                border:"1px solid rgba(124,231,255,0.34)",
                color:"#7ce7ff",
                padding:"8px 12px",
                borderRadius:"7px",
                fontFamily:"monospace",
                fontSize:"clamp(9px, 2.4vw, 10px)",
                letterSpacing:"clamp(1.1px, 0.5vw, 2px)",
                cursor:"pointer",
                touchAction:"manipulation",
              }}
            >
              PLAY
            </button>
          </div>
          <div style={{marginTop:"2px"}}>
            <IntroRhythmPreview
              sampleEvents={teachingOverlay.sampleEvents}
              sampleSpanBeats={teachingOverlay.sampleSpanBeats}
            />
          </div>
          <div style={{marginTop:"auto",fontSize:"clamp(8px, 2.3vw, 9px)",letterSpacing:"clamp(1.2px, 0.6vw, 2.2px)",color:"#ffd889aa",textAlign:"center"}}>
            TAP TO START
          </div>
        </div>
      </foreignObject>
    </g>
  );
});

export const EndlessUnlockOverlay = memo(function EndlessUnlockOverlay({
  open,
  onClose,
}) {
  if (!open) return null;
  return (
    <div
      onClick={event => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,0.7)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        padding:18,
        zIndex:45,
      }}
    >
      <div
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
        }}
        style={{
          width:"min(100%, 420px)",
          border:"1px solid rgba(68,255,136,0.34)",
          borderRadius:14,
          background:"linear-gradient(180deg, rgba(6,18,10,0.98), rgba(8,10,18,0.96))",
          boxShadow:"0 0 40px rgba(0,0,0,0.45), inset 0 0 60px rgba(68,255,136,0.06)",
          padding:"clamp(16px, 4.5vw, 22px) clamp(16px, 4.5vw, 22px) clamp(14px, 3.8vw, 18px)",
          textAlign:"center",
          fontFamily:"monospace",
        }}
      >
        <div style={{fontSize:"clamp(9px, 2.4vw, 10px)",letterSpacing:"clamp(1.4px, 0.8vw, 3px)",color:"#44ff88aa"}}>NEW MODE UNLOCKED</div>
        <div style={{marginTop:8,fontSize:"clamp(20px, 6vw, 24px)",letterSpacing:"clamp(1.2px, 0.6vw, 2.2px)",color:"#44ff88",fontWeight:"bold",lineHeight:1.08}}>
          ENDLESS MODE
        </div>
        <div style={{marginTop:10,fontSize:"clamp(10px, 2.8vw, 11px)",letterSpacing:"clamp(0.5px, 0.3vw, 1.1px)",color:"#ffd889",lineHeight:1.45}}>
          You cleared the campaign. Endless mode is now available from the menu.
        </div>
        <div style={{marginTop:16,fontSize:"clamp(9px, 2.4vw, 10px)",letterSpacing:"clamp(1.2px, 0.6vw, 2.2px)",color:"#ffd889aa"}}>
          TAP TO CONTINUE
        </div>
      </div>
    </div>
  );
});

export const TreasureRoomOverlay = memo(function TreasureRoomOverlay({
  treasureRoomOpen,
  setTreasureRoomOpen,
  setHoveredTreasureLevel,
  hoveredTreasureRecord,
  levels,
  prizeByLevel,
  treasureRoomRecords,
  renderPrizeIcon,
  renderPrizeCaseScene,
}) {
  if (!treasureRoomOpen) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(1,3,8,0.84)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:40}}>
      <div style={{width:"min(100%, 960px)",maxHeight:"min(90dvh, 760px)",overflow:"auto",border:"1px solid #ffd88933",borderRadius:10,background:"linear-gradient(180deg, rgba(20,12,20,.98), rgba(8,9,18,.96))",boxShadow:"0 0 40px #00000088, inset 0 0 120px rgba(255,216,137,0.04)",padding:"clamp(14px, 4vw, 18px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:10,color:"#ffd88988",letterSpacing:3}}>TREASURE ROOM</div>
            <div style={{fontSize:20,color:"#fff5dc",letterSpacing:2}}>Recovered Prizes</div>
          </div>
          <button
            onPointerDown={event => {
              event.preventDefault();
              setTreasureRoomOpen(false);
              setHoveredTreasureLevel(null);
            }}
            style={{background:"#231724",border:"1px solid #ffd88944",color:"#ffd889",padding:"10px 14px",fontFamily:"monospace",fontSize:11,letterSpacing:2,cursor:"pointer",borderRadius:6}}
          >
            CLOSE
          </button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"minmax(0, 1.7fr) minmax(260px, 1fr)",gap:16,alignItems:"start"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))",gap:12}}>
            {levels.map(levelDef => {
              const prize = prizeByLevel[levelDef.level];
              const record = treasureRoomRecords[levelDef.level] || null;
              const isCollected = Boolean(record);
              return (
                <div
                  key={levelDef.level}
                  onPointerEnter={() => isCollected && setHoveredTreasureLevel(levelDef.level)}
                  onPointerLeave={() => setHoveredTreasureLevel(current => current === levelDef.level ? null : current)}
                  style={{
                    border:`1px solid ${isCollected ? "#ffd88933" : "#293042"}`,
                    borderRadius:8,
                    padding:"12px 8px 10px",
                    background:isCollected ? "linear-gradient(180deg, rgba(34,24,33,.92), rgba(15,14,26,.88))" : "linear-gradient(180deg, rgba(11,15,24,.82), rgba(8,10,18,.84))",
                    opacity:isCollected ? 1 : 0.55,
                    boxShadow:isCollected ? "0 0 18px rgba(0,0,0,.22)" : "none",
                    textAlign:"center",
                  }}
                >
                  {renderPrizeIcon(prize, !isCollected)}
                  <div style={{marginTop:8,fontSize:9,color:isCollected ? "#fff5dc" : "#7b8798",letterSpacing:1.2}}>
                    {isCollected ? prize.name.toUpperCase() : "LOCKED CASE"}
                  </div>
                  <div style={{marginTop:4,fontSize:8,color:isCollected ? "#ffd88999" : "#4e596b",letterSpacing:1.6}}>
                    {`LEVEL ${String(levelDef.level).padStart(2, "0")}`}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{border:"1px solid #ffd88922",borderRadius:8,padding:14,background:"linear-gradient(180deg, rgba(18,16,29,.96), rgba(10,11,20,.9))",minHeight:300}}>
            {hoveredTreasureRecord ? (
              <>
                <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
                  {renderPrizeCaseScene(prizeByLevel[hoveredTreasureRecord.level])}
                </div>
                <div style={{fontSize:10,color:"#ffd88988",letterSpacing:2.4}}>{`LEVEL ${String(hoveredTreasureRecord.level).padStart(2, "0")}`}</div>
                <div style={{fontSize:18,color:"#fff5dc",letterSpacing:1.4,marginTop:3}}>{hoveredTreasureRecord.prizeName}</div>
                <div style={{fontSize:10,color:"#7ce7ff88",letterSpacing:2,marginTop:6}}>{hoveredTreasureRecord.title.toUpperCase()}</div>
                <div style={{marginTop:14,fontSize:11,color:"#fff7ef"}}>{`${hoveredTreasureRecord.summary.accuracyPct}% accurate`}</div>
                <div style={{marginTop:6,fontSize:10,color:"#c7d3df",letterSpacing:1.3}}>
                  {`${hoveredTreasureRecord.summary.accurate}/${hoveredTreasureRecord.summary.total} on-time`}
                </div>
                <div style={{marginTop:6,fontSize:10,color:"#c7d3df",letterSpacing:1.3}}>
                  {`EARLY ${hoveredTreasureRecord.summary.early} · LATE ${hoveredTreasureRecord.summary.late}`}
                </div>
              </>
            ) : (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",minHeight:260,textAlign:"center",color:"#7b8798",fontSize:11,letterSpacing:1.5}}>
                Hover over a collected prize to inspect the haul.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
