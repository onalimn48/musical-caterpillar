import { PRACTICE_DURATION_OPTIONS } from "../data/constants.js";

const sectionButtonStyle = (active) => ({
  flex: 1,
  padding: "14px 18px",
  borderRadius: 14,
  border: `1px solid ${active ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)"}`,
  background: active ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
  color: active ? "#c7d2fe" : "rgba(255,255,255,0.55)",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: 14,
});

const settingButtonStyle = (active) => ({
  padding: "12px 16px",
  borderRadius: 12,
  border: `1px solid ${active ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)"}`,
  background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
  color: active ? "#e0e7ff" : "rgba(255,255,255,0.52)",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 500,
});

function CardMetric({ label, value, accent = "#e8e6e1" }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: accent, fontSize: 17, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
    </div>
  );
}

function BestRunStat({ label, value, accent = "#e8e6e1" }) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: accent, fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
    </div>
  );
}

function BenchmarkCard({ preset, history, onStart }) {
  const bestFluencyRun = history?.bestFluencyRun || null;
  const fastestRawRun = history?.fastestRawRun || null;
  const bestFluencyLabel = bestFluencyRun
    ? `${bestFluencyRun.summary.fluencyScore.toFixed(1)}`
    : "No official score yet";
  const fastestRawLabel = fastestRawRun
    ? `${fastestRawRun.summary.correctNotes ?? Math.round(fastestRawRun.summary.rawNpm)} correct`
    : "No run yet";
  const latestBandLabel = history?.latest?.summary?.fluencyBand || "No runs yet";
  const latestStatus = history?.latest
    ? (history.latest.qualifiedBenchmark ? "Official" : "Below threshold")
    : "No latest run";
  const bestSummary = bestFluencyRun?.summary || null;
  const bestFlowLabel = bestSummary?.flowPct != null && bestSummary?.flowConfidence === "full"
    ? `${Math.round(bestSummary.flowPct)}%`
    : "n/a";
  const bestDelayedNote = bestSummary?.topDelayedNotes?.[0]?.label || null;
  const fastestRawAccent = fastestRawRun
    ? "#fcd34d"
    : "rgba(255,255,255,0.45)";
  const bestFluencyAccent = bestFluencyRun
    ? "#34d399"
    : "rgba(255,255,255,0.45)";
  const latestBandText = history?.latest?.summary?.fluencyBand
    ? ` · latest band: ${latestBandLabel}`
    : "";

  return (
    <button
      onClick={() => onStart(preset.id)}
      style={{
        width: "100%",
        textAlign: "left",
        background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        padding: 22,
        cursor: "pointer",
        color: "#e8e6e1",
        boxShadow: "0 18px 32px rgba(2,6,23,0.18)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            Benchmark
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, letterSpacing: -1.5 }}>
            {preset.id}
          </div>
        </div>
        <div style={{
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(99,102,241,0.14)",
          border: "1px solid rgba(129,140,248,0.2)",
          fontSize: 11,
          color: "#c7d2fe",
          letterSpacing: 1.2,
          textTransform: "uppercase",
          fontWeight: 700,
        }}>
          Keyboard
        </div>
      </div>

      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, marginBottom: 16 }}>
        {preset.clef} clef · {preset.shortDescription}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginBottom: 18 }}>
        <CardMetric label="Best Fluency Run" value={bestFluencyLabel} accent={bestFluencyAccent} />
        <CardMetric label="Fastest Raw Run" value={fastestRawLabel} accent={fastestRawAccent} />
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", letterSpacing: 0.3 }}>
        60 seconds · naturals only · latest: {latestStatus}{latestBandText}
      </div>

      {bestSummary ? (
        <div style={{
          marginTop: 18,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 12 }}>
            Best Fluency Run Stats
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: bestDelayedNote ? 12 : 0 }}>
            <BestRunStat label="Fluency Score" value={bestFluencyLabel} accent="#c7d2fe" />
            <BestRunStat label="Accuracy" value={`${Math.round(bestSummary.accuracy)}%`} accent={bestSummary.accuracy >= 85 ? "#34d399" : "#fbbf24"} />
            <BestRunStat label="Flow" value={bestFlowLabel} accent="#a5b4fc" />
            <BestRunStat label="Correct Notes" value={`${bestSummary.correctNotes}`} accent="#fcd34d" />
          </div>
          {bestDelayedNote ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.5 }}>
              Most delayed note: <span style={{ color: "#fcd34d", fontWeight: 700 }}>{bestDelayedNote}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

export default function MenuScreen({
  menuSection,
  setMenuSection,
  menuMessage,
  benchmarkCards,
  historyLoaded,
  practiceSettings,
  updatePracticeSetting,
  onStartBenchmark,
  onStartPractice,
  midiStatus,
  midiDevice,
}) {
  const practiceStartDisabled = practiceSettings.inputMode === "midi" && midiStatus !== "connected";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
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

      <div style={{ width: "100%", maxWidth: 980 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 16, fontWeight: 300,
          }}>
            Standardized Fluency Runs
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(60px, 9vw, 86px)",
            fontWeight: 900,
            letterSpacing: -3,
            margin: 0,
            background: "linear-gradient(135deg, #e8e6e1 0%, rgba(129,140,248,0.8) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            NPM
          </h1>
          <p style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.44)",
            fontWeight: 300,
            margin: "10px auto 0",
            lineHeight: 1.6,
            maxWidth: 720,
          }}>
            Notes Per Minute stays focused on single-note reading fluency. Benchmarks are locked and comparable over time. Practice stays flexible.
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: 12,
          maxWidth: 420,
          margin: "0 auto 28px",
          padding: 6,
          borderRadius: 18,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button onClick={() => setMenuSection("benchmarks")} style={sectionButtonStyle(menuSection === "benchmarks")}>
            Benchmarks
          </button>
          <button onClick={() => setMenuSection("practice")} style={sectionButtonStyle(menuSection === "practice")}>
            Practice
          </button>
        </div>

        {menuMessage ? (
          <div style={{
            maxWidth: 520,
            margin: "0 auto 24px",
            padding: "12px 14px",
            borderRadius: 14,
            background: menuMessage.tone === "error" ? "rgba(248,113,113,0.1)" : "rgba(99,102,241,0.1)",
            border: `1px solid ${menuMessage.tone === "error" ? "rgba(248,113,113,0.22)" : "rgba(129,140,248,0.2)"}`,
            color: menuMessage.tone === "error" ? "#fca5a5" : "#c7d2fe",
            fontSize: 13,
            textAlign: "center",
          }}>
            {menuMessage.text}
          </div>
        ) : null}

        {menuSection === "benchmarks" ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: 22, fontSize: 13, color: "rgba(255,255,255,0.3)", letterSpacing: 0.3 }}>
              {historyLoaded ? "Choose an official preset. Practice runs do not count here." : "Loading benchmark history..."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
              {benchmarkCards.map(({ preset, history }) => (
                <BenchmarkCard key={preset.id} preset={preset} history={history} onStart={onStartBenchmark} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: 28,
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 36px rgba(2,6,23,0.18)",
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                Practice Only
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, marginBottom: 8 }}>
                Flexible Mode
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.52)", lineHeight: 1.6 }}>
                Practice lets you change clef, timing, ledger lines, and MIDI. Sixty-second runs can use the classroom fluency score. Longer runs stay practice-only and emphasize raw NPM, flow, and hesitation guidance.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18, marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Clef
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Treble", "Bass", "Alto"].map((clef) => (
                    <button key={clef} onClick={() => updatePracticeSetting("clef", clef)} style={settingButtonStyle(practiceSettings.clef === clef)}>
                      {clef}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Input
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => updatePracticeSetting("inputMode", "keyboard")} style={settingButtonStyle(practiceSettings.inputMode === "keyboard")}>
                    Keyboard
                  </button>
                  <button onClick={() => midiStatus !== "unsupported" && updatePracticeSetting("inputMode", "midi")} style={{
                    ...settingButtonStyle(practiceSettings.inputMode === "midi"),
                    opacity: midiStatus === "unsupported" ? 0.45 : 1,
                    cursor: midiStatus === "unsupported" ? "not-allowed" : "pointer",
                  }}>
                    MIDI
                  </button>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: midiStatus === "connected" ? "#34d399" : "rgba(255,255,255,0.3)" }}>
                  {practiceSettings.inputMode === "midi"
                    ? (midiStatus === "connected"
                      ? `Connected: ${midiDevice?.name || "MIDI Device"}`
                      : "Connect a MIDI keyboard to start.")
                    : "Benchmarks stay keyboard-only for comparability."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Ledger Lines
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => updatePracticeSetting("allowLedgerLines", false)} style={settingButtonStyle(!practiceSettings.allowLedgerLines)}>
                    Inside Staff
                  </button>
                  <button onClick={() => updatePracticeSetting("allowLedgerLines", true)} style={settingButtonStyle(practiceSettings.allowLedgerLines)}>
                    Include Ledgers
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  Duration
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {PRACTICE_DURATION_OPTIONS.map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => updatePracticeSetting("durationSeconds", seconds)}
                      style={settingButtonStyle(practiceSettings.durationSeconds === seconds)}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Accidentals
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => updatePracticeSetting("includeAccidentals", false)}
                  style={settingButtonStyle(!practiceSettings.includeAccidentals)}
                >
                  Naturals Only
                </button>
                <button
                  onClick={() => practiceSettings.inputMode === "midi" && updatePracticeSetting("includeAccidentals", true)}
                  style={{
                    ...settingButtonStyle(practiceSettings.includeAccidentals),
                    opacity: practiceSettings.inputMode === "midi" ? 1 : 0.45,
                    cursor: practiceSettings.inputMode === "midi" ? "pointer" : "not-allowed",
                  }}
                >
                  Accidentals
                </button>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
                Accidentals are only enabled for MIDI practice so answers can stay octave-specific.
              </div>
            </div>

            <button
              onClick={onStartPractice}
              disabled={practiceStartDisabled}
              style={{
                padding: "18px 32px",
                background: practiceStartDisabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 14,
                color: practiceStartDisabled ? "rgba(255,255,255,0.35)" : "#fff",
                fontSize: 17,
                fontWeight: 600,
                cursor: practiceStartDisabled ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.8,
                boxShadow: practiceStartDisabled ? "none" : "0 4px 24px rgba(99,102,241,0.3)",
              }}
            >
              Start Practice Run
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
