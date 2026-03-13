import { useEffect, useRef, useState } from "react";
import { STAGES } from "../../data/stages.js";
import { CLEFS, getClefMeta } from "../../data/clefs.js";
import GameLayout from "../../../shared/layout/GameLayout.jsx";
import MusicalCaterpillarMeter from "../../../shared/components/MusicalCaterpillarMeter.jsx";
import LevelBadge from "../LevelBadge.jsx";
import StatsPanel from "../StatsPanel.jsx";
import { LBOverlay, StreakLBOverlay } from "../overlays.jsx";

function playLaughSound() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const start = ctx.currentTime + 0.02;
  const notes = [620, 760, 690];

  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, start + index * 0.08);
    gain.gain.setValueAtTime(0.0001, start + index * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.08, start + index * 0.08 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.08 + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start + index * 0.08);
    osc.stop(start + index * 0.08 + 0.11);
  });

  window.setTimeout(() => {
    ctx.close().catch(() => {});
  }, 500);
}

export default function MenuScreen({
  state,
  dispatch,
  bgGradient,
  ff,
  css,
  actions,
  derived,
}) {
  const [laughing, setLaughing] = useState(false);
  const [laughBurst, setLaughBurst] = useState(0);
  const laughTimerRef = useRef(null);
  const { leaderboard, streakLB, midiStatus, fullArcadeUnlocked, timedSpecialModes, currentTimedClefProgress, darkMode } = derived;
  const { addStreakLeaderboardScore, getStreakLeaderboard, saveStreakLeaderboard, setClef, setStreakLB } = actions;
  const colors = darkMode ? {
    title: "#e9d5ff",
    subtitle: "#c4b5fd",
    divider: "rgba(255,255,255,.12)",
    cardShadow: "0 10px 30px rgba(0,0,0,.24)",
    timedBg: "linear-gradient(180deg,rgba(30,41,59,.96),rgba(17,24,39,.96))",
    timedBorder: "2px solid rgba(96,165,250,.35)",
    cardBg: "linear-gradient(180deg,rgba(30,41,59,.96),rgba(17,24,39,.96))",
    cardText: "#cbd5e1",
    stageBg: "rgba(15,23,42,.72)",
    stageBorder: "rgba(255,255,255,.1)",
    midiBg: "rgba(20,83,45,.28)",
    midiBorder: "1px solid rgba(74,222,128,.35)",
    midiText: "#86efac",
  } : {
    title: "#5b21b6",
    subtitle: "#7c3aed",
    divider: "#e5e7eb",
    cardShadow: "0 10px 30px rgba(15,23,42,.06)",
    timedBg: "linear-gradient(180deg,#f8fbff,#eef4ff)",
    timedBorder: "2px solid #bfdbfe",
    cardBg: null,
    cardText: "#9ca3af",
    stageBg: "white",
    stageBorder: null,
    midiBg: "#ecfdf5",
    midiBorder: "1px solid #86efac",
    midiText: "#16a34a",
  };
  const startWithClef = (type, clef, extra = {}) => {
    setClef(clef);
    dispatch({ type, clef, ...extra });
  };
  const sectionCardStyle = {
    width: "100%",
    maxWidth: 640,
    borderRadius: 24,
    padding: "18px 16px",
    marginBottom: 20,
    boxShadow: colors.cardShadow,
  };

  useEffect(() => () => {
    if (laughTimerRef.current) window.clearTimeout(laughTimerRef.current);
  }, []);

  const handleCaterpillarLaugh = () => {
    playLaughSound();
    setLaughing(true);
    setLaughBurst((value) => value + 1);
    if (laughTimerRef.current) window.clearTimeout(laughTimerRef.current);
    laughTimerRef.current = window.setTimeout(() => setLaughing(false), 700);
  };

  return (
    <GameLayout
      background={bgGradient}
      fontFamily={ff}
      padding="24px 16px calc(env(safe-area-inset-bottom, 0px) + 56px)"
      justify="flex-start"
      style={{ overflowY: "auto" }}
      styleContent={css}
    >
      {state.showLeaderboard && <LBOverlay leaderboard={leaderboard} onClose={() => dispatch({ type: "HIDE_LB" })} fontFamily={ff} />}
      {state.showStreakLB && <StreakLBOverlay state={state} dispatch={dispatch} streakLB={streakLB} addStreakScore={addStreakLeaderboardScore} saveStreakLB={saveStreakLeaderboard} getStreakLB={getStreakLeaderboard} setStreakLB={setStreakLB} fontFamily={ff} />}
      {state.showStats && <StatsPanel stats={state.stats} onClose={() => dispatch({ type: "HIDE_STATS" })} fontFamily={ff} dark={darkMode} />}

      <LevelBadge stats={state.stats} style={{ marginBottom: 12 }} />

      <button
        type="button"
        onClick={handleCaterpillarLaugh}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          marginBottom: 8,
          cursor: "pointer",
          touchAction: "manipulation",
          position: "relative",
          width: "min(320px, 82vw)",
          transform: laughing ? "scale(1.03)" : "scale(1)",
          transition: "transform .18s ease",
        }}
        aria-label="Make the caterpillar laugh"
        title="Click the caterpillar"
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            minHeight: 182,
            overflow: "visible",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", transform: laughing ? "scale(1.03)" : "scale(1)", transition: "transform .18s ease" }}>
            <MusicalCaterpillarMeter
              progress={0}
              triggerButterfly={0}
              streak={200}
              streakMilestone={{ tier: "rainbow", streak: 200 }}
              butterflyRemaining={null}
              milestoneScopeKey="note-speller-menu"
              width={320}
              height={170}
              showCounters={false}
              showTierBadge={false}
              showTierRing={false}
              showTierToast={false}
            />
          </div>
          <div
            key={laughBurst}
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "23%",
              top: laughing ? "8%" : "14%",
              fontSize: laughing ? 34 : 0,
              opacity: laughing ? 1 : 0,
              color: "#f59e0b",
              textShadow: "0 0 14px rgba(245,158,11,.35)",
              transform: laughing ? "translate(18px, -24px) rotate(-10deg)" : "translate(0, 0) scale(.6)",
              transition: "transform .55s ease-out, opacity .55s ease-out, font-size .2s ease-out, top .2s ease-out",
              pointerEvents: "none",
            }}
          >
            ♪
          </div>
        </div>
      </button>
      <h1 style={{ fontSize: "clamp(28px,6vw,46px)", color: colors.title, margin: "0 0 6px", textShadow: darkMode ? "none" : "2px 2px 0 #ddd6fe", textAlign: "center" }}>Note Speller</h1>
      <p style={{ color: colors.subtitle, fontSize: 15, marginBottom: 8, textAlign: "center", maxWidth: 380, lineHeight: 1.5 }}>
        Read the notes to spell words! 10 in a row = butterfly!
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {STAGES.map((st) => (
          <div key={st.id} style={{ background: colors.stageBg, borderRadius: 8, padding: "4px 10px", border: colors.stageBorder || `2px solid ${st.color}33`, fontSize: 11, color: st.color, fontWeight: 600 }}>Stage {st.id}: {st.name}</div>
        ))}
      </div>

      {midiStatus === "connected" && (
        <div style={{ background: colors.midiBg, border: colors.midiBorder, borderRadius: 10, padding: "4px 12px", marginBottom: 10, fontSize: 12, color: colors.midiText, fontWeight: 600 }}>🎹 MIDI keyboard connected</div>
      )}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
        {CLEFS.map((clef) => {
          const meta = getClefMeta(clef);
          return (
          <button
            key={clef}
            onClick={() => startWithClef("START", clef)}
            style={{ padding: "18px 30px", borderRadius: 18, border: darkMode ? "3px solid rgba(196,181,253,.4)" : "3px solid #5b21b6", background: darkMode ? "linear-gradient(135deg,#1f1a3a,#312e81)" : "linear-gradient(135deg,#f5f3ff,#ede9fe)", cursor: "pointer", fontSize: 16, fontWeight: 600, fontFamily: ff, color: darkMode ? "#e9d5ff" : "#5b21b6", boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,.22)" : "0 4px 16px rgba(91,33,182,.1)", transition: "all .2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}
          >
            <span style={{ fontSize: 38, display: "block", marginBottom: 2 }}>{meta.symbol}</span>{meta.title}
          </button>
          );
        })}
      </div>

      <div style={{ width: "100%", maxWidth: 380, height: 1, background: colors.divider, marginBottom: 16 }} />
      <div style={{ width: "100%", maxWidth: 640, background: colors.timedBg, border: colors.timedBorder, borderRadius: 24, padding: "18px 16px", marginBottom: 20, boxShadow: darkMode ? colors.cardShadow : "0 10px 30px rgba(37,99,235,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: fullArcadeUnlocked ? "#2563eb" : "#9ca3af" }}>⌛ Timed Mode</span>
        {!fullArcadeUnlocked && <span style={{ fontSize: 11, color: "#d1d5db", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>🔒 Unlock Stage 3</span>}
      </div>
      <p style={{ color: darkMode ? "#cbd5e1" : "#64748b", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 420, marginInline: "auto", lineHeight: 1.5 }}>
        Climb the timed ladder inside one mode: Level 1 gives you 10 seconds per word, Level 2 gives 7, and Level 3 gives 5. Clear enough Level 3 words to unlock Diamond and Legendary.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
        <span style={{ background: "#ecfdf5", color: "#166534", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 1 · 10s</span>
        <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 2 · 7s</span>
        <span style={{ background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>Level 3 · 5s</span>
      </div>
      <div style={{ color: darkMode ? "#e2e8f0" : "#475569", fontSize: 12, fontWeight: 600, textAlign: "center", marginBottom: 14 }}>
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

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#fff5f5,#fff1f2)", border: darkMode ? "2px solid rgba(248,113,113,.28)" : "2px solid #fecaca", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>📖 Story Mode</span>
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340, marginInline: "auto" }}>A fantasy adventure! Spell words to advance through the story.</p>
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
      </div>

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#fffaf0,#fffbeb)", border: darkMode ? "2px solid rgba(250,204,21,.22)" : "2px solid #fde68a", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>🎵 Song Mode</span>
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340, marginInline: "auto" }}>Play along with famous melodies! See notes on staff and name them.</p>
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
      </div>

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#faf5ff,#f5f3ff)", border: darkMode ? "2px solid rgba(196,181,253,.25)" : "2px solid #ddd6fe", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#8b5cf6" }}>🔀 Scramble Mode</span>
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340, marginInline: "auto" }}>Notes are scrambled! Read them all, figure out the word, then spell it in order.</p>
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
      </div>

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#fff5f5,#fef2f2)", border: darkMode ? "2px solid rgba(248,113,113,.28)" : "2px solid #fecaca", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>🎯 Practice Weak Notes</span>
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340, marginInline: "auto" }}>
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
      </div>

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#f3fff5,#f0fdf4)", border: darkMode ? "2px solid rgba(74,222,128,.24)" : "2px solid #bbf7d0", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>🎮 Practice Arcade</span>
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 320, marginInline: "auto" }}>60 seconds, Stage 1 words only. No leaderboard!</p>
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
      </div>

      <div style={{ ...sectionCardStyle, background: colors.cardBg || "linear-gradient(180deg,#fffaf0,#fffbeb)", border: darkMode ? "2px solid rgba(250,204,21,.22)" : "2px solid #fde68a", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: fullArcadeUnlocked ? "#f59e0b" : "#9ca3af" }}>⏱️ Full Arcade</span>
        {!fullArcadeUnlocked && <span style={{ fontSize: 11, color: "#d1d5db", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>🔒 Unlock Stage 3</span>}
      </div>
      <p style={{ color: colors.cardText, fontSize: 12, marginBottom: 14, textAlign: "center", maxWidth: 320, marginInline: "auto" }}>60 seconds, all words, leaderboard enabled!</p>
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
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
        {leaderboard.length > 0 && <button onClick={() => dispatch({ type: "SHOW_LB" })} style={{ background: "none", border: "2px solid #f59e0b44", borderRadius: 12, padding: "10px 18px", minHeight: 44, color: "#f59e0b", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>🏆 Arcade LB</button>}
        <button onClick={() => dispatch({ type: "SHOW_STATS" })} style={{ background: "none", border: "2px solid #7c3aed44", borderRadius: 12, padding: "10px 18px", minHeight: 44, color: "#7c3aed", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📊 Stats</button>
      </div>
    </GameLayout>
  );
}
