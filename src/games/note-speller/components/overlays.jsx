import { POWERUPS } from "../data/powerups.js";
import { getClefSymbol } from "../data/clefs.js";
import PowerupButton from "./PowerupButton.jsx";

export function PowerupsBar({ powerups, score, isDone, onBuy, onUse }) {
  return (
    <div style={{
      display: "flex", gap: 8, justifyContent: "center", alignItems: "flex-start",
      padding: "8px 12px", borderRadius: 14,
      background: "#f5f3ff66",
      border: "1px solid #e5e7eb",
      marginBottom: 8,
    }}>
      {Object.values(POWERUPS).map(pu => (
        <PowerupButton key={pu.id} powerup={pu} count={powerups[pu.id] || 0}
          score={score} onBuy={onBuy} onUse={onUse}
          disabled={isDone} />
      ))}
    </div>
  );
}

export function LBOverlay({ leaderboard, onClose, fontFamily }) {
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily }}>
    <div style={{ background: "#0f0a1a", borderRadius: 20, padding: "28px 32px", maxWidth: 380, width: "90%", border: "3px solid #f59e0b", boxShadow: "0 0 40px #f59e0b44" }}>
      <h2 style={{ color: "#f59e0b", textAlign: "center", margin: "0 0 16px", fontSize: 22, letterSpacing: 2 }}>🏆 LEADERBOARD</h2>
      {leaderboard.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 14 }}>No scores yet!</p> :
        <div style={{ maxHeight: 300, overflowY: "auto" }}>{leaderboard.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? "#f59e0b15" : i < 3 ? "#1a1128" : "#12091e", border: i === 0 ? "1px solid #f59e0b44" : "1px solid #2a1f3a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: i === 0 ? "#f59e0b" : i < 3 ? "#c084fc" : "#6b7280", fontWeight: 700, fontSize: 16, width: 28 }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 16, letterSpacing: 3, fontFamily: "monospace" }}>{e.initials}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>{getClefSymbol(e.clef)}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 18 }}>{e.score}</span>
            </div>
          </div>))}</div>}
      <button onClick={onClose} style={{ marginTop: 16, width: "100%", padding: 10, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily, cursor: "pointer" }}>Close</button>
    </div>
  </div>);
}

export function StreakLBOverlay({ state, dispatch, streakLB, addStreakScore, saveStreakLB, getStreakLB, setStreakLB, fontFamily }) {
  const ff = fontFamily;
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily: ff }}>
    <div style={{ background: "#0f0a1a", borderRadius: 20, padding: "28px 32px", maxWidth: 380, width: "90%", border: "3px solid #c084fc", boxShadow: "0 0 40px #c084fc44" }}>
      <h2 style={{ color: "#c084fc", textAlign: "center", margin: "0 0 16px", fontSize: 22, letterSpacing: 2 }}>🔥 STREAK RECORDS</h2>

      {state.streakLBEntering ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fbbf24", fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{state.lastBigStreak} 🔥</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 14 }}>Amazing streak! Enter your initials:</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 44, height: 52, borderRadius: 10, border: `3px solid ${state.streakInitials[i] ? "#c084fc" : "#3a2d50"}`, background: "#1a1128", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#c084fc", fontFamily: "monospace" }}>{state.streakInitials[i] || "_"}</div>))}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => (
              <button key={ch} onClick={() => { if (state.streakInitials.length < 3) dispatch({ type: "SET_STREAK_INIT", value: state.streakInitials + ch }); }}
                style={{ width: 32, height: 32, borderRadius: 7, border: "2px solid #3a2d50", background: "#1a1128", color: "#e2e8f0", fontSize: 12, fontWeight: 600, fontFamily: ff, cursor: "pointer", opacity: state.streakInitials.length >= 3 ? .3 : 1 }}>{ch}</button>))}
            <button onClick={() => dispatch({ type: "SET_STREAK_INIT", value: state.streakInitials.slice(0, -1) })}
              style={{ width: 44, height: 32, borderRadius: 7, border: "2px solid #dc2626", background: "#1a1128", color: "#f87171", fontSize: 10, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>DEL</button>
          </div>
          <button onClick={() => { if (state.streakInitials.length === 3) { addStreakScore(state.streakInitials, state.lastBigStreak, state.clef); saveStreakLB(); setStreakLB(getStreakLB()); dispatch({ type: "SUBMIT_STREAK" }); } }}
            disabled={state.streakInitials.length !== 3}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", background: state.streakInitials.length === 3 ? "linear-gradient(135deg,#c084fc,#7c3aed)" : "#2a1f3a", color: state.streakInitials.length === 3 ? "white" : "#6b7280", fontSize: 15, fontWeight: 700, fontFamily: ff, cursor: state.streakInitials.length === 3 ? "pointer" : "not-allowed" }}>Save Streak</button>
        </div>
      ) : (
        <>
          {streakLB.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 14 }}>No streaks yet! Get 5+ in a row!</p> :
            <div style={{ maxHeight: 300, overflowY: "auto" }}>{streakLB.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? "#c084fc15" : i < 3 ? "#1a1128" : "#12091e", border: i === 0 ? "1px solid #c084fc44" : "1px solid #2a1f3a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: i === 0 ? "#c084fc" : i < 3 ? "#f59e0b" : "#6b7280", fontWeight: 700, fontSize: 16, width: 28 }}>{i === 0 ? "🔥" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 16, letterSpacing: 3, fontFamily: "monospace" }}>{e.initials}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{getClefSymbol(e.clef)}</span>
                  <span style={{ color: "#c084fc", fontWeight: 700, fontSize: 18 }}>{e.streak}🔥</span>
                </div>
              </div>))}</div>}
          <button onClick={() => dispatch({ type: "HIDE_STREAK_LB" })} style={{ marginTop: 16, width: "100%", padding: 10, borderRadius: 12, border: "2px solid #c084fc", background: "transparent", color: "#c084fc", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Close</button>
        </>
      )}
    </div>
  </div>);
}

export function ArcadeEnd({ state, dispatch, leaderboard, setLeaderboard, clearTimer, fontFamily, stage1Words, addLBScore, saveLB, getLB }) {
  const ff = fontFamily;
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily: ff }}>
    <div style={{ background: "#0f0a1a", borderRadius: 24, padding: "32px 36px", maxWidth: 380, width: "90%", textAlign: "center", border: "3px solid #f59e0b", boxShadow: "0 0 60px #f59e0b33" }}>
      <div style={{ fontSize: 42, marginBottom: 8 }}>⏱️</div>
      <h2 style={{ color: "#f59e0b", margin: "0 0 4px", fontSize: 24 }}>TIME'S UP!</h2>
      <div style={{ color: "#e2e8f0", fontSize: 42, fontWeight: 700, margin: "12px 0" }}>{state.arcadeScore}</div>
      <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>notes named correctly</div>

      {state.arcadePractice ? (
        <div>
          <div style={{ color: "#c084fc", fontSize: 13, marginBottom: 16 }}>Practice Arcade — scores not saved</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { clearTimer(); dispatch({ type: "ARCADE_START", clef: state.arcadeClef, pool: stage1Words, practice: true }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Play Again</button>
            <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #6b7280", background: "transparent", color: "#9ca3af", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Menu</button>
          </div>
        </div>
      ) : state.enteringName ? (
        <div>
          <div style={{ color: "#c084fc", fontSize: 14, marginBottom: 10, fontWeight: 600 }}>Enter your initials:</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 48, height: 56, borderRadius: 10, border: `3px solid ${state.arcadeInitials[i] ? "#f59e0b" : "#3a2d50"}`, background: "#1a1128", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace", letterSpacing: 2 }}>{state.arcadeInitials[i] || "_"}</div>))}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => (
              <button key={ch} onClick={() => { if (state.arcadeInitials.length < 3) dispatch({ type: "SET_INIT", value: state.arcadeInitials + ch }); }}
                style={{ width: 34, height: 34, borderRadius: 7, border: "2px solid #3a2d50", background: "#1a1128", color: "#e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer", opacity: state.arcadeInitials.length >= 3 ? .3 : 1 }}>{ch}</button>))}
            <button onClick={() => dispatch({ type: "SET_INIT", value: state.arcadeInitials.slice(0, -1) })}
              style={{ width: 48, height: 34, borderRadius: 7, border: "2px solid #dc2626", background: "#1a1128", color: "#f87171", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>DEL</button>
          </div>
          <button onClick={() => { if (state.arcadeInitials.length === 3) { addLBScore(state.arcadeInitials, state.arcadeScore, state.arcadeClef); saveLB(); setLeaderboard(getLB()); dispatch({ type: "SUBMIT" }); } }}
            disabled={state.arcadeInitials.length !== 3}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: state.arcadeInitials.length === 3 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#2a1f3a", color: state.arcadeInitials.length === 3 ? "white" : "#6b7280", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: state.arcadeInitials.length === 3 ? "pointer" : "not-allowed" }}>Submit Score</button>
        </div>
      ) : (
        <div>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>{leaderboard.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderRadius: 8, marginBottom: 3, background: e.initials === state.arcadeInitials && e.score === state.arcadeScore ? "#f59e0b22" : "#1a1128", border: e.initials === state.arcadeInitials && e.score === state.arcadeScore ? "1px solid #f59e0b" : "1px solid #2a1f3a" }}>
              <span style={{ color: i < 3 ? "#f59e0b" : "#9ca3af", fontWeight: 700, fontSize: 14 }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}{" "}<span style={{ color: "#e2e8f0", letterSpacing: 2, fontFamily: "monospace" }}>{e.initials}</span></span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{e.score}</span>
            </div>))}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { clearTimer(); dispatch({ type: "ARCADE_START", clef: state.arcadeClef }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Play Again</button>
            <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #6b7280", background: "transparent", color: "#9ca3af", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Menu</button>
          </div>
        </div>
      )}
    </div>
  </div>);
}
