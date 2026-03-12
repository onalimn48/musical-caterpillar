export const DEFAULT_PATCH = {
  oscType: "sine",
  cutoff: 1600,
  resonance: 1.2,
  noiseMix: 0,
  lfoDepth: 0,
  lfoRate: 1.8,
  attack: 0.03,
  decay: 0.16,
  sustain: 0.68,
  release: 0.28,
  volume: 0.22,
};

export const NOTE_BUTTONS = ["C", "D", "E", "G", "A", "C"];
export const OCTAVE_OPTIONS = [2, 3, 4, 5];
export const SHAPE_MISSION_TYPES = ["sine", "triangle", "square", "sawtooth"];

export const initialState = {
  phase: "menu",
  patch: DEFAULT_PATCH,
  savedPatches: [],
  audioReady: false,
  activeLessonId: "shape",
  octave: 4,
  lastNote: "C4",
  lastNoteIndex: 0,
  singing: false,
  wavePhase: 0,
  drawerOpen: false,
  lastSavedPatchName: "",
  draftPatchName: "",
  draftRoleTag: "",
  heardShapeTypes: [],
  lessonArmed: false,
  lessonPreviewBeforeChange: false,
  lessonPreviewCount: 0,
  progressLoaded: false,
  completedLessonIds: [],
  lessonToast: "",
};
