import { STAGES } from "../../data/stages.js";
import { getClefMeta } from "../../data/clefs.js";
import MusicalCaterpillarMeter from "../../../shared/components/MusicalCaterpillarMeter.jsx";
import GameHUD from "../../../shared/components/GameHUD.jsx";
import ScorePanel from "../../../shared/components/ScorePanel.jsx";
import StreakMeter from "../../../shared/components/StreakMeter.jsx";
import GameContainer from "../../../shared/layout/GameContainer.jsx";
import GameLayout from "../../../shared/layout/GameLayout.jsx";
import Confetti from "../Confetti.jsx";
import LevelBadge from "../LevelBadge.jsx";
import NoteBtn from "../NoteButton.jsx";
import PreFilled from "../PreFilled.jsx";
import Staff from "../Staff.jsx";
import StaffHint from "../StaffHint.jsx";
import StatsPanel from "../StatsPanel.jsx";
import StreakCelebration from "../StreakCelebration.jsx";
import { PowerupsBar, StreakLBOverlay } from "../overlays.jsx";

export default function GameScreen({
  state,
  dispatch,
  bgGradient,
  ff,
  css,
  actions,
  derived,
}) {
  const { butterflyDisplayRemaining, butterflyToken, showStaffHint, speakWords, streakLB } = derived;
  const {
    addStreakLeaderboardScore,
    clearTimer,
    getStreakLeaderboard,
    handleBuyPowerup,
    handleUsePowerup,
    saveStreakLeaderboard,
    setShowStaffHint,
    setSpeakWords,
    setStreakLB,
  } = actions;
  const letters = state.word ? state.word.w.split("") : [];
  const slotSet = new Set(state.slots);
  const useExt = STAGES[state.stageIndex].id === 3;
  const slotMap = {};
  state.slots.forEach((wi, si) => {
    slotMap[wi] = si;
  });
  const stage = STAGES[state.stageIndex];
  const clefMeta = getClefMeta(state.clef);
  const noteCount = letters.length;
  const noteScale = noteCount > 5 ? Math.max(0.7, 5 / noteCount) : 1;

  return (
    <GameLayout
      background={bgGradient}
      fontFamily={ff}
      padding="14px 14px calc(120px + env(safe-area-inset-bottom, 0px))"
      styleContent={css}
    >
      <Confetti show={state.showConfetti} />
      <StreakCelebration milestone={state.streakMilestone} />
      {state.showStats && <StatsPanel stats={state.stats} onClose={() => dispatch({ type: "HIDE_STATS" })} fontFamily={ff} />}
      {state.showStreakLB && <StreakLBOverlay state={state} dispatch={dispatch} streakLB={streakLB} addStreakScore={addStreakLeaderboardScore} saveStreakLB={saveStreakLeaderboard} getStreakLB={getStreakLeaderboard} setStreakLB={setStreakLB} fontFamily={ff} />}

      {state.popup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, fontFamily: ff }}>
          <div style={{ background: "white", borderRadius: 24, padding: "32px 44px", textAlign: "center", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,.3)", animation: "popIn .4s ease" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
            <h2 style={{ color: state.popup.color, margin: "0 0 6px", fontSize: 22 }}>Stage {state.popup.id} Unlocked!</h2>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{state.popup.name}</div>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>{state.popup.desc}</div>
            <button onClick={() => dispatch({ type: "DISMISS" })} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${state.popup.color},${state.popup.color}cc)`, color: "white", fontSize: 16, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Let's Go!</button>
          </div>
        </div>
      )}

      <GameContainer maxWidth={560}>
        <GameHUD
          left={<button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ background: "none", border: "none", fontSize: 13, color: "#7c3aed", cursor: "pointer", fontFamily: ff, fontWeight: 500 }}>← Back</button>}
          center={
            <>
              <LevelBadge stats={state.stats} />
              <ScorePanel
                label="Stage"
                value={stage.id}
                tone="mint"
                style={{ background: `${stage.color}18`, color: stage.color, boxShadow: "none", border: `2px solid ${stage.color}44` }}
                valueStyle={{ fontSize: 11, fontWeight: 700 }}
                labelStyle={{ fontSize: 9, color: stage.color, opacity: 0.8 }}
              />
            </>
          }
          right={
            <>
              <button onClick={() => setSpeakWords((v) => !v)} title={speakWords ? "Word reading: ON" : "Word reading: OFF"} style={{ background: "none", border: "none", fontSize: 14, color: speakWords ? "#7c3aed" : "#9ca3af", cursor: "pointer", padding: 0, position: "relative" }}>🔊{!speakWords && <span style={{ position: "absolute", top: -1, left: -1, fontSize: 16, color: "#ef4444" }}>╲</span>}</button>
              <button onClick={() => dispatch({ type: "SHOW_STATS" })} style={{ background: "none", border: "none", fontSize: 14, color: "#9ca3af", cursor: "pointer", padding: 0 }}>📊</button>
              {state.stats.butterflies > 0 && <ScorePanel icon="🦋" value={state.stats.butterflies} tone="violet" valueStyle={{ fontSize: 14 }} />}
              <ScorePanel icon="⭐" label="Score" value={state.score} tone="violet" />
            </>
          }
        />
      </GameContainer>

      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{clefMeta.symbol} {clefMeta.name} · Word #{state.completed + 1}</div>
      <GameContainer maxWidth={420} style={{ display: "flex", justifyContent: "center" }}>
        <StreakMeter label="Streak" value={state.streak ?? 0} accent="#7c3aed" style={{ margin: "28px 0 6px" }}>
          <MusicalCaterpillarMeter
            streak={state.streak ?? 0}
            streakMilestone={state.streakMilestone}
            progress={(state.streak ?? 0) % 10}
            butterflyRemaining={butterflyDisplayRemaining}
            triggerButterfly={butterflyToken}
            milestoneScopeKey={`${state.phase}:${state.clef}`}
          />
        </StreakMeter>
      </GameContainer>

      {(state.doubleActive || state.shieldActive) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {state.doubleActive && <span style={{ fontSize: 11, color: "#f59e0b", background: "#fef3c7", borderRadius: 6, padding: "2px 8px", fontWeight: 600, animation: "pulse 1.5s ease-in-out infinite" }}>✨ 2× Active</span>}
          {state.shieldActive && <span style={{ fontSize: 11, color: "#3b82f6", background: "#dbeafe", borderRadius: 6, padding: "2px 8px", fontWeight: 600, animation: "pulse 1.5s ease-in-out infinite" }}>🛡️ Shield Active</span>}
        </div>
      )}

      <PowerupsBar
        powerups={state.powerups}
        score={state.score}
        isDone={state.isDone}
        onBuy={handleBuyPowerup}
        onUse={handleUsePowerup}
      />

      <div style={{ background: "white", borderRadius: 12, padding: "7px 18px", marginBottom: 8, boxShadow: "0 2px 10px rgba(0,0,0,.06)", fontSize: 13, color: "#4b5563", fontWeight: 500, maxWidth: 460, textAlign: "center", lineHeight: 1.4, animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>{state.message}</div>

      <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "white", borderRadius: 16, padding: "6px 8px", boxShadow: "0 2px 14px rgba(0,0,0,.06)", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto", transform: noteScale < 1 ? `scale(${noteScale})` : undefined, transformOrigin: "center top", animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.isDone;
          const hlVal = isSlot ? state.highlights[si] || null : null;
          if (!isSlot) return <PreFilled key={wi} letter={ch} />;
          return (
            <div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #7c3aed" : "2px solid transparent", background: active ? "#f5f3ff" : "transparent", transition: "all .25s ease", animation: active ? "bounce 1.2s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={useExt} shake={hlVal === "wrong"} />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 480, animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.isDone;
          const got = isSlot && state.guessed[si];
          return (
            <div key={wi} style={{ width: 33, height: 39, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#e0e7ff,#c7d2fe)" : got ? "linear-gradient(135deg,#4ade80,#22c55e)" : "white", border: active ? "2.5px solid #7c3aed" : !isSlot ? "2px solid #a5b4fc" : "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#4338ca" : got ? "white" : "#d1d5db", transition: "all .3s ease", animation: got ? "popIn .3s ease" : "none" }}>
              {!isSlot ? ch : (got ? state.guessed[si] : "·")}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
          <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "PICK", note })} disabled={state.isDone} />
        ))}
      </div>
      <div style={{ color: "#b4a0d0", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <span>💡 Press A–G on your keyboard!</span>
        <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
      </div>
      {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}

      {state.wrongCount >= 3 && !state.isDone && <button onClick={() => dispatch({ type: "SKIP" })} style={{ marginTop: 10, background: "none", border: "2px solid #d1d5db", borderRadius: 10, padding: "6px 18px", color: "#9ca3af", fontSize: 12, fontFamily: ff, fontWeight: 500, cursor: "pointer" }}>Skip →</button>}

      {state.unlockedStages.length > 1 && (
        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {state.unlockedStages.map((si) => (
            <button key={si} onClick={() => { clearTimer(); dispatch({ type: "SWITCH", index: si }); }} style={{ padding: "4px 10px", borderRadius: 8, border: `2px solid ${STAGES[si].color}${si === state.stageIndex ? "" : "44"}`, background: si === state.stageIndex ? `${STAGES[si].color}18` : "white", color: STAGES[si].color, fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Stage {STAGES[si].id}</button>
          ))}
        </div>
      )}
    </GameLayout>
  );
}
