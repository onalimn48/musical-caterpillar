import { SONGS } from "../../data/songs.js";
import LevelBadgeDark from "../LevelBadgeDark.jsx";
import NoteBtn from "../NoteButton.jsx";
import Staff from "../Staff.jsx";
import StaffHint from "../StaffHint.jsx";

export default function SongScreen({
  state,
  dispatch,
  ff,
  css,
  actions,
  derived,
}) {
  const { noteRefs, playingSong, showStaffHint, songScrollRef } = derived;
  const { playSongMelody, setPlayingSong, setShowStaffHint } = actions;
  const song = SONGS[state.songIndex];
  const notes = state.songNotes || [];
  const progress = notes.length > 0 ? Math.round((state.songCorrect / notes.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0f0a1a,#1a1128,#12091e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 540, marginBottom: 8 }}>
        <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
        <LevelBadgeDark stats={state.stats} />
        <div style={{ color: song.color, fontSize: 14, fontWeight: 700 }}>🎵 {song.title}</div>
        <div style={{ color: "#6b7280", fontSize: 11 }}>{song.composer}</div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
        {SONGS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => dispatch({ type: "SONG_SELECT", index: i })}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: ff,
              border: `2px solid ${i === state.songIndex ? s.color : s.color + "44"}`,
              background: i === state.songIndex ? s.color + "22" : "transparent",
              color: s.color,
              cursor: "pointer",
            }}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 400, marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ color: "#9ca3af", fontSize: 11 }}>Note {Math.min(state.songNoteIndex + 1, notes.length)}/{notes.length}</span>
          <span style={{ color: song.color, fontSize: 11, fontWeight: 600 }}>{progress}%</span>
        </div>
        <div style={{ width: "100%", height: 6, borderRadius: 3, background: "#2a1f3a", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, background: song.color, width: `${progress}%`, transition: "width .2s ease" }} />
        </div>
      </div>

      <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

      <div ref={songScrollRef} className="songScroll" style={{ display: "flex", justifyContent: "flex-start", flexWrap: "nowrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 700, width: "100%", overflowX: "auto" }}>
        {notes.map((note, i) => {
          const isCurrent = i === state.songNoteIndex && !state.songDone;
          const hlVal = state.highlights[i] || null;
          const isPast = i < state.songNoteIndex;
          return (
            <div
              key={i}
              ref={(el) => {
                noteRefs.current[i] = el;
              }}
              style={{
                borderRadius: 12,
                flexShrink: 0,
                border: isCurrent ? `2px solid ${song.color}` : "2px solid transparent",
                background: isCurrent ? song.color + "11" : "transparent",
                opacity: isPast ? 0.5 : 1,
                transition: "all .2s ease",
                animation: isCurrent ? "bounce 1s ease-in-out infinite" : "none",
              }}
            >
              <Staff
                note={note}
                clef={state.clef}
                highlight={hlVal || (isPast ? "correct" : null)}
                showLabel={isPast || hlVal === "correct" || hlVal === "reveal"}
                extended={false}
                dark
                shake={hlVal === "wrong"}
                songMode
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 500 }}>
        {notes.map((_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: i < state.songNoteIndex ? "#4ade80" : i === state.songNoteIndex ? song.color : "#3a3050",
              transition: "all .15s ease",
            }}
          />
        ))}
      </div>

      {!state.songDone ? (
        <>
          <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
            {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
              <NoteBtn key={n} note={n} onPick={(note) => dispatch({ type: "SONG_PICK", note })} disabled={state.songDone} gold />
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
          <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
          <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Song Complete!</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>{state.songCorrect}/{notes.length} notes</div>
          <button
            onClick={() => playSongMelody(notes, state.clef, () => setPlayingSong(true), () => setPlayingSong(false), song.rhythm)}
            disabled={playingSong}
            style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: playingSong ? "#d1d5db" : "linear-gradient(135deg,#f59e0b,#f97316)", color: "white", fontSize: 15, fontWeight: 700, fontFamily: ff, cursor: playingSong ? "default" : "pointer", marginBottom: 12, transition: "all .2s" }}
          >
            {playingSong ? "🎵 Playing..." : "🎵 Listen to Melody"}
          </button>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => dispatch({ type: "SONG_SELECT", index: state.songIndex })} style={{ padding: "10px 22px", borderRadius: 12, border: `2px solid ${song.color}`, background: "transparent", color: song.color, fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Replay</button>
            {state.songIndex + 1 < SONGS.length && (
              <button onClick={() => dispatch({ type: "SONG_SELECT", index: state.songIndex + 1 })} style={{ padding: "10px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${song.color},${song.color}cc)`, color: "white", fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Next Song →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
