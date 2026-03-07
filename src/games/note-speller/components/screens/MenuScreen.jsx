import { STAGES } from "../../data/stages.js";
import { CLEFS, getClefMeta } from "../../data/clefs.js";
import GameLayout from "../../../shared/layout/GameLayout.jsx";
import LevelBadge from "../LevelBadge.jsx";
import StatsPanel from "../StatsPanel.jsx";
import { LBOverlay, StreakLBOverlay } from "../overlays.jsx";

export default function MenuScreen({
  state,
  dispatch,
  bgGradient,
  ff,
  css,
  actions,
  derived,
}) {
  const { leaderboard, streakLB, midiStatus, fullArcadeUnlocked, timedSpecialModes, currentTimedClefProgress } = derived;
  const { addStreakLeaderboardScore, getStreakLeaderboard, saveStreakLeaderboard, setClef, setStreakLB } = actions;
  const startWithClef = (type, clef, extra = {}) => {
    setClef(clef);
    dispatch({ type, clef, ...extra });
  };
  return (
    <GameLayout
      background={bgGradient}
      fontFamily={ff}
      padding="24px 16px env(safe-area-inset-bottom, 24px)"
      justify="flex-start"
      style={{ overflowY: "auto" }}
      styleContent={css}
    >
      {state.showLeaderboard && <LBOverlay leaderboard={leaderboard} onClose={() => dispatch({ type: "HIDE_LB" })} fontFamily={ff} />}
      {state.showStreakLB && <StreakLBOverlay state={state} dispatch={dispatch} streakLB={streakLB} addStreakScore={addStreakLeaderboardScore} saveStreakLB={saveStreakLeaderboard} getStreakLB={getStreakLeaderboard} setStreakLB={setStreakLB} fontFamily={ff} />}
      {state.showStats && <StatsPanel stats={state.stats} onClose={() => dispatch({ type: "HIDE_STATS" })} fontFamily={ff} />}

      <LevelBadge stats={state.stats} style={{ marginBottom: 12 }} />

      <div style={{ fontSize: 56, marginBottom: 8 }}>
        <svg width="160" height="140" viewBox="0 0 200 170">
          <circle cx="52" cy="128" r="14" fill="#4ade80" stroke="#fff" strokeWidth="2" />
          <text x="52" y="132" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="49" y1="140" x2="47" y2="148" stroke="#4ade8088" strokeWidth="1.5" />
          <line x1="55" y1="140" x2="57" y2="148" stroke="#4ade8088" strokeWidth="1.5" />
          <circle cx="72" cy="120" r="14" fill="#86efac" stroke="#fff" strokeWidth="2" />
          <text x="72" y="124" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♫</text>
          <line x1="69" y1="132" x2="67" y2="140" stroke="#86efac88" strokeWidth="1.5" />
          <line x1="75" y1="132" x2="77" y2="140" stroke="#86efac88" strokeWidth="1.5" />
          <circle cx="90" cy="110" r="14" fill="#facc15" stroke="#fff" strokeWidth="2" />
          <text x="90" y="114" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="87" y1="122" x2="85" y2="130" stroke="#facc1588" strokeWidth="1.5" />
          <line x1="93" y1="122" x2="95" y2="130" stroke="#facc1588" strokeWidth="1.5" />
          <circle cx="107" cy="98" r="14" fill="#fde047" stroke="#fff" strokeWidth="2" />
          <text x="107" y="102" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♫</text>
          <line x1="104" y1="110" x2="102" y2="118" stroke="#fde04788" strokeWidth="1.5" />
          <line x1="110" y1="110" x2="112" y2="118" stroke="#fde04788" strokeWidth="1.5" />
          <circle cx="122" cy="88" r="14" fill="#fb923c" stroke="#fff" strokeWidth="2" />
          <text x="122" y="92" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="119" y1="100" x2="117" y2="108" stroke="#fb923c88" strokeWidth="1.5" />
          <line x1="125" y1="100" x2="127" y2="108" stroke="#fb923c88" strokeWidth="1.5" />
          <circle cx="140" cy="70" r="22" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />
          <rect x="122" y="28" width="36" height="24" rx="3" fill="#1a1a2e" />
          <rect x="116" y="49" width="48" height="7" rx="3" fill="#1a1a2e" />
          <rect x="126" y="34" width="28" height="4" rx="2" fill="#4ade80" opacity="0.4" />
          <circle cx="132" cy="65" r="6" fill="white" />
          <circle cx="148" cy="65" r="6" fill="white" />
          <circle cx="133.5" cy="66" r="3.2" fill="#1a1a2e" />
          <circle cx="149.5" cy="66" r="3.2" fill="#1a1a2e" />
          <circle cx="134.5" cy="64" r="1.2" fill="white" />
          <circle cx="150.5" cy="64" r="1.2" fill="white" />
          <circle cx="124" cy="74" r="5" fill="#f9a8d4" opacity="0.45" />
          <circle cx="156" cy="74" r="5" fill="#f9a8d4" opacity="0.45" />
          <path d="M130 78 Q140 88 150 78" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <line x1="130" y1="49" x2="118" y2="26" stroke="#16a34a" strokeWidth="2" />
          <circle cx="118" cy="26" r="4" fill="#facc15" />
          <line x1="150" y1="49" x2="162" y2="26" stroke="#16a34a" strokeWidth="2" />
          <circle cx="162" cy="26" r="4" fill="#facc15" />
        </svg>
      </div>
      <h1 style={{ fontSize: "clamp(28px,6vw,46px)", color: "#5b21b6", margin: "0 0 6px", textShadow: "2px 2px 0 #ddd6fe", textAlign: "center" }}>Note Speller</h1>
      <p style={{ color: "#7c3aed", fontSize: 15, marginBottom: 8, textAlign: "center", maxWidth: 380, lineHeight: 1.5 }}>
        Read the notes to spell words! 10 in a row = butterfly!
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {STAGES.map((st) => (
          <div key={st.id} style={{ background: "white", borderRadius: 8, padding: "4px 10px", border: `2px solid ${st.color}33`, fontSize: 11, color: st.color, fontWeight: 600 }}>Stage {st.id}: {st.name}</div>
        ))}
      </div>

      {midiStatus === "connected" && (
        <div style={{ background: "#ecfdf5", border: "1px solid #86efac", borderRadius: 10, padding: "4px 12px", marginBottom: 10, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>🎹 MIDI keyboard connected</div>
      )}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
        {CLEFS.map((clef) => {
          const meta = getClefMeta(clef);
          return (
          <button
            key={clef}
            onClick={() => startWithClef("START", clef)}
            style={{ padding: "18px 30px", borderRadius: 18, border: "3px solid #5b21b6", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", cursor: "pointer", fontSize: 16, fontWeight: 600, fontFamily: ff, color: "#5b21b6", boxShadow: "0 4px 16px rgba(91,33,182,.1)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 38, display: "block", marginBottom: 2 }}>{meta.symbol}</span>{meta.title}
          </button>
          );
        })}
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ width: "100%", maxWidth: 640, background: "linear-gradient(180deg,#f8fbff,#eef4ff)", border: "2px solid #bfdbfe", borderRadius: 24, padding: "18px 16px", marginBottom: 20, boxShadow: "0 10px 30px rgba(37,99,235,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: fullArcadeUnlocked ? "#2563eb" : "#9ca3af" }}>⌛ Timed Mode</span>
        {!fullArcadeUnlocked && <span style={{ fontSize: 11, color: "#d1d5db", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>🔒 Unlock Stage 3</span>}
      </div>
      <p style={{ color: "#64748b", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 420, marginInline: "auto", lineHeight: 1.5 }}>
        Climb the timed ladder inside one mode: Level 1 gives you 10 seconds per word, Level 2 gives 7, and Level 3 gives 5. Clear enough Level 3 words to unlock Diamond and Legendary.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
        <span style={{ background: "#ecfdf5", color: "#166534", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 1 · 10s</span>
        <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 2 · 7s</span>
        <span style={{ background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 3 · 5s</span>
      </div>
      <div style={{ color: "#475569", fontSize: 12, fontWeight: 600, textAlign: "center", marginBottom: 14 }}>
        {getClefMeta(state.clef).modeLabel} Level 3 clears: {currentTimedClefProgress.level3Clears}
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 18, opacity: fullArcadeUnlocked ? 1 : 0.4 }}>
        {CLEFS.map((clef) => (
          <button
            key={`timed-${clef}`}
            onClick={() => { if (fullArcadeUnlocked) startWithClef("TIMED_START", clef, { mode: "normal" }); }}
            disabled={!fullArcadeUnlocked}
            style={{ padding: "12px 22px", borderRadius: 14, border: "3px solid #2563eb", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", cursor: fullArcadeUnlocked ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600, fontFamily: ff, color: "#1d4ed8", boxShadow: fullArcadeUnlocked ? "0 4px 16px rgba(37,99,235,.15)" : "none", transition: "all .2s ease" }}
            onMouseEnter={(e) => { if (fullArcadeUnlocked) e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 24, display: "block", marginBottom: 2 }}>{getClefMeta(clef).symbol}</span>Timed {getClefMeta(clef).modeLabel}
          </button>
        ))}
      </div>
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>📖 Story Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>A fantasy adventure! Spell words to advance through the story.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {CLEFS.map((clef) => (
          <button
            key={`story-${clef}`}
            onClick={() => startWithClef("STORY_START", clef)}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #dc2626", background: "linear-gradient(135deg,#fef2f2,#fecaca)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#991b1b", boxShadow: "0 4px 16px rgba(220,38,38,.1)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>📖</span>Story ({getClefMeta(clef).modeLabel})
          </button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>🎵 Song Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>Play along with famous melodies! See notes on staff and name them.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {CLEFS.map((clef) => (
          <button
            key={`song-${clef}`}
            onClick={() => startWithClef("SONG_START", clef)}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #f59e0b", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#92400e", boxShadow: "0 4px 16px rgba(245,158,11,.1)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>🎵</span>Songs ({getClefMeta(clef).modeLabel})
          </button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#8b5cf6" }}>🔀 Scramble Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>Notes are scrambled! Read them all, figure out the word, then spell it in order.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {CLEFS.map((clef) => (
          <button
            key={`scramble-${clef}`}
            onClick={() => startWithClef("SCRAMBLE_START", clef)}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #8b5cf6", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#5b21b6", boxShadow: "0 4px 16px rgba(139,92,246,.1)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>🔀</span>Scramble ({getClefMeta(clef).modeLabel})
          </button>
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>🎯 Practice Weak Notes</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>
        {(state.stats.totalGuesses || 0) < 10 ? "Play some rounds first so we can find your weak spots!" : "Auto-targets the notes you struggle with most!"}
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {CLEFS.map((clef) => (
          <button
            key={`weak-${clef}`}
            onClick={() => startWithClef("WEAK_START", clef)}
            disabled={(state.stats.totalGuesses || 0) < 10}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #dc2626", background: (state.stats.totalGuesses || 0) >= 10 ? "linear-gradient(135deg,#fef2f2,#fecaca)" : "#f3f4f6", cursor: (state.stats.totalGuesses || 0) >= 10 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, fontFamily: ff, color: (state.stats.totalGuesses || 0) >= 10 ? "#991b1b" : "#9ca3af", boxShadow: "0 4px 16px rgba(220,38,38,.1)", transition: "all .2s ease", opacity: (state.stats.totalGuesses || 0) >= 10 ? 1 : 0.5 }}
            onMouseEnter={(e) => { if ((state.stats.totalGuesses || 0) >= 10) e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>🎯</span>Weak ({getClefMeta(clef).modeLabel})
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>🎮 Practice Arcade</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 320 }}>60 seconds, Stage 1 words only. No leaderboard!</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {CLEFS.map((clef) => (
          <button
            key={`practice-${clef}`}
            onClick={() => startWithClef("ARCADE_START", clef, { pool: STAGES[0].words, practice: true })}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #22c55e", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#166534", boxShadow: "0 4px 16px rgba(34,197,94,.12)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{getClefMeta(clef).symbol}</span>Practice {getClefMeta(clef).modeLabel}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: fullArcadeUnlocked ? "#f59e0b" : "#9ca3af" }}>⏱️ Full Arcade</span>
        {!fullArcadeUnlocked && <span style={{ fontSize: 11, color: "#d1d5db", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>🔒 Unlock Stage 3</span>}
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 14, textAlign: "center", maxWidth: 320 }}>60 seconds, all words, leaderboard enabled!</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20, opacity: fullArcadeUnlocked ? 1 : 0.4 }}>
        {CLEFS.map((clef) => (
          <button
            key={`arcade-${clef}`}
            onClick={() => { if (fullArcadeUnlocked) startWithClef("ARCADE_START", clef); }}
            disabled={!fullArcadeUnlocked}
            style={{ padding: "12px 22px", borderRadius: 14, border: "3px solid #f59e0b", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", cursor: fullArcadeUnlocked ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600, fontFamily: ff, color: "#92400e", boxShadow: fullArcadeUnlocked ? "0 4px 16px rgba(245,158,11,.15)" : "none", transition: "all .2s ease", animation: fullArcadeUnlocked ? "glow 2s ease-in-out infinite" : "none" }}
            onMouseEnter={(e) => { if (fullArcadeUnlocked) e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 26, display: "block", marginBottom: 2 }}>{getClefMeta(clef).symbol}</span>Arcade {getClefMeta(clef).modeLabel}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {leaderboard.length > 0 && <button onClick={() => dispatch({ type: "SHOW_LB" })} style={{ background: "none", border: "2px solid #f59e0b44", borderRadius: 10, padding: "6px 18px", color: "#f59e0b", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>🏆 Arcade LB</button>}
        <button onClick={() => dispatch({ type: "SHOW_STATS" })} style={{ background: "none", border: "2px solid #7c3aed44", borderRadius: 10, padding: "6px 18px", color: "#7c3aed", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📊 Stats</button>
      </div>
    </GameLayout>
  );
}
