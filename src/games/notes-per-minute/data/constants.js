export const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
export const CHROMATIC_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const ACCIDENTAL_DISPLAY_NAMES = ["C#", "Db", "D#", "Eb", "F#", "Gb", "G#", "Ab", "A#", "Bb"];

export const CLEF_RANGES = {
  Treble: { low: 0, high: 16, clefName: "Treble", clefSymbol: "𝄞" },
  Bass: { low: -12, high: 4, clefName: "Bass", clefSymbol: "𝄢" },
  Alto: { low: -6, high: 10, clefName: "Alto", clefSymbol: "𝄡" },
};

export const GAME_DURATION = 60;
export const QUEUE_SIZE = 8;
export const NOTE_SPACING = 90;
export const STAFF_LEFT = 100;

export const MIDI_NOTE_NAMES = CHROMATIC_NOTE_NAMES;
