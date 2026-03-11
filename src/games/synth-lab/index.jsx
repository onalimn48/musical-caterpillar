import { useNavigate } from "react-router-dom";
import ExploreScreen from "./components/ExploreScreen.jsx";
import MenuScreen from "./components/MenuScreen.jsx";
import { useSynthLabState } from "./state/useSynthLabState.js";

export default function SynthLab() {
  const navigate = useNavigate();
  const { state, derived, actions } = useSynthLabState();

  if (state.phase === "menu") {
    return <MenuScreen onStart={actions.wakeAudioAndEnterLab} />;
  }

  return <ExploreScreen state={state} derived={derived} actions={actions} onBack={() => navigate("/caterpillar-studio")} />;
}
