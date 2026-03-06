export const STAFF_W = 100;
export const STAFF_H = 155;
export const TOP_LINE_Y = 52;
export const LINE_GAP = 14;

const DIATONIC_ORDER = ["C", "D", "E", "F", "G", "A", "B"];
const C4_INDEX = 4 * DIATONIC_ORDER.length;

const CLEF_REFERENCE_POSITIONS = {
  treble: {
    middleC: -2,
    standard: { A: "A4", B: "B4", C: "C5", D: "D5", E: "E4", F: "F4", G: "G4" },
    extended: { A: "A3", B: "B5", C: "C4", D: "D6", E: "E6", F: "F3", G: "G5" },
    songFallback: { C: "C4", D: "D4", E: "E4", F: "F4", G: "G4", A: "A4", B: "B4" },
  },
  alto: {
    middleC: 4,
    standard: { A: "A3", B: "B3", C: "C4", D: "D4", E: "E4", F: "F3", G: "G3" },
    extended: { A: "A2", B: "B4", C: "C4", D: "D5", E: "E5", F: "F2", G: "G4" },
    songFallback: { C: "C4", D: "D4", E: "E4", F: "F3", G: "G3", A: "A3", B: "B3" },
  },
  bass: {
    middleC: 10,
    standard: { A: "A2", B: "B2", C: "C3", D: "D3", E: "E3", F: "F3", G: "G2" },
    extended: { A: "A1", B: "B3", C: "C4", D: "D4", E: "E4", F: "F4", G: "G4" },
    songFallback: { C: "C3", D: "D3", E: "E3", F: "F3", G: "G2", A: "A2", B: "B2" },
  },
};

function getClefReference(clef = "treble") {
  return CLEF_REFERENCE_POSITIONS[clef] || CLEF_REFERENCE_POSITIONS.treble;
}

function getDiatonicIndex(name, octave) {
  return octave * DIATONIC_ORDER.length + DIATONIC_ORDER.indexOf(name);
}

function parsePitch(noteName) {
  const name = noteName.charAt(0);
  const octave = Number.parseInt(noteName.slice(1), 10);
  return { name, octave: Number.isNaN(octave) ? 4 : octave };
}

export function getRenderedNoteName(note, clef = "treble", options = {}) {
  const { extended = false, songMode = false } = options;
  if (songMode) {
    if (note.length > 1 && Number.isFinite(Number.parseInt(note.slice(1), 10))) return note;
    return getClefReference(clef).songFallback[note] || getClefReference(clef).songFallback.C;
  }

  const mode = extended ? "extended" : "standard";
  return getClefReference(clef)[mode][note] || getClefReference(clef).standard.C;
}

export function getNotePosition(note, clef = "treble", options = {}) {
  const rendered = getRenderedNoteName(note, clef, options);
  const { name, octave } = parsePitch(rendered);
  const middleC = getClefReference(clef).middleC;
  return getDiatonicIndex(name, octave) - C4_INDEX + middleC;
}

export function getPositionY(pos) {
  return TOP_LINE_Y + 4 * LINE_GAP - pos * (LINE_GAP / 2);
}

export function getLedgerLines(pos) {
  const lines = [];
  if (pos <= -1) {
    const end = pos % 2 === 0 ? pos : pos + 1;
    for (let p = -2; p >= end; p -= 2) lines.push(p);
  }
  if (pos >= 9) {
    const end = pos % 2 === 0 ? pos : pos - 1;
    for (let p = 10; p <= end; p += 2) lines.push(p);
  }
  return lines;
}
