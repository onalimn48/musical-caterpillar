import { countCompletedItems, getAccuracyPercent } from "../../state/gameLogic.js";
import { ff, css } from "../../data/theme.js";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { INTERVAL_DB } from "../../data/intervals.js";

export const DEFAULT_BG = "linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 100%)";

export function AchToast({ achToast }) {
  if (!achToast) return null;
  return (
    <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "slideIn .4s ease", pointerEvents: "none" }}>
      <div style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 16, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(245,158,11,.4)" }}>
        <span style={{ fontSize: 28 }}>{achToast.icon}</span>
        <div>
          <div style={{ color: "white", fontSize: 13, fontWeight: 800 }}>🏆 {achToast.name}!</div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>{achToast.desc}</div>
        </div>
      </div>
    </div>
  );
}

export function TrophyCase({ unlockedAch, showAchPopup, setShowAchPopup }) {
  if (!showAchPopup) return null;
  const count = countCompletedItems(unlockedAch);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }}
      onClick={() => setShowAchPopup(false)}>
      <div style={{ background: "linear-gradient(180deg,#451a03,#7c2d12)", borderRadius: 24, padding: "24px 20px", maxWidth: 420, width: "92%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.5)", animation: "popIn .3s ease", fontFamily: ff }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>🏆 Achievements</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#fde68a", fontSize: 13, fontWeight: 600 }}>{count}/{ACHIEVEMENTS.length}</span>
            <button onClick={() => setShowAchPopup(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 10, width: 32, height: 32, color: "white", fontSize: 16, cursor: "pointer", fontFamily: ff }}>✕</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {ACHIEVEMENTS.map((ach) => {
            const got = !!unlockedAch[ach.id];
            return (
              <div key={ach.id} style={{ background: got ? "rgba(245,158,11,.1)" : "rgba(0,0,0,.2)", border: `1px solid ${got ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.06)"}`, borderRadius: 12, padding: "10px 10px", textAlign: "center", opacity: got ? 1 : .45 }}>
                <div style={{ fontSize: 28, marginBottom: 2, filter: got ? "none" : "grayscale(1)" }}>{ach.icon}</div>
                <div style={{ color: got ? "white" : "#9ca3af", fontSize: 12, fontWeight: 700 }}>{ach.name}</div>
                <div style={{ color: got ? "#fed7aa" : "#6b7280", fontSize: 10, lineHeight: 1.3 }}>{ach.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StatsPanel({ showStats, setShowStats, sessionStats, intervalStats, resetAllProgress }) {
  if (!showStats) return null;
  const total = sessionStats.correct + sessionStats.wrong;
  const pct = getAccuracyPercent(sessionStats.correct, total);
  const elapsed = Math.floor((Date.now() - sessionStats.started) / 60000);
  const mins = elapsed < 1 ? "<1" : elapsed;
  const ivEntries = INTERVAL_DB.map((iv, i) => {
    const s = intervalStats[i];
    if (!s) return null;
    const t = s.correct + s.wrong;
    return { iv, idx: i, correct: s.correct, wrong: s.wrong, total: t, pct: getAccuracyPercent(s.correct, t) };
  }).filter(Boolean).sort((a, b) => b.total - a.total);
  const best = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct > b.pct ? a : b) : null;
  const worst = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct < b.pct ? a : b) : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.6)", backdropFilter: "blur(6px)" }}
      onClick={() => setShowStats(false)}>
      <div style={{ background: "linear-gradient(180deg,#1e1b4b,#312e81)", borderRadius: 24, padding: "24px 20px", maxWidth: 420, width: "92%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.5)", animation: "popIn .3s ease", fontFamily: ff }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>📊 Session Stats</h2>
          <button onClick={() => setShowStats(false)} style={{ background: "rgba(255,255,255,.1)", border: "none", borderRadius: 10, width: 32, height: 32, color: "white", fontSize: 16, cursor: "pointer", fontFamily: ff }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Correct", value: sessionStats.correct, color: "#4ade80", icon: "✓" },
            { label: "Wrong", value: sessionStats.wrong, color: "#f87171", icon: "✗" },
            { label: "Accuracy", value: total > 0 ? `${pct}%` : "—", color: pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171", icon: "🎯" },
          ].map((s, i) => (
            <div key={i} style={{ background: "rgba(99,102,241,.1)", borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 4 }}>{s.icon} {s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "rgba(99,102,241,.08)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#818cf8" }}>🕐 Time Played</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{mins} min</div>
          </div>
          <div style={{ flex: 1, background: "rgba(99,102,241,.08)", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#818cf8" }}>📝 Total Questions</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{total}</div>
          </div>
        </div>
        {best && worst && best.idx !== worst.idx && ivEntries.length >= 2 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 600, marginBottom: 4 }}>💪 Strongest</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{best.iv.emoji} {best.iv.short}</div>
              <div style={{ fontSize: 11, color: "#86efac" }}>{best.pct}% ({best.correct}/{best.total})</div>
            </div>
            <div style={{ flex: 1, background: "rgba(248,113,113,.08)", border: "1px solid rgba(248,113,113,.2)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#f87171", fontWeight: 600, marginBottom: 4 }}>🎯 Needs Work</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{worst.iv.emoji} {worst.iv.short}</div>
              <div style={{ fontSize: 11, color: "#fca5a5" }}>{worst.pct}% ({worst.correct}/{worst.total})</div>
            </div>
          </div>
        )}
        {ivEntries.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 8 }}>Per-Interval Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {ivEntries.map((e) => (
                <div key={e.idx} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,.06)", borderRadius: 10, padding: "6px 10px" }}>
                  <span style={{ fontSize: 16, width: 24, textAlign: "center" }}>{e.iv.emoji}</span>
                  <span style={{ color: "white", fontSize: 12, fontWeight: 600, width: 40 }}>{e.iv.short}</span>
                  <div style={{ flex: 1, height: 10, background: "rgba(99,102,241,.15)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${e.pct}%`, borderRadius: 5, background: e.pct >= 80 ? "linear-gradient(90deg,#22c55e,#4ade80)" : e.pct >= 60 ? "linear-gradient(90deg,#eab308,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)", transition: "width .3s" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: e.pct >= 80 ? "#4ade80" : e.pct >= 60 ? "#fbbf24" : "#f87171", width: 36, textAlign: "right" }}>{e.pct}%</span>
                  <span style={{ fontSize: 10, color: "#818cf8", width: 32, textAlign: "right" }}>{e.correct}/{e.total}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {total === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#818cf8", fontSize: 14 }}>No stats yet — start playing to see your progress!</div>}
        {total > 0 && (
          <button onClick={resetAllProgress} style={{ marginTop: 16, width: "100%", padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.08)", color: "#fca5a5", fontSize: 12, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>
            Reset All Progress
          </button>
        )}
      </div>
    </div>
  );
}

export function IntroOverlay({ showIntro, dismissIntro, playIntervalHalfStepPreview }) {
  if (!showIntro) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, fontFamily: ff, padding: 16, animation: "fadeIn .3s ease" }}
      onClick={dismissIntro}>
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", borderRadius: 24, padding: "28px 24px", maxWidth: 460, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.5)", animation: "slideIn .4s ease", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🎵</div>
          <h2 style={{ color: "white", fontSize: 24, margin: "0 0 6px" }}>What is an Interval?</h2>
          <p style={{ color: "#a5b4fc", fontSize: 14, margin: 0 }}>The building block of all music</p>
        </div>
        <div style={{ background: "rgba(99,102,241,.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <p style={{ color: "#c4b5fd", fontSize: 14, lineHeight: 1.7, margin: "0 0 10px" }}>
            An <span style={{ color: "white", fontWeight: 700 }}>interval</span> is the distance between two notes.
            It&apos;s measured in <span style={{ color: "white", fontWeight: 700 }}>half steps</span> — the smallest step on a piano.
          </p>
          <p style={{ color: "#c4b5fd", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            Every melody and every chord is made of intervals. Learning to recognize them lets you understand how music works!
          </p>
        </div>
        <div style={{ background: "rgba(0,0,0,.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ color: "#818cf8", fontSize: 11, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>A piano keyboard — each key to the next is 1 half step</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 1, marginBottom: 8 }}>
            {["C", "", "D", "", "E", "F", "", "G", "", "A", "", "B"].map((n, i) => {
              const isBlack = [1, 3, 6, 8, 10].includes(i);
              return (
                <div key={i} style={{ width: isBlack ? 18 : 26, height: isBlack ? 40 : 60, background: isBlack ? "#1e1b4b" : "white", borderRadius: "0 0 4px 4px", border: "1px solid #444", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3, zIndex: isBlack ? 2 : 1, marginLeft: isBlack ? -9 : 0, marginRight: isBlack ? -9 : 0 }}>
                  {n && <span style={{ fontSize: 9, color: isBlack ? "#818cf8" : "#4b5563", fontWeight: 600 }}>{n}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#a5b4fc" }}>C → D = <span style={{ color: "white", fontWeight: 700 }}>2 half steps</span> (Major 2nd)</span>
            <span style={{ fontSize: 12, color: "#a5b4fc" }}>C → E = <span style={{ color: "white", fontWeight: 700 }}>4 half steps</span> (Major 3rd)</span>
          </div>
        </div>
        <div style={{ background: "rgba(99,102,241,.08)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
          <div style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Some intervals to try:</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { name: "Minor 2nd", half: 1, emoji: "🦈" },
              { name: "Major 3rd", half: 4, emoji: "🎺" },
              { name: "Perfect 5th", half: 7, emoji: "⭐" },
              { name: "Octave", half: 12, emoji: "🌈" },
            ].map((iv, i) => (
              <button key={i} onClick={() => playIntervalHalfStepPreview(iv.half)}
                style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(99,102,241,.3)", background: "rgba(99,102,241,.1)", color: "white", fontSize: 12, fontWeight: 600, fontFamily: ff, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{iv.emoji}</div>
                <div style={{ fontSize: 10, color: "#a5b4fc" }}>{iv.name}</div>
                <div style={{ fontSize: 9, color: "#818cf8" }}>{iv.half} half steps</div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ background: "rgba(34,197,94,.08)", borderRadius: 12, padding: "10px 16px", marginBottom: 18 }}>
          <p style={{ color: "#86efac", fontSize: 13, lineHeight: 1.6, margin: 0, textAlign: "center" }}>
            🎧 <span style={{ fontWeight: 700 }}>Tip:</span> Each interval has a unique sound. You can learn to recognize them by associating them with famous songs!
          </p>
        </div>
        <button onClick={dismissIntro}
          style={{ width: "100%", padding: "14px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", fontSize: 17, fontWeight: 700, fontFamily: ff, cursor: "pointer", boxShadow: "0 4px 16px rgba(99,102,241,.4)" }}>
          Got it — let&apos;s go! 🎵
        </button>
      </div>
    </div>
  );
}

export function ScreenStyle() {
  return <style>{css}</style>;
}
