import { CLEF_RANGES } from "../data/constants.js";
import ClefGlyph from "./ClefGlyph.jsx";

export default function MenuScreen({ clef, setClef, onStart, midiStatus, inputMode, setInputMode, midiDevice }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{
        position: "fixed", top: "-20%", right: "-10%", width: "50%", height: "60%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-10%", width: "40%", height: "50%",
        background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute", top: "8%", right: "8%",
        width: 120, height: 120,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 88, lineHeight: 1, color: "rgba(255,255,255,0.02)",
        fontFamily: "'Noto Music','Segoe UI Symbol',serif",
        pointerEvents: "none",
        userSelect: "none",
      }}>𝄞</div>

      <div style={{ textAlign: "center", maxWidth: 500, padding: 40 }}>
        <div style={{
          fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", marginBottom: 16, fontWeight: 300,
        }}>
          Sight Reading Challenge
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 72, fontWeight: 900, letterSpacing: -3,
          margin: "0 0 8px 0",
          background: "linear-gradient(135deg, #e8e6e1 0%, rgba(129,140,248,0.8) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          NPM
        </h1>
        <p style={{
          fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 300,
          margin: "0 0 48px 0", lineHeight: 1.6,
        }}>
          Notes Per Minute
        </p>
        <p style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.28)",
          margin: "0 0 28px 0",
          lineHeight: 1.6,
          letterSpacing: 0.2,
        }}>
          Finish a run to get a breakdown of your speed, accuracy, and weak notes.
        </p>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>
            Select Clef
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {Object.entries(CLEF_RANGES).map(([key, val]) => (
              <button key={key} onClick={() => setClef(key)} style={{
                padding: "16px 28px",
                background: clef === key ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${clef === key ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12,
                color: clef === key ? "#818cf8" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: 16,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <svg width="52" height="58" viewBox="0 0 52 58" style={{ display: "block", margin: "0 auto 4px", overflow: "visible" }}>
                  <ClefGlyph clef={key} x={26} y={24} color={clef === key ? "#818cf8" : "rgba(255,255,255,0.5)"} opacity={1} menu />
                </svg>
                {key}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>
            Input Method
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setInputMode("keyboard")} style={{
              padding: "14px 24px",
              background: inputMode === "keyboard" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${inputMode === "keyboard" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12,
              color: inputMode === "keyboard" ? "#818cf8" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>⌨️</span>
              Keyboard
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Letter only</div>
            </button>
            <button onClick={() => {
              if (midiStatus !== "unsupported") setInputMode("midi");
            }} style={{
              padding: "14px 24px",
              background: inputMode === "midi" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${inputMode === "midi" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12,
              color: inputMode === "midi" ? "#818cf8" : midiStatus === "unsupported" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
              cursor: midiStatus === "unsupported" ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              opacity: midiStatus === "unsupported" ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>🎹</span>
              MIDI
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                Octave-specific
              </div>
            </button>
          </div>
          {inputMode === "midi" && (
            <div style={{
              marginTop: 12, fontSize: 12, textAlign: "center",
              color: midiStatus === "connected" ? "#34d399" : "rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", display: "inline-block",
                background: midiStatus === "connected" ? "#34d399" : "#f87171",
                boxShadow: midiStatus === "connected" ? "0 0 6px #34d399" : "none",
              }} />
              {midiStatus === "connected"
                ? `Connected: ${midiDevice?.name || "MIDI Device"}`
                : "No MIDI device detected — plug one in"}
            </div>
          )}
          {midiStatus === "unsupported" && inputMode !== "midi" && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              MIDI not supported in this browser (use Chrome/Edge)
            </div>
          )}
        </div>

        <button onClick={() => onStart(clef)} style={{
          padding: "18px 56px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          borderRadius: 14,
          color: "#fff",
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: 1,
          transition: "all 0.2s ease",
          boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
        }}
        onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          Begin Test
        </button>

        <div style={{
          marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.2)",
          lineHeight: 1.8,
        }}>
          60 seconds · Identify notes as fast as you can<br />
          {inputMode === "midi"
            ? "Play the correct note on your MIDI keyboard, including sharps and flats when shown (octave matters!)"
            : "Use keyboard (C D E F G A B) or click the buttons"}
        </div>
      </div>
    </div>
  );
}
