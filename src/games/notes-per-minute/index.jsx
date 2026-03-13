import { useEffect, useMemo, useRef } from "react";
import { NOTE_NAMES } from "./data/constants.js";
import MenuScreen from "./components/MenuScreen.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";
import StaffView from "./components/StaffView.jsx";
import TimerDisplay from "./components/TimerDisplay.jsx";
import { useNotesPerMinuteState } from "./state/useNotesPerMinuteState.js";
import { buildPracticeConfig, getBenchmarkPresetById } from "./data/benchmarks.js";
import { useAssignmentContext } from "../../assignment/useAssignmentContext.js";
import { useAssignmentAttempt } from "../../assignment/useAssignmentAttempt.js";
import StudentResultScreen from "../../assignment/StudentResultScreen.jsx";

function RunLabel({ activeRun }) {
  const isBenchmark = activeRun?.runType === "benchmark";
  const label = isBenchmark ? activeRun.id : "Practice";
  const description = isBenchmark ? "Official preset" : "Flexible practice";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>NPM</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 300, letterSpacing: 2, textTransform: "uppercase" }}>
        {activeRun?.clef} Clef
      </span>
      <span style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: isBenchmark ? "rgba(52,211,153,0.12)" : "rgba(99,102,241,0.12)",
        border: `1px solid ${isBenchmark ? "rgba(52,211,153,0.2)" : "rgba(129,140,248,0.2)"}`,
        color: isBenchmark ? "#6ee7b7" : "#c7d2fe",
        fontSize: 11,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        fontWeight: 700,
      }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
        {description}
      </span>
    </div>
  );
}

export default function NotesPerMinute() {
  const assignmentContext = useAssignmentContext("notes-per-minute");
  const {
    screen,
    menuSection,
    setMenuSection,
    menuMessage,
    practiceSettings,
    updatePracticeSetting,
    benchmarkCards,
    historyLoaded,
    activeRun,
    hasRunStarted,
    notes,
    currentIndex,
    timeLeft,
    results,
    feedback,
    completedSession,
    midiDevice,
    midiStatus,
    handleAnswer,
    beginRun,
    startBenchmark,
    startPractice,
    startAssignmentRun,
    resetToMenu,
  } = useNotesPerMinuteState();
  const assignmentLaunchRef = useRef(false);

  const assignmentAttempt = useAssignmentAttempt({
    assignment: assignmentContext.assignment,
    studentIdentity: assignmentContext.studentIdentity,
    enabled: assignmentContext.isAssignmentMode && !assignmentContext.loading && !assignmentContext.error,
  });

  const assignmentRunConfig = useMemo(() => {
    if (!assignmentContext.assignment) {
      return null;
    }

    const config = assignmentContext.assignment.activityConfig;

    if (config.runType === "benchmark") {
      return getBenchmarkPresetById(config.presetId);
    }

    return buildPracticeConfig({
      clef: config.clef,
      durationSeconds: config.durationSeconds,
      allowLedgerLines: config.allowLedgerLines,
      includeAccidentals: config.includeAccidentals,
      inputMode: "keyboard",
    });
  }, [assignmentContext.assignment]);

  useEffect(() => {
    if (!assignmentContext.isAssignmentMode || !assignmentRunConfig) {
      assignmentLaunchRef.current = false;
      return;
    }

    if (assignmentAttempt.startStatus !== "started" || assignmentLaunchRef.current) {
      return;
    }

    assignmentLaunchRef.current = true;
    startAssignmentRun(assignmentRunConfig);
  }, [
    assignmentAttempt.startStatus,
    assignmentContext.isAssignmentMode,
    assignmentRunConfig,
    startAssignmentRun,
  ]);

  useEffect(() => {
    if (!assignmentContext.isAssignmentMode || !completedSession || assignmentAttempt.completionStatus !== "idle") {
      return;
    }

    assignmentAttempt.completeAttempt({
      summary: {
        npm: Number(completedSession.summary?.rawNpm ?? completedSession.summary?.npm ?? 0),
        accuracy: Number(completedSession.summary?.accuracy || 0),
        score: completedSession.summary?.fluencyScore ?? null,
        rawNpm: Number(completedSession.summary?.rawNpm ?? completedSession.summary?.npm ?? 0),
        fluencyScore: completedSession.summary?.fluencyScore ?? null,
        qualifiedBenchmark: Boolean(completedSession.qualifiedBenchmark),
        presetId: completedSession.presetId,
        clef: completedSession.config?.clef || completedSession.summary?.clef,
      },
      rawResult: completedSession,
    });
  }, [
    assignmentAttempt,
    assignmentContext.isAssignmentMode,
    completedSession,
  ]);

  if (assignmentContext.isAssignmentMode && assignmentContext.loading) {
    return <StudentResultScreen title="Loading assignment" subtitle="Getting your assignment settings ready." summaryLines={[]} />;
  }

  if (assignmentContext.isAssignmentMode && assignmentContext.error) {
    return <StudentResultScreen title="Assignment unavailable" subtitle="This assignment could not be loaded." summaryLines={[]} error={assignmentContext.error} />;
  }

  if (assignmentContext.isAssignmentMode && assignmentAttempt.startStatus === "error") {
    return <StudentResultScreen title="Cannot start assignment" subtitle="The assignment could not be started." summaryLines={[]} error={assignmentAttempt.error} />;
  }

  const isReadyState = screen === "playing" && activeRun && !hasRunStarted;
  const isBenchmarkRun = activeRun?.runType === "benchmark";
  const startLabel = isBenchmarkRun ? "Begin Benchmark" : "Begin Practice";
  const helperLabel = isBenchmarkRun
    ? "The benchmark stays hidden until you begin. Notes appear and the 60-second timer starts together."
    : "Practice notes stay hidden until you begin. Start when you are ready to read.";
  const readyHint = activeRun?.inputMode === "midi"
    ? "Play any MIDI note or click to begin."
    : "Press any key or click to begin.";

  if (assignmentContext.isAssignmentMode && (assignmentAttempt.completionStatus === "completed" || assignmentAttempt.completionStatus === "error")) {
    const summary = completedSession?.summary;

    return (
      <StudentResultScreen
        title={assignmentAttempt.completionStatus === "completed" ? "Assignment complete" : "Result saved with an issue"}
        subtitle={assignmentContext.assignment?.title || "Notes Per Minute"}
        summaryLines={summary ? [
          `Notes per minute: ${summary.rawNpm ?? summary.npm ?? 0}`,
          `Accuracy: ${summary.accuracy ?? 0}%`,
          `Clef: ${completedSession?.config?.clef || ""}`,
        ] : []}
        error={assignmentAttempt.completionStatus === "error" ? assignmentAttempt.error : ""}
      />
    );
  }

  if (screen === "menu" && !assignmentContext.isAssignmentMode) {
    return (
      <MenuScreen
        menuSection={menuSection}
        setMenuSection={setMenuSection}
        menuMessage={menuMessage}
        benchmarkCards={benchmarkCards}
        historyLoaded={historyLoaded}
        practiceSettings={practiceSettings}
        updatePracticeSetting={updatePracticeSetting}
        onStartBenchmark={startBenchmark}
        onStartPractice={startPractice}
        midiStatus={midiStatus}
        midiDevice={midiDevice}
      />
    );
  }

  if (screen === "results") {
    if (assignmentContext.isAssignmentMode) {
      return null;
    }
    return <ResultsScreen session={completedSession} onRestart={resetToMenu} />;
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
        width: "100%",
        padding: "24px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: 24,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={resetToMenu}
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
          <RunLabel activeRun={activeRun} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <TimerDisplay timeLeft={timeLeft} durationSeconds={activeRun?.durationSeconds || 60} />
          <div style={{ textAlign: "right" }}>
            {isReadyState ? (
              <>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Status</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  Ready
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Score</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {results.filter((attempt) => attempt.correct).length}
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/{results.length}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{
        width: "100%",
        maxWidth: 920,
        padding: "18px 40px 0",
        color: "rgba(255,255,255,0.36)",
        fontSize: 13,
        letterSpacing: 0.3,
      }}>
        {activeRun?.runType === "benchmark"
          ? "Benchmark settings are locked for comparability over time."
          : `Practice · ${activeRun?.allowLedgerLines ? "ledger lines included" : "inside the staff"} · ${activeRun?.includeAccidentals ? "accidentals on" : "naturals only"}`}
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: 900,
        padding: "20px 40px",
      }}>
        {isReadyState ? (
          <div style={{
            width: "100%",
            maxWidth: 760,
            padding: "40px 36px",
            borderRadius: 22,
            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 36px rgba(2,6,23,0.18)",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.34)",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 12,
            }}>
              {isBenchmarkRun ? activeRun?.id : "Practice"}
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(34px, 4.5vw, 48px)",
              fontWeight: 700,
              letterSpacing: -0.4,
              lineHeight: 1.15,
              marginBottom: 14,
            }}>
              Start When Ready
            </div>
            <div style={{
              maxWidth: 560,
              margin: "0 auto 28px",
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.52)",
            }}>
              {helperLabel}
            </div>
            <div style={{
              marginBottom: 20,
              fontSize: 12,
              color: "rgba(255,255,255,0.34)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}>
              {readyHint}
            </div>
            <button
              onClick={beginRun}
              style={{
                padding: "14px 26px",
                borderRadius: 999,
                border: "1px solid rgba(129,140,248,0.26)",
                background: "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(79,70,229,0.32))",
                color: "#eef2ff",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.2,
                boxShadow: "0 14px 28px rgba(49,46,129,0.24)",
              }}
            >
              {startLabel}
            </button>
          </div>
        ) : (
          <StaffView notes={notes} currentIndex={currentIndex} clef={activeRun?.clef || "Treble"} />
        )}
      </div>

      {feedback && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: 64,
          fontWeight: 900,
          fontFamily: "'Playfair Display', serif",
          color: feedback.type === "correct" ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)",
          pointerEvents: "none",
          animation: "fadeUp 0.4s ease-out forwards",
        }}>
          {feedback.type === "correct" ? "✓" : "✗"}
        </div>
      )}

      <div style={{
        padding: "24px 40px 40px",
        width: "100%",
        maxWidth: 700,
      }}>
        {isReadyState ? (
          <div style={{
            textAlign: "center",
            padding: "16px 0 4px",
            fontSize: 12,
            color: "rgba(255,255,255,0.28)",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            Notes and input controls will appear after you begin.
          </div>
        ) : activeRun?.inputMode !== "midi" ? (
          <>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {NOTE_NAMES.map((note) => (
                <button
                  key={note}
                  style={{
                    width: 72,
                    height: 72,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#e8e6e1",
                    fontSize: 24,
                    fontWeight: 700,
                    fontFamily: "'Playfair Display', serif",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => handleAnswer(note, false)}
                >
                  {note}
                </button>
              ))}
            </div>
            <div style={{
              textAlign: "center",
              marginTop: 12,
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: 1,
            }}>
              click buttons or use keyboard keys C D E F G A B
            </div>
          </>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "28px 0",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎹</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
              {midiStatus === "connected"
                ? <>Playing via <span style={{ color: "#a5b4fc" }}>{midiDevice?.name || "MIDI Device"}</span> · octave-specific matching</>
                : <span style={{ color: "#f87171" }}>No MIDI device detected — return to Practice and reconnect to continue</span>}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
