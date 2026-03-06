import ChordBuildScreen from "./components/screens/ChordBuildScreen.jsx";
import ChordEarScreen from "./components/screens/ChordEarScreen.jsx";
import ClassicScreen from "./components/screens/ClassicScreen.jsx";
import IntervalEarScreen from "./components/screens/IntervalEarScreen.jsx";
import MenuScreen from "./components/screens/MenuScreen.jsx";
import TrainingScreen from "./components/screens/TrainingScreen.jsx";
import { useChordSnowmanState } from "./state/useChordSnowmanState.js";
import WeakSpotsScreen from "./components/screens/WeakSpotsScreen.jsx";

export default function IntervalChordGame() {
  const { state, actions } = useChordSnowmanState();

  switch (state.phase) {
    case "training":
      return <TrainingScreen state={state} actions={actions} />;
    case "classic":
      return <ClassicScreen state={state} actions={actions} />;
    case "intervalEar":
      return <IntervalEarScreen state={state} actions={actions} />;
    case "weakSpots":
      return <WeakSpotsScreen state={state} actions={actions} />;
    case "chordEar":
      return <ChordEarScreen state={state} actions={actions} />;
    case "chord":
      return <ChordBuildScreen state={state} actions={actions} />;
    case "menu":
    default:
      return <MenuScreen state={state} actions={actions} />;
  }
}
