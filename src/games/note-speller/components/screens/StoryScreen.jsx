import { STORY_CHAPTERS } from "../../data/story.js";
import Confetti from "../Confetti.jsx";
import LevelBadgeDark from "../LevelBadgeDark.jsx";
import NoteBtn from "../NoteButton.jsx";
import PreFilled from "../PreFilled.jsx";
import Staff from "../Staff.jsx";
import StaffHint from "../StaffHint.jsx";

export default function StoryScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { showStaffHint } = derived;
  const { setShowStaffHint } = actions;
  const chapter = STORY_CHAPTERS[state.storyChapter];
  const letters = state.word ? state.word.w.split("") : [];
  const slotSet = new Set(state.slots);
  const slotMap = {};
  state.slots.forEach((wi, si) => {
    slotMap[wi] = si;
  });

  if (state.storyComplete) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a2a1a,#1a4a2a,#0a3a1a)", fontFamily: ff, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <Confetti show={true} />
        <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
        <h1 style={{ color: "#4ade80", fontSize: 32, margin: "0 0 8px", textAlign: "center" }}>Quest Complete!</h1>
        <p style={{ color: "#86efac", fontSize: 16, textAlign: "center", maxWidth: 360, lineHeight: 1.6, marginBottom: 8 }}>
          You've restored music to the realm! The Whispering Woods sing once more, the dragon hums along, and the enchantress dances with joy.
        </p>
        <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Chapters completed: {STORY_CHAPTERS.length}/{STORY_CHAPTERS.length}</p>
        {STORY_CHAPTERS[STORY_CHAPTERS.length - 1].scene(true)}
        <button onClick={() => dispatch({ type: "MENU" })} style={{ marginTop: 20, padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#4ade80,#16a34a)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer" }}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${chapter.bg},#0a0a1a)`, fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 500, marginBottom: 8 }}>
        <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Quit</button>
        <LevelBadgeDark stats={state.stats} />
        <div style={{ color: "#c084fc", fontSize: 12, fontWeight: 600 }}>Chapter {chapter.id}/{STORY_CHAPTERS.length}</div>
        <div style={{ width: 50 }} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {STORY_CHAPTERS.map((_, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < state.storyChapter ? "#4ade80" : i === state.storyChapter ? "#c084fc" : "#3a3050", transition: "all .3s ease" }} />
        ))}
      </div>

      <h2 style={{ color: "#e2e8f0", fontSize: 20, margin: "0 0 8px", textAlign: "center" }}>{chapter.title}</h2>

      <div style={{ marginBottom: 12, width: "100%", maxWidth: 360 }}>
        {chapter.scene(state.storyWordDone)}
      </div>

      <div style={{ background: "#1a112888", borderRadius: 12, padding: "10px 18px", marginBottom: 10, border: "1px solid #2a1f3a", maxWidth: 420, textAlign: "center" }}>
        <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{chapter.narrative}</p>
      </div>

      <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#fbbf24", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

      <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi);
          const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.storyWordDone;
          const hlVal = isSlot ? state.highlights[si] || null : null;
          if (!isSlot) return <PreFilled key={wi} letter={ch} dark />;
          return (
            <div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #c084fc" : "2px solid transparent", background: active ? "#c084fc11" : "transparent", transition: "all .2s ease", animation: active ? "bounce 1s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={false} dark shake={hlVal === "wrong"} />
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

      {!state.storyWordDone ? (
        <>
          <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
            {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
              <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "STORY_PICK", note })} disabled={state.storyWordDone} gold />
            ))}
          </div>
          <div style={{ color: "#5a5070", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
            <span>💡 Press A–G on keyboard!</span>
            <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
          </div>
          {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
        </>
      ) : (
        <button onClick={() => dispatch({ type: "STORY_NEXT" })} style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#c084fc,#7c3aed)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer", animation: "popIn .4s ease", marginTop: 8 }}>
          {state.storyChapter + 1 >= STORY_CHAPTERS.length ? "🏆 Finish Quest!" : "Continue →"}
        </button>
      )}
    </div>
  );
}
