import LevelBadgeDark from "../LevelBadgeDark.jsx";
import NoteBtn from "../NoteButton.jsx";
import Staff from "../Staff.jsx";
import StaffHint from "../StaffHint.jsx";

export default function ScrambleScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { showStaffHint } = derived;
  const { setShowStaffHint } = actions;
  const word = state.scrambleWord;
  const scrambledNotes = state.scrambleNotes || [];
  const wordLetters = word ? word.w.split("") : [];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1a0a2e,#2d1b69,#1a0a2e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 540, marginBottom: 8 }}>
        <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
        <LevelBadgeDark stats={state.stats} />
        <div style={{ color: "#8b5cf6", fontSize: 16, fontWeight: 700 }}>🔀 Scramble Mode</div>
        <div style={{ color: "#6b7280", fontSize: 11 }}>{state.scrambleScore}/{state.scrambleTotal} correct</div>
      </div>

      <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 12, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", marginBottom: 6 }}>📖 These notes are scrambled — read them and figure out the word!</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", background: "#1a1128", borderRadius: 16, padding: "8px 12px", border: "1px solid #2a1f3a" }}>
          {scrambledNotes.map((note, i) => (
            <div key={i} style={{ borderRadius: 10, border: "2px solid #8b5cf644", background: "#1a112844", padding: "2px 0" }}>
              <Staff note={note} clef={state.clef} highlight={null} showLabel={false} extended={false} dark />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", marginBottom: 6 }}>🎯 Spell the word in the correct order:</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
          {wordLetters.map((ch, i) => {
            const isCurrent = i === state.scrambleSlotIndex && !state.scrambleDone;
            const hl = state.scrambleHL[i] || null;
            const guessed = state.scrambleGuessed[i];
            return (
              <div key={i} style={{ width: 48, height: 56, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: isCurrent ? "3px solid #8b5cf6" : hl === "correct" ? "3px solid #4ade80" : hl === "reveal" ? "3px solid #fbbf24" : hl === "wrong" ? "3px solid #f87171" : "3px solid #3a3050", background: isCurrent ? "#8b5cf611" : hl === "correct" ? "#4ade8011" : hl === "reveal" ? "#fbbf2411" : "#1a1128", transition: "all .2s ease", animation: isCurrent ? "bounce 1s ease-in-out infinite" : hl === "wrong" ? "shakeNote 0.35s ease-in-out" : "none" }}>
                <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Fredoka',sans-serif", color: guessed ? (hl === "correct" ? "#4ade80" : hl === "reveal" ? "#fbbf24" : "#e2d5f5") : "#3a3050" }}>
                  {guessed || "?"}
                </span>
                <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 500 }}>{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!state.scrambleDone ? (
        <>
          <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
            {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
              <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "SCRAMBLE_PICK", note })} disabled={state.scrambleDone} gold />
            ))}
          </div>
          <div style={{ color: "#5a5070", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <span>💡 Press A–G on keyboard!</span>
            <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
          </div>
          {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>{state.scrambleScore > 0 ? "🎉" : "📝"}</div>
          <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>"{word.w}"</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>{word.h}</div>
          <button onClick={() => dispatch({ type: "SCRAMBLE_NEXT" })} style={{ padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer", transition: "all .2s" }}>
            Next Word →
          </button>
        </div>
      )}
    </div>
  );
}
