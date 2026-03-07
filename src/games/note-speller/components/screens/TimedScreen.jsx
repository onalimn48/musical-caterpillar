import { getClefMeta } from "../../data/clefs.js";
import PreFilled from "../PreFilled.jsx";
import Staff from "../Staff.jsx";
import NoteBtn from "../NoteButton.jsx";
import StaffHint from "../StaffHint.jsx";
import LevelBadgeDark from "../LevelBadgeDark.jsx";
import Confetti from "../Confetti.jsx";

const BADGE_META = {
  treble: { icon: "👑", label: "Treble Legendary Badge", color: "#f59e0b", detail: "Treble master" },
  alto: { icon: "🎖️", label: "Alto Legendary Badge", color: "#14b8a6", detail: "Alto master" },
  bass: { icon: "🏅", label: "Bass Legendary Badge", color: "#ec4899", detail: "Bass master" },
};

export default function TimedScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { showStaffHint, timeLeft, timedLevelConfig, timedSpecialModes, currentTimedClefProgress } = derived;
  const { clearTimer, setShowStaffHint } = actions;
  const letters = state.word ? state.word.w.split("") : [];
  const slotSet = new Set(state.slots);
  const slotMap = {};
  state.slots.forEach((wi, si) => {
    slotMap[wi] = si;
  });
  const activeSpecialMode = timedSpecialModes.find((mode) => mode.id === state.timedMode) || null;
  const unlockedMode = timedSpecialModes.find((mode) => mode.id === state.timedUnlockedMode) || null;
  const unlockedBadge = state.timedBadgeUnlockedClef ? BADGE_META[state.timedBadgeUnlockedClef] : null;
  const duration = activeSpecialMode ? activeSpecialMode.seconds : timedLevelConfig.seconds;
  const pct = Math.max(0, (timeLeft / duration) * 100);
  const tc = pct > 50 ? "#4ade80" : pct > 25 ? "#f59e0b" : "#ef4444";
  const clefMeta = getClefMeta(state.clef);
  const noteScale = letters.length > 5 ? Math.max(0.7, 5 / letters.length) : 1;

  if (state.timedOver) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#140f2d,#1c173d,#0f0a1a)", fontFamily: ff, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <style>{css}</style>
        <div style={{ fontSize: 48, marginBottom: 10 }}>{activeSpecialMode ? activeSpecialMode.icon : "⏱️"}</div>
        <h2 style={{ color: activeSpecialMode ? activeSpecialMode.color : "#f59e0b", margin: "0 0 8px", fontSize: 28 }}>
          {activeSpecialMode ? `${activeSpecialMode.label} Run Over` : "Timed Run Over"}
        </h2>
        <div style={{ color: "white", fontSize: 42, fontWeight: 700, marginBottom: 6 }}>{state.timedScore}</div>
        <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 10 }}>words cleared</div>
        {!activeSpecialMode && (
          <div style={{ color: timedLevelConfig.color, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            Reached {timedLevelConfig.title}
          </div>
        )}
        {!activeSpecialMode && (
          <div style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 18 }}>
            Special mode progress: {currentTimedClefProgress.level3Clears}/{timedSpecialModes[timedSpecialModes.length - 1]?.unlockGoal}
          </div>
        )}
        {state.timedUnlockedMode && (
          <div style={{ background: "linear-gradient(135deg,#fdf4ff,#ede9fe)", border: "2px solid #c084fc", borderRadius: 16, padding: "12px 18px", color: "#6d28d9", fontSize: 14, fontWeight: 700, marginBottom: 18 }}>
            {(timedSpecialModes.find((mode) => mode.id === state.timedUnlockedMode) || {}).icon} {(timedSpecialModes.find((mode) => mode.id === state.timedUnlockedMode) || {}).label} Mode unlocked! It is now available from the menu.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => { clearTimer(); dispatch({ type: "TIMED_START", clef: state.clef, mode: state.timedMode }); }} style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: activeSpecialMode ? `linear-gradient(135deg,${activeSpecialMode.color},${activeSpecialMode.color}cc)` : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer" }}>
            Play Again
          </button>
          <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ padding: "12px 28px", borderRadius: 14, border: "2px solid rgba(255,255,255,.2)", background: "transparent", color: "#cbd5e1", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>
            Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: activeSpecialMode ? "linear-gradient(160deg,#0f172a,#1d4ed8,#0f172a)" : "linear-gradient(160deg,#140f2d,#1c173d,#0f0a1a)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>
      <Confetti show={state.showConfetti} />

      <div style={{ width: "100%", maxWidth: 520, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Quit</button>
          <LevelBadgeDark stats={state.stats} />
          <div style={{ color: tc, fontSize: 28, fontWeight: 700, fontFamily: "'Courier New',monospace", animation: timeLeft < 3 ? "pulse .45s ease-in-out infinite" : "none" }}>
            {Math.ceil(timeLeft)}s
          </div>
          <div style={{ background: activeSpecialMode ? `linear-gradient(135deg,${activeSpecialMode.color},${activeSpecialMode.color}cc)` : "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", borderRadius: 12, padding: "4px 14px", fontSize: 20, fontWeight: 700 }}>{state.timedScore}</div>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: tc, width: `${pct}%`, transition: "width .1s linear" }} />
        </div>
      </div>

      <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 6 }}>
        {clefMeta.symbol} {clefMeta.name} · {activeSpecialMode ? `${activeSpecialMode.label} Mode · ${activeSpecialMode.seconds}s/${activeSpecialMode.perNote ? "note" : "word"}` : `${timedLevelConfig.title} · ${timedLevelConfig.seconds}s`}
      </div>

      {!activeSpecialMode && (
        <div style={{ color: timedLevelConfig.color, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          {state.timedLevelCorrect}/{timedLevelConfig.target} words to next speed
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 10, maxWidth: 460 }}>
        {timedSpecialModes.map((mode) => {
          const unlocked = mode.id === "diamond" ? currentTimedClefProgress.diamondUnlocked : currentTimedClefProgress.legendaryUnlocked;
          const active = state.timedMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                if (unlocked && !active) {
                  clearTimer();
                  dispatch({ type: "TIMED_START", clef: state.clef, mode: mode.id });
                }
              }}
              disabled={!unlocked || active}
              style={{
                minWidth: 138,
                background: active ? `${mode.color}22` : "rgba(255,255,255,.06)",
                border: `1.5px solid ${active || unlocked ? mode.color : "rgba(255,255,255,.12)"}`,
                borderRadius: 14,
                padding: "8px 10px",
                textAlign: "center",
                cursor: unlocked && !active ? "pointer" : "default",
                opacity: unlocked || active ? 1 : 0.82,
                transition: "transform .18s ease, background .18s ease",
              }}
              onMouseEnter={(e) => {
                if (unlocked && !active) e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{mode.icon}</div>
              <div style={{ color: unlocked ? mode.color : "#94a3b8", fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{mode.label}</div>
              <div style={{ color: "#cbd5e1", fontSize: 10, lineHeight: 1.35 }}>
                {mode.seconds}s per word
                {mode.id === "legendary" ? " · all notes on and off the staff" : ""}
              </div>
              <div style={{ color: unlocked ? "#cbd5e1" : "#64748b", fontSize: 10, marginTop: 4, fontWeight: 700 }}>
                {unlocked ? (active ? "Active now" : "Tap to switch") : `${currentTimedClefProgress.level3Clears}/${mode.unlockGoal}`}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ background: "rgba(17,24,39,.72)", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid rgba(255,255,255,.08)", fontSize: 13, color: activeSpecialMode ? "#bfdbfe" : "#fcd34d", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

      <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "rgba(17,24,39,.9)", borderRadius: 16, padding: "6px 8px", border: "1px solid rgba(255,255,255,.08)", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto", transform: noteScale < 1 ? `scale(${noteScale})` : undefined, transformOrigin: "center top" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.timedWordDone;
          const hlVal = isSlot ? state.highlights[si] || null : null;
          if (!isSlot) return <PreFilled key={wi} letter={ch} dark />;
          return (
            <div key={wi} style={{ borderRadius: 12, border: active ? `2px solid ${activeSpecialMode ? activeSpecialMode.color : "#f59e0b"}` : "2px solid transparent", background: active ? (activeSpecialMode ? `${activeSpecialMode.color}22` : "#f59e0b11") : "transparent", transition: "all .2s ease", animation: active ? "bounce 1s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct"} extended={timedLevelConfig.stageIndex === 2 || !!activeSpecialMode} dark shake={hlVal === "wrong"} />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 480 }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const got = isSlot && state.guessed[si];
          return (
            <div key={wi} style={{ width: 32, height: 38, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#312e81,#3730a3)" : got ? "linear-gradient(135deg,#4ade80,#16a34a)" : "rgba(17,24,39,.9)", border: !isSlot ? "2px solid #4338ca" : "2px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#a5b4fc" : got ? "white" : "#5a5070", transition: "all .2s ease", animation: got ? "popIn .2s ease" : "none" }}>
              {!isSlot ? ch : (got ? state.guessed[si] : "·")}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
          <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "TIMED_PICK", note })} disabled={state.timedWordDone || state.timedOver} gold />
        ))}
      </div>
      <div style={{ color: "#5a5070", fontSize: 11, marginTop: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <span>💡 Press A–G on keyboard!</span>
        <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
      </div>
      {unlockedMode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,15,30,.68)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 30 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "linear-gradient(180deg,#fff,#f8fafc)", borderRadius: 24, padding: "22px 20px", boxShadow: "0 30px 80px rgba(15,23,42,.35)", textAlign: "center", border: `3px solid ${unlockedMode.color}` }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{unlockedMode.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: unlockedMode.color, marginBottom: 8 }}>{unlockedMode.label} Mode Unlocked</div>
            <div style={{ color: "#334155", fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
              {unlockedMode.label} gives you {unlockedMode.seconds} second{unlockedMode.seconds === 1 ? "" : "s"} per {unlockedMode.perNote ? "note" : "word"}.
              {unlockedMode.perNote ? " Every new note restarts the clock, so each tap must be instant." : " You have to finish the whole word before time runs out."}
            </div>
            <div style={{ background: "#eff6ff", borderRadius: 14, padding: "10px 12px", color: "#475569", fontSize: 13, marginBottom: 18 }}>
              Find it inside Timed Mode on the menu. Press continue to move on to the next timed word.
            </div>
            <button
              onClick={() => dispatch({ type: "TIMED_ADVANCE" })}
              style={{ padding: "12px 24px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${unlockedMode.color},${unlockedMode.color}cc)`, color: "white", fontSize: 16, fontWeight: 800, fontFamily: ff, cursor: "pointer" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {unlockedBadge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(8,15,30,.68)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 31 }}>
          <div style={{ width: "100%", maxWidth: 430, background: "linear-gradient(180deg,#fff7ed,#fff)", borderRadius: 24, padding: "22px 20px", boxShadow: "0 30px 80px rgba(15,23,42,.35)", textAlign: "center", border: `3px solid ${unlockedBadge.color}` }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>{unlockedBadge.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: unlockedBadge.color, marginBottom: 8 }}>Congratulations!</div>
            <div style={{ color: "#334155", fontSize: 15, lineHeight: 1.55, marginBottom: 8 }}>
              You got 15 words in a row in Legendary Mode and unlocked the {unlockedBadge.label}.
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 14, padding: "10px 12px", color: "#475569", fontSize: 13, marginBottom: 18, fontWeight: 700 }}>
              {unlockedBadge.detail}. This badge now shows on every screen.
            </div>
            <button
              onClick={() => dispatch({ type: "TIMED_ADVANCE" })}
              style={{ padding: "12px 24px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${unlockedBadge.color},${unlockedBadge.color}cc)`, color: "white", fontSize: 16, fontWeight: 800, fontFamily: ff, cursor: "pointer" }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
    </div>
  );
}
