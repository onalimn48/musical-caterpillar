// Architecture: index.jsx is composition only; state/ holds reducers, state machines, and orchestration hooks;
// hooks/ holds browser/device integrations like MIDI, keyboard, and timers; data/ holds static configuration
// and content; components/ holds presentational UI components.
import { NOTE_NAMES } from "./data/constants.js";
import MenuScreen from "./components/MenuScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import StaffView from "./components/StaffView.jsx";
import TimerDisplay from "./components/TimerDisplay.jsx";
import { useNotesPerMinuteState } from "./state/useNotesPerMinuteState.js";

export default function NotesPerMinute() {
  const {
    screen,
    setScreen,
    clef,
    setClef,
    notes,
    currentIndex,
    timeLeft,
    results,
    startTime,
    feedback,
    midiDevice,
    midiStatus,
    inputMode,
    setInputMode,
    initGame,
    exitToMenu,
    handleAnswer,
    stats,
  } = useNotesPerMinuteState();

  if (screen === "menu") {
    return (
      <MenuScreen
        clef={clef}
        setClef={setClef}
        onStart={initGame}
        midiStatus={midiStatus}
        inputMode={inputMode}
        setInputMode={setInputMode}
        midiDevice={midiDevice}
      />
    );
  }

  if (screen === "results") {
    return <ResultsScreen stats={stats} clef={clef} onRestart={() => setScreen("menu")} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    }}>
      <div style={{
        position: "fixed", top: "-30%", left: "-10%", width: "60%", height: "60%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <button
            onClick={exitToMenu}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            ← Menu
          </button>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>NPM</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 300, letterSpacing: 2, textTransform: "uppercase" }}>
            {clef} Clef
          </span>
          {inputMode === "midi" && (
            <span style={{
              fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500,
              color: midiStatus === "connected" ? "#34d399" : "#f87171",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: midiStatus === "connected" ? "#34d399" : "#f87171",
                display: "inline-block",
                boxShadow: midiStatus === "connected" ? "0 0 6px #34d399" : "none",
              }} />
              MIDI {midiStatus === "connected" ? `· ${midiDevice?.name || "Device"}` : "· No device"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <TimerDisplay timeLeft={timeLeft} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Score</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {results.filter(r => r.correct).length}
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/{results.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", maxWidth: 900, padding: "20px 40px",
      }}>
        <StaffView
          notes={notes}
          currentIndex={currentIndex}
          clef={clef}
        />
      </div>

      {feedback && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: 64, fontWeight: 900, fontFamily: "'Playfair Display', serif",
          color: feedback.type === "correct" ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)",
          pointerEvents: "none",
          animation: "fadeUp 0.4s ease-out forwards",
        }}>
          {feedback.type === "correct" ? "✓" : "✗"}
        </div>
      )}

      <div style={{
        padding: "24px 40px 40px",
        width: "100%", maxWidth: 700,
      }}>
        {!startTime && (
          <div style={{
            textAlign: "center", marginBottom: 16, fontSize: 14,
            color: "rgba(255,255,255,0.4)", letterSpacing: 1,
            animation: "pulse 2s ease-in-out infinite",
          }}>
            {inputMode === "midi"
              ? "Play a note on your MIDI keyboard to begin"
              : "Press a note key or click to begin"}
          </div>
        )}
        {inputMode !== "midi" && (
          <>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {NOTE_NAMES.map(n => (
                <button
                  key={n}
                  onClick={() => handleAnswer(n, false)}
                  style={{
                    width: 72, height: 72,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#e8e6e1",
                    fontSize: 24, fontWeight: 700,
                    fontFamily: "'Playfair Display', serif",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = "rgba(99,102,241,0.15)";
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = "rgba(255,255,255,0.04)";
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{
              textAlign: "center", marginTop: 12, fontSize: 12,
              color: "rgba(255,255,255,0.25)", letterSpacing: 1,
            }}>
              or use keyboard keys C D E F G A B
            </div>
          </>
        )}
        {inputMode === "midi" && (
          <div style={{
            textAlign: "center", padding: "28px 0",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎹</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
              {midiStatus === "connected"
                ? <>Playing via <span style={{ color: "#a5b4fc" }}>{midiDevice?.name || "MIDI Device"}</span> · octave-specific matching</>
                : <span style={{ color: "#f87171" }}>No MIDI device detected — plug one in or switch to keyboard mode</span>
              }
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(1.2); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
