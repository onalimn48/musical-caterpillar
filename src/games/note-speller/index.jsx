// Architecture: index.jsx is composition only; state/ holds reducers, state machines, and orchestration hooks;
// hooks/ holds browser/device integrations like MIDI, keyboard, and timers; data/ holds static configuration
// and content; components/ holds presentational UI components.
import { useEffect, useRef } from "react";
import { useNoteSpellerState } from "./state/useNoteSpellerState.js";
import ArcadeScreen from "./components/screens/ArcadeScreen.jsx";
import GameScreen from "./components/screens/GameScreen.jsx";
import MenuScreen from "./components/screens/MenuScreen.jsx";
import SongScreen from "./components/screens/SongScreen.jsx";
import StoryScreen from "./components/screens/StoryScreen.jsx";
import ScrambleScreen from "./components/screens/ScrambleScreen.jsx";
import TimedScreen from "./components/screens/TimedScreen.jsx";
import WeakNotesScreen from "./components/screens/WeakNotesScreen.jsx";
import { useAssignmentContext } from "../../assignment/useAssignmentContext.js";
import { useAssignmentAttempt } from "../../assignment/useAssignmentAttempt.js";
import StudentResultScreen from "../../assignment/StudentResultScreen.jsx";

function getAssignmentWordTarget(assignment) {
  const rawValue = assignment?.activityConfig?.targetWords ?? assignment?.activityConfig?.wordTarget;
  const value = Number(rawValue);

  if (Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  return 10;
}

function ThemeToggle({ darkMode, onToggle, fontFamily }) {
  return (
    <button
      className="note-speller-theme-toggle"
      onClick={onToggle}
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "fixed",
        top: "max(12px, calc(env(safe-area-inset-top, 0px) + 12px))",
        right: 12,
        zIndex: 1200,
        border: darkMode ? "1px solid rgba(255,255,255,.16)" : "1px solid rgba(91,33,182,.14)",
        background: darkMode ? "rgba(15,23,42,.86)" : "rgba(255,255,255,.86)",
        color: darkMode ? "#e2e8f0" : "#5b21b6",
        borderRadius: 999,
        padding: "10px 14px",
        fontFamily,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: darkMode ? "0 10px 24px rgba(0,0,0,.28)" : "0 10px 24px rgba(91,33,182,.14)",
        backdropFilter: "blur(10px)",
      }}
    >
      <span aria-hidden="true">{darkMode ? "☀️" : "🌙"}</span>
      <span className="note-speller-theme-toggle-label" style={{ marginLeft: 6 }}>
        {darkMode ? "Light" : "Dark"}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const ff = "'Fredoka',sans-serif";
  const assignmentContext = useAssignmentContext("note-speller");
  const assignmentWordTarget = getAssignmentWordTarget(assignmentContext.assignment);
  const { state, dispatch, actions, derived } = useNoteSpellerState({
    isAssignmentMode: assignmentContext.isAssignmentMode,
    assignmentWordTarget,
  });
  const { darkMode } = derived;
  const assignmentLaunchRef = useRef(false);
  const assignmentAttempt = useAssignmentAttempt({
    assignment: assignmentContext.assignment,
    studentIdentity: assignmentContext.studentIdentity,
    enabled: assignmentContext.isAssignmentMode && !assignmentContext.loading && !assignmentContext.error,
  });

  useEffect(() => {
    if (!assignmentContext.isAssignmentMode || !assignmentContext.assignment) {
      assignmentLaunchRef.current = false;
      return;
    }

    if (assignmentAttempt.startStatus !== "started" || assignmentLaunchRef.current || state.phase !== "menu") {
      return;
    }

    assignmentLaunchRef.current = true;
    dispatch({
      type: "START_ASSIGNMENT",
      clef: assignmentContext.assignment.activityConfig.clef,
      stageIndex: Number(assignmentContext.assignment.activityConfig.stage || 1) - 1,
    });
  }, [
    assignmentAttempt.startStatus,
    assignmentContext,
    dispatch,
    state.phase,
  ]);

  useEffect(() => {
    if (
      !assignmentContext.isAssignmentMode
      || state.phase !== "game"
      || !state.isDone
      || state.completed < assignmentWordTarget
      || assignmentAttempt.completionStatus !== "idle"
    ) {
      return;
    }

    assignmentAttempt.completeAttempt({
      summary: {
        score: state.score,
        streak: state.streak,
        clef: state.clef,
        stage: state.stageIndex + 1,
        completedWords: state.completed,
        targetWords: assignmentWordTarget,
        hintCountTotal: state.assignmentDiagnostics.hintCountTotal,
        hintCountByNote: state.assignmentDiagnostics.hintCountByNote,
        fourthTryFailuresByNote: state.assignmentDiagnostics.fourthTryFailuresByNote,
      },
      rawResult: {
        score: state.score,
        streak: state.streak,
        clef: state.clef,
        stage: state.stageIndex + 1,
        completedWords: state.completed,
        targetWords: assignmentWordTarget,
        assignmentDiagnostics: state.assignmentDiagnostics,
        message: state.message,
      },
    });
  }, [
    assignmentAttempt,
    assignmentContext.isAssignmentMode,
    assignmentWordTarget,
    state.clef,
    state.completed,
    state.isDone,
    state.message,
    state.phase,
    state.score,
    state.stageIndex,
    state.streak,
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

  if (assignmentContext.isAssignmentMode && (assignmentAttempt.completionStatus === "completed" || assignmentAttempt.completionStatus === "error")) {
    return (
      <StudentResultScreen
        title={assignmentAttempt.completionStatus === "completed" ? "Assignment complete" : "Result saved with an issue"}
        subtitle={assignmentContext.assignment?.title || "Note Speller"}
        currentAssignmentId={assignmentContext.assignment?.id || ""}
        summaryLines={[
          `Score: ${state.score}`,
          `Streak: ${state.streak}`,
          `Clef: ${state.clef}`,
          `Stage: ${state.stageIndex + 1}`,
          `Words: ${state.completed}/${assignmentWordTarget}`,
        ]}
        error={assignmentAttempt.completionStatus === "error" ? assignmentAttempt.error : ""}
      />
    );
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
    @keyframes cfall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
    @keyframes bfly{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes popIn{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px #f59e0b44}50%{box-shadow:0 0 20px #f59e0baa}}
    @keyframes shakeNote{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(5px)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-2px)}100%{transform:translateX(0)}}
    @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
    @keyframes fadeSlideOut{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}
    @keyframes puPop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
    @keyframes milestoneFlash{0%{opacity:1}100%{opacity:0}}
    @keyframes milestonePop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}15%{transform:translate(-50%,-50%) scale(1.3);opacity:1}30%{transform:translate(-50%,-50%) scale(1);opacity:1}85%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(0.8);opacity:0}}
    @keyframes milestoneSpin{0%{transform:scale(0) rotate(-180deg)}60%{transform:scale(1.3) rotate(15deg)}100%{transform:scale(1) rotate(0deg)}}
    @keyframes milestoneBurst{0%{transform:translate(-50%,-50%);opacity:1}100%{transform:translate(calc(-50% + var(--burst-x)),calc(-50% + var(--burst-y)));opacity:0}}
    @keyframes milestoneRing{0%{width:20px;height:20px;opacity:.8}100%{width:350px;height:350px;opacity:0}}
    @keyframes milestoneRainbow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}40%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.1)}}
    @keyframes catFloat{0%{transform:translateY(0);opacity:.7}50%{transform:translateY(-10px);opacity:.3}100%{transform:translateY(0);opacity:.7}}
    .songScroll::-webkit-scrollbar{display:none}
    .songScroll{-ms-overflow-style:none;scrollbar-width:none}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    button{touch-action:manipulation}
    html,body{overscroll-behavior:none}
    .note-speller-powerup-cost-badge{display:none}
    @media(max-width:480px){
      .noteGrid{gap:6px !important}
    }
    @media(max-width:380px){
      svg{max-width:100%}
    }
    @media(max-width:520px){
      .note-speller-theme-toggle{
        top:max(8px, calc(env(safe-area-inset-top, 0px) + 8px)) !important;
        right:8px !important;
        padding:8px 10px !important;
        min-width:40px;
        min-height:40px;
        font-size:12px !important;
      }
      .note-speller-theme-toggle-label{
        display:none;
      }
      .note-speller-game-hud{
        padding-right:56px;
      }
      .note-speller-status-row{
        margin-bottom:3px !important;
      }
      .note-speller-streak-powerups-cluster{
        display:flex;
        align-items:flex-start;
        justify-content:center;
        gap:0;
        width:auto;
        max-width:100%;
        position:relative;
      }
      .note-speller-streak-wrap{
        flex:0 1 auto;
        transform:scale(.88);
        transform-origin:center top;
        margin-top:-10px;
        margin-bottom:-22px;
        position:relative;
        z-index:1;
      }
      .note-speller-active-effects-row{
        gap:4px !important;
        margin-bottom:2px !important;
      }
      .note-speller-powerups-wrap{
        width:auto;
        max-width:none;
        margin-bottom:0;
        flex:0 0 auto;
        margin-left:-48px;
        margin-top:68px;
        position:relative;
        z-index:4;
      }
      .note-speller-powerups-bar{
        flex-direction:column;
        gap:5px !important;
        justify-content:flex-start !important;
        align-items:center !important;
        padding:6px 6px !important;
        margin-bottom:4px !important;
        border-radius:12px !important;
      }
      .note-speller-powerup-button{
        width:38px !important;
        height:38px !important;
        border-radius:10px !important;
        font-size:17px !important;
      }
      .note-speller-powerup-cost-badge{
        display:flex !important;
      }
      .note-speller-powerup-label{
        display:block;
        font-size:8px !important;
        margin-top:1px;
        min-height:10px;
      }
      .note-speller-powerup-label.is-priced{
        display:none;
      }
      .note-speller-powerup-label.is-owned{
        display:block;
      }
      .note-speller-powerup-tooltip{
        left:auto !important;
        right:calc(100% + 8px) !important;
        bottom:50% !important;
        transform:translateY(50%) !important;
        max-width:120px;
        white-space:normal !important;
        text-align:center;
      }
      .note-speller-powerup-tooltip-arrow{
        top:50% !important;
        left:100% !important;
        transform:translateY(-50%) !important;
        border-top:5px solid transparent !important;
        border-bottom:5px solid transparent !important;
        border-left:5px solid #1f2937 !important;
        border-right:none !important;
      }
      .note-speller-message-card{
        padding:6px 12px !important;
        margin-bottom:5px !important;
        font-size:12px !important;
        line-height:1.32 !important;
        max-width:420px !important;
      }
      .note-speller-keyboard-hint{
        display:none;
      }
    }
    .staffRow{display:flex;justify-content:center;flex-wrap:nowrap;border-radius:16px;padding:6px 4px;margin-bottom:6px;max-width:600px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
    @media(max-width:500px){.staffRow{transform:scale(0.82);transform-origin:center top;margin-bottom:-12px}}
    @media(max-width:380px){.staffRow{transform:scale(0.68);transform-origin:center top;margin-bottom:-22px}}
    `;
  const bgGradient = darkMode
    ? "linear-gradient(160deg,#0f172a 0%,#111827 45%,#1f1b3a 100%)"
    : "linear-gradient(160deg,#fefce8 0%,#f0fdf4 40%,#ede9fe 100%)";

  const withThemeToggle = (screen) => (
    <>
      <ThemeToggle darkMode={darkMode} onToggle={() => actions.setDarkMode((value) => !value)} fontFamily={ff} />
      {screen}
    </>
  );

  // ═══════════════════════════════════════
  //  MENU
  // ═══════════════════════════════════════
  if (state.phase === "menu") return withThemeToggle((
    <MenuScreen
      state={state}
      dispatch={dispatch}
      bgGradient={bgGradient}
      ff={ff}
      css={css}
      actions={actions}
      derived={derived}
    />
  ));

  // ═══════════════════════════════════════
  //  ARCADE
  // ═══════════════════════════════════════
  if (state.phase === "arcade") {
    return withThemeToggle((
      <ArcadeScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  if (state.phase === "timed") {
    return withThemeToggle((
      <TimedScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  // ═══════════════════════════════════════
  //  SONG MODE
  // ═══════════════════════════════════════
  if (state.phase === "song") {
    return withThemeToggle((
      <SongScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  // ═══════════════════════════════════════
  //  STORY MODE
  // ═══════════════════════════════════════
  if (state.phase === "story") {
    return withThemeToggle((
      <StoryScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  // ═══════════════════════════════════════
  //  SCRAMBLE MODE
  // ═══════════════════════════════════════
  if (state.phase === "scramble") {
    return withThemeToggle((
      <ScrambleScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  // ═══════════════════════════════════════
  //  PRACTICE WEAK NOTES
  // ═══════════════════════════════════════
  if (state.phase === "weak") {
    return withThemeToggle((
      <WeakNotesScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    ));
  }

  // ═══════════════════════════════════════
  //  NORMAL GAME
  // ═══════════════════════════════════════
  return withThemeToggle((
    <GameScreen
      state={state}
      dispatch={dispatch}
      bgGradient={bgGradient}
      ff={ff}
      css={css}
      actions={actions}
      derived={derived}
    />
  ));
}
