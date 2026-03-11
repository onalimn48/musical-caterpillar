export const DEFAULT_PATCH = {
  oscType: "sine",
  cutoff: 1600,
  resonance: 1.2,
  attack: 0.03,
  decay: 0.16,
  sustain: 0.68,
  release: 0.28,
  volume: 0.22,
};

export const NOTE_BUTTONS = ["C4", "D4", "E4", "G4", "A4", "C5"];

export const LESSON_CARDS = [
  {
    id: "shape",
    title: "Shape the Voice",
    summary: "Swap between smooth, pointed, chunky, and spiky wave shapes.",
  },
  {
    id: "brightness",
    title: "Open the Garden",
    summary: "Hear how a filter makes the caterpillar darker or brighter.",
  },
  {
    id: "tail",
    title: "Grow the Tail",
    summary: "Short notes bounce. Long releases leave a glowing trail.",
  },
];

export const initialState = {
  phase: "menu",
  patch: DEFAULT_PATCH,
  savedPatches: [],
  audioReady: false,
  activeLessonId: LESSON_CARDS[0].id,
  lastNote: "C4",
  lastNoteIndex: 0,
  singing: false,
  wavePhase: 0,
};
