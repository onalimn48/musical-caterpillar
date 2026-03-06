// Architecture: index.jsx is composition only; state/ holds reducers, state machines, and orchestration hooks;
// hooks/ holds browser/device integrations like MIDI, keyboard, and timers; data/ holds static configuration
// and content; components/ holds presentational UI components.
import { useNoteSpellerState } from "./state/useNoteSpellerState.js";
import ArcadeScreen from "./components/screens/ArcadeScreen.jsx";
import GameScreen from "./components/screens/GameScreen.jsx";
import MenuScreen from "./components/screens/MenuScreen.jsx";
import SongScreen from "./components/screens/SongScreen.jsx";
import StoryScreen from "./components/screens/StoryScreen.jsx";
import ScrambleScreen from "./components/screens/ScrambleScreen.jsx";
import WeakNotesScreen from "./components/screens/WeakNotesScreen.jsx";

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const ff = "'Fredoka',sans-serif";
  const { state, dispatch, actions, derived } = useNoteSpellerState();

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
    @media(max-width:480px){
      .noteGrid{gap:6px !important}
    }
    @media(max-width:380px){
      svg{max-width:100%}
    }
    .staffRow{display:flex;justify-content:center;flex-wrap:nowrap;border-radius:16px;padding:6px 4px;margin-bottom:6px;max-width:600px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
    @media(max-width:500px){.staffRow{transform:scale(0.82);transform-origin:center top;margin-bottom:-12px}}
    @media(max-width:380px){.staffRow{transform:scale(0.68);transform-origin:center top;margin-bottom:-22px}}
    `;
  const bgGradient = "linear-gradient(160deg,#fefce8 0%,#f0fdf4 40%,#ede9fe 100%)";

  // ═══════════════════════════════════════
  //  MENU
  // ═══════════════════════════════════════
  if (state.phase === "menu") return (
    <MenuScreen
      state={state}
      dispatch={dispatch}
      bgGradient={bgGradient}
      ff={ff}
      css={css}
      actions={actions}
      derived={derived}
    />
  );

  // ═══════════════════════════════════════
  //  ARCADE
  // ═══════════════════════════════════════
  if (state.phase === "arcade") {
    return (
      <ArcadeScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    );
  }

  // ═══════════════════════════════════════
  //  SONG MODE
  // ═══════════════════════════════════════
  if (state.phase === "song") {
    return (
      <SongScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    );
  }

  // ═══════════════════════════════════════
  //  STORY MODE
  // ═══════════════════════════════════════
  if (state.phase === "story") {
    return (
      <StoryScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    );
  }

  // ═══════════════════════════════════════
  //  SCRAMBLE MODE
  // ═══════════════════════════════════════
  if (state.phase === "scramble") {
    return (
      <ScrambleScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    );
  }

  // ═══════════════════════════════════════
  //  PRACTICE WEAK NOTES
  // ═══════════════════════════════════════
  if (state.phase === "weak") {
    return (
      <WeakNotesScreen
        state={state}
        dispatch={dispatch}
        ff={ff}
        css={css}
        actions={actions}
        derived={derived}
      />
    );
  }

  // ═══════════════════════════════════════
  //  NORMAL GAME
  // ═══════════════════════════════════════
  return (
    <GameScreen
      state={state}
      dispatch={dispatch}
      bgGradient={bgGradient}
      ff={ff}
      css={css}
      actions={actions}
      derived={derived}
    />
  );
}
