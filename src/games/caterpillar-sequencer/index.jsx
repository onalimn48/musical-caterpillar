import { useNavigate } from "react-router-dom";
import BeatBuilderScreen from "./components/BeatBuilderScreen.jsx";
import MenuScreen from "./components/MenuScreen.jsx";
import { useSequencerState } from "./state/useSequencerState.js";

export default function CaterpillarSequencer() {
  const navigate = useNavigate();
  const { state, derived, actions } = useSequencerState();

  if (state.phase === "menu") {
    return <MenuScreen onStart={actions.enterSequencer} />;
  }

  return <BeatBuilderScreen state={state} derived={derived} actions={actions} onBack={() => navigate("/caterpillar-studio")} />;
}
