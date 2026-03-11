import { FULL_CLEF_POSITION_RANGES, INSIDE_STAFF_POSITION_RANGES, NOTE_NAMES } from "./constants.js";

function positionToNoteName(pos) {
  const idx = ((pos % 7) + 7) % 7;
  return NOTE_NAMES[idx];
}

function positionToFullName(pos) {
  const idx = ((pos % 7) + 7) % 7;
  const octave = Math.floor(pos / 7) + 4;
  return `${NOTE_NAMES[idx]}${octave}`;
}

function getAccidentalNote(pos) {
  const baseName = positionToNoteName(pos);
  const baseOctave = Math.floor(pos / 7) + 4;
  const variants = {
    C: [{ accidental: "#", displayName: "C#", fullName: `C#${baseOctave}` }],
    D: [
      { accidental: "#", displayName: "D#", fullName: `D#${baseOctave}` },
      { accidental: "b", displayName: "Db", fullName: `C#${baseOctave}` },
    ],
    E: [{ accidental: "b", displayName: "Eb", fullName: `D#${baseOctave}` }],
    F: [{ accidental: "#", displayName: "F#", fullName: `F#${baseOctave}` }],
    G: [
      { accidental: "#", displayName: "G#", fullName: `G#${baseOctave}` },
      { accidental: "b", displayName: "Gb", fullName: `F#${baseOctave}` },
    ],
    A: [
      { accidental: "#", displayName: "A#", fullName: `A#${baseOctave}` },
      { accidental: "b", displayName: "Ab", fullName: `G#${baseOctave}` },
    ],
    B: [{ accidental: "b", displayName: "Bb", fullName: `A#${baseOctave}` }],
  };

  const choices = variants[baseName] || [];
  if (choices.length === 0) return null;
  return choices[Math.floor(Math.random() * choices.length)];
}

export function generateNote(clef, options = {}) {
  const {
    includeAccidentals = false,
    positionPool,
    rangeOverride,
    allowLedgerLines = true,
  } = options;
  const fallbackRange = allowLedgerLines
    ? FULL_CLEF_POSITION_RANGES[clef]
    : INSIDE_STAFF_POSITION_RANGES[clef];
  const positions = Array.isArray(positionPool) && positionPool.length > 0
    ? positionPool
    : buildPositionPool(rangeOverride || fallbackRange);
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const natural = {
    position: pos,
    name: positionToNoteName(pos),
    fullName: positionToFullName(pos),
    displayName: positionToNoteName(pos),
    accidental: null,
  };

  if (!includeAccidentals || Math.random() < 0.55) return natural;

  const accidentalNote = getAccidentalNote(pos);
  if (!accidentalNote) return natural;

  return {
    position: pos,
    name: accidentalNote.displayName,
    fullName: accidentalNote.fullName,
    displayName: accidentalNote.displayName,
    accidental: accidentalNote.accidental,
  };
}

export function buildPositionPool(range) {
  const positions = [];
  for (let pos = range.low; pos <= range.high; pos += 1) {
    positions.push(pos);
  }
  return positions;
}

export function getStaffLines(clef) {
  switch (clef) {
    case "Treble": return [2, 4, 6, 8, 10];
    case "Bass": return [-10, -8, -6, -4, -2];
    case "Alto": return [-4, -2, 0, 2, 4];
    default: return [2, 4, 6, 8, 10];
  }
}

export function posToY(pos, clef) {
  const lines = getStaffLines(clef);
  const middleLine = lines[2];
  const middleY = 150;
  return middleY - (pos - middleLine) * 8;
}

export function needsLedgerLines(pos, clef) {
  const lines = getStaffLines(clef);
  const lowest = lines[0];
  const highest = lines[4];
  const ledgers = [];

  if (pos < lowest) {
    for (let p = lowest - 2; p >= pos; p -= 2) ledgers.push(p);
  }
  if (pos > highest) {
    for (let p = highest + 2; p <= pos; p += 2) ledgers.push(p);
  }

  return ledgers;
}
