export const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
export const CHROMATIC_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const ACCIDENTAL_DISPLAY_NAMES = ["C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb"];

export const CLEF_META = {
  Treble: { clefName: "Treble", clefSymbol: "𝄞" },
  Bass: { clefName: "Bass", clefSymbol: "𝄢" },
  Alto: { clefName: "Alto", clefSymbol: "𝄡" },
};
export const SUPPORTED_CLEFS = Object.keys(CLEF_META);

export const FULL_CLEF_POSITION_RANGES = {
  Treble: { low: 0, high: 16 },
  Bass: { low: -12, high: 4 },
  Alto: { low: -6, high: 10 },
};

export const INSIDE_STAFF_POSITION_RANGES = {
  Treble: { low: 2, high: 10 },
  Bass: { low: -10, high: -2 },
  Alto: { low: -4, high: 4 },
};

export const DEFAULT_DURATION_SECONDS = 60;
export const PRACTICE_DURATION_OPTIONS = [45, 60, 90];
export const QUEUE_SIZE = 8;
export const NOTE_SPACING = 90;
export const STAFF_LEFT = 100;
export const NPM_GAME_ID = "notes-per-minute";
export const NPM_BENCHMARK_QUALIFICATION_ACCURACY = 85;
export const NPM_FLUENCY_FORMULA_VERSION = "fluency-v2";

export const MIDI_NOTE_NAMES = CHROMATIC_NOTE_NAMES;
