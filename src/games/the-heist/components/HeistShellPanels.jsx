import { memo } from "react";
import { DevMenuTools, MenuModeToggle } from "./HeistDebugTools.jsx";

export const StartControls = memo(function StartControls({
  started,
  countingIn,
  gameOver,
  levelCompleteOverlay,
  isMenuEndlessSelection,
  selectedStartLevel,
  displayStageTitle,
  displayBpm,
  beatFlash,
  handleStartOrInputPress,
  handleInputRelease,
  returnToMenu,
}) {
  return (
    <div style={{display:"flex",gap:10,alignItems:"stretch",justifyContent:"center",flexWrap:"wrap",width:"min(100%, 720px)"}}>
      <button
        onPointerDown={event => {
          event.preventDefault();
          handleStartOrInputPress();
        }}
        onPointerUp={event => { event.preventDefault(); handleInputRelease("button"); }}
        onPointerCancel={event => { event.preventDefault(); handleInputRelease("button"); }}
        onPointerLeave={event => { event.preventDefault(); handleInputRelease("button"); }}
        style={{background:"#ff336618",border:"2px solid #ff336655",color:"#ff3366",
          padding:"16px clamp(18px, 8vw, 60px)",fontFamily:"monospace",fontSize:"clamp(11px, 3.4vw, 13px)",letterSpacing:"clamp(2px, 1vw, 4px)",
          width:"min(100%, 420px)",
          cursor:"pointer",borderRadius:6,userSelect:"none",WebkitUserSelect:"none",
          boxShadow:beatFlash?"0 0 28px #ff336655":"0 0 8px #ff336622",transition:"box-shadow 0.08s",touchAction:"manipulation"}}
      >
        {countingIn ? "COUNTING IN" : gameOver ? "RETRY" : levelCompleteOverlay ? "CONTINUE" : !started ? (isMenuEndlessSelection ? "START ENDLESS" : `START LEVEL ${String(selectedStartLevel).padStart(2, "0")}`) : "TAP THE BEAT"}
        <div style={{fontSize:"clamp(7px, 2.2vw, 8px)",opacity:0.4,marginTop:4,letterSpacing:"clamp(1.4px, 0.7vw, 3px)"}}>
          {gameOver
            ? "SPACE · ENTER · ANY KEY"
            : levelCompleteOverlay
              ? `${levelCompleteOverlay.nextLabel} · SPACE TO CONTINUE`
              : !started
                ? `${displayStageTitle.toUpperCase()} · ${displayBpm} BPM`
                : "SPACE · ENTER · ANY KEY"}
        </div>
      </button>

      {gameOver && (
        <button
          onPointerDown={event => { event.preventDefault(); returnToMenu(); }}
          style={{background:"#0a1324",border:"2px solid #7ce7ff33",color:"#7ce7ff",
            padding:"16px 22px",fontFamily:"monospace",fontSize:"clamp(11px, 3vw, 12px)",letterSpacing:"clamp(1.5px, 0.8vw, 3px)",
            cursor:"pointer",borderRadius:6,userSelect:"none",WebkitUserSelect:"none",touchAction:"manipulation"}}
        >
          MENU
          <div style={{fontSize:8,opacity:0.45,marginTop:4,letterSpacing:2}}>LEVEL SELECT</div>
        </button>
      )}
    </div>
  );
});

export const HeistMenuPanel = memo(function HeistMenuPanel({
  showMenuScreen,
  showMenuModeToggle,
  selectedMenuMode,
  displayStageAccent,
  setSelectedMenuModeValue,
  DEV_MODE,
  previewLevelClearOverlay,
  menuLevelDef,
  setNotationLabOpen,
  isMenuEndlessSelection,
  levelLabel,
  displayStageTitle,
  effectiveHighestUnlockedLevel,
  LEVELS,
  selectedStartLevel,
  setSelectedStartLevelValue,
  displayLevelDef,
  menuLevelAdjustedBpm,
  menuLevelTempoPct,
  setLevelTempoOverrideValue,
  displayCoaching,
  treasureRoomRecords,
  setHoveredTreasureLevel,
  setTreasureRoomOpen,
  endlessLeaderboard,
}) {
  if (!showMenuScreen) return null;
  return (
    <div style={{width:"min(100%, 720px)",padding:"12px clamp(12px, 3vw, 16px)",border:"1px solid #7ce7ff22",borderRadius:6,
      background:"linear-gradient(180deg, rgba(5,12,24,.92), rgba(2,6,14,.88))",boxShadow:"0 0 24px #00000055"}}>
      {showMenuModeToggle && (
        <MenuModeToggle
          selectedMenuMode={selectedMenuMode}
          displayStageAccent={displayStageAccent}
          setSelectedMenuModeValue={setSelectedMenuModeValue}
          showDevLabel={DEV_MODE}
        />
      )}
      {DEV_MODE && (
        <DevMenuTools
          previewLevelClearOverlay={previewLevelClearOverlay}
          menuLevelDef={menuLevelDef}
          setNotationLabOpen={setNotationLabOpen}
        />
      )}
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
        <div>
          <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#7ce7ff88",letterSpacing:"clamp(1.4px, 0.7vw, 3px)"}}>{isMenuEndlessSelection ? "START MODE" : "START LEVEL"}</div>
          <div style={{fontSize:"clamp(13px, 4vw, 15px)",color:"#fff7ef",letterSpacing:"clamp(1px, 0.5vw, 2px)"}}>{`${levelLabel} · ${displayStageTitle}`}</div>
        </div>
        <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#ffffff55",letterSpacing:"clamp(1px, 0.5vw, 2px)"}}>
          {effectiveHighestUnlockedLevel >= LEVELS.length ? "FULL CAMPAIGN UNLOCKED" : `UNLOCKED THROUGH LEVEL ${String(effectiveHighestUnlockedLevel).padStart(2, "0")}`}
        </div>
      </div>

      {!isMenuEndlessSelection && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(44px, 1fr))",gap:8}}>
          {Array.from({length: effectiveHighestUnlockedLevel}, (_, index) => {
            const level = index + 1;
            const isSelected = level === selectedStartLevel;
            return (
              <button
                key={level}
                onPointerDown={event => {
                  event.preventDefault();
                  setSelectedStartLevelValue(level);
                }}
                style={{
                  background: isSelected ? `${displayStageAccent}22` : "#07111f",
                  border: `1px solid ${isSelected ? displayStageAccent : "#7ce7ff22"}`,
                  color: isSelected ? "#fff7ef" : "#8fc7e8",
                  padding: "10px 0",
                  fontFamily: "monospace",
                  fontSize: "clamp(11px, 3vw, 12px)",
                  letterSpacing: "clamp(1px, 0.5vw, 2px)",
                  cursor: "pointer",
                  borderRadius: 6,
                  boxShadow: isSelected ? `0 0 14px ${displayStageAccent}33` : "none",
                  touchAction: "manipulation",
                }}
              >
                {String(level).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      )}

      {!isMenuEndlessSelection && (
        <div style={{marginTop:14,padding:"12px 12px 10px",border:"1px solid #7ce7ff1f",borderRadius:8,background:"rgba(4,10,20,.58)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#7ce7ff88",letterSpacing:"clamp(1.2px, 0.6vw, 2.6px)"}}>LEVEL TEMPO</div>
              <div style={{fontSize:"clamp(12px, 3.3vw, 13px)",color:"#fff7ef",letterSpacing:"clamp(0.8px, 0.4vw, 1.6px)"}}>
                {`${menuLevelAdjustedBpm} BPM · ${menuLevelTempoPct}% OF AUTHORED ${menuLevelDef.bpm}`}
              </div>
            </div>
            <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#ffffff55",letterSpacing:"clamp(0.8px, 0.4vw, 1.6px)"}}>
              50% - 120%
            </div>
          </div>
          <input
            type="range"
            min={50}
            max={120}
            step={1}
            value={menuLevelTempoPct}
            onChange={event => {
              setLevelTempoOverrideValue(menuLevelDef.level, Number(event.target.value));
            }}
            style={{width:"100%",marginTop:10,accentColor:displayStageAccent,cursor:"pointer"}}
          />
        </div>
      )}

      <div style={{marginTop:12,fontSize:"clamp(8px, 2.3vw, 9px)",color:"#ffffff55",letterSpacing:"clamp(0.9px, 0.4vw, 1.8px)",lineHeight:1.45}}>
        {`${(isMenuEndlessSelection ? "Procedural heist route" : displayLevelDef.environment).toUpperCase()} · ${displayCoaching.toUpperCase()}`}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,gap:10,flexWrap:"wrap"}}>
        <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#ffd88988",letterSpacing:"clamp(0.9px, 0.4vw, 1.8px)"}}>
          {`${Object.keys(treasureRoomRecords).length} / ${LEVELS.length} PRIZES SECURED`}
        </div>
        <button
          onPointerDown={event => {
            event.preventDefault();
            setHoveredTreasureLevel(null);
            setTreasureRoomOpen(true);
          }}
          style={{
            background:"#1a1426",
            border:"1px solid #ffd88955",
            color:"#ffd889",
            padding:"9px 14px",
            fontFamily:"monospace",
            fontSize:"clamp(10px, 2.8vw, 11px)",
            letterSpacing:"clamp(1.2px, 0.6vw, 2.2px)",
            cursor:"pointer",
            borderRadius:6,
            boxShadow:"0 0 18px #00000033",
            touchAction:"manipulation",
          }}
        >
          TREASURE ROOM
        </button>
      </div>
      {endlessLeaderboard.length > 0 && (
        <div style={{marginTop:14,padding:"12px 12px 10px",border:"1px solid #44ff881f",borderRadius:8,background:"rgba(6,20,14,.42)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
            <div>
              <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#44ff8888",letterSpacing:"clamp(1.2px, 0.6vw, 2.6px)"}}>ENDLESS BOARD</div>
              <div style={{fontSize:"clamp(12px, 3.3vw, 13px)",color:"#fff7ef",letterSpacing:"clamp(0.8px, 0.4vw, 1.6px)"}}>Top endless runs on this browser</div>
            </div>
            <div style={{fontSize:"clamp(8px, 2.3vw, 9px)",color:"#ffffff55",letterSpacing:"clamp(0.8px, 0.4vw, 1.6px)"}}>
              TOP {Math.min(5, endlessLeaderboard.length)}
            </div>
          </div>
          <div style={{display:"grid",gap:6}}>
            {endlessLeaderboard.slice(0, 5).map((entry, index) => (
              <div
                key={`${entry.at}-${index}`}
                style={{
                  display:"grid",
                  gridTemplateColumns:"40px minmax(0, 1fr)",
                  gap:10,
                  alignItems:"center",
                  padding:"7px 8px",
                  borderRadius:6,
                  background:index === 0 ? "rgba(68,255,136,.08)" : "rgba(255,255,255,.03)",
                  border:`1px solid ${index === 0 ? "#44ff8844" : "#ffffff10"}`,
                }}
              >
                <div style={{fontSize:"clamp(10px, 2.8vw, 11px)",color:index === 0 ? "#44ff88" : "#8fd7b0",letterSpacing:"clamp(1px, 0.4vw, 1.8px)",fontFamily:"monospace"}}>
                  #{index + 1}
                </div>
                <div style={{fontSize:"clamp(9px, 2.5vw, 10px)",color:"#ffffffbb",letterSpacing:"clamp(0.6px, 0.3vw, 1.4px)",fontFamily:"monospace",lineHeight:1.4}}>
                  {`VALUE ${String(entry.value).padStart(4, "0")} · SCORE ${String(entry.score).padStart(4, "0")} · ${entry.meters}M · BPM ${entry.bpm}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
