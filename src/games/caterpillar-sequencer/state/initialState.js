export const SEQUENCER_LANES = [
  { id: "kick", label: "Kick", icon: "🥁", color: "#f59e0b" },
  { id: "snare", label: "Snare", icon: "🍂", color: "#f472b6" },
  { id: "hat", label: "Hat", icon: "✨", color: "#67e8f9" },
];

export const STARTER_PATTERNS = {
  trail: {
    kick: [true, false, false, false, true, false, false, false],
    snare: [false, false, true, false, false, false, true, false],
    hat: [true, true, true, true, true, true, true, true],
  },
  bounce: {
    kick: [true, false, true, false, true, false, false, false],
    snare: [false, false, true, false, false, false, true, false],
    hat: [true, false, true, false, true, false, true, false],
  },
  empty: {
    kick: [false, false, false, false, false, false, false, false],
    snare: [false, false, false, false, false, false, false, false],
    hat: [false, false, false, false, false, false, false, false],
  },
};

export const STEP_COUNT = 8;
export const AVAILABLE_NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B", "C"];
export const OCTAVE_OPTIONS = [3, 4, 5];
export const STARTER_MELODY = ["C4", null, null, "E4", null, "G4", null, "D4"];
export const SYNTH_LANE_TEMPLATES = [
  { id: "bloom", label: "Bloom", color: "#f9a8d4", icon: "🌸", octave: 4 },
  { id: "dew", label: "Dew", color: "#93c5fd", icon: "💧", octave: 3 },
];

export function createEmptySynthLane(template, patchId = "") {
  return {
    ...template,
    patchId,
    steps: Array.from({ length: STEP_COUNT }, () => null),
  };
}

export function createStarterSynthLanes(firstPatchId = "", secondPatchId = "") {
  return [
    {
      ...SYNTH_LANE_TEMPLATES[0],
      patchId: firstPatchId,
      steps: [...STARTER_MELODY],
    },
    {
      ...SYNTH_LANE_TEMPLATES[1],
      patchId: secondPatchId,
      steps: Array.from({ length: STEP_COUNT }, () => null),
    },
  ];
}

export const initialState = {
  phase: "menu",
  tempo: 104,
  stepCount: STEP_COUNT,
  currentStep: 0,
  isPlaying: false,
  audioReady: false,
  pattern: STARTER_PATTERNS.trail,
  synthLanes: createStarterSynthLanes(),
  savedPatches: [],
  savedProjects: [],
  activePresetId: "trail",
};
