import { analyzeWeakNotes } from "../../state/gameLogic.js";
import LevelBadge from "../LevelBadge.jsx";
import NoteBtn from "../NoteButton.jsx";
import PreFilled from "../PreFilled.jsx";
import Staff from "../Staff.jsx";
import StaffHint from "../StaffHint.jsx";

export default function WeakNotesScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { showStaffHint } = derived;
  const { setShowStaffHint } = actions;
  const wLetters = state.word ? state.word.w.split("") : [];
  const wSlotSet = new Set(state.slots);
  const wSlotMap = {};
  state.slots.forEach((wi, si) => {
    wSlotMap[wi] = si;
  });
  const analysis = analyzeWeakNotes(state.stats);
  const pct = state.weakTotal > 0 ? Math.round((state.weakScore / state.weakTotal) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fef2f2,#fce7f3,#ede9fe)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 500, marginBottom: 10 }}>
        <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
        <LevelBadge stats={state.stats} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>🎯</span>
          <span style={{ color: "#dc2626", fontSize: 16, fontWeight: 700 }}>Weak Notes Practice</span>
        </div>
        <div style={{ background: "#dc262622", borderRadius: 10, padding: "4px 10px" }}>
          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>{pct}%</span>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: 16, padding: "12px 16px", width: "100%", maxWidth: 500, marginBottom: 12, border: "2px solid #fecaca" }}>
        <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 600, marginBottom: 8 }}>Your Note Accuracy:</div>
        <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
          {analysis.map((n) => {
            const isWeak = state.weakNotes?.includes(n.note);
            const accPct = n.accuracy >= 0 ? Math.round(n.accuracy * 100) : null;
            const color = accPct === null ? "#d1d5db" : accPct >= 80 ? "#4ade80" : accPct >= 60 ? "#facc15" : "#f87171";
            return (
              <div key={n.note} style={{ textAlign: "center", padding: "4px 8px", borderRadius: 8, background: isWeak ? "#fef2f2" : "#f9fafb", border: isWeak ? "2px solid #f87171" : "1px solid #e5e7eb", minWidth: 40 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: isWeak ? "#dc2626" : "#374151" }}>{n.note}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color }}>{accPct !== null ? `${accPct}%` : "new"}</div>
                <div style={{ fontSize: 9, color: "#9ca3af" }}>{n.attempts > 0 ? `${n.attempts}×` : ""}</div>
              </div>
            );
          })}
        </div>
        {state.weakNotes && (
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6, textAlign: "center", fontWeight: 500 }}>
            Focusing on: {state.weakNotes.map((n) => <span key={n} style={{ fontWeight: 700, margin: "0 2px" }}>{n}</span>)}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 13, color: "#6b7280" }}>
        <span>✅ {state.weakScore} correct</span>
        <span>📝 {state.weakTotal} total</span>
        <span>🎯 {pct}% accuracy</span>
      </div>

      {state.word && (
        <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "white", borderRadius: 16, padding: "6px 8px", boxShadow: "0 2px 14px rgba(0,0,0,.06)", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto" }}>
          {wLetters.map((ch, wi) => {
            const isSlot = wSlotSet.has(wi);
            const si = wSlotMap[wi];
            const active = isSlot && si === state.slotIndex && !state.isDone;
            const hlVal = isSlot ? state.highlights[si] || null : null;
            if (!isSlot) return <PreFilled key={wi} letter={ch} />;
            return (
              <div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #dc2626" : "2px solid transparent", background: active ? "#fef2f2" : "transparent", transition: "all .25s ease", animation: active ? "bounce 1.2s ease-in-out infinite" : "none" }}>
                <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={false} shake={hlVal === "wrong"} />
              </div>
            );
          })}
        </div>
      )}

      <div style={{ color: "#991b1b", fontSize: 14, fontWeight: 500, marginBottom: 8, textAlign: "center", minHeight: 22 }}>{state.message}</div>

      {state.word && (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
          {wLetters.map((ch, wi) => {
            const isSlot = wSlotSet.has(wi);
            const si = wSlotMap[wi];
            const got = state.guessed[si];
            const hl = state.highlights[si];
            const isWeak = state.weakNotes?.includes(ch);
            let bg = !isSlot ? (isWeak ? "#fecaca" : "#ede9fe") : got ? "#4ade80" : "white";
            if (hl === "wrong") bg = "#f87171";
            if (hl === "reveal") bg = "#f59e0b";
            const isCurrent = isSlot && si === state.slotIndex && !state.isDone;
            return (
              <div key={wi} style={{ width: 40, height: 46, borderRadius: 10, background: bg, border: isCurrent ? "3px solid #dc2626" : isWeak && !isSlot ? "2px solid #f87171" : "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: ff, color: !isSlot ? (isWeak ? "#dc2626" : "#5b21b6") : got ? "white" : "#9ca3af", transition: "all .2s ease", animation: hl === "wrong" ? "shakeNote .4s ease" : got ? "popIn .2s ease" : isCurrent ? "pulse 1.5s ease-in-out infinite" : "none" }}>
                {!isSlot ? ch : (got ? state.guessed[si] : "·")}
              </div>
            );
          })}
        </div>
      )}

      {!state.isDone ? (
        <div>
          <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
            {["A", "B", "C", "D", "E", "F", "G"].map((n) => {
              const isWeak = state.weakNotes?.includes(n);
              return <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "WEAK_PICK", note })} disabled={state.isDone} gold={isWeak} />;
            })}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 10, textAlign: "center", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <span>Press A–G on keyboard! Weak notes highlighted gold.</span>
            <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #dc262644", borderRadius: 8, padding: "3px 10px", color: "#dc2626", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
          </div>
          {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
        </div>
      ) : (
        <div style={{ textAlign: "center", animation: "popIn .3s ease" }}>
          <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Next word coming...</div>
        </div>
      )}
    </div>
  );
}
