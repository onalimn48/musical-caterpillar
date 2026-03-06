import { countCompletedItems } from "../../state/gameLogic.js";
import { ff } from "../../data/theme.js";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { Snowflakes } from "../ui.jsx";
import GameLayout from "../../../shared/layout/GameLayout.jsx";
import { AchToast, IntroOverlay, ScreenStyle, StatsPanel, TrophyCase, DEFAULT_BG } from "./shared.jsx";

export default function MenuScreen({ state, actions }) {
  const {
    midiStatus,
    showStats,
    showIntro,
    unlockedAch,
    showAchPopup,
    achToast,
    intervalStats,
    sessionStats,
  } = state;
  const {
    setShowStats,
    setShowAchPopup,
    playIntervalHalfStepPreview,
    resetAllProgress,
    startTraining,
    startClassic,
    startIntervalEar,
    startChordEar,
    startChord,
    startWeakPractice,
    dismissIntro,
  } = actions;

  return (
    <GameLayout background={DEFAULT_BG} fontFamily={ff} padding="20px" justify="center">
      <ScreenStyle />
      <Snowflakes count={40} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", animation: "slideIn .6s ease" }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>⛄🎵</div>
        <h1 style={{ fontSize: "clamp(28px,6vw,42px)", fontWeight: 700, color: "white", margin: "0 0 8px", letterSpacing: -1, textShadow: "0 4px 20px rgba(99,102,241,.5)" }}>Chord Snowman</h1>
        <p style={{ color: "#a5b4fc", fontSize: 15, margin: "0 0 36px", maxWidth: 360 }}>Learn intervals & build chords through music!</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { fn: startTraining, icon: "📚", title: "Training", desc: "Step-by-step interval lessons", border: "#4f46e5", bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
            { fn: startClassic, icon: "🎼", title: "Classic", desc: "Progressive difficulty levels", border: "#6366f1", bg: "linear-gradient(135deg,#1e1b4b,#3730a3)" },
            { fn: startIntervalEar, icon: "🐛", title: "Ear Journey", desc: "Identify intervals by ear!", border: "#06b6d4", bg: "linear-gradient(135deg,#083344,#164e63)" },
            { fn: startChordEar, icon: "🎧", title: "Chord Ear", desc: "Hear & identify chord types", border: "#ec4899", bg: "linear-gradient(135deg,#4a1942,#831843)" },
            { fn: startChord, icon: "⛄", title: "Build Chords", desc: "Stack notes to build chords", border: "#7c3aed", bg: "linear-gradient(135deg,#2e1065,#4c1d95)" },
            { fn: startWeakPractice, icon: "🎯", title: "Weak Spots", desc: "Drill your weakest intervals", border: "#f97316", bg: "linear-gradient(135deg,#431407,#7c2d12)" },
          ].map((item, i) => (
            <button key={i} onClick={item.fn} style={{ width: "clamp(140px,42vw,175px)", padding: "20px 12px", borderRadius: 20, border: `2px solid ${item.border}`, background: item.bg, cursor: "pointer", textAlign: "center", fontFamily: ff, boxShadow: `0 8px 30px ${item.border}44`, transition: "all .2s" }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#a5b4fc", lineHeight: 1.4 }}>{item.desc}</div>
            </button>
          ))}
        </div>
        {midiStatus === "connected" && (
          <div style={{ marginTop: 8, background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 10, padding: "4px 14px", fontSize: 12, color: "#4ade80", fontWeight: 600 }}>🎹 MIDI keyboard connected</div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
          <button onClick={() => setShowStats(true)}
            style={{ padding: "10px 24px", borderRadius: 14, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.08)", color: "#a5b4fc", fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>
            📊 Stats
          </button>
          <button onClick={() => setShowAchPopup(true)}
            style={{ padding: "10px 24px", borderRadius: 14, border: "1px solid rgba(245,158,11,.3)", background: "rgba(245,158,11,.08)", color: "#fde68a", fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>
            🏆 {countCompletedItems(unlockedAch)}/{ACHIEVEMENTS.length}
          </button>
        </div>
      </div>
      <StatsPanel showStats={showStats} setShowStats={setShowStats} sessionStats={sessionStats} intervalStats={intervalStats} resetAllProgress={resetAllProgress} />
      <TrophyCase unlockedAch={unlockedAch} showAchPopup={showAchPopup} setShowAchPopup={setShowAchPopup} />
      <AchToast achToast={achToast} />
      <IntroOverlay showIntro={showIntro} dismissIntro={dismissIntro} playIntervalHalfStepPreview={playIntervalHalfStepPreview} />
    </GameLayout>
  );
}
