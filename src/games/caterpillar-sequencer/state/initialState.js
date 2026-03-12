export const SEQUENCER_LANES = [
  { id: "kick", label: "Kick", icon: "🥁", color: "#f59e0b" },
  { id: "snare", label: "Snare", icon: "🍂", color: "#f472b6" },
  { id: "hat", label: "Hat", icon: "✨", color: "#67e8f9" },
];

export const DRUM_PATCH_DEFAULTS = {
  kick: {
    oscType: "sine",
    cutoff: 1500,
    attack: 0.03,
    release: 0.24,
    volume: 0.95,
  },
  snare: {
    oscType: "triangle",
    cutoff: 1300,
    attack: 0.04,
    release: 0.14,
    volume: 0.5,
  },
  hat: {
    oscType: "square",
    cutoff: 5200,
    attack: 0.015,
    release: 0.05,
    volume: 0.18,
  },
};

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
export const GATE_OPTIONS = ["short", "medium", "long"];
export const VARIANT_IDS = ["A", "B"];
export const SECTION_LABELS = ["Start", "Middle", "End"];
export const STARTER_MELODY = ["C4", null, null, "E4", null, "G4", null, "D4"];
export const SYNTH_LANE_TEMPLATES = [
  { id: "bloom", label: "Bloom", color: "#f9a8d4", icon: "🌸", octave: 4 },
  { id: "dew", label: "Dew", color: "#93c5fd", icon: "💧", octave: 3 },
];

export function createMelodyStep(noteName, overrides = {}) {
  if (!noteName) return null;

  return {
    noteName,
    gate: GATE_OPTIONS.includes(overrides.gate) ? overrides.gate : "medium",
    accent: Boolean(overrides.accent),
  };
}

export function normalizeMelodyStep(step) {
  if (!step) return null;

  if (typeof step === "string") {
    return createMelodyStep(step);
  }

  if (typeof step === "object" && typeof step.noteName === "string" && step.noteName) {
    return createMelodyStep(step.noteName, step);
  }

  return null;
}

export function cloneMelodySteps(steps = []) {
  return steps.map((step) => {
    const normalizedStep = normalizeMelodyStep(step);
    return normalizedStep ? { ...normalizedStep } : null;
  });
}

export function createEmptySynthLane(template, patchId = "") {
  return {
    ...template,
    patchId,
    steps: Array.from({ length: STEP_COUNT }, () => null),
  };
}

export function clonePattern(pattern) {
  return Object.fromEntries(
    Object.entries(pattern).map(([laneId, steps]) => [laneId, [...steps]]),
  );
}

export function cloneDrumPatches(drumPatches = DRUM_PATCH_DEFAULTS) {
  return Object.fromEntries(
    Object.entries(DRUM_PATCH_DEFAULTS).map(([laneId, patch]) => [
      laneId,
      {
        ...patch,
        ...(drumPatches?.[laneId] || {}),
      },
    ]),
  );
}

export function createStarterSynthLanes(firstPatchId = "", secondPatchId = "") {
  return [
    {
      ...SYNTH_LANE_TEMPLATES[0],
      patchId: firstPatchId,
      steps: cloneMelodySteps(STARTER_MELODY),
    },
    {
      ...SYNTH_LANE_TEMPLATES[1],
      patchId: secondPatchId,
      steps: Array.from({ length: STEP_COUNT }, () => null),
    },
  ];
}

export function createLoopVariant({
  pattern = STARTER_PATTERNS.trail,
  drumPatches = DRUM_PATCH_DEFAULTS,
  synthLanes = createStarterSynthLanes(),
} = {}) {
  return {
    pattern: clonePattern(pattern),
    drumPatches: cloneDrumPatches(drumPatches),
    synthLanes: synthLanes.map((lane) => ({
      ...lane,
      steps: cloneMelodySteps(lane.steps),
    })),
  };
}

export function createEmptyLoopVariant() {
  return createLoopVariant({
    pattern: STARTER_PATTERNS.empty,
    drumPatches: DRUM_PATCH_DEFAULTS,
    synthLanes: SYNTH_LANE_TEMPLATES.map((template) => createEmptySynthLane(template)),
  });
}

export const initialState = {
  phase: "menu",
  tempo: 104,
  stepCount: STEP_COUNT,
  currentStep: 0,
  currentSectionIndex: 0,
  isPlaying: false,
  audioReady: false,
  pattern: clonePattern(STARTER_PATTERNS.empty),
  drumPatches: cloneDrumPatches(DRUM_PATCH_DEFAULTS),
  synthLanes: createStarterSynthLanes(),
  loopVariants: {
    A: createLoopVariant({
      pattern: STARTER_PATTERNS.empty,
      drumPatches: DRUM_PATCH_DEFAULTS,
      synthLanes: createStarterSynthLanes(),
    }),
    B: createEmptyLoopVariant(),
  },
  activeVariantId: "A",
  playbackMode: "arrangement",
  playbackVariantId: "A",
  arrangementSections: ["A", "A", "B"],
  savedPatches: [],
  savedProjects: [],
  activeProjectId: "",
  activePresetId: "empty",
  selectedLaneId: "kick",
  activeLessonId: "march-of-the-caterpillar",
  lessonArmed: false,
  progressLoaded: false,
  completedLessonIds: [],
  lessonToast: "",
};
