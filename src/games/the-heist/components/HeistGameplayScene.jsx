import { memo } from "react";
import {
  GameHud,
  LevelCompleteOverlay,
  StartOverlay,
  TeachingIntroOverlay,
} from "./HeistHudOverlays.jsx";

export const HeistGameplayScene = memo(function HeistGameplayScene({
  width,
  height,
  worldXRef,
  museumBgVersion,
  guardObsRender,
  handleMuseumReady,
  activeTheme,
  gameplayActive,
  hitFlash,
  rhythmLane,
  laserObstacleLayer,
  guardFallbackLayer,
  burglar,
  tapGood,
  rhythmHitX,
  rhythmLaneY,
  moveLabel,
  moveCol,
  burglarX,
  groundY,
  guardClearFlash,
  spottedFlash,
  tooEarlyFlash,
  missFlash,
  levelBanner,
  teachingOverlay,
  continueTeachingIntro,
  gameHud,
  startOverlay,
  levelCompleteOverlayProps,
  gameOver,
  score,
  metersCovered,
  levelLabel,
  endlessMode,
  endlessStealValue,
  endlessLeaderboard,
  children,
  HeistMuseumBackground,
}) {
  return (
    <div style={{position:"relative",width:"min(100%, 720px)",maxWidth:"100%",border:"1px solid #ff336622",borderRadius:4,
      overflow:"hidden",boxShadow:"0 0 50px #ff33660e,0 0 100px #00000099",
      animation:hitFlash?"sh 0.45s ease":"none"}}>
      <HeistMuseumBackground
        key={museumBgVersion}
        worldXSourceRef={worldXRef}
        guardObstacles={guardObsRender}
        onReady={handleMuseumReady}
        theme={activeTheme}
        gameplayActive={gameplayActive}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{display:"block",maxWidth:"100%",position:"relative",zIndex:1}}
      >
        {rhythmLane}
        {laserObstacleLayer}
        {guardFallbackLayer}

        <g transform={`translate(${burglarX},${groundY})`}>
          {burglar}
        </g>

        {tapGood && <circle cx={rhythmHitX} cy={rhythmLaneY} r={12} fill="none"
          stroke="#44ff88" strokeWidth={2} style={{animation:"tr 0.28s ease-out forwards"}}/>}

        {moveLabel && <text x={burglarX + 32} y={groundY - 130} textAnchor="middle"
          fontSize={17} fontWeight="bold" fill={moveCol} fontFamily="monospace" letterSpacing={3}
          style={{animation:"lb 0.85s ease forwards"}}>{moveLabel}</text>}

        {guardClearFlash && <text x={burglarX} y={groundY - 94} textAnchor="middle"
          fontSize={22} fontWeight="bold" fill="#f5e642" fontFamily="monospace"
          style={{animation:"mf 0.65s ease forwards"}}>HIDDEN!</text>}
        {spottedFlash && <text x={burglarX} y={groundY - 94} textAnchor="middle"
          fontSize={22} fontWeight="bold" fill="#f5e642" fontFamily="monospace"
          style={{animation:"mf 0.65s ease forwards"}}>SPOTTED!</text>}
        {!guardClearFlash && !spottedFlash && tooEarlyFlash && <text x={burglarX} y={groundY - 94} textAnchor="middle"
          fontSize={20} fontWeight="bold" fill="#ffb347" fontFamily="monospace"
          style={{animation:"mf 0.65s ease forwards"}}>TOO EARLY!</text>}
        {!guardClearFlash && !spottedFlash && missFlash && <text x={burglarX} y={groundY - 94} textAnchor="middle"
          fontSize={22} fontWeight="bold" fill="#ff2200" fontFamily="monospace"
          style={{animation:"mf 0.65s ease forwards"}}>MISS!</text>}

        {levelBanner && (
          <g transform={`translate(${width/2},${height/2-102})`}>
            <rect x={-154} y={-34} width={308} height={68} rx={8} fill="#000000bf" stroke={levelBanner.accent} strokeWidth={1.6}/>
            <text x={0} y={-10} textAnchor="middle" fontSize={10} fill={levelBanner.accent} fontFamily="monospace" letterSpacing={3}>
              {levelBanner.heading}
            </text>
            <text x={0} y={10} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#fff7ef" fontFamily="monospace" letterSpacing={2}>
              {levelBanner.title.toUpperCase()}
            </text>
            <text x={0} y={27} textAnchor="middle" fontSize={8} fill="#ffffff66" fontFamily="monospace" letterSpacing={1.4}>
              {levelBanner.detail.toUpperCase()}
            </text>
          </g>
        )}

        <GameHud {...gameHud} />
        <StartOverlay {...startOverlay} />
        <TeachingIntroOverlay
          width={width}
          height={height}
          teachingOverlay={teachingOverlay}
          onContinue={continueTeachingIntro}
        />
        <LevelCompleteOverlay {...levelCompleteOverlayProps} />

        {gameOver && (
          <g>
            <rect width={width} height={height} fill="#000" opacity={0.76}/>
            <text x={width/2} y={height/2-38} textAnchor="middle" fontSize={36} fontWeight="bold"
              fill="#ff3366" fontFamily="monospace" letterSpacing={4}
              style={{filter:"drop-shadow(0 0 22px #ff336688)"}}>CAUGHT!</text>
            <text x={width/2} y={height/2+6} textAnchor="middle" fontSize={13}
              fill="#ffffff55" fontFamily="monospace" letterSpacing={2}>
              {`SCORE: ${score}  ·  COVERED: ${metersCovered}M  ·  ${levelLabel}${endlessMode ? `  ·  VALUE: ${endlessStealValue}` : ""}`}
            </text>
            {endlessMode && endlessLeaderboard.length > 0 && (
              <>
                <text x={width/2} y={height/2+62} textAnchor="middle" fontSize={9}
                  fill="#44ff88" fontFamily="monospace" letterSpacing={3}>ENDLESS BOARD</text>
                {endlessLeaderboard.slice(0, 3).map((entry, index) => (
                  <text key={`${entry.at}-${index}`} x={width/2} y={height/2+80+index*14} textAnchor="middle" fontSize={8}
                    fill="#ffffff55" fontFamily="monospace" letterSpacing={1.4}>
                    {`${index + 1}. VALUE ${String(entry.value).padStart(4, "0")} · SCORE ${String(entry.score).padStart(4, "0")} · ${entry.meters}M`}
                  </text>
                ))}
              </>
            )}
            <rect x={width/2-80} y={height/2+22} width={160} height={30} rx={4}
              fill="#ff336618" stroke="#ff3366" strokeWidth={1.5}/>
            <text x={width/2} y={height/2+41} textAnchor="middle" fontSize={10}
              fill="#ff3366" fontFamily="monospace" letterSpacing={3}>TAP TO TRY AGAIN</text>
          </g>
        )}

        <defs>
          <radialGradient id="vg" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="transparent"/>
            <stop offset="100%" stopColor="#000" stopOpacity={0.68}/>
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#vg)" pointerEvents="none"/>
      </svg>
      {children}
    </div>
  );
});
