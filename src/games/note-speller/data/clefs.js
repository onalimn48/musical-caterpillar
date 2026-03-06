export const CLEFS = ["treble", "alto", "bass"];

export const CLEF_META = {
  treble: {
    id: "treble",
    name: "Treble",
    title: "Treble Clef",
    symbol: "𝄞",
    modeLabel: "Treble",
  },
  alto: {
    id: "alto",
    name: "Alto",
    title: "Alto Clef",
    symbol: "𝄡",
    modeLabel: "Alto",
  },
  bass: {
    id: "bass",
    name: "Bass",
    title: "Bass Clef",
    symbol: "𝄢",
    modeLabel: "Bass",
  },
};

export const CLEF_HINTS = {
  treble: {
    lines: ["E", "G", "B", "D", "F"],
    spaces: ["F", "A", "C", "E"],
    lineMnemonic: "Every Good Burger Deserves Fries",
    spaceMnemonic: "FACE",
  },
  alto: {
    lines: ["F", "A", "C", "E", "G"],
    spaces: ["G", "B", "D", "F"],
    lineMnemonic: "Frogs And Cats Eat Grass",
    spaceMnemonic: "Good Birds Don't Fly",
  },
  bass: {
    lines: ["G", "B", "D", "F", "A"],
    spaces: ["A", "C", "E", "G"],
    lineMnemonic: "Good Bears Do Find Apples",
    spaceMnemonic: "All Cows Eat Grass",
  },
};

export function getClefMeta(clef = "treble") {
  return CLEF_META[clef] || CLEF_META.treble;
}

export function getClefSymbol(clef = "treble") {
  return getClefMeta(clef).symbol;
}

export function getClefTitle(clef = "treble") {
  return getClefMeta(clef).title;
}

export function getClefModeLabel(clef = "treble") {
  return getClefMeta(clef).modeLabel;
}
