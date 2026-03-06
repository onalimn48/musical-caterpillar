import { STAGES } from "../../data/stages.js";
import { getClefMeta } from "../../data/clefs.js";
import PreFilled from "../PreFilled.jsx";
import Staff from "../Staff.jsx";
import NoteBtn from "../NoteButton.jsx";
import StaffHint from "../StaffHint.jsx";
import LevelBadgeDark from "../LevelBadgeDark.jsx";
import { ArcadeEnd } from "../overlays.jsx";

export default function ArcadeScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { leaderboard, showStaffHint, timeLeft } = derived;
  const { addLeaderboardScore, clearTimer, getLeaderboard, saveLeaderboard, setLeaderboard, setShowStaffHint } = actions;
  const letters = state.word ? state.word.w.split("") : [];
  const slotSet = new Set(state.slots);
  const slotMap = {};
  state.slots.forEach((wi, si) => {
    slotMap[wi] = si;
  });
  const useExt = state.word && state.word.w.length >= 5;
  const pct = (timeLeft / 60) * 100;
  const tc = pct > 50 ? "#4ade80" : pct > 20 ? "#f59e0b" : "#ef4444";
  const clefMeta = getClefMeta(state.clef);
  const noteCount = letters.length;
  const noteScale = noteCount > 5 ? Math.max(0.7, 5 / noteCount) : 1;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0f0a1a,#1a1128,#12091e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>
      {state.arcadeOver && (
        <ArcadeEnd
          state={state}
          dispatch={dispatch}
          leaderboard={leaderboard}
          setLeaderboard={setLeaderboard}
          clearTimer={clearTimer}
          fontFamily={ff}
          stage1Words={STAGES[0].words}
          addLBScore={addLeaderboardScore}
          saveLB={saveLeaderboard}
          getLB={getLeaderboard}
        />
      )}

      <div style={{ width: "100%", maxWidth: 500, marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Quit</button>
          <LevelBadgeDark stats={state.stats} />
          <div style={{ color: tc, fontSize: 28, fontWeight: 700, fontFamily: "'Courier New',monospace", animation: timeLeft < 10 ? "pulse .5s ease-in-out infinite" : "none" }}>
            {Math.ceil(timeLeft)}s
          </div>
          <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", borderRadius: 12, padding: "4px 14px", fontSize: 20, fontWeight: 700 }}>{state.arcadeScore}</div>
        </div>
        <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#2a1f3a", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: tc, width: `${pct}%`, transition: "width .1s linear" }} />
        </div>
      </div>

      <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 6 }}>
        {clefMeta.symbol} {clefMeta.name}
        {state.arcadePractice && <span style={{ color: "#22c55e", marginLeft: 8 }}>Practice</span>}
      </div>

      <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

      <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto", transform: noteScale < 1 ? `scale(${noteScale})` : undefined, transformOrigin: "center top" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.arcadeOver && !state.arcadeWordDone;
          const hlVal = isSlot ? state.highlights[si] || null : null;
          if (!isSlot) return <PreFilled key={wi} letter={ch} dark />;
          return (
            <div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #f59e0b" : "2px solid transparent", background: active ? "#f59e0b11" : "transparent", transition: "all .2s ease", animation: active ? "bounce 1s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct"} extended={useExt} dark shake={hlVal === "wrong"} />
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
            <div key={wi} style={{ width: 32, height: 38, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#312e81,#3730a3)" : got ? "linear-gradient(135deg,#4ade80,#16a34a)" : "#1a1128", border: !isSlot ? "2px solid #4338ca" : "2px solid #2a1f3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#a5b4fc" : got ? "white" : "#5a5070", transition: "all .2s ease", animation: got ? "popIn .2s ease" : "none" }}>
              {!isSlot ? ch : (got ? state.guessed[si] : "·")}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
          <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "ARCADE_PICK", note })} disabled={state.arcadeOver || state.arcadeWordDone} gold />
        ))}
      </div>
      <div style={{ color: "#5a5070", fontSize: 11, marginTop: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <span>💡 Press A–G on keyboard!</span>
        <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
      </div>
      {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
    </div>
  );
}
