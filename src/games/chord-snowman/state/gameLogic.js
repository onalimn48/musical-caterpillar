import {
  CHROMATIC,
  CHROMATIC_SHARP,
  NOTE_ORDER,
  SEMITONES,
  SHARP_NAMES,
  FLAT_NAMES,
  FREQ,
  INTERVAL_LETTER_SPAN,
} from "../data/musicTheory.js";
import {
  INTERVAL_DB,
  CLASSIC_LEVELS,
  STREAK_MILESTONES,
} from "../data/intervals.js";
import { CHORD_TYPES, CHORD_EAR_LEVELS } from "../data/chords.js";

export function displayName(n) {
  return SHARP_NAMES[n] ? `${n}/${SHARP_NAMES[n]}` : FLAT_NAMES[n] ? `${FLAT_NAMES[n]}/${n}` : n;
}

export function shortDisplay(n) { return n; }
export function isSharp(n) { return n.includes("#"); }
export function isFlat(n) { return n.includes("b") && n !== "B"; }
export function noteLetter(n) { return n[0]; }

export function enharmonic(n) {
  return SHARP_NAMES[n] || FLAT_NAMES[n] || null;
}

export function isEnharmonicMatch(note, target) {
  return note === target || note === enharmonic(target) || enharmonic(note) === target;
}

export function getCorrectNoteHighlights(note, target) {
  const highlights = { [note]: "correct" };
  const noteEnh = enharmonic(note);
  if (noteEnh) highlights[noteEnh] = "correct";
  const targetEnh = enharmonic(target);
  if (targetEnh) highlights[targetEnh] = "correct";
  highlights[target] = "correct";
  return highlights;
}

export function noteToMidi(name, octave) {
  return SEMITONES[name] + (octave + 1) * 12;
}

export function midiToChromatic(midi) {
  const oct = Math.floor(midi / 12) - 1;
  const idx = ((midi % 12) + 12) % 12;
  return { name: CHROMATIC[idx], octave: oct };
}

export function midiToNote(midi, preferSharps) {
  const oct = Math.floor(midi / 12) - 1;
  const idx = ((midi % 12) + 12) % 12;
  const name = preferSharps ? CHROMATIC_SHARP[idx] : CHROMATIC[idx];
  return { name, octave: oct };
}

export function getFreq(name, octave) {
  const key = name + octave;
  if (FREQ[key]) return FREQ[key];
  const semi = SEMITONES[name];
  if (semi !== undefined) {
    const flatName = CHROMATIC[semi];
    if (FREQ[flatName + octave]) return FREQ[flatName + octave];
  }
  return 440;
}

export function spellInterval(startName, startOct, intervalIdx, dir) {
  const iv = INTERVAL_DB[intervalIdx];
  const halfSteps = iv.half;
  const letterSpan = INTERVAL_LETTER_SPAN[intervalIdx];
  const startLetter = startName[0];
  const startLetterIdx = NOTE_ORDER.indexOf(startLetter);

  const letterSteps = letterSpan - 1;
  let targetLetterIdx;
  let targetOct;
  if (dir === "up") {
    targetLetterIdx = (startLetterIdx + letterSteps) % 7;
    targetOct = startOct + Math.floor((startLetterIdx + letterSteps) / 7);
  } else {
    targetOct = startOct;
    let idx = startLetterIdx;
    for (let i = 0; i < letterSteps; i++) {
      idx--;
      if (idx < 0) {
        idx = 6;
        targetOct--;
      }
    }
    targetLetterIdx = idx;
  }
  const targetLetter = NOTE_ORDER[targetLetterIdx];

  const startMidi = noteToMidi(startName, startOct);
  const targetMidi = dir === "up" ? startMidi + halfSteps : startMidi - halfSteps;
  const naturalSemitones = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const targetNaturalMidi = naturalSemitones[targetLetter] + (targetOct + 1) * 12;
  const diff = targetMidi - targetNaturalMidi;

  let targetName;
  if (diff === 0) targetName = targetLetter;
  else if (diff === 1) targetName = targetLetter + "#";
  else if (diff === -1) targetName = targetLetter + "b";
  else return null;

  if (targetName === "B#" || targetName === "Cb" || targetName === "E#" || targetName === "Fb") return null;

  const actualTargetMidi = noteToMidi(targetName, targetOct);
  if (Math.abs(actualTargetMidi - startMidi) !== halfSteps) return null;
  if (targetOct < 2 || targetOct > 5) return null;

  return { name: targetName, octave: targetOct };
}

export function genIntervalQ(intervalIdx, direction, accidentals = false, previousQuestionKey = null) {
  const iv = INTERVAL_DB[intervalIdx];
  const dir = direction || (Math.random() < 0.5 ? "up" : "down");
  const startPool = [...CHROMATIC, ...CHROMATIC_SHARP.filter(n => n.includes("#"))];
  const uniquePool = [...new Set(startPool)];

  let attempts = 0;
  while (attempts < 400) {
    attempts++;
    const startName = uniquePool[Math.floor(Math.random() * uniquePool.length)];
    const startOct = dir === "down" ? (Math.random() < 0.5 ? 4 : 5) : (Math.random() < 0.5 ? 3 : 4);
    const target = spellInterval(startName, startOct, intervalIdx, dir);
    if (!target) continue;
    if (!accidentals && !NOTE_ORDER.includes(target.name)) continue;

    const key = `${startName}${startOct}${target.name}${target.octave}${dir}`;
    if (previousQuestionKey === key) continue;
    return {
      question: {
        interval: iv,
        dir,
        startName,
        startOct,
        targetName: target.name,
        targetOct: target.octave,
      },
      questionKey: key,
    };
  }

  const fbDir = direction || "up";
  const fbStart = fbDir === "up" ? 4 : 5;
  const fbMidi = noteToMidi("C", fbStart) + (fbDir === "up" ? iv.half : -iv.half);
  const fbTarget = midiToChromatic(fbMidi);
  return {
    question: {
      interval: iv,
      dir: fbDir,
      startName: "C",
      startOct: fbStart,
      targetName: fbTarget.name,
      targetOct: fbTarget.octave,
    },
    questionKey: null,
  };
}

export function genClassicQ(level, previousIntervalIdx = -1, previousQuestionKey = null) {
  const lv = CLASSIC_LEVELS[level];
  let ivIdx;
  if (lv.intervals.length > 1) {
    let tries = 0;
    do {
      ivIdx = lv.intervals[Math.floor(Math.random() * lv.intervals.length)];
      tries++;
    } while (ivIdx === previousIntervalIdx && tries < 20);
  } else {
    ivIdx = lv.intervals[0];
  }
  const result = genIntervalQ(ivIdx, Math.random() < 0.5 ? "up" : "down", lv.accidentals, previousQuestionKey);
  return {
    ...result,
    intervalIdx: ivIdx,
  };
}

export function getChordNotes(rootName, rootOct, type) {
  const rootMidi = noteToMidi(rootName, rootOct);
  return type.intervals.map(hs => midiToChromatic(rootMidi + hs));
}

export function genChordEarQ(level, previousTypeIdx = -1) {
  const lv = CHORD_EAR_LEVELS[level];
  let typeIdx;
  if (lv.types.length > 1) {
    let tries = 0;
    do {
      typeIdx = lv.types[Math.floor(Math.random() * lv.types.length)];
      tries++;
    } while (typeIdx === previousTypeIdx && tries < 20);
  } else {
    typeIdx = lv.types[0];
  }
  const type = CHORD_TYPES[typeIdx];
  const root = CHROMATIC[Math.floor(Math.random() * CHROMATIC.length)];
  const rootOct = Math.random() < 0.5 ? 3 : 4;
  const notes = type.intervals.map(hs => midiToChromatic(noteToMidi(root, rootOct) + hs));
  return {
    question: { root, rootOct, typeIdx, type, notes, displayName: root + type.symbol },
    typeIdx,
  };
}

const VALID_CHORDS = [];
NOTE_ORDER.forEach(letter => {
  CHORD_TYPES.slice(0, 2).forEach(type => {
    const notes = getChordNotes(letter, 4, type);
    if (notes.every(n => NOTE_ORDER.includes(n.name))) {
      VALID_CHORDS.push({ root: letter, type });
    }
  });
});

export function genChordQ() {
  const chord = VALID_CHORDS[Math.floor(Math.random() * VALID_CHORDS.length)];
  const rootOct = Math.random() < 0.5 ? 3 : 4;
  const notes = getChordNotes(chord.root, rootOct, chord.type);
  return {
    root: chord.root,
    rootOct,
    type: chord.type,
    third: notes[1],
    fifth: notes[2],
    displayName: chord.root + chord.type.symbol,
  };
}

const POS_MAP = {};
(() => {
  const base = { C: -2, D: -1, E: 0, F: 1, G: 2, A: 3, B: 4 };
  for (let oct = 2; oct <= 6; oct++) {
    const offset = (oct - 4) * 7;
    NOTE_ORDER.forEach(n => {
      POS_MAP[n + oct] = base[n] + offset;
    });
  }
  const allAccidentals = ["Cb", "C#", "Db", "D#", "Eb", "E#", "Fb", "F#", "Gb", "G#", "Ab", "A#", "Bb", "B#"];
  for (let oct = 2; oct <= 6; oct++) {
    allAccidentals.forEach(acc => {
      const letter = acc[0];
      POS_MAP[acc + oct] = base[letter] + (oct - 4) * 7;
    });
  }
})();

export function getNotePos(name, oct) {
  return POS_MAP[name + oct] ?? 0;
}

export function getLedgers(pos) {
  const lines = [];
  if (pos <= -1) {
    for (let p = -2; p >= (pos % 2 === 0 ? pos : pos + 1); p -= 2) lines.push(p);
  }
  if (pos >= 9) {
    for (let p = 10; p <= (pos % 2 === 0 ? pos : pos - 1); p += 2) lines.push(p);
  }
  return lines;
}

export function isAccidental(name) {
  return name.length > 1;
}

export function accidentalSymbol(name) {
  return isSharp(name) ? "♯" : "♭";
}

export function getStreakTier(streak) {
  let tier = null;
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.at) tier = m;
  }
  return tier;
}

export function getStreakBonus(streak) {
  if (streak >= 20) return { mult: 3, label: "3×" };
  if (streak >= 10) return { mult: 2, label: "2×" };
  if (streak >= 5) return { mult: 1, bonus: 4, label: "+4" };
  if (streak >= 3) return { mult: 1, bonus: 2, label: "+2" };
  return { mult: 1, bonus: 0, label: "" };
}

export function calcScore(streak) {
  const b = getStreakBonus(streak);
  const base = 10;
  return (base + (b.bonus || 0)) * (b.mult || 1);
}

export function dropStreak(current) {
  if (current <= 0) return 0;
  let prev = 0;
  for (const m of STREAK_MILESTONES) {
    if (m.at < current) prev = m.at;
  }
  return Math.max(0, prev - 1);
}

export function getAccuracyPercent(correct, total) {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

export function countCompletedItems(record, excludedKeys = []) {
  const excluded = new Set(excludedKeys);
  return Object.keys(record).filter((key) => !excluded.has(key) && record[key]).length;
}

export function hasMetThreshold(value, threshold) {
  return value >= threshold;
}

export function shouldUnlockClassicLevel(correctInLevel, currentLevel, unlockedCount, neededPerLevel, totalLevels) {
  return correctInLevel >= neededPerLevel && currentLevel + 1 < totalLevels && currentLevel + 1 >= unlockedCount;
}

export function getWeakIntervals(intervalStats) {
  const entries = INTERVAL_DB.map((iv, i) => {
    const stats = intervalStats[i];
    if (!stats || (stats.correct + stats.wrong) < 3) return null;
    const total = stats.correct + stats.wrong;
    const pct = getAccuracyPercent(stats.correct, total);
    return { idx: i, pct, total, wrong: stats.wrong };
  }).filter(Boolean);

  if (entries.length === 0) return [];

  const weak = entries.filter((entry) => entry.pct < 75);
  if (weak.length >= 2) {
    return weak.sort((a, b) => a.pct - b.pct).map((entry) => entry.idx);
  }

  return entries
    .sort((a, b) => a.pct - b.pct)
    .slice(0, Math.max(2, Math.min(4, entries.length)))
    .map((entry) => entry.idx);
}
