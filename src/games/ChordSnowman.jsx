import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
//  CHORD SNOWMAN — Interval & Chord Builder
// ═══════════════════════════════════════════════════════════

const ff = "'Fredoka','Nunito',sans-serif";

// ═══ WEB AUDIO ═══
const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
let _sharedCtx = null;
function getCtx() {
  if (!AudioCtxClass) return null;
  if (!_sharedCtx || _sharedCtx.state === "closed") _sharedCtx = new AudioCtxClass();
  if (_sharedCtx.state === "suspended") _sharedCtx.resume().catch(() => {});
  return _sharedCtx;
}

const FREQ = {
  "C2":65.41,"Db2":69.30,"D2":73.42,"Eb2":77.78,"E2":82.41,"F2":87.31,"Gb2":92.50,"G2":98.00,"Ab2":103.83,"A2":110.0,"Bb2":116.54,"B2":123.47,
  "C3":130.81,"Db3":138.59,"D3":146.83,"Eb3":155.56,"E3":164.81,"F3":174.61,"Gb3":185.00,"G3":196.00,"Ab3":207.65,"A3":220.0,"Bb3":233.08,"B3":246.94,
  "C4":261.63,"Db4":277.18,"D4":293.66,"Eb4":311.13,"E4":329.63,"F4":349.23,"Gb4":369.99,"G4":392.00,"Ab4":415.30,"A4":440.0,"Bb4":466.16,"B4":493.88,
  "C5":523.25,"Db5":554.37,"D5":587.33,"Eb5":622.25,"E5":659.25,"F5":698.46,"Gb5":739.99,"G5":783.99,"Ab5":830.61,"A5":880.0,"Bb5":932.33,"B5":987.77,
  "C6":1046.50,"D6":1174.66,"E6":1318.51,"F6":1396.91,"G6":1567.98,
};

// Full chromatic note names (using flats for display)
const CHROMATIC = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
const CHROMATIC_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const NOTE_ORDER = ["C","D","E","F","G","A","B"];
const SEMITONES = { C:0,Db:1,"C#":1,D:2,Eb:3,"D#":3,E:4,Fb:4,"E#":5,F:5,Gb:6,"F#":6,G:7,Ab:8,"G#":8,A:9,Bb:10,"A#":10,B:11,Cb:11,"B#":0 };

// Enharmonic display helpers
const SHARP_NAMES = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };
const FLAT_NAMES = { "C#":"Db", "D#":"Eb", "F#":"Gb", "G#":"Ab", "A#":"Bb" };
function displayName(n) { return SHARP_NAMES[n] ? `${n}/${SHARP_NAMES[n]}` : FLAT_NAMES[n] ? `${FLAT_NAMES[n]}/${n}` : n; }
function shortDisplay(n) { return n; }
function isSharp(n) { return n.includes("#"); }
function isFlat(n) { return n.includes("b") && n !== "B"; }
function noteLetter(n) { return n[0]; } // "Gb" → "G", "F#" → "F", "C" → "C"

// Get the enharmonic equivalent of a note (or null if natural)
function enharmonic(n) {
  return SHARP_NAMES[n] || FLAT_NAMES[n] || null;
}

// Chromatic button layout for accidentals mode: piano-style layout
// Each entry is [primary, enharmonicAlt] or [natural, null]
const CHROMATIC_BUTTONS = [
  ["C", null], ["Db", "C#"], ["D", null], ["Eb", "D#"], ["E", null],
  ["F", null], ["Gb", "F#"], ["G", null], ["Ab", "G#"], ["A", null], ["Bb", "A#"], ["B", null],
];

function noteToMidi(name, octave) { return SEMITONES[name] + (octave + 1) * 12; }
function midiToChromatic(midi) {
  const oct = Math.floor(midi / 12) - 1;
  const idx = ((midi % 12) + 12) % 12;
  return { name: CHROMATIC[idx], octave: oct };
}
// Direction-aware: going up uses sharps, going down uses flats
function midiToNote(midi, preferSharps) {
  const oct = Math.floor(midi / 12) - 1;
  const idx = ((midi % 12) + 12) % 12;
  const name = preferSharps ? CHROMATIC_SHARP[idx] : CHROMATIC[idx];
  return { name, octave: oct };
}

function getFreq(name, octave) {
  const key = name + octave;
  if (FREQ[key]) return FREQ[key];
  // Compute frequency from semitones for any accidental spelling
  const semi = SEMITONES[name];
  if (semi !== undefined) {
    // Find the flat equivalent in FREQ table
    const flatName = CHROMATIC[semi];
    if (FREQ[flatName + octave]) return FREQ[flatName + octave];
  }
  return 440;
}

function playNote(name, octave, duration = 0.5, delay = 0, type = "triangle") {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const freq = getFreq(name, octave);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.setValueAtTime(0.18, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t); osc.stop(t + duration);
  } catch(e) {}
}

function playTwoNotes(n1, o1, n2, o2, cb) {
  playNote(n1, o1, 0.55, 0);
  playNote(n2, o2, 0.55, 0.4);
  if (cb) setTimeout(cb, 950);
}

function playTogether(n1, o1, n2, o2) {
  playNote(n1, o1, 0.8, 0);
  playNote(n2, o2, 0.8, 0);
}

function playSepThenTogether(n1, o1, n2, o2) {
  playNote(n1, o1, 0.5, 0);
  playNote(n2, o2, 0.5, 0.4);
  playNote(n1, o1, 0.7, 1.0);
  playNote(n2, o2, 0.7, 1.0);
}

// Reference song snippets — short melodic excerpts that make the interval memorable
// Each note: [name, octave, duration]
const SONG_SNIPPETS = {
  // Minor 2nd up: Jaws — E F E F E F (creeping half steps)
  "m2_up":   [["E",3,.5],["F",3,.5],["E",3,.4],["F",3,.4],["E",3,.3],["F",3,.3],["E",3,.25],["F",3,.6]],
  // Minor 2nd down: Für Elise — E Eb E Eb E B D C A
  "m2_down": [["E",5,.3],["Eb",5,.3],["E",5,.3],["Eb",5,.3],["E",5,.3],["B",4,.3],["D",5,.3],["C",5,.5]],
  // Major 2nd up: Happy Birthday — G G A G C B
  "M2_up":   [["G",4,.25],["G",4,.15],["A",4,.4],["G",4,.4],["C",5,.4],["B",4,.6]],
  // Major 2nd down: Mary Had a Little Lamb — E D C D E E E
  "M2_down": [["E",4,.35],["D",4,.35],["C",4,.35],["D",4,.35],["E",4,.35],["E",4,.35],["E",4,.6]],
  // Minor 3rd up: Greensleeves — A C D E Eb D
  "m3_up":   [["A",3,.5],["C",4,.35],["D",4,.25],["E",4,.5],["Eb",4,.25],["D",4,.5]],
  // Minor 3rd down: Hey Jude — C A A Bb Bb A G
  "m3_down": [["C",5,.6],["A",4,.3],["A",4,.3],["Bb",4,.3],["Bb",4,.3],["A",4,.4],["G",4,.6]],
  // Major 3rd up: Oh When the Saints — C E F G C E F G
  "M3_up":   [["C",4,.35],["E",4,.35],["F",4,.35],["G",4,.7],["C",4,.35],["E",4,.35],["F",4,.35],["G",4,.7]],
  // Major 3rd down: Swing Low — G Eb Eb D Eb
  "M3_down": [["G",4,.7],["Eb",4,.35],["Eb",4,.25],["D",4,.4],["Eb",4,.7]],
  // P4 up: Here Comes the Bride — C F F F A G
  "P4_up":   [["C",4,.4],["F",4,.6],["F",4,.25],["F",4,.25],["A",4,.45],["G",4,.7]],
  // P4 down: Oh Come All Ye Faithful — G D D G A D E
  "P4_down": [["G",4,.5],["D",4,.35],["D",4,.5],["G",4,.35],["A",4,.35],["D",4,.35],["E",4,.7]],
  // Tritone up: Simpsons — C Eb Gb A Gb
  "TT_up":   [["C",4,.3],["E",4,.3],["Gb",4,.3],["A",4,.5],["Gb",4,.7]],
  // P5 up: Star Wars — C G F Eb D C
  "P5_up":   [["C",4,.5],["G",4,.5],["F",4,.25],["Eb",4,.25],["D",4,.25],["C",5,.7]],
  // P5 down: Flintstones — G C C D Eb C
  "P5_down": [["G",4,.5],["C",4,.3],["C",4,.2],["D",4,.3],["Eb",4,.35],["C",4,.6]],
  // Minor 6th up: Entertainer — D Eb E C (octave up)
  "m6_up":   [["D",4,.2],["Eb",4,.2],["E",4,.2],["C",5,.5],["A",4,.2],["C",5,.5]],
  // Major 6th up: My Bonnie — G E E E E D
  "M6_up":   [["G",3,.4],["E",4,.4],["E",4,.25],["E",4,.25],["E",4,.3],["D",4,.6]],
  // Minor 7th up: Somewhere — C Bb A Bb C D
  "m7_up":   [["C",4,.5],["Bb",4,.5],["A",4,.3],["Bb",4,.3],["C",5,.3],["D",5,.6]],
  // Major 7th up: Take On Me — Gb Gb D B A
  "M7_up":   [["Gb",4,.25],["Gb",4,.25],["D",4,.35],["B",3,.35],["A",3,.6]],
  // Octave up: Somewhere Over the Rainbow — C C
  "P8_up":   [["C",4,.5],["C",5,.5],["B",4,.3],["A",4,.3],["G",4,.3],["A",4,.3],["B",4,.5]],
};

function playSongSnippet(intervalIdx, dir) {
  const iv = INTERVAL_DB[intervalIdx];
  const key = iv.short + "_" + dir;
  const notes = SONG_SNIPPETS[key];
  if (!notes) return;
  let t = 0;
  notes.forEach(([name, oct, dur]) => {
    playNote(name, oct, dur, t);
    t += dur * 0.85; // slight overlap for legato feel
  });
}

function playChord(notes, stagger = 0.12) {
  notes.forEach(([n, o], i) => playNote(n, o, 0.8, i * stagger));
}

// Play chord notes one by one (arpeggiated), then all together
function playChordArpThenTogether(notes) {
  const arpGap = 0.4;
  // Arpeggiate
  notes.forEach(([n, o], i) => playNote(n, o, 0.45, i * arpGap));
  // Small pause then play together
  const togetherDelay = notes.length * arpGap + 0.3;
  notes.forEach(([n, o], i) => playNote(n, o, 0.9, togetherDelay + i * 0.05));
}

// Play chord notes only arpeggiated (separately)
function playChordArp(notes) {
  notes.forEach(([n, o], i) => playNote(n, o, 0.5, i * 0.35));
}

function playChordSequence(chords, onDone) {
  const gap = 1.2;
  chords.forEach((notes, ci) => {
    notes.forEach(([n, o], ni) => playNote(n, o, 0.9, ci * gap + ni * 0.06));
  });
  if (onDone) setTimeout(onDone, chords.length * gap * 1000 + 500);
}

function playBuzz() {
  const ctx = getCtx(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sawtooth"; osc.frequency.value = 110;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.2);
  } catch(e) {}
}

function playChime() {
  const ctx = getCtx(); if (!ctx) return;
  try {
    [523.25,659.25,783.99,1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
      osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch(e) {}
}

// ═══ INTERVAL DATABASE ═══
const INTERVAL_DB = [
  { name:"Minor 2nd",   short:"m2", half:1,  songUp:"Jaws theme 🦈",                    songDown:"Für Elise 🎹",          emoji:"🦈",
    desc:"The smallest step — just one half step. It sounds tense and close together, like two notes almost touching." },
  { name:"Major 2nd",   short:"M2", half:2,  songUp:"Happy Birthday 🎂",                songDown:"Mary Had a Little Lamb 🐑", emoji:"🎂",
    desc:"A whole step — two half steps. This is the most common step between notes in a scale. It sounds bright and natural." },
  { name:"Minor 3rd",   short:"m3", half:3,  songUp:"Greensleeves 🌿",                  songDown:"Hey Jude 🎤",            emoji:"🌿",
    desc:"Three half steps. It has a sad, gentle quality — it's the interval that makes minor chords sound 'minor'." },
  { name:"Major 3rd",   short:"M3", half:4,  songUp:"Oh When the Saints 🎺",            songDown:"Swing Low, Sweet Chariot 🎷", emoji:"🎺",
    desc:"Four half steps. It sounds bright and happy — this is the interval that makes major chords sound 'major'." },
  { name:"Perfect 4th",  short:"P4", half:5,  songUp:"Here Comes the Bride 👰",          songDown:"Oh Come All Ye Faithful 🎄", emoji:"👰",
    desc:"Five half steps. It sounds strong, open, and a bit medieval — like a fanfare or hymn opening." },
  { name:"Tritone",      short:"TT", half:6,  songUp:"The Simpsons theme 📺",            songDown:"Black Sabbath (riff) 🎸", emoji:"😈",
    desc:"Six half steps — exactly half an octave. Called the 'devil's interval' because of its restless, unstable sound." },
  { name:"Perfect 5th",  short:"P5", half:7,  songUp:"Star Wars ⭐",                     songDown:"The Flintstones 🦕",      emoji:"⭐",
    desc:"Seven half steps. The most powerful and stable interval after the octave — it's the backbone of most chords." },
  { name:"Minor 6th",    short:"m6", half:8,  songUp:"The Entertainer 🎹",               songDown:"Love Story theme 💕",     emoji:"🎹",
    desc:"Eight half steps. A wide, bittersweet interval with an expressive, reaching quality." },
  { name:"Major 6th",    short:"M6", half:9,  songUp:"My Bonnie Lies Over the Ocean 🌊", songDown:"Nobody Knows the Trouble 🎵", emoji:"🌊",
    desc:"Nine half steps. It sounds warm and optimistic — a big, singable leap." },
  { name:"Minor 7th",    short:"m7", half:10, songUp:"Somewhere (West Side Story) 🌃",   songDown:"Watermelon Man 🍉",       emoji:"🌃",
    desc:"Ten half steps. It sounds jazzy and expectant, like it wants to resolve somewhere." },
  { name:"Major 7th",    short:"M7", half:11, songUp:"Take On Me 🎤",                    songDown:"I Love You (from a Musical) 💖", emoji:"🎤",
    desc:"Eleven half steps. Almost an octave but not quite — it sounds dreamy and slightly dissonant." },
  { name:"Perfect Octave",short:"P8",half:12, songUp:"Somewhere Over the Rainbow 🌈",    songDown:"Somewhere Over the Rainbow 🌈", emoji:"🌈",
    desc:"Twelve half steps — the same note, one register higher. It sounds complete and unified." },
];

// ═══ TRAINING LEVELS ═══
// Each level introduces an interval, has an explanation phase, then practice
const TRAINING_LEVELS = [
  { intervalIdx: 0, direction: "up",   title: "Minor 2nd Up ⬆" },
  { intervalIdx: 0, direction: "down", title: "Minor 2nd Down ⬇" },
  { intervalIdx: 1, direction: "up",   title: "Major 2nd Up ⬆" },
  { intervalIdx: 1, direction: "down", title: "Major 2nd Down ⬇" },
  { intervalIdx: 2, direction: "up",   title: "Minor 3rd Up ⬆" },
  { intervalIdx: 2, direction: "down", title: "Minor 3rd Down ⬇" },
  { intervalIdx: 3, direction: "up",   title: "Major 3rd Up ⬆" },
  { intervalIdx: 3, direction: "down", title: "Major 3rd Down ⬇" },
  { intervalIdx: 4, direction: "up",   title: "Perfect 4th Up ⬆" },
  { intervalIdx: 4, direction: "down", title: "Perfect 4th Down ⬇" },
  { intervalIdx: 5, direction: "up",   title: "Tritone Up ⬆" },
  { intervalIdx: 6, direction: "up",   title: "Perfect 5th Up ⬆" },
  { intervalIdx: 6, direction: "down", title: "Perfect 5th Down ⬇" },
  { intervalIdx: 7, direction: "up",   title: "Minor 6th Up ⬆" },
  { intervalIdx: 8, direction: "up",   title: "Major 6th Up ⬆" },
  { intervalIdx: 9, direction: "up",   title: "Minor 7th Up ⬆" },
  { intervalIdx: 10, direction: "up",  title: "Major 7th Up ⬆" },
  { intervalIdx: 11, direction: "up",  title: "Octave Up ⬆" },
];

// Classic mode levels
const CLASSIC_LEVELS = [
  { id: 1, name: "Seconds & Thirds", desc: "Natural notes only", intervals: [0,1,2,3], accidentals: false, earOnly: false },
  { id: 2, name: "Adding 4ths & 5ths", desc: "Natural notes only", intervals: [0,1,2,3,4,6], accidentals: false, earOnly: false },
  { id: 3, name: "All Intervals", desc: "Natural notes, up & down", intervals: [0,1,2,3,4,5,6,7,8,9,10,11], accidentals: false, earOnly: false },
  { id: 4, name: "Sharps & Flats", desc: "Accidentals included!", intervals: [0,1,2,3,4,5,6,7,8,9,10,11], accidentals: true, earOnly: false },
  { id: 5, name: "Ear Training", desc: "Hear it, name it!", intervals: [0,1,2,3,4,5,6,7,8,9,10,11], accidentals: true, earOnly: true },
];

// ═══ QUESTION GENERATORS ═══
let _lastQ = null; // prevent back-to-back identical questions

// Letter span for each interval (how many letter-names apart, 1-based)
// m2/M2=2, m3/M3=3, P4=4, TT=4(aug4th), P5=5, m6/M6=6, m7/M7=7, P8=8
const INTERVAL_LETTER_SPAN = [2,2,3,3,4,4,5,6,6,7,7,8]; // indexed same as INTERVAL_DB

// Spell an interval correctly: given a start note name (like "Eb"), direction, and interval index,
// return the correctly-spelled target note name and its accidental adjustment
function spellInterval(startName, startOct, intervalIdx, dir) {
  const iv = INTERVAL_DB[intervalIdx];
  const halfSteps = iv.half;
  const letterSpan = INTERVAL_LETTER_SPAN[intervalIdx];
  
  // Get the starting letter (strip accidental) and its index in NOTE_ORDER
  const startLetter = startName[0];
  const startLetterIdx = NOTE_ORDER.indexOf(startLetter);
  
  // Compute target letter by stepping through letter names
  const letterSteps = letterSpan - 1; // e.g. a 2nd spans 2 letters = 1 step
  let targetLetterIdx, targetOct;
  if (dir === "up") {
    targetLetterIdx = (startLetterIdx + letterSteps) % 7;
    targetOct = startOct + Math.floor((startLetterIdx + letterSteps) / 7);
  } else {
    targetLetterIdx = ((startLetterIdx - letterSteps) % 7 + 7) % 7;
    targetOct = startOct - Math.floor((7 - startLetterIdx + letterSteps - 1) / 7);
    // Simpler: compute via midi
    targetOct = startOct;
    let idx = startLetterIdx;
    for (let i = 0; i < letterSteps; i++) {
      idx--;
      if (idx < 0) { idx = 6; targetOct--; }
    }
    targetLetterIdx = idx;
  }
  const targetLetter = NOTE_ORDER[targetLetterIdx];
  
  // Now figure out what accidental the target needs to be exactly `halfSteps` away
  const startMidi = noteToMidi(startName, startOct);
  const targetMidi = dir === "up" ? startMidi + halfSteps : startMidi - halfSteps;
  
  // What midi would the target letter natural be?
  const naturalSemitones = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const targetNaturalMidi = naturalSemitones[targetLetter] + (targetOct + 1) * 12;
  
  const diff = targetMidi - targetNaturalMidi;
  // diff: 0=natural, 1=sharp, -1=flat, 2=double sharp, -2=double flat
  let targetName;
  if (diff === 0) targetName = targetLetter;
  else if (diff === 1) targetName = targetLetter + "#";
  else if (diff === -1) targetName = targetLetter + "b";
  else return null; // double sharp/flat — skip this combination
  
  // Reject enharmonic edge cases that cause octave/playback issues
  if (targetName === "B#" || targetName === "Cb" || targetName === "E#" || targetName === "Fb") return null;
  
  // Verify actual midi distance matches expected half steps
  const actualTargetMidi = noteToMidi(targetName, targetOct);
  const actualDist = Math.abs(actualTargetMidi - startMidi);
  if (actualDist !== halfSteps) return null;
  
  if (targetOct < 2 || targetOct > 5) return null;
  return { name: targetName, octave: targetOct };
}

function genIntervalQ(intervalIdx, direction, accidentals = false) {
  const iv = INTERVAL_DB[intervalIdx];
  const dir = direction || (Math.random() < 0.5 ? "up" : "down");
  // Build pool of all chromatic notes with correct spelling for context
  const startPool = [...CHROMATIC, ...CHROMATIC_SHARP.filter(n => n.includes("#"))];
  // Remove duplicates (the naturals appear in both)
  const uniquePool = [...new Set(startPool)];
  
  let attempts = 0;
  while (attempts < 400) {
    attempts++;
    const startName = uniquePool[Math.floor(Math.random() * uniquePool.length)];
    const startOct = dir === "down" ? (Math.random() < 0.5 ? 4 : 5) : (Math.random() < 0.5 ? 3 : 4);
    
    const target = spellInterval(startName, startOct, intervalIdx, dir);
    if (!target) continue;
    
    // In non-accidental answer mode, the target must be a natural note
    if (!accidentals && !NOTE_ORDER.includes(target.name)) continue;
    
    // Avoid repeating the exact same question
    const key = `${startName}${startOct}${target.name}${target.octave}${dir}`;
    if (_lastQ === key) continue;
    _lastQ = key;
    return { interval: iv, dir, startName, startOct, targetName: target.name, targetOct: target.octave };
  }
  _lastQ = null;
  // Fallback: use the requested interval with a safe C start
  const fb = INTERVAL_DB[intervalIdx];
  const fbDir = direction || "up";
  const fbStart = fbDir === "up" ? 4 : 5;
  const fbMidi = noteToMidi("C", fbStart) + (fbDir === "up" ? fb.half : -fb.half);
  const fbTarget = midiToChromatic(fbMidi);
  return { interval: fb, dir: fbDir, startName: "C", startOct: fbStart, targetName: fbTarget.name, targetOct: fbTarget.octave };
}

let _lastClassicIv = -1;

function genClassicQ(level) {
  const lv = CLASSIC_LEVELS[level];
  let ivIdx;
  if (lv.intervals.length > 1) {
    // Avoid same interval back-to-back
    let tries = 0;
    do {
      ivIdx = lv.intervals[Math.floor(Math.random() * lv.intervals.length)];
      tries++;
    } while (ivIdx === _lastClassicIv && tries < 20);
  } else {
    ivIdx = lv.intervals[0];
  }
  _lastClassicIv = ivIdx;
  const dir = Math.random() < 0.5 ? "up" : "down";
  return genIntervalQ(ivIdx, dir, lv.accidentals);
}

// ═══ CHORD STUFF ═══
function getChordNotes(rootName, rootOct, type) {
  const rootMidi = noteToMidi(rootName, rootOct);
  return type.intervals.map(hs => midiToChromatic(rootMidi + hs));
}

const CHORD_TYPES = [
  { name: "Major", symbol: "", intervals: [0, 4, 7, 12], emoji: "😊", color: "#4ade80",
    desc: "Bright and happy! Built with a major 3rd (4 half steps) and a perfect 5th (7 half steps), topped with the octave." },
  { name: "Minor", symbol: "m", intervals: [0, 3, 7, 12], emoji: "😢", color: "#60a5fa",
    desc: "Sad and gentle. Built with a minor 3rd (3 half steps) and a perfect 5th (7 half steps), topped with the octave." },
  { name: "Augmented", symbol: "+", intervals: [0, 4, 8, 12], emoji: "😵", color: "#f472b6",
    desc: "Tense and dreamy — like a major chord stretched wider. Both intervals are major 3rds (4 half steps each), plus the octave." },
  { name: "Diminished 7th", symbol: "°7", intervals: [0, 3, 6, 9], emoji: "😰", color: "#fb923c",
    desc: "Dark and suspenseful — four notes stacked in minor 3rds (3 half steps each). Its symmetry gives it a uniquely eerie sound." },
];

const CHORD_EAR_LEVELS = [
  { id: 0, name: "Major vs Minor", types: [0, 1], desc: "Happy or sad? Learn the two most common chords", needed: 8, lives: 5 },
  { id: 1, name: "Add Diminished", types: [0, 1, 3], desc: "Now with the dark, suspenseful chord", needed: 8, lives: 4 },
  { id: 2, name: "Add Augmented", types: [0, 1, 2, 3], desc: "All four types — the full challenge!", needed: 10, lives: 3 },
];

let _lastChordEarType = -1;
function genChordEarQ(level) {
  const lv = CHORD_EAR_LEVELS[level];
  let typeIdx;
  if (lv.types.length > 1) {
    let tries = 0;
    do { typeIdx = lv.types[Math.floor(Math.random() * lv.types.length)]; tries++; }
    while (typeIdx === _lastChordEarType && tries < 20);
  } else { typeIdx = lv.types[0]; }
  _lastChordEarType = typeIdx;
  const ct = CHORD_TYPES[typeIdx];
  const roots = CHROMATIC;
  const root = roots[Math.floor(Math.random() * roots.length)];
  const rootOct = Math.random() < 0.5 ? 3 : 4;
  const notes = ct.intervals.map(hs => {
    const m = noteToMidi(root, rootOct) + hs;
    return midiToChromatic(m);
  });
  return { root, rootOct, typeIdx, type: ct, notes, displayName: root + ct.symbol };
}

// Only use major/minor chords with all natural notes for Build Chords mode
const VALID_CHORDS = [];
NOTE_ORDER.forEach(letter => {
  CHORD_TYPES.slice(0, 2).forEach(ct => {
    const notes = getChordNotes(letter, 4, ct);
    if (notes.every(n => NOTE_ORDER.includes(n.name))) {
      VALID_CHORDS.push({ root: letter, type: ct, notes });
    }
  });
});

function genChordQ() {
  const chord = VALID_CHORDS[Math.floor(Math.random() * VALID_CHORDS.length)];
  const rootOct = Math.random() < 0.5 ? 3 : 4;
  const notes = getChordNotes(chord.root, rootOct, chord.type);
  return {
    root: chord.root, rootOct, type: chord.type,
    third: notes[1], fifth: notes[2],
    displayName: chord.root + chord.type.symbol,
  };
}

// ═══ STAFF RENDERING ═══
const STAFF_W = 110, STAFF_H = 230, TOP_Y = 52, LG = 14;
const posY = (pos) => TOP_Y + 4 * LG - pos * (LG / 2);

// Positions for treble clef: each note+octave -> staff position
// E4=0, F4=1, G4=2, A4=3, B4=4, C5=5, D5=6 ...
const POS_MAP = {};
(() => {
  const base = { C:-2, D:-1, E:0, F:1, G:2, A:3, B:4 }; // octave 4
  for (let oct = 2; oct <= 6; oct++) {
    const offset = (oct - 4) * 7;
    NOTE_ORDER.forEach(n => {
      POS_MAP[n + oct] = base[n] + offset;
    });
  }
  // All accidentals sit on their letter's staff position
  // (Db on D's line, C# on C's line, Fb on F's line, E# on E's line, etc.)
  const allAccidentals = ["Cb","C#","Db","D#","Eb","E#","Fb","F#","Gb","G#","Ab","A#","Bb","B#"];
  for (let oct = 2; oct <= 6; oct++) {
    allAccidentals.forEach(acc => {
      const letter = acc[0];
      POS_MAP[acc + oct] = base[letter] + (oct - 4) * 7;
    });
  }
})();

function getNotePos(name, oct) { return POS_MAP[name + oct] ?? 0; }

function getLedgers(pos) {
  const lines = [];
  if (pos <= -1) { for (let p = -2; p >= (pos % 2 === 0 ? pos : pos + 1); p -= 2) lines.push(p); }
  if (pos >= 9)  { for (let p = 10; p <= (pos % 2 === 0 ? pos : pos - 1); p += 2) lines.push(p); }
  return lines;
}

const isAccidental = (name) => name.length > 1;
const accidentalSymbol = (name) => isSharp(name) ? "♯" : "♭";

const CLEF_PATH = "M 2002,7851 C 1941,7868 1886,7906 1835,7964 C 1784,8023 1759,8088 1759,8158 C 1759,8202 1774,8252 1803,8305 C 1832,8359 1876,8398 1933,8423 C 1952,8427 1961,8437 1961,8451 C 1961,8456 1954,8461 1937,8465 C 1846,8442 1771,8393 1713,8320 C 1655,8246 1625,8162 1623,8066 C 1626,7963 1657,7867 1716,7779 C 1776,7690 1853,7627 1947,7590 L 1878,7235 C 1724,7363 1599,7496 1502,7636 C 1405,7775 1355,7926 1351,8089 C 1353,8162 1368,8233 1396,8301 C 1424,8370 1466,8432 1522,8489 C 1635,8602 1782,8661 1961,8667 C 2022,8663 2087,8652 2157,8634 L 2002,7851 z M 2074,7841 L 2230,8610 C 2384,8548 2461,8413 2461,8207 C 2452,8138 2432,8076 2398,8021 C 2365,7965 2321,7921 2265,7889 C 2209,7857 2146,7841 2074,7841 z M 1869,6801 C 1902,6781 1940,6746 1981,6697 C 2022,6649 2062,6592 2100,6528 C 2139,6463 2170,6397 2193,6330 C 2216,6264 2227,6201 2227,6143 C 2227,6118 2225,6093 2220,6071 C 2216,6035 2205,6007 2186,5988 C 2167,5970 2143,5960 2113,5960 C 2053,5960 1999,5997 1951,6071 C 1914,6135 1883,6211 1861,6297 C 1838,6384 1825,6470 1823,6557 C 1828,6656 1844,6737 1869,6801 z M 1806,6859 C 1761,6697 1736,6532 1731,6364 C 1732,6256 1743,6155 1764,6061 C 1784,5967 1813,5886 1851,5816 C 1888,5746 1931,5693 1979,5657 C 2022,5625 2053,5608 2070,5608 C 2083,5608 2094,5613 2104,5622 C 2114,5631 2127,5646 2143,5666 C 2262,5835 2322,6039 2322,6277 C 2322,6390 2307,6500 2277,6610 C 2248,6719 2205,6823 2148,6920 C 2090,7018 2022,7103 1943,7176 L 2024,7570 C 2068,7565 2098,7561 2115,7561 C 2191,7561 2259,7577 2322,7609 C 2385,7641 2439,7684 2483,7739 C 2527,7793 2561,7855 2585,7925 C 2608,7995 2621,8068 2621,8144 C 2621,8262 2590,8370 2528,8467 C 2466,8564 2373,8635 2248,8681 C 2256,8730 2270,8801 2291,8892 C 2311,8984 2326,9057 2336,9111 C 2346,9165 2350,9217 2350,9268 C 2350,9347 2331,9417 2293,9479 C 2254,9541 2202,9589 2136,9623 C 2071,9657 1999,9674 1921,9674 C 1811,9674 1715,9643 1633,9582 C 1551,9520 1507,9437 1503,9331 C 1506,9284 1517,9240 1537,9198 C 1557,9156 1584,9122 1619,9096 C 1653,9069 1694,9055 1741,9052 C 1780,9052 1817,9063 1852,9084 C 1886,9106 1914,9135 1935,9172 C 1955,9209 1966,9250 1966,9294 C 1966,9353 1946,9403 1906,9444 C 1866,9485 1815,9506 1754,9506 L 1731,9506 C 1770,9566 1834,9597 1923,9597 C 1968,9597 2014,9587 2060,9569 C 2107,9550 2146,9525 2179,9493 C 2212,9461 2234,9427 2243,9391 C 2260,9350 2268,9293 2268,9222 C 2268,9174 2263,9126 2254,9078 C 2245,9031 2231,8968 2212,8890 C 2193,8813 2179,8753 2171,8712 C 2111,8727 2049,8735 1984,8735 C 1875,8735 1772,8713 1675,8668 C 1578,8623 1493,8561 1419,8481 C 1346,8401 1289,8311 1248,8209 C 1208,8108 1187,8002 1186,7892 C 1190,7790 1209,7692 1245,7600 C 1281,7507 1327,7419 1384,7337 C 1441,7255 1500,7180 1561,7113 C 1623,7047 1704,6962 1806,6859 z";

function NoteOnStaff({ name, octave, highlight, showLabel, ghost, showAccidental }) {
  const pos = getNotePos(name, octave);
  const ny = posY(pos);
  const nx = 70;
  const ledgers = getLedgers(pos);
  const lc = "#a09484";
  const cc = "#6b5c4f";
  const acc = isAccidental(name);
  const fill = highlight === "correct" ? "#22c55e" : highlight === "wrong" ? "#ef4444" : ghost ? "rgba(139,92,246,0.25)" : "#2d1810";
  const stemUp = pos < 4;
  const staffBottom = TOP_Y + 4 * LG;
  // Label just below staff for on/above-staff notes, just below notehead for below-staff notes
  const labelY = pos >= 0 ? staffBottom + 18 : ny + 22;
  return (
    <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
      style={{ opacity: ghost ? 0.35 : 1, transition: "opacity .3s" }}>
      {[0,1,2,3,4].map(i => <line key={i} x1="5" y1={TOP_Y+i*LG} x2="105" y2={TOP_Y+i*LG} stroke={lc} strokeWidth="1"/>)}
      <g transform={`translate(6,${TOP_Y-1.31*LG}) scale(${LG*6.89/4066})`}><path d={CLEF_PATH} fill={cc} transform="translate(-984,-5608)"/></g>
      {ledgers.map((lp,i)=><line key={`l${i}`} x1={nx-14} y1={posY(lp)} x2={nx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
      {acc && showAccidental !== false && !ghost && (
        <text x={nx - 22} y={ny + 5} fontSize="16" fontWeight="700" fill={fill} fontFamily="serif">{accidentalSymbol(name)}</text>
      )}
      <ellipse cx={nx} cy={ny} rx="7.5" ry="5.5" fill={fill} transform={`rotate(-12,${nx},${ny})`}/>
      {stemUp
        ? <line x1={nx+7} y1={ny} x2={nx+7} y2={ny-30} stroke={fill} strokeWidth="1.8"/>
        : <line x1={nx-7} y1={ny} x2={nx-7} y2={ny+30} stroke={fill} strokeWidth="1.8"/>}
      {showLabel && (
        <text x={nx} y={labelY} textAnchor="middle" fontSize="14" fontWeight="700"
          fill={highlight==="correct"?"#22c55e":highlight==="wrong"?"#ef4444":"#6b7280"} fontFamily={ff}>
          {shortDisplay(name)}
        </text>
      )}
    </svg>
  );
}

// Interactive dual-note staff
function DualStaff({ startName, startOct, targetName, targetOct, highlight, showTarget, earOnly, showGhost }) {
  const sp = getNotePos(startName, startOct);
  const sy = posY(sp);
  const sx = earOnly ? 55 : 75;
  const tx = earOnly ? 55 : 140;
  const sLedgers = getLedgers(sp);
  const lc = "#a09484";
  const cc = "#6b5c4f";
  const sAcc = isAccidental(startName);
  const w = earOnly ? 110 : 260;
  const staffBottom = TOP_Y + 4 * LG;
  const sLabelY = sp >= 0 ? staffBottom + 18 : sy + 22;

  let tContent = null;
  if (showTarget && targetName) {
    const tp = getNotePos(targetName, targetOct);
    const ty = posY(tp);
    const tLedgers = getLedgers(tp);
    const tAcc = isAccidental(targetName);
    const clr = highlight === "correct" ? "#22c55e" : highlight === "wrong" ? "#ef4444" : "#c4b5fd";
    const stemUp = tp < 4;
    const tLabelY = tp >= 0 ? staffBottom + 18 : ty + 22;
    tContent = (
      <g style={{animation: highlight==="correct" ? "popIn .3s ease" : undefined}}>
        {tLedgers.map((lp,i)=><line key={`tl${i}`} x1={tx-14} y1={posY(lp)} x2={tx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
        {tAcc && <text x={tx-22} y={ty+5} fontSize="16" fontWeight="700" fill={clr} fontFamily="serif">{accidentalSymbol(targetName)}</text>}
        <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" fill={clr} transform={`rotate(-12,${tx},${ty})`}/>
        {stemUp
          ? <line x1={tx+7} y1={ty} x2={tx+7} y2={ty-30} stroke={clr} strokeWidth="1.8"/>
          : <line x1={tx-7} y1={ty} x2={tx-7} y2={ty+30} stroke={clr} strokeWidth="1.8"/>}
        <text x={tx} y={tLabelY} textAnchor="middle" fontSize="13" fontWeight="700" fill={clr} fontFamily={ff}>{shortDisplay(targetName)}</text>
      </g>
    );
  } else if (showGhost && targetName) {
    // Ghost note: semi-transparent hint of where the answer goes
    const tp = getNotePos(targetName, targetOct);
    const ty = posY(tp);
    const tLedgers = getLedgers(tp);
    const ghostClr = "rgba(139,92,246,0.25)";
    const stemUp = tp < 4;
    tContent = (
      <g style={{opacity: 0.4}}>
        {tLedgers.map((lp,i)=><line key={`gl${i}`} x1={tx-14} y1={posY(lp)} x2={tx+14} y2={posY(lp)} stroke={lc} strokeWidth="1" opacity="0.4"/>)}
        <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" fill={ghostClr} transform={`rotate(-12,${tx},${ty})`}/>
        {stemUp
          ? <line x1={tx+7} y1={ty} x2={tx+7} y2={ty-30} stroke={ghostClr} strokeWidth="1.8"/>
          : <line x1={tx-7} y1={ty} x2={tx-7} y2={ty+30} stroke={ghostClr} strokeWidth="1.8"/>}
      </g>
    );
  }

  return (
    <svg width={w} height={STAFF_H} viewBox={`0 0 ${w} ${STAFF_H}`}>
      {[0,1,2,3,4].map(i=><line key={i} x1="5" y1={TOP_Y+i*LG} x2={w-5} y2={TOP_Y+i*LG} stroke={lc} strokeWidth="1"/>)}
      <g transform={`translate(4,${TOP_Y-1.31*LG}) scale(${LG*6.89/4066})`}><path d={CLEF_PATH} fill={cc} transform="translate(-984,-5608)"/></g>
      {!earOnly && (
        <>
          {sLedgers.map((lp,i)=><line key={`sl${i}`} x1={sx-14} y1={posY(lp)} x2={sx+14} y2={posY(lp)} stroke={lc} strokeWidth="1"/>)}
          {sAcc && <text x={sx-22} y={sy+5} fontSize="16" fontWeight="700" fill="#2d1810" fontFamily="serif">{accidentalSymbol(startName)}</text>}
          <ellipse cx={sx} cy={sy} rx="7.5" ry="5.5" fill="#2d1810" transform={`rotate(-12,${sx},${sy})`}/>
          {sp < 4
            ? <line x1={sx+7} y1={sy} x2={sx+7} y2={sy-30} stroke="#2d1810" strokeWidth="1.8"/>
            : <line x1={sx-7} y1={sy} x2={sx-7} y2={sy+30} stroke="#2d1810" strokeWidth="1.8"/>}
          <text x={sx} y={sLabelY} textAnchor="middle" fontSize="13" fontWeight="700" fill="#6b5c4f" fontFamily={ff}>{shortDisplay(startName)}</text>
        </>
      )}
      {showTarget && tContent}
      {!showTarget && showGhost && tContent}
      {!showTarget && !showGhost && !earOnly && (
        <text x={tx} y={TOP_Y+2*LG+5} textAnchor="middle" fontSize="28" fontWeight="700" fill="#c4b5fd" fontFamily={ff} style={{animation:"pulse 1.5s ease-in-out infinite"}}>?</text>
      )}
      {earOnly && !showTarget && (
        <text x={55} y={TOP_Y+2*LG+5} textAnchor="middle" fontSize="22" fontWeight="700" fill="#c4b5fd" fontFamily={ff} style={{animation:"pulse 1.5s ease-in-out infinite"}}>🎧</text>
      )}
    </svg>
  );
}

// ═══ SNOWMAN ═══
function Snowman({ root, third, fifth, complete, bouncing, index, chordName }) {
  const by = 180;
  const delay = (index||0) * 0.15;
  const style = bouncing ? { animation: `snowBounce .6s ease-in-out ${delay}s infinite alternate` } : {};
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", ...style }}>
      <svg width="100" height="200" viewBox="0 0 100 200">
        <ellipse cx="50" cy={by+5} rx="35" ry="5" fill="rgba(0,0,0,0.08)"/>
        {/* Base — root */}
        <circle cx="50" cy={by-30} r="32" fill="white" stroke="#d1d5db" strokeWidth="2"/>
        <text x="50" y={by-25} textAnchor="middle" fontSize="14" fontWeight="700" fill="#6366f1" fontFamily={ff}>{root}</text>
        <text x="50" y={by-10} textAnchor="middle" fontSize="9" fill="#a5b4fc" fontFamily={ff}>root</text>
        {/* Middle — 3rd */}
        {third ? (
          <g style={{animation:"popIn .4s ease"}}>
            <circle cx="50" cy={by-80} r="26" fill="white" stroke="#d1d5db" strokeWidth="2"/>
            <text x="50" y={by-76} textAnchor="middle" fontSize="14" fontWeight="700" fill="#8b5cf6" fontFamily={ff}>{third}</text>
            <text x="50" y={by-62} textAnchor="middle" fontSize="9" fill="#c4b5fd" fontFamily={ff}>3rd</text>
            <circle cx="50" cy={by-85} r="2.5" fill="#374151"/><circle cx="50" cy={by-78} r="2.5" fill="#374151"/>
            <line x1="24" y1={by-82} x2="6" y2={by-95} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="76" y1={by-82} x2="94" y2={by-95} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        ) : (
          <g><circle cx="50" cy={by-80} r="26" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 4"/>
          <text x="50" y={by-74} textAnchor="middle" fontSize="12" fill="#d1d5db" fontFamily={ff}>3rd?</text></g>
        )}
        {/* Head — 5th */}
        {fifth ? (
          <g style={{animation:"popIn .4s ease"}}>
            <circle cx="50" cy={by-122} r="20" fill="white" stroke="#d1d5db" strokeWidth="2"/>
            <circle cx="44" cy={by-127} r="2.5" fill="#1f2937"/><circle cx="56" cy={by-127} r="2.5" fill="#1f2937"/>
            <polygon points={`50,${by-122} 62,${by-120} 50,${by-118}`} fill="#f97316"/>
            <path d={`M 43 ${by-116} Q 50 ${by-110} 57 ${by-116}`} fill="none" stroke="#374151" strokeWidth="1.5"/>
            <rect x="37" y={by-148} width="26" height="16" rx="2" fill="#1e1b4b"/>
            <rect x="33" y={by-134} width="34" height="5" rx="2" fill="#1e1b4b"/>
            <rect x="40" y={by-145} width="20" height="2.5" rx="1" fill="#a78bfa" opacity="0.5"/>
            <text x="50" y={by-108} textAnchor="middle" fontSize="9" fill="#c4b5fd" fontFamily={ff}>5th</text>
          </g>
        ) : (
          <g><circle cx="50" cy={by-122} r="20" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 4"/>
          <text x="50" y={by-118} textAnchor="middle" fontSize="12" fill="#d1d5db" fontFamily={ff}>5th?</text></g>
        )}
      </svg>
      {complete && (
        <div style={{marginTop:-8,padding:"3px 12px",borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:13,fontWeight:700,fontFamily:ff,animation:"popIn .3s ease",whiteSpace:"nowrap"}}>
          {chordName}
        </div>
      )}
    </div>
  );
}

// ═══ MELTING SNOWMAN for Chord Ear Training ═══
function MeltingSnowman({ meltStage, maxStages }) {
  // meltStage: 0 = fully intact, maxStages = fully melted
  const pct = meltStage / maxStages; // 0 to 1
  const by = 170;
  // Progressive melting: hat droops, face sags, body puddles
  const headR = 20 - pct * 8;
  const midR = 26 - pct * 10;
  const baseR = 32 - pct * 6;
  const headY = by - 122 + pct * 40;
  const midY = by - 80 + pct * 25;
  const baseY = by - 30 + pct * 8;
  const puddleRx = 35 + pct * 20;
  const puddleRy = 5 + pct * 8;
  const opacity = Math.max(0, 1 - pct * 0.3);

  return (
    <svg width="100" height="200" viewBox="0 0 100 200" style={{transition:"all .5s ease"}}>
      {/* Puddle grows as snowman melts */}
      <ellipse cx="50" cy={by + 10} rx={puddleRx} ry={puddleRy} fill="rgba(147,197,253,0.3)" style={{transition:"all .5s"}}/>
      {/* Shadow */}
      <ellipse cx="50" cy={by + 5} rx="35" ry="5" fill="rgba(0,0,0,0.08)"/>
      {/* Base */}
      <circle cx="50" cy={baseY} r={baseR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>
      {/* Middle */}
      {pct < 0.9 && <circle cx="50" cy={midY} r={midR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>}
      {/* Arms */}
      {pct < 0.7 && <>
        <line x1="24" y1={midY - 2} x2="6" y2={midY - 15} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" style={{transition:"all .5s"}}/>
        <line x1="76" y1={midY - 2} x2="94" y2={midY - 15} stroke="#8B4513" strokeWidth="2.5" strokeLinecap="round" style={{transition:"all .5s"}}/>
      </>}
      {/* Head */}
      {pct < 0.8 && <circle cx="50" cy={headY} r={headR} fill="white" stroke="#d1d5db" strokeWidth="2" opacity={opacity} style={{transition:"all .5s"}}/>}
      {/* Face */}
      {pct < 0.6 && <>
        <circle cx="44" cy={headY - 4} r="2.5" fill="#1f2937" style={{transition:"all .5s"}}/>
        <circle cx="56" cy={headY - 4} r="2.5" fill="#1f2937" style={{transition:"all .5s"}}/>
        <polygon points={`50,${headY} 60,${headY + 2} 50,${headY + 4}`} fill="#f97316" style={{transition:"all .5s"}}/>
        {pct < 0.3 ?
          <path d={`M 43 ${headY + 7} Q 50 ${headY + 13} 57 ${headY + 7}`} fill="none" stroke="#374151" strokeWidth="1.5"/> :
          <path d={`M 43 ${headY + 10} Q 50 ${headY + 6} 57 ${headY + 10}`} fill="none" stroke="#374151" strokeWidth="1.5"/>
        }
      </>}
      {/* Hat */}
      {pct < 0.5 && <>
        <rect x="37" y={headY - 28 + pct * 10} width="26" height="16" rx="2" fill="#1e1b4b" style={{transition:"all .5s",transform:`rotate(${pct * 15}deg)`,transformOrigin:"50px " + (headY - 20) + "px"}}/>
        <rect x="33" y={headY - 14 + pct * 6} width="34" height="5" rx="2" fill="#1e1b4b" style={{transition:"all .5s"}}/>
      </>}
      {/* Fully melted - just a puddle with hat */}
      {pct >= 0.9 && <>
        <ellipse cx="50" cy={by + 5} rx="40" ry="10" fill="rgba(200,220,255,0.5)"/>
        <rect x="38" y={by - 8} width="24" height="14" rx="2" fill="#1e1b4b"/>
        <rect x="34" y={by + 4} width="32" height="4" rx="2" fill="#1e1b4b"/>
        <polygon points="55,172 63,170 55,168" fill="#f97316"/>
      </>}
    </svg>
  );
}

// Auto-play chord when question loads
function ChordAutoPlay({ notes }) {
  useEffect(() => {
    const noteArr = notes.map(n => [n.name, n.octave]);
    playChordArpThenTogether(noteArr);
  }, [notes]);
  return null;
}

// ═══ EFFECTS ═══
function Snowflakes({ count = 30 }) {
  const f = useMemo(() => Array.from({length:count},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*8,dur:4+Math.random()*6,size:3+Math.random()*6,op:0.3+Math.random()*0.5})),[count]);
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {f.map(s=><div key={s.id} style={{position:"absolute",left:`${s.left}%`,top:-10,width:s.size,height:s.size,borderRadius:"50%",background:"white",opacity:s.op,animation:`snowfall ${s.dur}s linear ${s.delay}s infinite`}}/>)}
    </div>
  );
}

function Confetti({ show }) {
  const p = useMemo(()=>Array.from({length:50},(_,i)=>({id:i,left:Math.random()*100,color:["#6366f1","#8b5cf6","#ec4899","#f59e0b","#22c55e","#3b82f6","#ef4444"][Math.floor(Math.random()*7)],delay:Math.random()*0.5,dur:1.5+Math.random()*2,size:4+Math.random()*6,rot:Math.random()*360})),[]);
  if (!show) return null;
  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:100}}>
      {p.map(c=><div key={c.id} style={{position:"absolute",left:`${c.left}%`,top:-20,width:c.size,height:c.size*0.6,background:c.color,borderRadius:2,transform:`rotate(${c.rot}deg)`,animation:`confettiFall ${c.dur}s ease-out ${c.delay}s forwards`}}/>)}
    </div>
  );
}

function NoteBtn({ note, onClick, disabled, highlight, small }) {
  const bg = highlight==="correct" ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : highlight==="wrong" ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : highlight==="hint" ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
    : "linear-gradient(135deg,#6366f1,#8b5cf6)";
  const sz = small ? 42 : 52;
  return (
    <button onClick={()=>!disabled&&onClick(note)} disabled={disabled}
      style={{width:sz,height:sz,borderRadius:small?10:14,border:highlight==="hint"?"2px solid #c4b5fd":"none",background:disabled?"#374151":bg,color:disabled?"#6b7280":"white",fontSize:small?16:22,fontWeight:700,fontFamily:ff,cursor:disabled?"default":"pointer",boxShadow:highlight==="hint"?"0 0 16px rgba(167,139,250,.5)":disabled?"none":"0 4px 12px rgba(99,102,241,0.3)",transition:"all .15s",transform:highlight?"scale(1.1)":"scale(1)",animation:highlight==="hint"?"pulse 1.2s ease-in-out infinite":undefined}}>
      {shortDisplay(note)}
    </button>
  );
}

// Button for accidentals mode — shows enharmonic pair (Gb/F#) on one key
function EnharmonicBtn({ primary, alt, onClick, disabled, highlight }) {
  const isNatural = !alt;
  const bg = highlight==="correct" ? "linear-gradient(135deg,#22c55e,#16a34a)"
    : highlight==="wrong" ? "linear-gradient(135deg,#ef4444,#dc2626)"
    : highlight==="hint" ? "linear-gradient(135deg,#7c3aed,#a78bfa)"
    : isNatural ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
    : "linear-gradient(135deg,#3730a3,#4f46e5)";
  return (
    <button onClick={()=>!disabled&&onClick(primary)} disabled={disabled}
      style={{minWidth:isNatural?44:56,height:52,borderRadius:12,border:highlight==="hint"?"2px solid #c4b5fd":isNatural?"none":"1px solid rgba(139,92,246,.3)",background:disabled?"#374151":bg,color:disabled?"#6b7280":"white",fontWeight:700,fontFamily:ff,cursor:disabled?"default":"pointer",boxShadow:highlight==="hint"?"0 0 16px rgba(167,139,250,.5)":disabled?"none":"0 4px 12px rgba(99,102,241,0.3)",transition:"all .15s",transform:highlight?"scale(1.08)":"scale(1)",padding:"4px 6px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,animation:highlight==="hint"?"pulse 1.2s ease-in-out infinite":undefined}}>
      {isNatural ? (
        <span style={{fontSize:20}}>{primary}</span>
      ) : (
        <>
          <span style={{fontSize:13,lineHeight:1.1}}>{primary}</span>
          <span style={{fontSize:10,lineHeight:1,opacity:.7,color:highlight?"white":"#c4b5fd"}}>{alt}</span>
        </>
      )}
    </button>
  );
}

// ═══ STREAK SYSTEM ═══
const STREAK_MILESTONES = [
  { at: 3,  item: "scarf",    label: "🧣 Scarf!",          color: "#ef4444" },
  { at: 5,  item: "cocoa",    label: "☕ Hot Cocoa!",       color: "#92400e" },
  { at: 8,  item: "mittens",  label: "🧤 Mittens!",        color: "#6366f1" },
  { at: 10, item: "tophat",   label: "🎩 Snow-pillar!",    color: "#1e1b4b" },
  { at: 15, item: "skates",   label: "⛸️ Ice Skates!",     color: "#06b6d4" },
  { at: 20, item: "ice",      label: "🧊 Ice Form!",       color: "#67e8f9" },
  { at: 25, item: "campfire", label: "🔥 Cozy Glow!",      color: "#f97316" },
  { at: 30, item: "crown",    label: "❄️ Snow Royalty!",    color: "#c084fc" },
];

function getStreakTier(streak) {
  let tier = null;
  for (const m of STREAK_MILESTONES) {
    if (streak >= m.at) tier = m;
  }
  return tier;
}

function getStreakBonus(streak) {
  if (streak >= 20) return { mult: 3, label: "3×" };
  if (streak >= 10) return { mult: 2, label: "2×" };
  if (streak >= 5)  return { mult: 1, bonus: 4, label: "+4" };
  if (streak >= 3)  return { mult: 1, bonus: 2, label: "+2" };
  return { mult: 1, bonus: 0, label: "" };
}

function calcScore(streak) {
  const b = getStreakBonus(streak);
  const base = 10;
  return (base + (b.bonus || 0)) * (b.mult || 1);
}

// Drop streak to previous milestone (lose one item, not everything)
function dropStreak(current) {
  if (current <= 0) return 0;
  // Find the highest milestone below current streak
  let prev = 0;
  for (const m of STREAK_MILESTONES) {
    if (m.at < current) prev = m.at;
  }
  // Drop to one below previous milestone, but at least lose 1
  return Math.max(0, prev - 1);
}

// ═══ STREAK MILESTONE CELEBRATION ═══
function StreakCelebration({ milestone }) {
  if (!milestone) return null;
  return (
    <div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,pointerEvents:"none",animation:"fadeIn .2s ease"}}>
      <div style={{background:"rgba(0,0,0,.6)",borderRadius:20,padding:"16px 28px",textAlign:"center",animation:"popIn .4s ease",pointerEvents:"none"}}>
        <div style={{fontSize:36,marginBottom:4}}>{milestone.label.split(" ")[0]}</div>
        <div style={{color:"white",fontSize:18,fontWeight:700,fontFamily:ff}}>{milestone.label}</div>
        <div style={{color:"#a5b4fc",fontSize:12,marginTop:4,fontFamily:ff}}>Streak bonus active!</div>
      </div>
    </div>
  );
}

// ═══ WINTER CATERPILLAR ═══
function WinterCaterpillar({ streak, shiver }) {
  const segs = Math.min(streak, 10);
  const tier = getStreakTier(streak);
  const hasScarf   = streak >= 3;
  const hasCocoa   = streak >= 5;
  const hasMittens = streak >= 8;
  const hasTophat  = streak >= 10;
  const hasSkates  = streak >= 15;
  const isIce      = streak >= 20;
  const hasCampfire= streak >= 25;
  const hasCrown   = streak >= 30;

  const segColor = (i) => {
    if (isIce && hasCampfire) return i % 2 === 0 ? "#67e8f9" : "#fdba74";
    if (isIce) return i % 2 === 0 ? "#a5f3fc" : "#67e8f9";
    if (hasTophat) return i % 2 === 0 ? "#e0e7ff" : "#c7d2fe";
    return i % 2 === 0 ? "#a5b4fc" : "#818cf8";
  };

  const headFill = hasCrown ? "#c084fc" : isIce ? "#06b6d4" : hasTophat ? "#e0e7ff" : "#6366f1";
  const headStroke = hasCrown ? "#7c3aed" : isIce ? "#0891b2" : hasTophat ? "#a5b4fc" : "#4338ca";
  const glowColor = hasCampfire ? "rgba(249,115,22,.4)" : isIce ? "rgba(6,182,212,.3)" : hasCrown ? "rgba(192,132,252,.4)" : "none";

  const w = 460;
  const h = 170;
  const hx = 60; // head center x
  const hy = 80; // head center y
  const hr = 36; // head radius
  const segR = hasTophat ? 22 : 18;
  const segGap = 34;

  const shiverAnim = shiver ? "catShiver .3s ease" : undefined;

  return (
    <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{animation:shiverAnim,overflow:"visible"}}>
        {/* Glow */}
        {glowColor !== "none" && (
          <ellipse cx={w/2} cy={hy+16} rx={w*0.4} ry={40} fill={glowColor} style={{animation:"pulse 2s ease-in-out infinite"}}/>
        )}

        {/* Skates track */}
        {hasSkates && (
          <line x1={hx-20} y1={h-8} x2={w-10} y2={h-8} stroke="#bae6fd" strokeWidth="2.5" strokeDasharray="8 5" opacity="0.5"/>
        )}

        {/* Body segments */}
        {Array.from({length:segs},(_,i)=>{
          const si = segs - 1 - i;
          const sx = hx + hr + 12 + si * segGap;
          const sy = hy + 12;
          return (
            <g key={i}>
              <circle cx={sx} cy={sy} r={segR} fill={segColor(si)}
                stroke={isIce?"#0891b2":hasTophat?"#a5b4fc":"#6366f1"} strokeWidth="2.5"
                style={{animation:`segBob .8s ease-in-out ${si*0.08}s infinite alternate`}}/>
              {hasMittens && (si === 0 || si === segs-1) && (
                <g>
                  <ellipse cx={sx-segR+3} cy={sy+segR+5} rx={5.5} ry={7} fill="#6366f1" stroke="#4338ca" strokeWidth="1.2"/>
                  <ellipse cx={sx+segR-3} cy={sy+segR+5} rx={5.5} ry={7} fill="#6366f1" stroke="#4338ca" strokeWidth="1.2"/>
                  <rect x={sx-segR} y={sy+segR+1} width={7} height={3.5} rx={1.5} fill="#818cf8"/>
                  <rect x={sx+segR-7} y={sy+segR+1} width={7} height={3.5} rx={1.5} fill="#818cf8"/>
                </g>
              )}
              {hasSkates && (
                <g>
                  <line x1={sx-8} y1={sy+segR+3} x2={sx+9} y2={sy+segR+3} stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round"/>
                  <line x1={sx-9} y1={sy+segR+7} x2={sx+10} y2={sy+segR+7} stroke="#0891b2" strokeWidth="2" strokeLinecap="round"/>
                </g>
              )}
            </g>
          );
        })}

        {/* Head */}
        <circle cx={hx} cy={hy} r={hr} fill={headFill} stroke={headStroke} strokeWidth="2.5"/>
        {/* Eyes */}
        <circle cx={hx-11} cy={hy-8} r={6.5} fill="white"/>
        <circle cx={hx+11} cy={hy-8} r={6.5} fill="white"/>
        <circle cx={hx-9} cy={hy-7} r={3.2} fill="#1e1b4b"/>
        <circle cx={hx+13} cy={hy-7} r={3.2} fill="#1e1b4b"/>
        {/* Eye shine */}
        <circle cx={hx-7.5} cy={hy-9.5} r={1.5} fill="white"/>
        <circle cx={hx+14.5} cy={hy-9.5} r={1.5} fill="white"/>
        {isIce && <>
          <circle cx={hx-7} cy={hy-10.5} r={1} fill="#67e8f9"/>
          <circle cx={hx+15} cy={hy-10.5} r={1} fill="#67e8f9"/>
        </>}
        {/* Rosy cheeks */}
        <circle cx={hx-20} cy={hy+5} r={5.5} fill="#f9a8d4" opacity=".35"/>
        <circle cx={hx+20} cy={hy+5} r={5.5} fill="#f9a8d4" opacity=".35"/>
        {/* Smile */}
        <path d={`M ${hx-11} ${hy+11} Q ${hx} ${hy+23} ${hx+11} ${hy+11}`} fill="none" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round"/>

        {/* ── ITEMS ── */}

        {/* Scarf */}
        {hasScarf && (
          <g>
            <rect x={hx-24} y={hy+hr-7} width={48} height={12} rx={4} fill="#ef4444"/>
            <rect x={hx+18} y={hy+hr+2} width={10} height={22} rx={4} fill="#ef4444"/>
            <line x1={hx-20} y1={hy+hr-2} x2={hx+20} y2={hy+hr-2} stroke="#dc2626" strokeWidth="1.8"/>
            <line x1={hx-20} y1={hy+hr+1} x2={hx+20} y2={hy+hr+1} stroke="#b91c1c" strokeWidth="1" opacity=".5"/>
            {[0,1,2].map(i => <line key={i} x1={hx+20+i*3} y1={hy+hr+22} x2={hx+20+i*3} y2={hy+hr+28} stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>)}
          </g>
        )}

        {/* Crown or Top hat */}
        {hasCrown ? (
          <g>
            <rect x={hx-22} y={hy-hr-2} width={44} height={6} rx={3} fill="#7c3aed"/>
            <polygon points={`${hx-20},${hy-hr} ${hx-13},${hy-hr-24} ${hx-6},${hy-hr}`} fill="#c084fc" stroke="#a855f7" strokeWidth="1.5"/>
            <polygon points={`${hx-7},${hy-hr} ${hx},${hy-hr-32} ${hx+7},${hy-hr}`} fill="#e9d5ff" stroke="#a855f7" strokeWidth="1.5"/>
            <polygon points={`${hx+6},${hy-hr} ${hx+13},${hy-hr-24} ${hx+20},${hy-hr}`} fill="#c084fc" stroke="#a855f7" strokeWidth="1.5"/>
            <circle cx={hx} cy={hy-hr-22} r={3} fill="white" style={{animation:"pulse 1s ease-in-out infinite"}}/>
            <circle cx={hx-13} cy={hy-hr-15} r={2} fill="#fbbf24" style={{animation:"pulse 1.2s ease-in-out .3s infinite"}}/>
            <circle cx={hx+13} cy={hy-hr-15} r={2} fill="#fbbf24" style={{animation:"pulse 1.2s ease-in-out .6s infinite"}}/>
          </g>
        ) : hasTophat ? (
          <g>
            <rect x={hx-20} y={hy-hr-30} width={40} height={30} rx={4} fill="#1e1b4b"/>
            <rect x={hx-26} y={hy-hr-4} width={52} height={8} rx={4} fill="#1e1b4b"/>
            <rect x={hx-16} y={hy-hr-22} width={32} height={5} rx={2} fill={isIce?"#67e8f9":"#a78bfa"} opacity=".5"/>
            <circle cx={hx+8} cy={hy-hr-18} r={3} fill="#16a34a"/>
            <circle cx={hx+14} cy={hy-hr-18} r={3} fill="#16a34a"/>
            <circle cx={hx+11} cy={hy-hr-21} r={2.5} fill="#ef4444"/>
          </g>
        ) : null}

        {/* Hot cocoa */}
        {hasCocoa && segs > 0 && (
          <g>
            <rect x={hx+hr+8} y={hy-20} width={22} height={28} rx={5} fill="#92400e" stroke="#78350f" strokeWidth="1.5"/>
            <rect x={hx+hr+6} y={hy-22} width={26} height={6} rx={3} fill="#78350f"/>
            <path d={`M ${hx+hr+30} ${hy-14} Q ${hx+hr+40} ${hy-6} ${hx+hr+30} ${hy+4}`} fill="none" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round"/>
            <ellipse cx={hx+hr+19} cy={hy-17} rx={9} ry={3} fill="#5c2d0e"/>
            <path d={`M ${hx+hr+14} ${hy-26} Q ${hx+hr+18} ${hy-38} ${hx+hr+13} ${hy-46}`} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.8" style={{animation:"steamFloat 2s ease-in-out infinite"}}/>
            <path d={`M ${hx+hr+22} ${hy-26} Q ${hx+hr+26} ${hy-36} ${hx+hr+20} ${hy-44}`} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" style={{animation:"steamFloat 2s ease-in-out .6s infinite"}}/>
            <circle cx={hx+hr+15} cy={hy-18} r={4} fill="#fef3c7" stroke="#fbbf24" strokeWidth=".8"/>
            <circle cx={hx+hr+23} cy={hy-17} r={3.5} fill="#fef3c7" stroke="#fbbf24" strokeWidth=".8"/>
          </g>
        )}

        {/* Campfire glow particles */}
        {hasCampfire && (
          <g>
            {[0,1,2,3,4,5].map(i => {
              const px = hx + 55 + i * 40;
              const py = hy + 32 + Math.sin(i) * 8;
              return <circle key={i} cx={px} cy={py} r={3.5} fill="#f97316" opacity=".5"
                style={{animation:`sparkleFloat 1.5s ease-in-out ${i*0.25}s infinite`}}/>;
            })}
          </g>
        )}

        {/* Snowflake trail for crown */}
        {hasCrown && (
          <g>
            {[0,1,2,3].map(i => {
              const px = hx + hr + 20 + segs * segGap + i * 22;
              return <text key={i} x={px} y={hy + 8 + Math.sin(i*2)*10} fontSize="18" fill="white" opacity={0.35 + i * 0.12}
                style={{animation:`sparkleFloat 2s ease-in-out ${i*0.35}s infinite`}}>❄</text>;
            })}
          </g>
        )}
      </svg>

      {/* Streak label */}
      {streak > 0 && (
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2}}>
          <span style={{fontSize:14,color:tier?tier.color:"#818cf8",fontWeight:600,fontFamily:ff}}>
            {streak} streak{tier ? ` · ${tier.label}` : ""}
          </span>
          {getStreakBonus(streak).label && (
            <span style={{fontSize:13,color:"#22c55e",fontWeight:700,background:"rgba(34,197,94,.12)",borderRadius:8,padding:"2px 10px",fontFamily:ff}}>
              {getStreakBonus(streak).label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ CSS ═══
const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
button{touch-action:manipulation;-webkit-touch-callout:none;user-select:none}
@keyframes popIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes shakeNote{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes snowfall{0%{transform:translateY(-10px) rotate(0deg)}100%{transform:translateY(100vh) rotate(360deg)}}
@keyframes snowBounce{0%{transform:translateY(0)}100%{transform:translateY(-18px)}}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes slideIn{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3)}50%{box-shadow:0 0 40px rgba(99,102,241,.6)}}
@keyframes segBob{0%{transform:translateY(0)}100%{transform:translateY(-2px)}}
@keyframes catShiver{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes steamFloat{0%{opacity:.5;transform:translateY(0)}50%{opacity:.3;transform:translateY(-3px)}100%{opacity:.1;transform:translateY(-6px)}}
@keyframes sparkleFloat{0%{opacity:.6;transform:translateY(0)}50%{opacity:.2;transform:translateY(-4px)}100%{opacity:.6;transform:translateY(0)}}
@keyframes catWalk{0%,100%{transform:translateY(0) scaleX(1)}25%{transform:translateY(-4px) scaleX(1.05)}50%{transform:translateY(0) scaleX(0.95)}75%{transform:translateY(-3px) scaleX(1.02)}}
@keyframes obsBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}
@keyframes snowmanWave{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@keyframes musicFloat{0%{opacity:0;transform:translateY(0) scale(.5)}30%{opacity:1;transform:translateY(-12px) scale(1)}100%{opacity:0;transform:translateY(-40px) scale(.6)}}
@keyframes correctBurst{0%{transform:scale(1)}30%{transform:scale(1.15)}60%{transform:scale(.95)}100%{transform:scale(1)}}
@keyframes hpShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes starTwinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
@keyframes treeSway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
*{box-sizing:border-box}body{margin:0;overflow-x:hidden}
`;

// ═══ EXPLANATION OVERLAY ═══
function ExplanationOverlay({ level, onStart }) {
  const lv = TRAINING_LEVELS[level];
  const iv = INTERVAL_DB[lv.intervalIdx];
  const dir = lv.direction;
  // Example: C4 up by this interval
  const exStart = "C";
  const exOct = dir === "down" ? 5 : 4;
  const exMidi = noteToMidi(exStart, exOct);
  const exTargetMidi = dir === "up" ? exMidi + iv.half : exMidi - iv.half;
  const exTarget = midiToChromatic(exTargetMidi);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:20,animation:"fadeIn .3s ease"}}>
      <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 32px",maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",textAlign:"center",animation:"slideIn .4s ease"}}>
        <div style={{fontSize:40,marginBottom:8}}>{iv.emoji}</div>
        <h2 style={{color:"white",margin:"0 0 4px",fontSize:24}}>{iv.name}</h2>
        <div style={{color:"#a5b4fc",fontSize:14,marginBottom:4}}>{iv.half} half step{iv.half!==1?"s":""} · {dir === "up" ? "Going up ⬆" : "Going down ⬇"}</div>

        <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.6,margin:"12px 0 16px"}}>{iv.desc}</p>

        {/* Example on staff */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
          <div style={{background:"white",borderRadius:14,padding:"4px 12px",display:"inline-block"}}>
            <DualStaff startName={exStart} startOct={exOct} targetName={exTarget.name} targetOct={exTarget.octave} highlight="correct" showTarget={true}/>
          </div>
        </div>

        <div style={{color:"#818cf8",fontSize:13,marginBottom:6}}>
          Example: {exStart} {dir === "up" ? "→" : "←"} {shortDisplay(exTarget.name)} ({iv.name} {dir})
        </div>

        {/* Song reference */}
        <div style={{background:"rgba(99,102,241,.12)",borderRadius:12,padding:"8px 16px",marginBottom:16}}>
          <div style={{color:"#a5b4fc",fontSize:11,marginBottom:2}}>Remember this sound from:</div>
          <div style={{color:"white",fontSize:15,fontWeight:600,marginBottom:6}}>{dir==="up" ? iv.songUp : iv.songDown}</div>
          {SONG_SNIPPETS[iv.short + "_" + dir] && (
            <button onClick={() => playSongSnippet(lv.intervalIdx, dir)}
              style={{padding:"8px 16px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.1)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              🎶 Hear It
            </button>
          )}
        </div>

        {/* Audio buttons */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>playTwoNotes(exStart, exOct, exTarget.name, exTarget.octave)}
            style={{padding:"8px 16px",borderRadius:10,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
            🎵 Hear Separately
          </button>
          <button onClick={()=>playTogether(exStart, exOct, exTarget.name, exTarget.octave)}
            style={{padding:"8px 16px",borderRadius:10,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
            🎶 Hear Together
          </button>
        </div>

        <button onClick={onStart}
          style={{padding:"12px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>
          Start Practice →
        </button>
      </div>
    </div>
  );
}

// ═══ MAIN COMPONENT ═══
export default function IntervalChordGame() {
  // Top-level mode: null=menu, "training", "classic", "chord"
  const [mode, setMode] = useState(null);
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected");

  // ── Training mode state ──
  const [tLevel, setTLevel] = useState(0);
  const [tPhase, setTPhase] = useState("explain"); // "explain" | "practice"
  const [tQ, setTQ] = useState(null);
  const [tHL, setTHL] = useState(null);
  const [tShow, setTShow] = useState(false);
  const [tSong, setTSong] = useState(null);
  const [tScore, setTScore] = useState(0);
  const [tStreak, setTStreak] = useState(0);
  const [tCorrectInLevel, setTCorrectInLevel] = useState(0);
  const [tMissesInLevel, setTMissesInLevel] = useState(0);
  const [tBtnHL, setTBtnHL] = useState({});
  const [tLevelStats, setTLevelStats] = useState({}); // { [levelIdx]: { score, perfect } }
  const [tWrongCount, setTWrongCount] = useState(0); // consecutive wrong on current Q
  const [tShowClue, setTShowClue] = useState(false);
  const NEEDED_PER_LEVEL = 5;

  // ── Classic mode state ──
  const [cLevel, setCLevel] = useState(0);
  const [cQ, setCQ] = useState(null);
  const [cHL, setCHL] = useState(null);
  const [cShow, setCShow] = useState(false);
  const [cSong, setCSong] = useState(null);
  const [cScore, setCScore] = useState(0);
  const [cStreak, setCStreak] = useState(0);
  const [cTotal, setCTotal] = useState(0);
  const [cCorrect, setCCorrect] = useState(0);
  const [cBtnHL, setCBtnHL] = useState({});
  const [cUnlocked, setCUnlocked] = useState(1); // how many classic levels unlocked
  const [cCorrectInLevel, setCCorrectInLevel] = useState(0);
  const [cLevelUp, setCLevelUp] = useState(null); // null or { from, to } for level-up popup
  const [cWrongCount, setCWrongCount] = useState(0);
  const [cShowClue, setCShowClue] = useState(false);
  const CLASSIC_NEEDED = 8;

  // ── Chord mode state ──
  const [chords, setChords] = useState([]);
  const [curChord, setCurChord] = useState(null);
  const [chStep, setChStep] = useState(0); // 0=pick 3rd, 1=pick 5th
  const [chHL, setChHL] = useState(null);
  const [chBtnHL, setChBtnHL] = useState({});
  const [chScore, setChScore] = useState(0);
  const [chThird, setChThird] = useState(null);
  const [chFifth, setChFifth] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chLocked, setChLocked] = useState(false); // prevent input during transitions
  const [chRound, setChRound] = useState(0); // total chords completed across all plays

  // ── Chord Ear Training state ──
  const [ceLevel, setCeLevel] = useState(0);
  const [cePhase, setCePhase] = useState("select"); // "select" | "explain" | "practice" | "levelUp" | "gameover" | "done"
  const [ceQ, setCeQ] = useState(null);
  const [ceHL, setCeHL] = useState(null);
  const [ceCorrect, setCeCorrect] = useState(0);
  const [ceLives, setCeLives] = useState(5);
  const [ceScore, setCeScore] = useState(0);
  const [ceMelt, setCeMelt] = useState(0); // current snowman melt stage
  const [ceSnowmenLost, setCeSnowmenLost] = useState(0); // total snowmen melted in level
  const [ceLevelStats, setCeLevelStats] = useState({}); // persisted

  // ── Interval Ear Training state ──
  const [ieLevel, setIeLevel] = useState(0);
  const [iePhase, setIePhase] = useState("select"); // select | practice | levelUp | gameover | done
  const [ieQ, setIeQ] = useState(null);
  const [ieHL, setIeHL] = useState(null);
  const [ieCorrect, setIeCorrect] = useState(0);
  const [ieHP, setIeHP] = useState(3); // caterpillar hit points
  const [ieScore, setIeScore] = useState(0);
  const [ieLevelStats, setIeLevelStats] = useState({});
  const [ieShowRef, setIeShowRef] = useState(false); // persisted

  // ── Weak Spots practice state ──
  const [wpPhase, setWpPhase] = useState("menu"); // menu | practice | done
  const [wpIvs, setWpIvs] = useState([]);
  const [wpQ, setWpQ] = useState(null);
  const [wpHL, setWpHL] = useState(null);
  const [wpCorrect, setWpCorrect] = useState(0);
  const [wpTotal, setWpTotal] = useState(0);
  const [wpRound, setWpRound] = useState(0);

  // ── Shared streak visual state ──
  const [showMilestone, setShowMilestone] = useState(null);
  const [catShiver, setCatShiver] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [seenIntro, setSeenIntro] = useState(false);

  // ── Achievements ──
  const ACHIEVEMENTS = [
    { id:"first_correct",  icon:"🌱", name:"First Steps",       desc:"Get your first correct answer" },
    { id:"streak_5",       icon:"🔥", name:"On Fire",           desc:"Get a 5-answer streak" },
    { id:"streak_10",      icon:"💎", name:"Unstoppable",       desc:"Get a 10-answer streak" },
    { id:"train_complete", icon:"📚", name:"Student",           desc:"Complete all training levels" },
    { id:"journey_3",      icon:"🐛", name:"Explorer",          desc:"Clear 3 Ear Journey levels" },
    { id:"journey_all",    icon:"🏆", name:"Journey Master",    desc:"Complete the entire Ear Journey" },
    { id:"perfect_level",  icon:"⭐", name:"Flawless",          desc:"Clear a Journey level with no hits" },
    { id:"chords_3",       icon:"⛄", name:"Chord Builder",     desc:"Build 3 chords correctly" },
    { id:"chords_10",      icon:"🎹", name:"Chord Master",      desc:"Build 10 chords correctly" },
    { id:"weak_80",        icon:"💪", name:"Comeback",          desc:"Score 80%+ in Weak Spots" },
    { id:"total_50",       icon:"🎯", name:"Dedicated",         desc:"Answer 50 total questions" },
    { id:"total_200",      icon:"👑", name:"Interval Royalty",   desc:"Answer 200 total questions" },
    { id:"all_intervals",  icon:"🌈", name:"Full Spectrum",     desc:"Get every interval correct at least once" },
    { id:"chord_ear_clear",icon:"🎧", name:"Chord Ear Pro",     desc:"Clear a Chord Ear level" },
  ];
  const [unlockedAch, setUnlockedAch] = useState({});
  const [showAchPopup, setShowAchPopup] = useState(false);
  const [achToast, setAchToast] = useState(null);
  const achToastTimer = useRef(null);

  // ── Global stats tracking ──
  const [intervalStats, setIntervalStats] = useState({});
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, started: Date.now() });
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      try {
        const [lvRes, ivRes, sessRes, unlockRes, ceRes, ieRes, introRes, achRes] = await Promise.all([
          window.storage.get("tLevelStats").catch(() => null),
          window.storage.get("intervalStats").catch(() => null),
          window.storage.get("sessionStats").catch(() => null),
          window.storage.get("cUnlocked").catch(() => null),
          window.storage.get("ceLevelStats").catch(() => null),
          window.storage.get("ieLevelStats").catch(() => null),
          window.storage.get("seenIntro").catch(() => null),
          window.storage.get("achievements").catch(() => null),
        ]);
        if (lvRes?.value) setTLevelStats(JSON.parse(lvRes.value));
        if (ivRes?.value) setIntervalStats(JSON.parse(ivRes.value));
        if (sessRes?.value) {
          const saved = JSON.parse(sessRes.value);
          setSessionStats({ ...saved, started: Date.now() });
        }
        if (unlockRes?.value) setCUnlocked(JSON.parse(unlockRes.value));
        if (ceRes?.value) setCeLevelStats(JSON.parse(ceRes.value));
        if (ieRes?.value) setIeLevelStats(JSON.parse(ieRes.value));
        if (introRes?.value) setSeenIntro(true);
        if (achRes?.value) setUnlockedAch(JSON.parse(achRes.value));
      } catch (e) { /* storage unavailable */ }
      setStorageLoaded(true);
    })();
  }, []);

  // Save tLevelStats when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("tLevelStats", JSON.stringify(tLevelStats)); } catch(e) {}
  }, [tLevelStats, storageLoaded]);

  // Save intervalStats when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("intervalStats", JSON.stringify(intervalStats)); } catch(e) {}
  }, [intervalStats, storageLoaded]);

  // Save sessionStats when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("sessionStats", JSON.stringify(sessionStats)); } catch(e) {}
  }, [sessionStats, storageLoaded]);

  // Save cUnlocked when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("cUnlocked", JSON.stringify(cUnlocked)); } catch(e) {}
  }, [cUnlocked, storageLoaded]);

  // Save ceLevelStats when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("ceLevelStats", JSON.stringify(ceLevelStats)); } catch(e) {}
  }, [ceLevelStats, storageLoaded]);

  // Save ieLevelStats when it changes
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("ieLevelStats", JSON.stringify(ieLevelStats)); } catch(e) {}
  }, [ieLevelStats, storageLoaded]);

  // Save achievements when they change
  useEffect(() => {
    if (!storageLoaded) return;
    try { window.storage.set("achievements", JSON.stringify(unlockedAch)); } catch(e) {}
  }, [unlockedAch, storageLoaded]);

  const grantAch = useCallback((id) => {
    setUnlockedAch(prev => {
      if (prev[id]) return prev;
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach) return prev;
      setAchToast(ach);
      if (achToastTimer.current) clearTimeout(achToastTimer.current);
      achToastTimer.current = setTimeout(() => setAchToast(null), 3000);
      return { ...prev, [id]: Date.now() };
    });
  }, [ACHIEVEMENTS]);

  const recordAnswer = useCallback((intervalIdx, isCorrect) => {
    setIntervalStats(prev => {
      const cur = prev[intervalIdx] || { correct: 0, wrong: 0 };
      const next = { ...prev, [intervalIdx]: { correct: cur.correct + (isCorrect ? 1 : 0), wrong: cur.wrong + (isCorrect ? 0 : 1) } };
      // Check "all intervals correct at least once"
      if (isCorrect) {
        const allHit = INTERVAL_DB.every((_, i) => (next[i]?.correct || 0) >= 1);
        if (allHit) grantAch("all_intervals");
      }
      return next;
    });
    setSessionStats(prev => {
      const next = { correct: prev.correct + (isCorrect ? 1 : 0), wrong: prev.wrong + (isCorrect ? 0 : 1), started: prev.started };
      const total = next.correct + next.wrong;
      if (isCorrect && next.correct === 1) grantAch("first_correct");
      if (total >= 50) grantAch("total_50");
      if (total >= 200) grantAch("total_200");
      return next;
    });
  }, [grantAch]);

  const timer = useRef(null);
  const milestoneTimer = useRef(null);

  // Cleanup
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); if (milestoneTimer.current) clearTimeout(milestoneTimer.current); }, []);

  // Check if streak just hit a milestone
  const checkMilestone = useCallback((newStreak) => {
    if (newStreak >= 5) grantAch("streak_5");
    if (newStreak >= 10) grantAch("streak_10");
    const hit = STREAK_MILESTONES.find(m => m.at === newStreak);
    if (hit) {
      setShowMilestone(hit);
      if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
      milestoneTimer.current = setTimeout(() => setShowMilestone(null), 1800);
    }
  }, []);

  const triggerShiver = useCallback(() => {
    setCatShiver(true);
    setTimeout(() => setCatShiver(false), 400);
  }, []);

  // ═══ TRAINING MODE ═══
  const tGenQ = useCallback((lvl) => {
    const lv = TRAINING_LEVELS[lvl];
    setTQ(genIntervalQ(lv.intervalIdx, lv.direction, false));
    setTHL(null); setTShow(false); setTSong(null); setTBtnHL({});
    setTWrongCount(0); setTShowClue(false);
  }, []);

  const startTraining = () => {
    if (!seenIntro) { setShowIntro("training"); return; }
    setMode("training"); setTPhase("select");
    setTScore(0); setTStreak(0); setTCorrectInLevel(0);
  };

  const tSelectLevel = (lvl) => {
    setTLevel(lvl); setTPhase("explain"); setTCorrectInLevel(0);
  };

  const tStartPractice = () => {
    setTPhase("practice"); setTCorrectInLevel(0); setTMissesInLevel(0);
    tGenQ(tLevel);
  };

  const tPick = useCallback((note) => {
    if (!tQ || tHL === "correct") return;
    const ivIdx = INTERVAL_DB.indexOf(tQ.interval);
    if (note === tQ.targetName) {
      recordAnswer(ivIdx, true);
      const newStreak = tStreak + 1;
      setTHL("correct"); setTShow(true); setTBtnHL({[note]:"correct"});
      setTScore(s => s + calcScore(newStreak)); setTStreak(newStreak);
      checkMilestone(newStreak);
      const iv = tQ.interval;
      const dir = tQ.dir;
      setTSong(`${iv.emoji} ${dir==="up"?iv.songUp:iv.songDown}`);
      playSepThenTogether(tQ.startName, tQ.startOct, tQ.targetName, tQ.targetOct);
      const nextCorrect = tCorrectInLevel + 1;
      setTCorrectInLevel(nextCorrect);
      timer.current = setTimeout(() => {
        if (nextCorrect >= NEEDED_PER_LEVEL) {
          setTLevelStats(prev => {
            const next = {
              ...prev,
              [tLevel]: {
                score: tScore + calcScore(newStreak),
                perfect: tMissesInLevel === 0
              }
            };
            if (Object.keys(next).length >= TRAINING_LEVELS.length) grantAch("train_complete");
            return next;
          });
          setTPhase("levelUp");
        } else {
          tGenQ(tLevel);
        }
      }, 2000);
    } else {
      recordAnswer(ivIdx, false);
      setTHL("wrong"); setTBtnHL({[note]:"wrong"}); setTStreak(s => dropStreak(s)); playBuzz();
      setTMissesInLevel(m => m + 1);
      setTWrongCount(w => w + 1);
      triggerShiver();
      timer.current = setTimeout(() => { setTHL(null); setTBtnHL({}); }, 500);
    }
  }, [tQ, tHL, tStreak, tCorrectInLevel, tLevel, tScore, tMissesInLevel, tGenQ, checkMilestone, triggerShiver, recordAnswer]);

  useEffect(() => {
    if (mode !== "training" || tPhase !== "practice") return;
    const h = (e) => { const k = e.key.toUpperCase(); if ("ABCDEFG".includes(k)) tPick(k); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mode, tPhase, tPick]);

  // ═══ CLASSIC MODE ═══
  const cGenQ = useCallback((lvl) => {
    setCQ(genClassicQ(lvl));
    setCHL(null); setCShow(false); setCSong(null); setCBtnHL({});
    setCWrongCount(0); setCShowClue(false);
  }, []);

  const startClassic = () => {
    setMode("classic"); setCLevel(0); setCScore(0); setCStreak(0); setCTotal(0); setCCorrect(0);
    setCCorrectInLevel(0); cGenQ(0);
    // Don't reset cUnlocked — preserve persisted progress
  };

  const cSwitchLevel = (lvl) => {
    if (lvl < cUnlocked) { setCLevel(lvl); setCCorrectInLevel(0); cGenQ(lvl); }
  };

  const cPick = useCallback((note) => {
    if (!cQ || cHL === "correct") return;
    setCTotal(t=>t+1);
    const ivIdx = INTERVAL_DB.indexOf(cQ.interval);
    // Accept enharmonic equivalents (clicking Gb when answer is F#, or vice versa)
    const target = cQ.targetName;
    const isMatch = note === target || note === enharmonic(target) || enharmonic(note) === target;

    if (isMatch) {
      recordAnswer(ivIdx, true);
      const newStreak = cStreak + 1;
      // Highlight the button that was clicked
      const hlObj = { [note]: "correct" };
      const enh = enharmonic(note);
      if (enh) hlObj[enh] = "correct";
      const enhTarget = enharmonic(target);
      if (enhTarget) hlObj[enhTarget] = "correct";
      hlObj[target] = "correct";
      setCHL("correct"); setCShow(true); setCBtnHL(hlObj);
      setCScore(s => s + calcScore(newStreak)); setCStreak(newStreak); setCCorrect(c=>c+1);
      checkMilestone(newStreak);
      const iv = cQ.interval; const dir = cQ.dir;
      setCSong(`${iv.emoji} ${dir==="up"?iv.songUp:iv.songDown}`);
      playSepThenTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct);

      const nextC = cCorrectInLevel + 1;
      setCCorrectInLevel(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= CLASSIC_NEEDED && cLevel + 1 < CLASSIC_LEVELS.length && cLevel + 1 >= cUnlocked) {
          setCLevelUp({ from: cLevel, to: cLevel + 1 });
          setCUnlocked(u => Math.max(u, cLevel + 2));
        } else {
          cGenQ(cLevel);
          if (nextC >= CLASSIC_NEEDED) setCCorrectInLevel(0);
        }
      }, 2200);
    } else {
      recordAnswer(ivIdx, false);
      setCHL("wrong"); setCBtnHL({[note]:"wrong"}); setCStreak(s => dropStreak(s)); playBuzz();
      setCWrongCount(w => w + 1);
      triggerShiver();
      timer.current = setTimeout(() => { setCHL(null); setCBtnHL({}); }, 500);
    }
  }, [cQ, cHL, cStreak, cLevel, cCorrectInLevel, cUnlocked, cGenQ, checkMilestone, triggerShiver, recordAnswer]);

  // For ear-only mode, let student pick the INTERVAL NAME, not the note
  const cPickInterval = useCallback((ivIdx) => {
    if (!cQ || cHL === "correct") return;
    setCTotal(t=>t+1);
    const correctIvIdx = INTERVAL_DB.indexOf(cQ.interval);
    if (ivIdx === correctIvIdx) {
      recordAnswer(correctIvIdx, true);
      const newStreak = cStreak + 1;
      setCHL("correct"); setCShow(true);
      setCScore(s => s + calcScore(newStreak)); setCStreak(newStreak); setCCorrect(c=>c+1);
      checkMilestone(newStreak);
      const iv = cQ.interval; const dir = cQ.dir;
      setCSong(`${iv.emoji} ${dir==="up"?iv.songUp:iv.songDown}`);
      playSepThenTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct);
      const nextC = cCorrectInLevel + 1;
      setCCorrectInLevel(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= CLASSIC_NEEDED && cLevel + 1 < CLASSIC_LEVELS.length && cLevel + 1 >= cUnlocked) {
          setCLevelUp({ from: cLevel, to: cLevel + 1 });
          setCUnlocked(u => Math.max(u, cLevel + 2));
        } else {
          cGenQ(cLevel);
          if (nextC >= CLASSIC_NEEDED) setCCorrectInLevel(0);
        }
      }, 2200);
    } else {
      recordAnswer(correctIvIdx, false);
      setCHL("wrong"); setCStreak(s => dropStreak(s)); playBuzz();
      setCWrongCount(w => w + 1);
      triggerShiver();
      timer.current = setTimeout(() => { setCHL(null); }, 500);
    }
  }, [cQ, cHL, cStreak, cLevel, cCorrectInLevel, cUnlocked, cGenQ, checkMilestone, triggerShiver, recordAnswer]);

  useEffect(() => {
    if (mode !== "classic") return;
    const lv = CLASSIC_LEVELS[cLevel];
    if (lv.earOnly) return; // no keyboard for ear-only (interval names)
    const h = (e) => {
      const k = e.key.toUpperCase();
      if (lv.accidentals) {
        // Map keys: allow natural notes only via keyboard
        if ("ABCDEFG".includes(k)) cPick(k);
      } else {
        if ("ABCDEFG".includes(k)) cPick(k);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mode, cLevel, cPick]);

  // ═══ CHORD MODE ═══
  const chGenQ = useCallback(() => {
    setCurChord(genChordQ());
    setChStep(0); setChHL(null); setChBtnHL({}); setChThird(null); setChFifth(null); setChLocked(false);
  }, []);

  const startChord = () => {
    setMode("chord"); setChords([]); setChScore(0); setAllDone(false);
    setBouncing(false); setShowConf(false); setChLocked(false);
    // Generate first chord
    const q = genChordQ();
    setCurChord(q);
    setChStep(0); setChHL(null); setChBtnHL({}); setChThird(null); setChFifth(null);
  };

  // ═══ CHORD EAR TRAINING ═══
  const ceGenQ = useCallback((lvl) => {
    const q = genChordEarQ(lvl);
    setCeQ(q); setCeHL(null);
  }, []);

  const startChordEar = () => {
    if (!seenIntro) { setShowIntro("chordEar"); return; }
    setMode("chordEar"); setCePhase("select"); setCeScore(0);
  };

  const ceSelectLevel = (lvl) => {
    setCeLevel(lvl); setCePhase("explain");
  };

  const ceStartPractice = () => {
    const lv = CHORD_EAR_LEVELS[ceLevel];
    setCePhase("practice"); setCeCorrect(0); setCeMelt(0); setCeSnowmenLost(0);
    setCeLives(lv.lives);
    ceGenQ(ceLevel);
  };

  const cePick = useCallback((typeIdx) => {
    if (!ceQ || ceHL) return;
    const lv = CHORD_EAR_LEVELS[ceLevel];

    if (typeIdx === ceQ.typeIdx) {
      setCeHL("correct");
      setCeScore(s => s + 15);
      const nextC = ceCorrect + 1;
      setCeCorrect(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= lv.needed) {
          setCeLevelStats(prev => ({ ...prev, [ceLevel]: { score: ceScore + 15, snowmenLost: ceSnowmenLost } }));
          grantAch("chord_ear_clear");
          if (ceLevel + 1 >= CHORD_EAR_LEVELS.length) setCePhase("done");
          else setCePhase("levelUp");
        } else {
          ceGenQ(ceLevel);
        }
      }, 3000);
    } else {
      setCeHL("wrong");
      playBuzz();
      const newMelt = ceMelt + 1;
      setCeMelt(newMelt);
      if (newMelt >= 3) {
        const newLives = ceLives - 1;
        setCeLives(newLives);
        setCeSnowmenLost(s => s + 1);
        timer.current = setTimeout(() => {
          if (newLives <= 0) {
            setCePhase("gameover");
          } else {
            setCeMelt(0);
            setCeHL(null);
          }
        }, 1200);
      } else {
        timer.current = setTimeout(() => setCeHL(null), 800);
      }
    }
  }, [ceQ, ceHL, ceLevel, ceCorrect, ceScore, ceMelt, ceLives, ceSnowmenLost, ceGenQ]);

  // ═══ INTERVAL EAR TRAINING ═══
  const IE_OBSTACLES = [
    { name: "Snowdrift", emoji: "❄️", desc: "A wall of snow blocks the path!" },
    { name: "Frozen Stream", emoji: "🧊", desc: "A slippery frozen stream to cross!" },
    { name: "Ice Cave", emoji: "🕳️", desc: "A dark ice cave echoes with music!" },
    { name: "Blizzard", emoji: "🌨️", desc: "A howling blizzard — listen carefully!" },
    { name: "Snow Beast", emoji: "🐻‍❄️", desc: "A snow beast guards the way!" },
    { name: "Frozen Waterfall", emoji: "🏔️", desc: "A frozen waterfall blocks the trail!" },
    { name: "Avalanche", emoji: "⛰️", desc: "Rumbling from above — quick!" },
    { name: "Ice Maze", emoji: "🌀", desc: "A twisting maze of ice walls!" },
    { name: "Snow Wolves", emoji: "🐺", desc: "A pack of snow wolves circles!" },
    { name: "Frozen Lake", emoji: "💎", desc: "A vast frozen lake to navigate!" },
    { name: "Ice Dragon", emoji: "🐉", desc: "An ice dragon challenges you!" },
    { name: "The Summit", emoji: "🏆", desc: "The final climb to the snowman!" },
  ];

  const IE_LEVELS = [
    { id: 0,  name: "Small Steps",      ivs: [0, 1],                            newIv: null, desc: "Minor 2nd & Major 2nd",           needed: 6,  hp: 4, obstacle: 0 },
    { id: 1,  name: "+ Minor 3rd",       ivs: [0, 1, 2],                         newIv: 2,    desc: "Adding the Minor 3rd",            needed: 6,  hp: 4, obstacle: 1 },
    { id: 2,  name: "+ Major 3rd",       ivs: [0, 1, 2, 3],                      newIv: 3,    desc: "Adding the Major 3rd",            needed: 7,  hp: 4, obstacle: 2 },
    { id: 3,  name: "+ Perfect 4th",     ivs: [0, 1, 2, 3, 4],                   newIv: 4,    desc: "Adding the Perfect 4th",          needed: 7,  hp: 3, obstacle: 3 },
    { id: 4,  name: "+ Tritone",         ivs: [0, 1, 2, 3, 4, 5],                newIv: 5,    desc: "Adding the devil's interval",     needed: 8,  hp: 3, obstacle: 4 },
    { id: 5,  name: "+ Perfect 5th",     ivs: [0, 1, 2, 3, 4, 5, 6],             newIv: 6,    desc: "Adding the Perfect 5th",          needed: 8,  hp: 3, obstacle: 5 },
    { id: 6,  name: "+ Minor 6th",       ivs: [0, 1, 2, 3, 4, 5, 6, 7],          newIv: 7,    desc: "Adding the Minor 6th",            needed: 8,  hp: 3, obstacle: 6 },
    { id: 7,  name: "+ Major 6th",       ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8],       newIv: 8,    desc: "Adding the Major 6th",            needed: 9,  hp: 3, obstacle: 7 },
    { id: 8,  name: "+ Minor 7th",       ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],    newIv: 9,    desc: "Adding the Minor 7th",            needed: 9,  hp: 3, obstacle: 8 },
    { id: 9,  name: "+ Major 7th",       ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], newIv: 10,  desc: "Adding the Major 7th",            needed: 10, hp: 3, obstacle: 9 },
    { id: 10, name: "+ Octave",          ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], newIv: 11, desc: "Adding the Octave",           needed: 10, hp: 3, obstacle: 10 },
    { id: 11, name: "All Intervals",     ivs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], newIv: null, desc: "The final challenge — all 12!", needed: 12, hp: 3, obstacle: 11 },
  ];

  const _lastIeIvRef = useRef(-1);
  const ieGenQ = useCallback((lvl) => {
    const lv = IE_LEVELS[lvl];
    let ivIdx;
    let tries = 0;
    do { ivIdx = lv.ivs[Math.floor(Math.random() * lv.ivs.length)]; tries++; }
    while (ivIdx === _lastIeIvRef.current && lv.ivs.length > 1 && tries < 20);
    _lastIeIvRef.current = ivIdx;
    const dir = Math.random() < 0.5 ? "up" : "down";
    const q = genIntervalQ(ivIdx, dir, true);
    setIeQ(q); setIeHL(null);
  }, []);

  const startIntervalEar = () => {
    if (!seenIntro) { setShowIntro("intervalEar"); return; }
    // Check if they've seen the journey-specific intro
    if (!ieLevelStats._seenJourneyIntro) {
      setMode("intervalEar"); setIePhase("journeyIntro"); setIeScore(0);
    } else {
      setMode("intervalEar"); setIePhase("select"); setIeScore(0);
    }
  };

  const ieFinishJourneyIntro = () => {
    setIeLevelStats(prev => ({ ...prev, _seenJourneyIntro: true }));
    setIeLevel(0);
    // Go straight to practice — we just explained the intervals
    const lv = IE_LEVELS[0];
    setIePhase("practice");
    setIeCorrect(0); setIeHP(lv.hp); setIeScore(0);
    ieGenQ(0);
  };

  const ieSelectLevel = (lvl) => {
    setIeLevel(lvl); setIePhase("explain");
  };

  const ieStartPractice = () => {
    const lv = IE_LEVELS[ieLevel];
    setIePhase("practice");
    setIeCorrect(0); setIeHP(lv.hp); setIeScore(0);
    ieGenQ(ieLevel);
  };

  const iePick = useCallback((ivIdx) => {
    if (!ieQ || ieHL) return;
    const lv = IE_LEVELS[ieLevel];
    const correctIdx = INTERVAL_DB.indexOf(ieQ.interval);

    if (ivIdx === correctIdx) {
      setIeHL("correct");
      setIeScore(s => s + 15);
      recordAnswer(correctIdx, true);
      const nextC = ieCorrect + 1;
      setIeCorrect(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= lv.needed) {
          setIeLevelStats(prev => {
            const next = { ...prev, [ieLevel]: { score: ieScore + 15, hpLeft: ieHP } };
            const cleared = Object.keys(next).filter(k => k !== "_seenJourneyIntro" && next[k]).length;
            if (cleared >= 3) grantAch("journey_3");
            if (cleared >= IE_LEVELS.length) grantAch("journey_all");
            return next;
          });
          if (ieHP === lv.hp) grantAch("perfect_level");
          if (ieLevel + 1 >= IE_LEVELS.length) setIePhase("done");
          else setIePhase("levelUp");
        } else {
          ieGenQ(ieLevel);
        }
      }, 2200);
    } else {
      setIeHL("wrong");
      recordAnswer(correctIdx, false);
      playBuzz();
      const newHP = ieHP - 1;
      setIeHP(newHP);
      timer.current = setTimeout(() => {
        if (newHP <= 0) {
          setIePhase("gameover");
        } else {
          setIeHL(null);
        }
      }, 1000);
    }
  }, [ieQ, ieHL, ieLevel, ieCorrect, ieScore, ieHP, ieGenQ, recordAnswer]);

  const chPick = useCallback((note) => {
    if (!curChord || chLocked) return;

    if (chStep === 0) {
      // Picking the 3rd
      if (note === curChord.third.name) {
        setChHL("correct"); setChBtnHL({[note]:"correct"}); setChThird(note);
        setChScore(s=>s+10); setChLocked(true);
        playNote(curChord.third.name, curChord.third.octave, 0.5);
        timer.current = setTimeout(() => {
          setChStep(1); setChHL(null); setChBtnHL({}); setChLocked(false);
        }, 700);
      } else {
        setChHL("wrong"); setChBtnHL({[note]:"wrong"}); playBuzz();
        timer.current = setTimeout(() => { setChHL(null); setChBtnHL({}); }, 500);
      }
    } else {
      // Picking the 5th
      if (note === curChord.fifth.name) {
        setChHL("correct"); setChBtnHL({[note]:"correct"}); setChFifth(note);
        setChScore(s=>s+10); setChLocked(true);
        playChord([
          [curChord.root, curChord.rootOct],
          [curChord.third.name, curChord.third.octave],
          [curChord.fifth.name, curChord.fifth.octave],
        ]);
        timer.current = setTimeout(() => {
          const newChords = [...chords, {
            root: curChord.root, third: curChord.third.name, fifth: curChord.fifth.name,
            name: curChord.displayName,
            notes: [[curChord.root, curChord.rootOct],[curChord.third.name, curChord.third.octave],[curChord.fifth.name, curChord.fifth.octave]],
          }];
          setChords(newChords);
          setChRound(r => {
            const next = r + 1;
            if (next >= 3) grantAch("chords_3");
            if (next >= 10) grantAch("chords_10");
            return next;
          });
          if (newChords.length >= 4) {
            setAllDone(true); setBouncing(true); setShowConf(true);
            playChordSequence(newChords.map(c=>c.notes), () => setTimeout(()=>setShowConf(false), 2000));
            setChLocked(true);
          } else {
            // Next chord
            const q = genChordQ();
            setCurChord(q);
            setChStep(0); setChHL(null); setChBtnHL({}); setChThird(null); setChFifth(null); setChLocked(false);
          }
        }, 1100);
      } else {
        setChHL("wrong"); setChBtnHL({[note]:"wrong"}); playBuzz();
        timer.current = setTimeout(() => { setChHL(null); setChBtnHL({}); }, 500);
      }
    }
  }, [curChord, chStep, chLocked, chords]);

  useEffect(() => {
    if (mode !== "chord") return;
    const h = (e) => { const k = e.key.toUpperCase(); if ("ABCDEFG".includes(k)) chPick(k); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mode, chPick]);

  // ═══ MIDI SETUP ═══
  const MIDI_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  useEffect(() => {
    if (!navigator.requestMIDIAccess) { setMidiStatus("unsupported"); return; }
    navigator.requestMIDIAccess().then(access => {
      const update = () => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) { setMidiDevice(inputs[0]); setMidiStatus("connected"); }
        else { setMidiDevice(null); setMidiStatus("disconnected"); }
      };
      update();
      access.onstatechange = update;
    }).catch(() => setMidiStatus("unsupported"));
  }, []);

  const tPickRef = useRef(tPick); tPickRef.current = tPick;
  const cPickRef = useRef(cPick); cPickRef.current = cPick;
  const chPickRef = useRef(chPick); chPickRef.current = chPick;
  const modeRef = useRef(mode); modeRef.current = mode;
  const tPhaseRef = useRef(tPhase); tPhaseRef.current = tPhase;

  useEffect(() => {
    if (!midiDevice) return;
    const onMsg = (e) => {
      const [status, noteNum, velocity] = e.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const name = MIDI_NAMES[noteNum % 12];
        if (name.includes("#")) return; // ignore black keys for natural-note modes
        const m = modeRef.current;
        if (m === "training" && tPhaseRef.current === "practice") tPickRef.current(name);
        else if (m === "classic") cPickRef.current(name);
        else if (m === "chord") chPickRef.current(name);
      }
    };
    midiDevice.onmidimessage = onMsg;
    return () => { midiDevice.onmidimessage = null; };
  }, [midiDevice]);

  // ═══ WEAK SPOTS PRACTICE ═══
  const getWeakIntervals = useCallback(() => {
    const entries = INTERVAL_DB.map((iv, i) => {
      const s = intervalStats[i];
      if (!s || (s.correct + s.wrong) < 3) return null;
      const total = s.correct + s.wrong;
      const pct = Math.round(s.correct / total * 100);
      return { idx: i, pct, total, wrong: s.wrong };
    }).filter(Boolean);
    if (entries.length === 0) return [];
    // Take intervals below 75% accuracy, or the worst 3 if all are above 75%
    const weak = entries.filter(e => e.pct < 75);
    if (weak.length >= 2) return weak.sort((a,b) => a.pct - b.pct).map(e => e.idx);
    return entries.sort((a,b) => a.pct - b.pct).slice(0, Math.max(2, Math.min(4, entries.length))).map(e => e.idx);
  }, [intervalStats]);

  const _lastWpIvRef = useRef(-1);
  const wpGenQ = useCallback((ivs) => {
    let ivIdx;
    let tries = 0;
    do { ivIdx = ivs[Math.floor(Math.random() * ivs.length)]; tries++; }
    while (ivIdx === _lastWpIvRef.current && ivs.length > 1 && tries < 20);
    _lastWpIvRef.current = ivIdx;
    const dir = Math.random() < 0.5 ? "up" : "down";
    const q = genIntervalQ(ivIdx, dir, true);
    setWpQ(q); setWpHL(null); setWpRound(r => r + 1);
  }, []);

  const startWeakPractice = () => {
    const weak = getWeakIntervals();
    if (weak.length < 2) {
      setMode("weakSpots"); setWpPhase("menu"); setWpIvs([]);
      return;
    }
    setMode("weakSpots"); setWpPhase("menu"); setWpIvs(weak);
  };

  const wpBegin = () => {
    setWpPhase("practice"); setWpCorrect(0); setWpTotal(0);
    wpGenQ(wpIvs);
  };

  const wpPick = useCallback((ivIdx) => {
    if (!wpQ || wpHL) return;
    const correctIdx = INTERVAL_DB.indexOf(wpQ.interval);
    const newTotal = wpTotal + 1;
    setWpTotal(newTotal);

    if (ivIdx === correctIdx) {
      setWpHL("correct");
      recordAnswer(correctIdx, true);
      const newC = wpCorrect + 1;
      setWpCorrect(newC);
      playChime();
      timer.current = setTimeout(() => {
        if (newTotal >= 10) {
          if (Math.round(newC / newTotal * 100) >= 80) grantAch("weak_80");
          setWpPhase("done");
        }
        else { wpGenQ(wpIvs); }
      }, 1800);
    } else {
      setWpHL("wrong");
      recordAnswer(correctIdx, false);
      playBuzz();
      timer.current = setTimeout(() => {
        if (newTotal >= 10) {
          if (Math.round(wpCorrect / newTotal * 100) >= 80) grantAch("weak_80");
          setWpPhase("done");
        }
        else { wpGenQ(wpIvs); }
      }, 2200);
    }
  }, [wpQ, wpHL, wpTotal, wpIvs, wpGenQ, recordAnswer]);

  const goMenu = () => { if (timer.current) clearTimeout(timer.current); setMode(null); };

  const dismissIntro = () => {
    const target = showIntro;
    setSeenIntro(true); setShowIntro(false);
    try { window.storage.set("seenIntro", "1"); } catch(e) {}
    // Now launch the mode they originally clicked
    if (target === "training") { setMode("training"); setTPhase("select"); setTScore(0); setTStreak(0); setTCorrectInLevel(0); }
    else if (target === "chordEar") { setMode("chordEar"); setCePhase("select"); setCeScore(0); }
    else if (target === "intervalEar") { setMode("intervalEar"); setIePhase("select"); setIeScore(0); }
  };

  // Intro overlay — "What is an interval?"
  const IntroOverlay = () => {
    if (!showIntro) return null;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}
        onClick={dismissIntro}>
        <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 24px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}
          onClick={e => e.stopPropagation()}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:40,marginBottom:6}}>🎵</div>
            <h2 style={{color:"white",fontSize:24,margin:"0 0 6px"}}>What is an Interval?</h2>
            <p style={{color:"#a5b4fc",fontSize:14,margin:0}}>The building block of all music</p>
          </div>

          <div style={{background:"rgba(99,102,241,.08)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.7,margin:"0 0 10px"}}>
              An <span style={{color:"white",fontWeight:700}}>interval</span> is the distance between two notes. 
              It's measured in <span style={{color:"white",fontWeight:700}}>half steps</span> — the smallest step on a piano (one key to the very next).
            </p>
            <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.7,margin:0}}>
              Every melody and every chord is made of intervals. Learning to recognize them lets you understand how music works!
            </p>
          </div>

          {/* Visual: piano keys showing half steps */}
          <div style={{background:"rgba(0,0,0,.2)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
            <div style={{color:"#818cf8",fontSize:11,fontWeight:600,marginBottom:8,textAlign:"center"}}>A piano keyboard — each key to the next is 1 half step</div>
            <div style={{display:"flex",justifyContent:"center",gap:1,marginBottom:8}}>
              {["C","","D","","E","F","","G","","A","","B"].map((n, i) => {
                const isBlack = [1,3,6,8,10].includes(i);
                return (
                  <div key={i} style={{width:isBlack?18:26,height:isBlack?40:60,background:isBlack?"#1e1b4b":"white",borderRadius:"0 0 4px 4px",border:"1px solid #444",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:3,marginTop:isBlack?0:0,zIndex:isBlack?2:1,marginLeft:isBlack?-9:0,marginRight:isBlack?-9:0}}>
                    {n && <span style={{fontSize:9,color:isBlack?"#818cf8":"#4b5563",fontWeight:600}}>{n}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"#a5b4fc"}}>C → D = <span style={{color:"white",fontWeight:700}}>2 half steps</span> (Major 2nd)</span>
              <span style={{fontSize:12,color:"#a5b4fc"}}>C → E = <span style={{color:"white",fontWeight:700}}>4 half steps</span> (Major 3rd)</span>
            </div>
          </div>

          {/* Key intervals with audio */}
          <div style={{background:"rgba(99,102,241,.08)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <div style={{color:"#a5b4fc",fontSize:12,fontWeight:600,marginBottom:8}}>Some intervals to try:</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
              {[
                { name: "Minor 2nd", half: 1, emoji: "🦈" },
                { name: "Major 3rd", half: 4, emoji: "🎺" },
                { name: "Perfect 5th", half: 7, emoji: "⭐" },
                { name: "Octave", half: 12, emoji: "🌈" },
              ].map((iv, i) => (
                <button key={i} onClick={() => { playNote("C", 4, 0.5, 0); const m = noteToMidi("C", 4) + iv.half; const t = midiToChromatic(m); playNote(t.name, t.octave, 0.5, 0.45); }}
                  style={{padding:"6px 10px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"white",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:16}}>{iv.emoji}</div>
                  <div style={{fontSize:10,color:"#a5b4fc"}}>{iv.name}</div>
                  <div style={{fontSize:9,color:"#818cf8"}}>{iv.half} half steps</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{background:"rgba(34,197,94,.08)",borderRadius:12,padding:"10px 16px",marginBottom:18}}>
            <p style={{color:"#86efac",fontSize:13,lineHeight:1.6,margin:0,textAlign:"center"}}>
              🎧 <span style={{fontWeight:700}}>Tip:</span> Each interval has a unique sound. You can learn to recognize them by associating them with famous songs!
            </p>
          </div>

          <button onClick={dismissIntro}
            style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>
            Got it — let's go! 🎵
          </button>
        </div>
      </div>
    );
  };

  // Stats panel
  // ── Achievement Toast ──
  const AchToast = () => {
    if (!achToast) return null;
    return (
      <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,animation:"slideIn .4s ease",pointerEvents:"none"}}>
        <div style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",borderRadius:16,padding:"10px 20px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 30px rgba(245,158,11,.4)"}}>
          <span style={{fontSize:28}}>{achToast.icon}</span>
          <div>
            <div style={{color:"white",fontSize:13,fontWeight:800}}>🏆 {achToast.name}!</div>
            <div style={{color:"rgba(255,255,255,.8)",fontSize:11}}>{achToast.desc}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── Trophy Case Popup ──
  const TrophyCase = () => {
    if (!showAchPopup) return null;
    const count = Object.keys(unlockedAch).length;
    return (
      <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)"}}
        onClick={() => setShowAchPopup(false)}>
        <div style={{background:"linear-gradient(180deg,#451a03,#7c2d12)",borderRadius:24,padding:"24px 20px",maxWidth:420,width:"92%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"popIn .3s ease",fontFamily:ff}}
          onClick={e => e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{color:"white",fontSize:20,fontWeight:700,margin:0}}>🏆 Achievements</h2>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#fde68a",fontSize:13,fontWeight:600}}>{count}/{ACHIEVEMENTS.length}</span>
              <button onClick={() => setShowAchPopup(false)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,width:32,height:32,color:"white",fontSize:16,cursor:"pointer",fontFamily:ff}}>✕</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {ACHIEVEMENTS.map(ach => {
              const got = !!unlockedAch[ach.id];
              return (
                <div key={ach.id} style={{background: got ? "rgba(245,158,11,.1)" : "rgba(0,0,0,.2)",border:`1px solid ${got ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.06)"}`,borderRadius:12,padding:"10px 10px",textAlign:"center",opacity:got?1:.45}}>
                  <div style={{fontSize:28,marginBottom:2,filter:got?"none":"grayscale(1)"}}>{ach.icon}</div>
                  <div style={{color:got?"white":"#9ca3af",fontSize:12,fontWeight:700}}>{ach.name}</div>
                  <div style={{color:got?"#fed7aa":"#6b7280",fontSize:10,lineHeight:1.3}}>{ach.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const StatsPanel = () => {
    if (!showStats) return null;
    const total = sessionStats.correct + sessionStats.wrong;
    const pct = total > 0 ? Math.round(sessionStats.correct / total * 100) : 0;
    const elapsed = Math.floor((Date.now() - sessionStats.started) / 60000);
    const mins = elapsed < 1 ? "<1" : elapsed;

    // Sort intervals by most attempted
    const ivEntries = INTERVAL_DB.map((iv, i) => {
      const s = intervalStats[i];
      if (!s) return null;
      const t = s.correct + s.wrong;
      return { iv, idx: i, correct: s.correct, wrong: s.wrong, total: t, pct: Math.round(s.correct / t * 100) };
    }).filter(Boolean).sort((a, b) => b.total - a.total);

    const best = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct > b.pct ? a : b) : null;
    const worst = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct < b.pct ? a : b) : null;

    return (
      <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)"}}
        onClick={() => setShowStats(false)}>
        <div style={{background:"linear-gradient(180deg,#1e1b4b,#312e81)",borderRadius:24,padding:"24px 20px",maxWidth:420,width:"92%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"popIn .3s ease",fontFamily:ff}}
          onClick={e => e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{color:"white",fontSize:20,fontWeight:700,margin:0}}>📊 Session Stats</h2>
            <button onClick={() => setShowStats(false)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,width:32,height:32,color:"white",fontSize:16,cursor:"pointer",fontFamily:ff}}>✕</button>
          </div>

          {/* Session overview */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[
              { label: "Correct", value: sessionStats.correct, color: "#4ade80", icon: "✓" },
              { label: "Wrong", value: sessionStats.wrong, color: "#f87171", icon: "✗" },
              { label: "Accuracy", value: total > 0 ? pct + "%" : "—", color: pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171", icon: "🎯" },
            ].map((s, i) => (
              <div key={i} style={{background:"rgba(99,102,241,.1)",borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"#818cf8",marginBottom:4}}>{s.icon} {s.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <div style={{flex:1,background:"rgba(99,102,241,.08)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"#818cf8"}}>🕐 Time Played</div>
              <div style={{fontSize:16,fontWeight:700,color:"white"}}>{mins} min</div>
            </div>
            <div style={{flex:1,background:"rgba(99,102,241,.08)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"#818cf8"}}>📝 Total Questions</div>
              <div style={{fontSize:16,fontWeight:700,color:"white"}}>{total}</div>
            </div>
          </div>

          {/* Highlights */}
          {best && worst && best.idx !== worst.idx && ivEntries.length >= 2 && (
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <div style={{flex:1,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#4ade80",fontWeight:600,marginBottom:4}}>💪 Strongest</div>
                <div style={{fontSize:13,color:"white",fontWeight:700}}>{best.iv.emoji} {best.iv.short}</div>
                <div style={{fontSize:11,color:"#86efac"}}>{best.pct}% ({best.correct}/{best.total})</div>
              </div>
              <div style={{flex:1,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:12,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#f87171",fontWeight:600,marginBottom:4}}>🎯 Needs Work</div>
                <div style={{fontSize:13,color:"white",fontWeight:700}}>{worst.iv.emoji} {worst.iv.short}</div>
                <div style={{fontSize:11,color:"#fca5a5"}}>{worst.pct}% ({worst.correct}/{worst.total})</div>
              </div>
            </div>
          )}

          {/* Per-interval breakdown */}
          {ivEntries.length > 0 && (
            <>
              <div style={{fontSize:13,fontWeight:700,color:"#a5b4fc",marginBottom:8}}>Per-Interval Breakdown</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {ivEntries.map(e => (
                  <div key={e.idx} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.06)",borderRadius:10,padding:"6px 10px"}}>
                    <span style={{fontSize:16,width:24,textAlign:"center"}}>{e.iv.emoji}</span>
                    <span style={{color:"white",fontSize:12,fontWeight:600,width:40}}>{e.iv.short}</span>
                    {/* Accuracy bar */}
                    <div style={{flex:1,height:10,background:"rgba(99,102,241,.15)",borderRadius:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:e.pct+"%",borderRadius:5,background:e.pct>=80?"linear-gradient(90deg,#22c55e,#4ade80)":e.pct>=60?"linear-gradient(90deg,#eab308,#fbbf24)":"linear-gradient(90deg,#ef4444,#f87171)",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:e.pct>=80?"#4ade80":e.pct>=60?"#fbbf24":"#f87171",width:36,textAlign:"right"}}>{e.pct}%</span>
                    <span style={{fontSize:10,color:"#818cf8",width:32,textAlign:"right"}}>{e.correct}/{e.total}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {total === 0 && (
            <div style={{textAlign:"center",padding:"20px 0",color:"#818cf8",fontSize:14}}>
              No stats yet — start playing to see your progress!
            </div>
          )}

          {/* Reset button */}
          {total > 0 && (
            <button onClick={() => {
              if (confirm("Reset all progress? This clears training stars, interval stats, and unlocked levels.")) {
                setTLevelStats({}); setIntervalStats({});
                setSessionStats({ correct: 0, wrong: 0, started: Date.now() });
                setCUnlocked(1); setCeLevelStats({}); setIeLevelStats({}); setSeenIntro(false);
                setUnlockedAch({});
                try {
                  window.storage.delete("tLevelStats");
                  window.storage.delete("intervalStats");
                  window.storage.delete("sessionStats");
                  window.storage.delete("cUnlocked");
                  window.storage.delete("ceLevelStats");
                  window.storage.delete("ieLevelStats");
                  window.storage.delete("seenIntro");
                  window.storage.delete("achievements");
                } catch(e) {}
                setShowStats(false);
              }
            }} style={{marginTop:16,width:"100%",padding:"8px 16px",borderRadius:10,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.08)",color:"#fca5a5",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              Reset All Progress
            </button>
          )}
        </div>
      </div>
    );
  };

  const bg = "linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 100%)";

  // ═══════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════

  // ── MENU ──
  if (!mode) {
    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
        <style>{css}</style>
        <Snowflakes count={40}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center",animation:"slideIn .6s ease"}}>
          <div style={{fontSize:48,marginBottom:4}}>⛄🎵</div>
          <h1 style={{fontSize:"clamp(28px,6vw,42px)",fontWeight:700,color:"white",margin:"0 0 8px",letterSpacing:-1,textShadow:"0 4px 20px rgba(99,102,241,.5)"}}>Chord Snowman</h1>
          <p style={{color:"#a5b4fc",fontSize:15,margin:"0 0 36px",maxWidth:360}}>Learn intervals & build chords through music!</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[
              { fn: startTraining, icon: "📚", title: "Training", desc: "Step-by-step interval lessons", border: "#4f46e5", bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
              { fn: startClassic,  icon: "🎼", title: "Classic", desc: "Progressive difficulty levels", border: "#6366f1", bg: "linear-gradient(135deg,#1e1b4b,#3730a3)" },
              { fn: startIntervalEar, icon: "🐛", title: "Ear Journey", desc: "Identify intervals by ear!", border: "#06b6d4", bg: "linear-gradient(135deg,#083344,#164e63)" },
              { fn: startChordEar, icon: "🎧", title: "Chord Ear", desc: "Hear & identify chord types", border: "#ec4899", bg: "linear-gradient(135deg,#4a1942,#831843)" },
              { fn: startChord,    icon: "⛄", title: "Build Chords", desc: "Stack notes to build chords", border: "#7c3aed", bg: "linear-gradient(135deg,#2e1065,#4c1d95)" },
              { fn: startWeakPractice, icon: "🎯", title: "Weak Spots", desc: "Drill your weakest intervals", border: "#f97316", bg: "linear-gradient(135deg,#431407,#7c2d12)" },
            ].map((m, i) => (
              <button key={i} onClick={m.fn} style={{width:"clamp(140px,42vw,175px)",padding:"20px 12px",borderRadius:20,border:`2px solid ${m.border}`,background:m.bg,cursor:"pointer",textAlign:"center",fontFamily:ff,boxShadow:`0 8px 30px ${m.border}44`,transition:"all .2s"}}>
                <div style={{fontSize:32,marginBottom:6}}>{m.icon}</div>
                <div style={{fontSize:18,fontWeight:700,color:"white",marginBottom:4}}>{m.title}</div>
                <div style={{fontSize:12,color:"#a5b4fc",lineHeight:1.4}}>{m.desc}</div>
              </button>
            ))}
          </div>
          {/* Stats + Trophy buttons */}
          {midiStatus === "connected" && (
            <div style={{marginTop:8,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#4ade80",fontWeight:600}}>🎹 MIDI keyboard connected</div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24}}>
            <button onClick={() => setShowStats(true)}
              style={{padding:"10px 24px",borderRadius:14,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              📊 Stats
            </button>
            <button onClick={() => setShowAchPopup(true)}
              style={{padding:"10px 24px",borderRadius:14,border:"1px solid rgba(245,158,11,.3)",background:"rgba(245,158,11,.08)",color:"#fde68a",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              🏆 {Object.keys(unlockedAch).length}/{ACHIEVEMENTS.length}
            </button>
          </div>
        </div>
        <StatsPanel/><AchToast/>
        <TrophyCase/>
        <AchToast/>
        <IntroOverlay/>
      </div>
    );
  }

  // ── TRAINING MODE ──
  if (mode === "training") {
    const lv = TRAINING_LEVELS[tLevel];
    const iv = lv ? INTERVAL_DB[lv.intervalIdx] : null;

    if (tPhase === "select") {
      // Group levels by interval for cleaner display
      const groups = [];
      let lastIv = -1;
      TRAINING_LEVELS.forEach((l, i) => {
        const ivData = INTERVAL_DB[l.intervalIdx];
        if (l.intervalIdx !== lastIv) {
          groups.push({ iv: ivData, idx: l.intervalIdx, levels: [] });
          lastIv = l.intervalIdx;
        }
        groups[groups.length - 1].levels.push({ ...l, index: i });
      });

      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:14,color:"#818cf8",fontWeight:600}}>📚 Training</div>
            </div>

            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:4}}>📚</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>Choose a Lesson</h2>
              <p style={{color:"#a5b4fc",fontSize:13,margin:"0 0 6px"}}>Pick any interval to practice, or start from the beginning</p>
              {Object.keys(tLevelStats).length > 0 && (
                <div style={{display:"flex",gap:12,justifyContent:"center",fontSize:12,color:"#818cf8"}}>
                  <span>✅ {Object.keys(tLevelStats).length}/{TRAINING_LEVELS.length} completed</span>
                  <span>⭐ {Object.values(tLevelStats).filter(s => s.perfect).length} perfect</span>
                </div>
              )}
            </div>

            {/* Start from beginning button */}
            <button onClick={() => tSelectLevel(0)}
              style={{width:"100%",padding:"12px 20px",borderRadius:14,border:"2px solid #6366f1",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer",marginBottom:16,boxShadow:"0 4px 16px rgba(99,102,241,.3)"}}>
              ▶ Start from Beginning
            </button>

            {/* Level grid */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {groups.map((g, gi) => {
                const allDoneInGroup = g.levels.every(l => tLevelStats[l.index]);
                const allPerfectInGroup = g.levels.every(l => tLevelStats[l.index]?.perfect);
                return (
                <div key={gi} style={{background: allPerfectInGroup ? "rgba(250,204,21,.06)" : allDoneInGroup ? "rgba(34,197,94,.05)" : "rgba(99,102,241,.06)",border:`1px solid ${allPerfectInGroup ? "rgba(250,204,21,.2)" : allDoneInGroup ? "rgba(34,197,94,.15)" : "rgba(99,102,241,.15)"}`,borderRadius:14,padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:20}}>{g.iv.emoji}</span>
                    <span style={{color:"white",fontSize:14,fontWeight:700}}>{g.iv.name}</span>
                    <span style={{color:"#818cf8",fontSize:11}}>{g.iv.half} half step{g.iv.half !== 1 ? "s" : ""}</span>
                    {allPerfectInGroup && <span style={{fontSize:14,marginLeft:"auto"}} title="All perfect!">🌟</span>}
                    {allDoneInGroup && !allPerfectInGroup && <span style={{fontSize:13,marginLeft:"auto",color:"#4ade80"}} title="All completed">✓</span>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {g.levels.map(l => {
                      const stats = tLevelStats[l.index];
                      const done = !!stats;
                      const perfect = stats && stats.perfect;
                      return (
                        <button key={l.index} onClick={() => tSelectLevel(l.index)}
                          style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.35)" : "rgba(99,102,241,.3)"}`,background:perfect ? "rgba(250,204,21,.1)" : done ? "rgba(34,197,94,.08)" : "rgba(99,102,241,.1)",color:perfect ? "#fde68a" : done ? "#86efac" : "#c4b5fd",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                          {perfect ? "⭐" : done ? "✅" : ""}{l.direction === "up" ? "⬆ Up" : "⬇ Down"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (tPhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={30}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .6s ease"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>Training Complete!</h2>
            <p style={{color:"#c4b5fd",fontSize:15,marginBottom:8}}>You've learned all the intervals! Score: {tScore}</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startTraining} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Restart Training</button>
              <button onClick={startClassic} style={{padding:"12px 28px",borderRadius:14,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Try Classic Mode</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    if (tPhase === "levelUp") {
      const nextLvl = tLevel + 1;
      const isAllDone = nextLvl >= TRAINING_LEVELS.length;
      const nextIv = !isAllDone ? INTERVAL_DB[TRAINING_LEVELS[nextLvl].intervalIdx] : null;
      const completedIv = INTERVAL_DB[lv.intervalIdx];
      const wasPerfect = tMissesInLevel === 0;
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/>
          <Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{wasPerfect ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Complete!</h2>
            {wasPerfect && (
              <div style={{color:"#fde68a",fontSize:15,fontWeight:700,marginBottom:8,animation:"popIn .5s ease"}}>⭐ Perfect Score — No Mistakes! ⭐</div>
            )}
            <div style={{background: wasPerfect ? "rgba(250,204,21,.12)" : "rgba(34,197,94,.12)",border:`1px solid ${wasPerfect ? "rgba(250,204,21,.3)" : "rgba(34,197,94,.3)"}`,borderRadius:16,padding:"14px 24px",marginBottom:16}}>
              <div style={{fontSize:28,marginBottom:4}}>{completedIv.emoji}</div>
              <div style={{color: wasPerfect ? "#fde68a" : "#4ade80",fontSize:18,fontWeight:700}}>{completedIv.name} {wasPerfect ? "⭐" : "✓"}</div>
              <div style={{color: wasPerfect ? "#fcd34d" : "#86efac",fontSize:13,marginTop:2}}>{wasPerfect ? "Flawless!" : "Mastered!"}</div>
            </div>
            <div style={{marginBottom:16}}>
              <WinterCaterpillar streak={tStreak} shiver={false}/>
            </div>
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:16}}>Score: {tScore} · Streak: {tStreak}</div>
            {!isAllDone ? (
              <>
                <div style={{color:"#818cf8",fontSize:13,marginBottom:12}}>
                  Next up: <span style={{color:"white",fontWeight:700}}>{nextIv.emoji} {nextIv.name}</span>
                </div>
                <button onClick={() => {
                  setTLevel(nextLvl); setTPhase("explain"); setTCorrectInLevel(0);
                }} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)",animation:"popIn .4s ease"}}>
                  Continue →
                </button>
              </>
            ) : (
              <button onClick={() => setTPhase("done")} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)"}}>
                See Results 🏆
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={20}/>
        {tPhase === "explain" && <ExplanationOverlay level={tLevel} onStart={tStartPractice}/>}
        <StreakCelebration milestone={showMilestone}/>
        <StatsPanel/><AchToast/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:6,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setTPhase("select")} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋 Lessons</button>
            <button onClick={() => setShowStats(true)} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📊</button>
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {tScore}</div>
          </div>
        </div>

        {/* Winter Caterpillar */}
        <div style={{zIndex:1,marginBottom:6}}>
          <WinterCaterpillar streak={tStreak} shiver={catShiver}/>
        </div>

        {/* Level info */}
        <div style={{color:"#818cf8",fontSize:12,marginBottom:4,zIndex:1}}>
          📚 Training · Level {tLevel+1}/{TRAINING_LEVELS.length}
        </div>
        <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:4,zIndex:1}}>{lv.title}</div>

        {/* Progress bar */}
        <div style={{width:"100%",maxWidth:300,height:8,background:"rgba(255,255,255,.1)",borderRadius:4,marginBottom:16,zIndex:1,overflow:"hidden"}}>
          <div style={{width:`${(tCorrectInLevel/NEEDED_PER_LEVEL)*100}%`,height:"100%",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:4,transition:"width .3s"}}/>
        </div>
        <div style={{color:"#a5b4fc",fontSize:11,marginBottom:12,zIndex:1}}>{tCorrectInLevel}/{NEEDED_PER_LEVEL} correct to advance</div>

        {tPhase === "practice" && tQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Prompt */}
            <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#818cf8",marginBottom:2}}>Find the note a</div>
              <div style={{fontSize:22,fontWeight:700,color:"white"}}>{tQ.interval.name}</div>
              <div style={{fontSize:14,color:"#a5b4fc",fontWeight:600}}>{tQ.dir==="up"?"⬆ above":"⬇ below"} {shortDisplay(tQ.startName)}</div>
            </div>

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 16px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,animation:tHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <DualStaff startName={tQ.startName} startOct={tQ.startOct} targetName={tQ.targetName} targetOct={tQ.targetOct} highlight={tHL} showTarget={tShow} showGhost={tWrongCount >= 3 && !tShow}/>
            </div>

            {/* Clue / help area */}
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,alignItems:"center",minHeight:28,flexWrap:"wrap"}}>
              {!tShowClue && tHL !== "correct" && (
                <button onClick={() => setTShowClue(true)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  💡 Clue
                </button>
              )}
              {tHL !== "correct" && SONG_SNIPPETS[tQ.interval.short + "_" + tQ.dir] && (
                <button onClick={() => playSongSnippet(INTERVAL_DB.indexOf(tQ.interval), tQ.dir)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Hear Song
                </button>
              )}
              {tShowClue && (
                <div style={{width:"100%",textAlign:"center",background:"rgba(250,204,21,.1)",border:"1px solid rgba(250,204,21,.25)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#fde68a",fontWeight:600,animation:"popIn .3s ease"}}>
                  💡 {tQ.interval.name} = {tQ.interval.half} half step{tQ.interval.half !== 1 ? "s" : ""} {tQ.dir === "up" ? "up ⬆" : "down ⬇"}
                </div>
              )}
              {tWrongCount >= 3 && !tShow && (
                <div style={{fontSize:11,color:"#c4b5fd",animation:"popIn .3s ease"}}>
                  👻 Ghost note showing answer position
                </div>
              )}
            </div>

            {/* Song hint */}
            {tSong && (
              <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:14,padding:"8px 20px",marginBottom:14,color:"#4ade80",fontSize:14,fontWeight:600,textAlign:"center",animation:"popIn .4s ease",maxWidth:340}}>
                <div style={{fontSize:11,color:"#86efac",marginBottom:2}}>Think of:</div>{tSong}
              </div>
            )}

            {/* Note buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
              {NOTE_ORDER.map(n=>{
                const hl = tBtnHL[n] || (tWrongCount >= 3 && !tShow && n === tQ.targetName ? "hint" : undefined);
                return <NoteBtn key={n} note={n} onClick={tPick} disabled={tHL==="correct"} highlight={hl}/>;
              })}
            </div>
            <div style={{color:"#6366f1",fontSize:11,marginTop:8,opacity:.5,zIndex:1}}>Press A–G on keyboard</div>
          </div>
        )}
      </div>
    );
  }

  // ── CLASSIC MODE ──
  if (mode === "classic") {
    const lv = CLASSIC_LEVELS[cLevel];
    const notePool = lv.accidentals ? CHROMATIC : NOTE_ORDER;
    const isEarOnly = lv.earOnly;

    // Level-up popup
    if (cLevelUp) {
      const nextLv = CLASSIC_LEVELS[cLevelUp.to];
      const prevLv = CLASSIC_LEVELS[cLevelUp.from];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/>
          <Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>🎉</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Unlocked!</h2>
            <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:16,padding:"12px 24px",marginBottom:12}}>
              <div style={{color:"#4ade80",fontSize:16,fontWeight:700}}>{prevLv.name} ✓ Complete</div>
            </div>
            <div style={{marginBottom:12}}>
              <WinterCaterpillar streak={cStreak} shiver={false}/>
            </div>
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:12}}>Score: {cScore} · {cTotal > 0 ? `${Math.round(cCorrect/cTotal*100)}% accuracy` : ""}</div>
            <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:14,padding:"12px 20px",marginBottom:20}}>
              <div style={{color:"#818cf8",fontSize:12,marginBottom:4}}>Next level:</div>
              <div style={{color:"white",fontSize:20,fontWeight:700}}>{nextLv.name}</div>
              <div style={{color:"#a5b4fc",fontSize:13}}>{nextLv.desc}</div>
            </div>
            <button onClick={() => {
              setCLevel(cLevelUp.to); setCCorrectInLevel(0); setCLevelUp(null); cGenQ(cLevelUp.to);
            }} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)",animation:"popIn .4s ease"}}>
              Let's Go! →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={20}/>
        <StreakCelebration milestone={showMilestone}/>
        <StatsPanel/><AchToast/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:540,marginBottom:6,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setShowStats(true)} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📊</button>
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {cScore}</div>
          </div>
        </div>

        {/* Winter Caterpillar */}
        <div style={{zIndex:1,marginBottom:6}}>
          <WinterCaterpillar streak={cStreak} shiver={catShiver}/>
        </div>

        {/* Level tabs */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",justifyContent:"center",zIndex:1}}>
          {CLASSIC_LEVELS.map((l, i) => (
            <button key={i} onClick={() => cSwitchLevel(i)} disabled={i >= cUnlocked}
              style={{padding:"4px 10px",borderRadius:8,border:`2px solid ${i===cLevel?"#6366f1":"rgba(99,102,241,.25)"}`,background:i===cLevel?"rgba(99,102,241,.15)":"transparent",color:i>=cUnlocked?"#374151":i===cLevel?"white":"#818cf8",fontSize:11,fontWeight:600,fontFamily:ff,cursor:i>=cUnlocked?"default":"pointer",opacity:i>=cUnlocked?0.4:1}}>
              {i >= cUnlocked ? "🔒 " : ""}{l.name}
            </button>
          ))}
        </div>

        <div style={{color:"#818cf8",fontSize:11,marginBottom:4,zIndex:1}}>
          {lv.desc} · {cTotal > 0 ? `${Math.round(cCorrect/cTotal*100)}% accuracy` : "Let's go!"}
        </div>

        {/* Progress to unlock next */}
        {cLevel + 1 < CLASSIC_LEVELS.length && cLevel + 1 >= cUnlocked && (
          <div style={{width:"100%",maxWidth:280,marginBottom:8,zIndex:1}}>
            <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,(cCorrectInLevel/CLASSIC_NEEDED)*100)}%`,height:"100%",background:"linear-gradient(90deg,#6366f1,#a855f7)",borderRadius:3,transition:"width .3s"}}/>
            </div>
            <div style={{color:"#6366f1",fontSize:10,marginTop:2,textAlign:"center"}}>{cCorrectInLevel}/{CLASSIC_NEEDED} to unlock next</div>
          </div>
        )}

        {cQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Prompt — for ear-only, just show interval direction */}
            {!isEarOnly && (
              <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:13,color:"#818cf8",marginBottom:2}}>Find the note a</div>
                <div style={{fontSize:22,fontWeight:700,color:"white"}}>{cQ.interval.name}</div>
                <div style={{fontSize:14,color:"#a5b4fc",fontWeight:600}}>{cQ.dir==="up"?"⬆ above":"⬇ below"} {shortDisplay(cQ.startName)}</div>
              </div>
            )}
            {isEarOnly && (
              <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:13,color:"#a78bfa",marginBottom:2}}>Listen and identify the interval</div>
                <div style={{fontSize:20,fontWeight:700,color:"white"}}>🎧 Ear Training</div>
                <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:8}}>
                  <button onClick={()=>playSepThenTogether(cQ.startName,cQ.startOct,cQ.targetName,cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🔄 Play Again
                  </button>
                  <button onClick={()=>playTwoNotes(cQ.startName,cQ.startOct,cQ.targetName,cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🎵 Separate
                  </button>
                  <button onClick={()=>playTogether(cQ.startName,cQ.startOct,cQ.targetName,cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🎶 Together
                  </button>
                </div>
              </div>
            )}

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 16px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,animation:cHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <DualStaff startName={cQ.startName} startOct={cQ.startOct} targetName={cQ.targetName} targetOct={cQ.targetOct} highlight={cHL} showTarget={cShow} earOnly={isEarOnly} showGhost={cWrongCount >= 3 && !cShow}/>
            </div>

            {/* Clue / help area */}
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,alignItems:"center",minHeight:28,flexWrap:"wrap"}}>
              {!cShowClue && cHL !== "correct" && (
                <button onClick={() => setCShowClue(true)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  💡 Clue
                </button>
              )}
              {cHL !== "correct" && SONG_SNIPPETS[cQ.interval.short + "_" + cQ.dir] && (
                <button onClick={() => playSongSnippet(INTERVAL_DB.indexOf(cQ.interval), cQ.dir)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Hear Song
                </button>
              )}
              {cShowClue && (
                <div style={{width:"100%",textAlign:"center",background:"rgba(250,204,21,.1)",border:"1px solid rgba(250,204,21,.25)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#fde68a",fontWeight:600,animation:"popIn .3s ease"}}>
                  💡 {cQ.interval.name} = {cQ.interval.half} half step{cQ.interval.half !== 1 ? "s" : ""} {cQ.dir === "up" ? "up ⬆" : "down ⬇"}
                </div>
              )}
              {cWrongCount >= 3 && !cShow && (
                <div style={{fontSize:11,color:"#c4b5fd",animation:"popIn .3s ease"}}>
                  👻 Ghost note showing answer
                </div>
              )}
            </div>

            {/* Auto-play on new question for ear-only */}
            {isEarOnly && !cShow && <EarAutoPlay key={`${cQ.startName}${cQ.startOct}${cQ.targetName}${cQ.targetOct}`} n1={cQ.startName} o1={cQ.startOct} n2={cQ.targetName} o2={cQ.targetOct}/>}

            {/* Song hint */}
            {cSong && (
              <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:14,padding:"8px 20px",marginBottom:14,color:"#4ade80",fontSize:14,fontWeight:600,textAlign:"center",animation:"popIn .4s ease",maxWidth:340}}>
                <div style={{fontSize:11,color:"#86efac",marginBottom:2}}>Think of:</div>{cSong}
              </div>
            )}

            {/* Buttons */}
            {!isEarOnly ? (
              <>
                {lv.accidentals ? (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    {/* Black keys row (accidentals) */}
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      {CHROMATIC_BUTTONS.filter(([,alt]) => alt).map(([primary, alt]) => {
                        const t = cQ.targetName;
                        const isHint = cWrongCount >= 3 && !cShow && (primary === t || alt === t || primary === enharmonic(t) || alt === enharmonic(t));
                        const hl = cBtnHL[primary] || cBtnHL[alt] || (isHint ? "hint" : undefined);
                        return <EnharmonicBtn key={primary} primary={primary} alt={alt} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                      })}
                    </div>
                    {/* White keys row (naturals) */}
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      {CHROMATIC_BUTTONS.filter(([,alt]) => !alt).map(([primary]) => {
                        const isHint = cWrongCount >= 3 && !cShow && (primary === cQ.targetName || primary === enharmonic(cQ.targetName));
                        const hl = cBtnHL[primary] || (isHint ? "hint" : undefined);
                        return <EnharmonicBtn key={primary} primary={primary} alt={null} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
                    {notePool.map(n=>{
                      const hl = cBtnHL[n] || (cWrongCount >= 3 && !cShow && n === cQ.targetName ? "hint" : undefined);
                      return <NoteBtn key={n} note={n} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                    })}
                  </div>
                )}
                {!lv.accidentals && <div style={{color:"#6366f1",fontSize:11,marginTop:8,opacity:.5}}>Press A–G on keyboard</div>}
              </>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:480}}>
                {INTERVAL_DB.map((iv, idx) => {
                  const isCorrectIV = cHL === "correct" && idx === INTERVAL_DB.indexOf(cQ.interval);
                  const bg2 = isCorrectIV ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#4338ca,#6366f1)";
                  return (
                    <button key={idx} onClick={()=>cPickInterval(idx)} disabled={cHL==="correct"}
                      style={{padding:"6px 12px",borderRadius:10,border:"none",background:cHL==="correct"?"#374151":bg2,color:cHL==="correct"?"#6b7280":"white",fontSize:12,fontWeight:600,fontFamily:ff,cursor:cHL==="correct"?"default":"pointer",opacity:cHL==="correct"&&!isCorrectIV?0.4:1,transition:"all .15s",transform:isCorrectIV?"scale(1.1)":"scale(1)"}}>
                      {iv.short}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── INTERVAL EAR TRAINING ──
  if (mode === "intervalEar") {
    const ieLv = IE_LEVELS[ieLevel];
    const obstacle = IE_OBSTACLES[ieLv.obstacle];

    // Journey intro — what is an interval + minor/major 2nds
    if (iePhase === "journeyIntro") {
      const m2 = INTERVAL_DB[0];
      const M2 = INTERVAL_DB[1];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:460,animation:"slideIn .5s ease"}}>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:44,marginBottom:6}}>🐛 → ⛄</div>
              <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Your Ear Journey Begins!</h2>
              <p style={{color:"#67e8f9",fontSize:14,margin:0}}>Before we start, let's learn about intervals</p>
            </div>

            {/* What is an interval */}
            <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
              <h3 style={{color:"white",fontSize:17,margin:"0 0 8px"}}>🎵 What is an Interval?</h3>
              <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7,margin:"0 0 8px"}}>
                An <span style={{color:"white",fontWeight:700}}>interval</span> is the distance between two notes. On a piano, each key to the next is one <span style={{color:"#67e8f9",fontWeight:700}}>half step</span>.
              </p>
              <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7,margin:0}}>
                Two half steps = a <span style={{color:"#67e8f9",fontWeight:700}}>whole step</span>. Each interval has its own unique sound!
              </p>
            </div>

            {/* Piano visual */}
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:14,padding:"12px 16px",marginBottom:14,textAlign:"center"}}>
              <div style={{color:"#818cf8",fontSize:11,fontWeight:600,marginBottom:8}}>Each key to the next = 1 half step</div>
              <div style={{display:"flex",justifyContent:"center",gap:1,marginBottom:6}}>
                {["C","","D","","E","F","","G","","A","","B","C"].map((n, i) => {
                  const isBlack = [1,3,6,8,10].includes(i);
                  const isHL = i <= 2;
                  return (
                    <div key={i} style={{width:isBlack?16:24,height:isBlack?36:56,background:isBlack?"#1e1b4b": isHL ? "#cffafe" : "white",borderRadius:"0 0 4px 4px",border:isBlack?"1px solid #555":"1px solid #aaa",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:3,zIndex:isBlack?2:1,marginLeft:isBlack?-8:0,marginRight:isBlack?-8:0}}>
                      {n && <span style={{fontSize:8,color:isBlack?"#818cf8":"#4b5563",fontWeight:600}}>{n}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:12,color:"#67e8f9"}}>
                C → D = <span style={{color:"white",fontWeight:700}}>2 half steps</span> (a whole step)
              </div>
            </div>

            {/* First two intervals */}
            <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
              <h3 style={{color:"white",fontSize:16,margin:"0 0 12px",textAlign:"center"}}>Your first two intervals:</h3>

              {/* Minor 2nd */}
              <div style={{background:"rgba(0,0,0,.15)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:"white",fontSize:15,fontWeight:700}}>{m2.emoji} {m2.name}</span>
                  <span style={{color:"#67e8f9",fontSize:11}}>1 half step</span>
                </div>
                <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.5,margin:"0 0 8px"}}>{m2.desc.split(".")[0]}.</p>
                {/* Ascending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:4}}>⬆ Ascending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={4} targetName="Db" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#67e8f9"}}>C → D♭</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {m2.songUp}</span>
                    <button onClick={() => { playNote("C",4,.5,0); playNote("Db",4,.5,.45); }}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["m2_up"] && (
                      <button onClick={() => playSongSnippet(0, "up")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Jaws
                      </button>
                    )}
                  </div>
                </div>
                {/* Descending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px"}}>
                  <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:4}}>⬇ Descending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={5} targetName="B" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#f9a8d4"}}>C → B</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {m2.songDown}</span>
                    <button onClick={() => { playNote("C",5,.5,0); playNote("B",4,.5,.45); }}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["m2_down"] && (
                      <button onClick={() => playSongSnippet(0, "down")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Für Elise
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Major 2nd */}
              <div style={{background:"rgba(0,0,0,.15)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:"white",fontSize:15,fontWeight:700}}>{M2.emoji} {M2.name}</span>
                  <span style={{color:"#67e8f9",fontSize:11}}>2 half steps</span>
                </div>
                <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.5,margin:"0 0 8px"}}>{M2.desc.split(".")[0]}.</p>
                {/* Ascending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:4}}>⬆ Ascending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={4} targetName="D" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#67e8f9"}}>C → D</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {M2.songUp}</span>
                    <button onClick={() => { playNote("C",4,.5,0); playNote("D",4,.5,.45); }}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["M2_up"] && (
                      <button onClick={() => playSongSnippet(1, "up")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Birthday
                      </button>
                    )}
                  </div>
                </div>
                {/* Descending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px"}}>
                  <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:4}}>⬇ Descending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="D" startOct={4} targetName="C" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#f9a8d4"}}>D → C</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {M2.songDown}</span>
                    <button onClick={() => { playNote("D",4,.5,0); playNote("C",4,.5,.45); }}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["M2_down"] && (
                      <button onClick={() => playSongSnippet(1, "down")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Mary
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div style={{background:"rgba(34,197,94,.08)",borderRadius:12,padding:"10px 16px",marginBottom:16,textAlign:"center"}}>
              <p style={{color:"#86efac",fontSize:13,lineHeight:1.5,margin:0}}>
                🎧 <span style={{fontWeight:700}}>Tip:</span> The minor 2nd sounds tense and creepy (like Jaws!). The major 2nd sounds natural and singable (like Happy Birthday). Listen for the difference!
              </p>
            </div>

            <button onClick={ieFinishJourneyIntro}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.4)"}}>
              Let's go! 🐛❄️
            </button>
          </div>
        </div>
      );
    }

    // Level select
    if (iePhase === "select") {
      const completedCount = Object.keys(ieLevelStats).filter(k => k !== "_seenJourneyIntro").length;
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a3a5c 100%)",fontFamily:ff,padding:"16px 14px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={15}/>
          {/* Stars */}
          {[15,35,55,75,90].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:10+i*12,left:`${l}%`,width:2,height:2,borderRadius:"50%",background:"#e0e7ff",animation:`starTwinkle ${2+i*.4}s ease infinite`,animationDelay:`${i*.3}s`,zIndex:0}}/>
          ))}
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:13,color:"#67e8f9",fontWeight:600}}>🐛 Ear Journey</div>
            </div>
            {/* Header with caterpillar scene */}
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:32,marginBottom:4}}>
                <span style={{display:"inline-block",animation:"catWalk 1.2s ease-in-out infinite"}}>🐛</span>
                <span style={{color:"#67e8f9",fontSize:18,margin:"0 8px"}}>→→→</span>
                <span style={{display:"inline-block",animation:"snowmanWave 3s ease-in-out infinite"}}>⛄</span>
              </div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>The Journey Map</h2>
              <p style={{color:"#67e8f9",fontSize:12,margin:0}}>{completedCount}/{IE_LEVELS.length} obstacles cleared</p>
            </div>

            {/* Journey path */}
            <div style={{display:"flex",flexDirection:"column",gap:6,position:"relative"}}>
              {/* Dotted line connecting levels */}
              <div style={{position:"absolute",left:28,top:30,bottom:30,width:2,background:"repeating-linear-gradient(180deg,rgba(6,182,212,.2) 0px,rgba(6,182,212,.2) 6px,transparent 6px,transparent 12px)",zIndex:0}}/>

              {IE_LEVELS.map((lv, i) => {
                const stats = ieLevelStats[i];
                const done = !!stats;
                const perfect = done && stats.hpLeft === lv.hp;
                const prevDone = i === 0 || !!ieLevelStats[i - 1];
                const locked = !prevDone;
                const obs = IE_OBSTACLES[lv.obstacle];
                const isNext = !done && prevDone;
                return (
                  <button key={i} onClick={() => !locked && ieSelectLevel(i)} disabled={locked}
                    style={{padding:"12px 14px",borderRadius:16,border:`2px solid ${locked ? "rgba(255,255,255,.05)" : isNext ? "rgba(6,182,212,.5)" : perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.3)" : "rgba(6,182,212,.15)"}`,background:locked ? "rgba(15,15,35,.5)" : isNext ? "rgba(6,182,212,.08)" : perfect ? "rgba(250,204,21,.05)" : done ? "rgba(34,197,94,.04)" : "rgba(6,182,212,.04)",cursor:locked?"default":"pointer",fontFamily:ff,textAlign:"left",display:"flex",alignItems:"center",gap:12,opacity:locked?.35:1,position:"relative",zIndex:1,transition:"all .2s",animation:isNext?"glowPulse 3s infinite":"none",boxShadow:isNext?"0 0 16px rgba(6,182,212,.15)":"none"}}>
                    <div style={{fontSize:26,width:34,textAlign:"center",flexShrink:0}}>
                      {locked ? "🔒" : perfect ? "⭐" : done ? "✅" : obs.emoji}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:locked?"#4b5563":isNext?"#67e8f9":"white",fontSize:14,fontWeight:700}}>{lv.name}</div>
                      <div style={{color:locked?"#374151":"#94a3b8",fontSize:11}}>{lv.desc}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {done ? (
                        <div style={{fontSize:10,color:perfect?"#fde68a":"#86efac"}}>{perfect?"Perfect!":"Cleared"}</div>
                      ) : (
                        <div style={{fontSize:10,color:"#818cf8"}}>{lv.needed} needed</div>
                      )}
                    </div>
                    {isNext && <div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",fontSize:16,animation:"catWalk 1s ease-in-out infinite"}}>🐛</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Explain intervals in this level
    if (iePhase === "explain") {
      const newIvIdx = ieLv.newIv;
      const newIv = newIvIdx !== null ? INTERVAL_DB[newIvIdx] : null;
      const prevIvs = ieLv.ivs.filter(i => i !== newIvIdx);
      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}>
          <div style={{background:"linear-gradient(135deg,#083344,#164e63)",borderRadius:24,padding:"24px 20px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:36,marginBottom:4}}>{obstacle.emoji}</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>{ieLv.name}</h2>
              <div style={{color:"#67e8f9",fontSize:13}}>{obstacle.name} — {ieLv.desc}</div>
            </div>

            {/* NEW interval — full detail */}
            {newIv && (
              <>
                <div style={{color:"#22d3ee",fontSize:12,fontWeight:700,textAlign:"center",marginBottom:8}}>✨ New Interval ✨</div>
                <div style={{background:"rgba(34,211,238,.1)",border:"2px solid rgba(34,211,238,.3)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{color:"white",fontSize:16,fontWeight:700}}>{newIv.emoji} {newIv.name}</span>
                    <span style={{color:"#67e8f9",fontSize:11}}>{newIv.half} half step{newIv.half!==1?"s":""}</span>
                  </div>
                  <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.4,margin:"0 0 6px"}}>{newIv.desc.split(".")[0]}.</p>

                  {/* Ascending */}
                  {(() => { const t = midiToChromatic(noteToMidi("C",4) + newIv.half); return (
                    <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"5px 8px",marginBottom:5}}>
                      <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:3}}>⬆ Ascending</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                          <DualStaff startName="C" startOct={4} targetName={t.name} targetOct={t.octave} highlight="correct" showTarget={true}/>
                        </div>
                        <div style={{fontSize:10,color:"#67e8f9"}}>C → {shortDisplay(t.name)}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"#a5b4fc"}}>🎵 {newIv.songUp}</span>
                        <button onClick={() => playTwoNotes("C", 4, t.name, t.octave)}
                          style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🔊</button>
                        {SONG_SNIPPETS[newIv.short + "_up"] && (
                          <button onClick={() => playSongSnippet(newIvIdx, "up")}
                            style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🎶</button>
                        )}
                      </div>
                    </div>
                  ); })()}

                  {/* Descending */}
                  {(() => { const t = midiToChromatic(noteToMidi("C",5) - newIv.half); return (
                    <div style={{background:"rgba(249,168,212,.06)",borderRadius:8,padding:"5px 8px"}}>
                      <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:3}}>⬇ Descending</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                          <DualStaff startName="C" startOct={5} targetName={t.name} targetOct={t.octave} highlight="correct" showTarget={true}/>
                        </div>
                        <div style={{fontSize:10,color:"#f9a8d4"}}>C → {shortDisplay(t.name)}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"#a5b4fc"}}>🎵 {newIv.songDown}</span>
                        <button onClick={() => playTwoNotes("C", 5, t.name, t.octave)}
                          style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🔊</button>
                        {SONG_SNIPPETS[newIv.short + "_down"] && (
                          <button onClick={() => playSongSnippet(newIvIdx, "down")}
                            style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🎶</button>
                        )}
                      </div>
                    </div>
                  ); })()}
                </div>
              </>
            )}

            {/* Already learned — compact list */}
            {prevIvs.length > 0 && (
              <div style={{marginBottom:10}}>
                <div style={{color:"#94a3b8",fontSize:11,fontWeight:600,marginBottom:6}}>{newIv ? "Plus everything you've learned:" : "Intervals in this round:"}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {prevIvs.map(ivIdx => {
                    const iv = INTERVAL_DB[ivIdx];
                    const t = midiToChromatic(noteToMidi("C",4) + iv.half);
                    return (
                      <button key={ivIdx} onClick={() => playTwoNotes("C", 4, t.name, t.octave)}
                        style={{padding:"4px 8px",borderRadius:8,border:"1px solid rgba(6,182,212,.2)",background:"rgba(6,182,212,.06)",color:"white",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",textAlign:"center"}}>
                        {iv.emoji} {iv.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{color:"#67e8f9",fontSize:11,textAlign:"center",margin:"10px 0"}}>
              Get {ieLv.needed} correct · {ieLv.hp} ❤️ HP
            </div>

            <button onClick={ieStartPractice}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Level up
    if (iePhase === "levelUp") {
      const nextLv = IE_LEVELS[ieLevel + 1];
      const nextObs = nextLv ? IE_OBSTACLES[nextLv.obstacle] : null;
      const perfect = ieHP === ieLv.hp;
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a4a3a 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={25}/><Confetti show={true}/>
          {/* Celebration sparkles */}
          {[20,40,60,80].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:30+i*20,left:`${l}%`,fontSize:16+i*2,animation:`musicFloat ${2+i*.3}s ease infinite`,animationDelay:`${i*.2}s`}}>
              {["🎵","✨","🎶","⭐"][i]}
            </div>
          ))}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:64,marginBottom:8,animation:"correctBurst .6s ease"}}>{perfect ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 4px",textShadow:"0 2px 20px rgba(34,211,238,.3)"}}>{obstacle.emoji} {obstacle.name} Cleared!</h2>
            {perfect && <div style={{color:"#fde68a",fontSize:16,fontWeight:800,marginBottom:8,animation:"glowPulse 2s infinite"}}>⭐ Perfect — No Hits Taken! ⭐</div>}
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
              <div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"6px 14px"}}>
                <div style={{fontSize:10,color:"#fde68a"}}>Score</div>
                <div style={{fontSize:18,color:"white",fontWeight:700}}>⭐ {ieScore}</div>
              </div>
              <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"6px 14px"}}>
                <div style={{fontSize:10,color:"#fca5a5"}}>HP Left</div>
                <div style={{fontSize:18}}>{"❤️".repeat(ieHP)}</div>
              </div>
            </div>
            {/* Caterpillar celebrating */}
            <div style={{fontSize:40,marginBottom:12,animation:"catWalk 1s ease-in-out infinite"}}>🐛🎉</div>
            {nextLv ? (
              <>
                <div style={{color:"#94a3b8",fontSize:13,marginBottom:12}}>
                  Next obstacle: <span style={{color:"white",fontWeight:700,fontSize:15}}>{nextObs.emoji} {nextLv.name}</span>
                </div>
                <button onClick={() => ieSelectLevel(ieLevel + 1)}
                  style={{padding:"14px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 30px rgba(6,182,212,.4)",transition:"transform .15s",animation:"glowPulse 2s infinite"}}>
                  Continue the Journey →
                </button>
              </>
            ) : (
              <button onClick={() => setIePhase("done")}
                style={{padding:"14px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 30px rgba(245,158,11,.4)"}}>
                🏆 Victory!
              </button>
            )}
          </div>
        </div>
      );
    }

    // Game over
    if (iePhase === "gameover") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#1a1a3e 50%,#2a1a3e 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={25}/>
          {/* Dramatic snow */}
          {[10,30,50,70,90].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:20+i*15,left:`${l}%`,fontSize:20,animation:`snowfall ${3+i*.5}s linear infinite`,animationDelay:`${i*.3}s`,opacity:.3}}>❄️</div>
          ))}
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease"}}>
            {/* Sad caterpillar with snowflakes */}
            <div style={{fontSize:56,marginBottom:8}}>
              <span style={{display:"inline-block",animation:"catShiver 1s ease-in-out infinite"}}>🐛</span>
              <span style={{fontSize:24,verticalAlign:"top"}}>❄️</span>
            </div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Brrr! Too Cold!</h2>
            <p style={{color:"#fca5a5",fontSize:14,marginBottom:2}}>The caterpillar needs to warm up...</p>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:4}}>{obstacle.emoji} {obstacle.name} — {ieCorrect}/{ieLv.needed} intervals identified</p>
            <div style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 16px",display:"inline-block",marginBottom:16}}>
              <span style={{color:"#fde68a",fontSize:14,fontWeight:700}}>⭐ {ieScore} points earned</span>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={ieStartPractice} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.3)"}}>🔄 Try Again</button>
              <button onClick={() => setIePhase("select")} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(6,182,212,.3)",background:"transparent",color:"#67e8f9",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>📋 Levels</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // All done
    if (iePhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#1a3a5c 30%,#1a4a3a 60%,#2a4a2a 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/><Confetti show={true}/>
          {/* Tons of sparkles */}
          {Array.from({length:12}).map((_,i)=>(
            <div key={i} style={{position:"absolute",top:`${10+Math.random()*60}%`,left:`${5+Math.random()*90}%`,fontSize:12+Math.random()*10,animation:`musicFloat ${2+Math.random()*2}s ease infinite`,animationDelay:`${Math.random()*2}s`}}>
              {["🎵","✨","⭐","🎶","💫","🌟"][i%6]}
            </div>
          ))}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease"}}>
            {/* Caterpillar meets snowman */}
            <div style={{fontSize:48,marginBottom:4}}>
              <span style={{display:"inline-block",animation:"catWalk .8s ease-in-out infinite"}}>🐛</span>
              <span style={{fontSize:24,animation:"popIn .5s ease"}}>❤️</span>
              <span style={{display:"inline-block",animation:"snowmanWave 2s ease-in-out infinite"}}>⛄</span>
            </div>
            <h2 style={{color:"white",fontSize:30,margin:"0 0 8px",textShadow:"0 2px 20px rgba(34,211,238,.3)"}}>Journey Complete!</h2>
            <p style={{color:"#86efac",fontSize:16,marginBottom:4,fontWeight:600}}>The caterpillar reached the snowman!</p>
            <p style={{color:"#c4b5fd",fontSize:14,marginBottom:16}}>Your ears are truly amazing! 🎧✨</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startIntervalEar} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 20px rgba(6,182,212,.3)"}}>🔄 Play Again</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    const journeyPct = ieLv.needed > 0 ? (ieCorrect / ieLv.needed) * 100 : 0;
    const catX = Math.max(6, Math.min(82, 6 + journeyPct * 0.76));
    const obsDefeated = journeyPct > 55;
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 30%,#1a3a5c 60%,#1e4d6b 100%)",fontFamily:ff,padding:"10px 12px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style>

        {/* Aurora / northern lights effect */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:200,background:"linear-gradient(135deg,rgba(34,211,238,.06) 0%,rgba(168,85,247,.04) 30%,rgba(52,211,153,.05) 60%,transparent 100%)",animation:"fadeIn 2s ease",pointerEvents:"none",zIndex:0}}/>

        {/* Twinkling stars */}
        {[12,25,38,55,72,85,8,45,68,90,33,60].map((l,i)=>(
          <div key={`st${i}`} style={{position:"absolute",top:8+((i*17)%60),left:`${l}%`,width:i%3===0?3:2,height:i%3===0?3:2,borderRadius:"50%",background:i%4===0?"#fde68a":"#e0e7ff",animation:`starTwinkle ${1.5+i*.3}s ease infinite`,animationDelay:`${i*.2}s`,zIndex:0,opacity:.7}}/>
        ))}

        {/* Moon */}
        <div style={{position:"absolute",top:12,right:20,width:40,height:40,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#fef9c3,#fde68a)",boxShadow:"0 0 20px rgba(253,230,138,.3),0 0 60px rgba(253,230,138,.1)",zIndex:0}}/>

        <Snowflakes count={20}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:6,zIndex:2}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={() => setIePhase("select")} style={{background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.25)",borderRadius:10,padding:"3px 8px",fontSize:11,color:"#67e8f9",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋</button>
            <button onClick={() => setIeShowRef(true)} style={{background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.25)",borderRadius:10,padding:"3px 8px",fontSize:11,color:"#67e8f9",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>ℹ️</button>
            <div style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"white",borderRadius:12,padding:"3px 12px",fontSize:14,fontWeight:700,boxShadow:"0 2px 10px rgba(245,158,11,.3)"}}>⭐ {ieScore}</div>
          </div>
        </div>

        {/* Level title banner */}
        <div style={{background:"rgba(6,182,212,.1)",border:"1px solid rgba(6,182,212,.2)",borderRadius:12,padding:"4px 16px",marginBottom:8,zIndex:2,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{obstacle.emoji}</span>
          <div>
            <div style={{color:"white",fontSize:13,fontWeight:700}}>{obstacle.name}</div>
            <div style={{color:"#67e8f9",fontSize:10}}>{ieLv.desc}</div>
          </div>
        </div>

        {/* ═══ JOURNEY SCENE SVG ═══ */}
        <div style={{width:"100%",maxWidth:460,marginBottom:8,zIndex:1}}>
          <svg viewBox="0 0 460 160" style={{width:"100%",height:"auto",borderRadius:16,overflow:"visible"}}>
            {/* Sky gradient */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f1b3d"/>
                <stop offset="100%" stopColor="#1a3a5c"/>
              </linearGradient>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b8d4e8"/>
                <stop offset="100%" stopColor="#8bb8d0"/>
              </linearGradient>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a8c8dc"/>
                <stop offset="100%" stopColor="#d4e8f4"/>
              </linearGradient>
            </defs>

            {/* Background */}
            <rect width="460" height="160" rx="16" fill="url(#skyGrad)"/>

            {/* Distant mountains */}
            <polygon points="0,80 40,35 80,65 130,25 170,60 220,40 260,70 300,30 340,55 380,45 420,65 460,50 460,100 0,100" fill="#1a2a4a" opacity=".6"/>
            <polygon points="0,95 50,55 100,75 160,50 210,70 270,55 320,80 370,60 420,75 460,65 460,100 0,100" fill="#1e3555" opacity=".5"/>

            {/* Snow ground */}
            <ellipse cx="230" cy="155" rx="250" ry="50" fill="url(#groundGrad)" opacity=".9"/>
            <ellipse cx="230" cy="152" rx="240" ry="42" fill="#d4e8f4" opacity=".4"/>

            {/* Pine trees background */}
            {[30,80,350,410].map((tx,i)=>(
              <g key={`tree${i}`} style={{animation:`treeSway ${3+i*.5}s ease-in-out infinite`,transformOrigin:`${tx}px 120px`}}>
                <polygon points={`${tx},${70+i%2*10} ${tx-12},${110+i%2*5} ${tx+12},${110+i%2*5}`} fill="#1a4a3a" opacity=".7"/>
                <polygon points={`${tx},${60+i%2*10} ${tx-9},${85+i%2*5} ${tx+9},${85+i%2*5}`} fill="#1e5a45" opacity=".6"/>
                <rect x={tx-2} y={110+i%2*5} width="4" height="10" fill="#5a3a2a" opacity=".5"/>
              </g>
            ))}

            {/* Dotted path */}
            <line x1="35" y1="128" x2="425" y2="128" stroke="#8ab4cc" strokeWidth="3" strokeDasharray="8 6" opacity=".4"/>

            {/* Footprints behind caterpillar */}
            {Array.from({length: Math.floor(journeyPct/12)}).map((_,i)=>(
              <circle key={`fp${i}`} cx={35 + i * 42} cy={131} r="2" fill="#7aa8c0" opacity=".3"/>
            ))}

            {/* Obstacle */}
            <g style={{animation: obsDefeated ? "none" : `obsBob 2s ease-in-out infinite`,opacity: obsDefeated ? 0.15 : 1,transition:"opacity .8s"}}>
              <text x="230" y="118" textAnchor="middle" fontSize={obsDefeated ? "20" : "32"} style={{transition:"font-size .5s"}}>{obstacle.emoji}</text>
            </g>
            {/* Obstacle defeated sparkles */}
            {obsDefeated && [215,230,245].map((sx,i)=>(
              <text key={`osp${i}`} x={sx} y={100+i*5} fontSize="10" opacity=".6" style={{animation:`musicFloat 2s ease infinite`,animationDelay:`${i*.3}s`}}>✨</text>
            ))}

            {/* Snowman at end */}
            <g style={{animation:"snowmanWave 3s ease-in-out infinite"}}>
              {/* Body */}
              <circle cx="425" cy="130" r="10" fill="white" stroke="#b8d4e8" strokeWidth="1"/>
              <circle cx="425" cy="116" r="7" fill="white" stroke="#b8d4e8" strokeWidth="1"/>
              {/* Eyes */}
              <circle cx="423" cy="114" r="1.2" fill="#1a1a2e"/>
              <circle cx="427" cy="114" r="1.2" fill="#1a1a2e"/>
              {/* Nose */}
              <polygon points="425,116 430,117 425,118" fill="#f97316"/>
              {/* Hat */}
              <rect x="419" y="106" width="12" height="3" rx="1" fill="#1a1a2e"/>
              <rect x="421" y="97" width="8" height="10" rx="2" fill="#1a1a2e"/>
              {/* Scarf */}
              <path d="M418,121 Q425,124 432,121" stroke="#ef4444" strokeWidth="2" fill="none"/>
              {/* Arms */}
              <line x1="415" y1="120" x2="408" y2="114" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="435" y1="120" x2="441" y2="113" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* Speech bubble from snowman */}
            {journeyPct > 80 && (
              <g style={{animation:"fadeIn .5s ease"}}>
                <rect x="395" y="78" width="30" height="16" rx="8" fill="white" opacity=".9"/>
                <text x="410" y="90" textAnchor="middle" fontSize="10">🎵</text>
              </g>
            )}

            {/* ═══ CATERPILLAR ═══ */}
            <g style={{transform:`translateX(${catX * 4.2}px)`,transition:"transform .7s cubic-bezier(.34,1.56,.64,1)"}}>
              {/* Shadow */}
              <ellipse cx="18" cy="136" rx="12" ry="3" fill="rgba(0,0,0,.15)"/>
              {/* Body segments */}
              {[0,1,2,3].map((seg,i)=>(
                <circle key={`seg${i}`} cx={18 - i*7} cy={124 + (i===0?0:2)} r={i===0?7:5.5-i*.3} 
                  fill={i===0?"#4ade80":"#22c55e"} stroke="#16a34a" strokeWidth="1"
                  style={{animation:`catWalk .6s ease-in-out infinite`,animationDelay:`${i*.08}s`}}/>
              ))}
              {/* Face */}
              <circle cx="16" cy="122" r="1.2" fill="#1a1a2e"/>
              <circle cx="21" cy="122" r="1.2" fill="#1a1a2e"/>
              <path d="M16,125 Q18.5,127 21,125" stroke="#1a1a2e" strokeWidth=".8" fill="none"/>
              {/* Antennae */}
              <line x1="17" y1="117" x2="14" y2="111" stroke="#16a34a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="20" y1="117" x2="23" y2="111" stroke="#16a34a" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="14" cy="110" r="1.5" fill="#fde68a"/>
              <circle cx="23" cy="110" r="1.5" fill="#fde68a"/>
              {/* Scarf */}
              <path d="M12,126 Q18,129 24,126" stroke="#06b6d4" strokeWidth="2.5" fill="none"/>
              <line x1="12" y1="126" x2="8" y2="130" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
              {/* Blush */}
              <ellipse cx="14" cy="124" rx="2" ry="1.2" fill="#fb7185" opacity=".4"/>
              <ellipse cx="23" cy="124" rx="2" ry="1.2" fill="#fb7185" opacity=".4"/>
            </g>

            {/* Music notes floating on correct */}
            {ieHL === "correct" && ["♪","♫","🎵"].map((n,i)=>(
              <text key={`mn${i}`} x={catX*4.2 + 10 + i*12} y={100} fontSize="14" style={{animation:`musicFloat 1.5s ease forwards`,animationDelay:`${i*.15}s`}}>{n}</text>
            ))}

            {/* Hit effect on wrong */}
            {ieHL === "wrong" && (
              <circle cx={catX*4.2+18} cy="124" r="20" fill="none" stroke="#f87171" strokeWidth="2" opacity=".6" style={{animation:"popIn .4s ease"}}/>
            )}

            {/* Snow lumps */}
            {[60,140,200,290,360].map((sx,i)=>(
              <ellipse key={`sl${i}`} cx={sx} cy={138+i%2*3} rx={6+i%3*2} ry={3} fill="white" opacity=".3"/>
            ))}
          </svg>

          {/* Progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{width:`${journeyPct}%`,height:"100%",background:"linear-gradient(90deg,#06b6d4,#22d3ee,#34d399)",borderRadius:4,transition:"width .5s cubic-bezier(.34,1.56,.64,1)",boxShadow: journeyPct > 0 ? "0 0 8px rgba(6,182,212,.4)" : "none"}}/>
            </div>
            <span style={{color:"#67e8f9",fontSize:12,fontWeight:700,minWidth:36,textAlign:"right"}}>{ieCorrect}/{ieLv.needed}</span>
          </div>

          {/* HP as scarves */}
          <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:6,animation: ieHL==="wrong" ? "hpShake .4s ease" : "none"}}>
            {Array.from({length: ieLv.hp}).map((_, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:2,background: i < ieHP ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.04)",border:`1px solid ${i < ieHP ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.08)"}`,borderRadius:8,padding:"3px 8px",transition:"all .3s"}}>
                <span style={{fontSize:14}}>{i < ieHP ? "❤️" : "💔"}</span>
              </div>
            ))}
          </div>
        </div>

        {ieQ && (
          <div style={{zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:460}}>
            {/* Auto play */}
            <EarAutoPlay key={`ie_${ieQ.startName}${ieQ.startOct}${ieQ.targetName}${ieQ.targetOct}${ieCorrect}${ieHP}`} n1={ieQ.startName} o1={ieQ.startOct} n2={ieQ.targetName} o2={ieQ.targetOct}/>

            {/* Prompt card */}
            <div style={{background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(99,102,241,.08))",border:"1px solid rgba(6,182,212,.25)",borderRadius:18,padding:"12px 20px",marginBottom:12,textAlign:"center",width:"100%",maxWidth:340,backdropFilter:"blur(8px)",animation: ieHL==="correct" ? "correctBurst .4s ease" : ieHL==="wrong" ? "hpShake .35s ease" : "none"}}>
              <div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:6}}>🎧 What interval do you hear?</div>
              <button onClick={() => playSepThenTogether(ieQ.startName, ieQ.startOct, ieQ.targetName, ieQ.targetOct)}
                style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(6,182,212,.4)",background:"rgba(6,182,212,.15)",color:"#67e8f9",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer",transition:"all .15s"}}>
                🔊 Hear Again
              </button>
            </div>

            {/* Feedback */}
            {ieHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:18,fontWeight:800,marginBottom:8,animation:"popIn .3s ease",textShadow:"0 0 16px rgba(74,222,128,.4)"}}>
                ✨ {ieQ.interval.emoji} {ieQ.interval.name}! ✨
              </div>
            )}
            {ieHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:15,fontWeight:700,marginBottom:8,animation:"shakeNote .35s ease"}}>
                💥 Oops! That was {ieQ.interval.emoji} {ieQ.interval.name}
              </div>
            )}

            {/* Interval buttons — fun bouncy grid */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:440}}>
              {ieLv.ivs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const isCorrectHL = ieHL === "correct" && ivIdx === INTERVAL_DB.indexOf(ieQ.interval);
                const isReveal = ieHL === "wrong" && ivIdx === INTERVAL_DB.indexOf(ieQ.interval);
                const colors = ["#06b6d4","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316","#84cc16","#e879f9","#22d3ee"];
                const btnColor = colors[ivIdx % colors.length];
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : isReveal ? "linear-gradient(135deg,rgba(34,197,94,.5),rgba(22,163,74,.5))"
                  : `linear-gradient(135deg,${btnColor}22,${btnColor}11)`;
                const btnBorder = isCorrectHL ? "#22c55e" : isReveal ? "#22c55e88" : `${btnColor}55`;
                return (
                  <button key={ivIdx} onClick={() => iePick(ivIdx)} disabled={!!ieHL}
                    style={{padding:"10px 12px",borderRadius:14,border:`2px solid ${btnBorder}`,background:btnBg,color:"white",fontSize:13,fontWeight:700,fontFamily:ff,cursor:ieHL?"default":"pointer",transition:"all .2s cubic-bezier(.34,1.56,.64,1)",transform:isCorrectHL?"scale(1.12)":"scale(1)",opacity:ieHL && !isCorrectHL && !isReveal?0.3:1,minWidth:64,textAlign:"center",backdropFilter:"blur(4px)"}}>
                    <div style={{fontSize:20,marginBottom:2,transition:"transform .2s"}}>{iv.emoji}</div>
                    <div style={{fontSize:10,letterSpacing:".3px"}}>{iv.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reference popup */}
        {ieShowRef && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}
            onClick={() => setIeShowRef(false)}>
            <div style={{background:"linear-gradient(135deg,#083344,#164e63)",borderRadius:24,padding:"24px 20px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}
              onClick={e => e.stopPropagation()}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:32,marginBottom:4}}>{obstacle.emoji}</div>
                <h2 style={{color:"white",fontSize:20,margin:"0 0 4px"}}>{ieLv.name} — Reference</h2>
                <div style={{color:"#67e8f9",fontSize:12}}>{ieLv.desc}</div>
              </div>
              {ieLv.ivs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const upTarget = midiToChromatic(noteToMidi("C", 4) + iv.half);
                const dnTarget = midiToChromatic(noteToMidi("C", 5) - iv.half);
                return (
                  <div key={ivIdx} style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.15)",borderRadius:14,padding:"10px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{color:"white",fontSize:14,fontWeight:700}}>{iv.emoji} {iv.name}</span>
                      <span style={{color:"#67e8f9",fontSize:11}}>{iv.half} half step{iv.half!==1?"s":""}</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {/* Up */}
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#67e8f9"}}>⬆ {iv.songUp}</span>
                        <button onClick={() => playTwoNotes("C", 4, upTarget.name, upTarget.octave)}
                          style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                          🔊
                        </button>
                      </div>
                      {/* Down */}
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#f9a8d4"}}>⬇ {iv.songDown}</span>
                        <button onClick={() => playTwoNotes("C", 5, dnTarget.name, dnTarget.octave)}
                          style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                          🔊
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setIeShowRef(false)}
                style={{width:"100%",marginTop:8,padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WEAK SPOTS PRACTICE ──
  if (mode === "weakSpots") {

    // Not enough data
    if (wpIvs.length < 2) {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={10}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease",maxWidth:380}}>
            <div style={{fontSize:48,marginBottom:8}}>🎯</div>
            <h2 style={{color:"white",fontSize:24,margin:"0 0 8px"}}>Not Enough Data Yet</h2>
            <p style={{color:"#fed7aa",fontSize:14,lineHeight:1.6,marginBottom:16}}>
              Play some rounds in Training, Classic, or Ear Journey first! Once you've answered at least 3 questions per interval, your weak spots will appear here.
            </p>
            <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(249,115,22,.3)"}}>
              ← Back to Menu
            </button>
          </div>
        </div>
      );
    }

    // Menu — show weak intervals
    if (wpPhase === "menu") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={10}/>
          <div style={{zIndex:1,width:"100%",maxWidth:460,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#fed7aa",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:13,color:"#fb923c",fontWeight:600}}>🎯 Weak Spots</div>
            </div>

            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:4}}>🎯</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 6px"}}>Practice Your Weak Spots</h2>
              <p style={{color:"#fed7aa",fontSize:13,margin:0}}>10 rounds focusing on the intervals you find hardest</p>
            </div>

            <div style={{color:"#fb923c",fontSize:12,fontWeight:600,marginBottom:8}}>Your weakest intervals:</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {wpIvs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const s = intervalStats[ivIdx];
                const total = s ? s.correct + s.wrong : 0;
                const pct = total > 0 ? Math.round(s.correct / total * 100) : 0;
                return (
                  <div key={ivIdx} style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.2)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:24}}>{iv.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"white",fontSize:14,fontWeight:700}}>{iv.name}</div>
                      <div style={{color:"#fed7aa",fontSize:11}}>{s.correct}/{total} correct</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171",fontSize:18,fontWeight:800}}>{pct}%</div>
                    </div>
                    {/* Mini bar */}
                    <div style={{width:50,height:6,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171",borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={wpBegin}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(249,115,22,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Done
    if (wpPhase === "done") {
      const pct = wpTotal > 0 ? Math.round(wpCorrect / wpTotal * 100) : 0;
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={15}/>
          {pct >= 70 && <Confetti show={true}/>}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{pct >= 80 ? "🌟" : pct >= 60 ? "💪" : "📈"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Practice Complete!</h2>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:12}}>
              <div style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",borderRadius:10,padding:"6px 16px"}}>
                <div style={{fontSize:10,color:"#86efac"}}>Correct</div>
                <div style={{fontSize:20,color:"white",fontWeight:700}}>{wpCorrect}/{wpTotal}</div>
              </div>
              <div style={{background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.2)",borderRadius:10,padding:"6px 16px"}}>
                <div style={{fontSize:10,color:"#fed7aa"}}>Accuracy</div>
                <div style={{fontSize:20,color:"white",fontWeight:700}}>{pct}%</div>
              </div>
            </div>
            <p style={{color:"#fed7aa",fontSize:13,marginBottom:16}}>
              {pct >= 80 ? "Amazing! Those weak spots are getting stronger! 💪" :
               pct >= 60 ? "Nice work! Keep practicing and you'll master these!" :
               "Don't give up — every practice session makes you better!"}
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={wpBegin} style={{padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>🔄 Again</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#fed7aa",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00 0%,#431407 40%,#7c2d12 100%)",fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={8}/>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#fed7aa",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{color:"#fb923c",fontSize:13,fontWeight:700}}>🎯 {wpTotal + 1}/10</div>
        </div>

        {/* Progress */}
        <div style={{width:"100%",maxWidth:440,marginBottom:12,zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${wpTotal * 10}%`,height:"100%",background:"linear-gradient(90deg,#f97316,#f59e0b)",borderRadius:4,transition:"width .4s"}}/>
            </div>
            <span style={{color:"#fb923c",fontSize:12,fontWeight:700}}>{wpCorrect}✓</span>
          </div>
        </div>

        {wpQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:460}}>
            <EarAutoPlay key={`wp_${wpQ.startName}${wpQ.startOct}${wpQ.targetName}${wpQ.targetOct}${wpRound}`} n1={wpQ.startName} o1={wpQ.startOct} n2={wpQ.targetName} o2={wpQ.targetOct}/>

            {/* Prompt */}
            <div style={{background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.25)",borderRadius:18,padding:"12px 24px",marginBottom:14,textAlign:"center",animation: wpHL==="correct" ? "correctBurst .4s ease" : wpHL==="wrong" ? "hpShake .35s ease" : "none"}}>
              <div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:6}}>🎧 What interval?</div>
              <button onClick={() => playSepThenTogether(wpQ.startName, wpQ.startOct, wpQ.targetName, wpQ.targetOct)}
                style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(249,115,22,.4)",background:"rgba(249,115,22,.15)",color:"#fed7aa",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>
                🔊 Hear Again
              </button>
            </div>

            {/* Feedback */}
            {wpHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:18,fontWeight:800,marginBottom:8,animation:"popIn .3s ease",textShadow:"0 0 16px rgba(74,222,128,.4)"}}>
                ✨ {wpQ.interval.emoji} {wpQ.interval.name}! ✨
              </div>
            )}
            {wpHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:15,fontWeight:700,marginBottom:8,animation:"shakeNote .35s ease"}}>
                💥 That was {wpQ.interval.emoji} {wpQ.interval.name}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:440}}>
              {wpIvs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const isCorrectHL = wpHL === "correct" && ivIdx === INTERVAL_DB.indexOf(wpQ.interval);
                const isReveal = wpHL === "wrong" && ivIdx === INTERVAL_DB.indexOf(wpQ.interval);
                const colors = ["#06b6d4","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316","#84cc16","#e879f9","#22d3ee"];
                const c = colors[ivIdx % colors.length];
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)" : isReveal ? "linear-gradient(135deg,rgba(34,197,94,.5),rgba(22,163,74,.5))" : `linear-gradient(135deg,${c}22,${c}11)`;
                const border = isCorrectHL ? "#22c55e" : isReveal ? "#22c55e88" : `${c}55`;
                return (
                  <button key={ivIdx} onClick={() => wpPick(ivIdx)} disabled={!!wpHL}
                    style={{padding:"10px 12px",borderRadius:14,border:`2px solid ${border}`,background:btnBg,color:"white",fontSize:13,fontWeight:700,fontFamily:ff,cursor:wpHL?"default":"pointer",transition:"all .2s",transform:isCorrectHL?"scale(1.12)":"scale(1)",opacity:wpHL && !isCorrectHL && !isReveal?0.3:1,minWidth:64,textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:2}}>{iv.emoji}</div>
                    <div style={{fontSize:10}}>{iv.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CHORD EAR TRAINING ──
  if (mode === "chordEar") {
    const ceLv = CHORD_EAR_LEVELS[ceLevel];

    // Level select
    if (cePhase === "select") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:14,color:"#f9a8d4",fontWeight:600}}>🎧 Chord Ear Training</div>
            </div>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:4}}>🎧</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>Chord Ear Training</h2>
              <p style={{color:"#f9a8d4",fontSize:13,margin:0}}>Learn to hear the difference between chord types</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {CHORD_EAR_LEVELS.map((lv, i) => {
                const stats = ceLevelStats[i];
                const done = !!stats;
                const perfect = done && stats.snowmenLost === 0;
                return (
                  <button key={i} onClick={() => ceSelectLevel(i)}
                    style={{padding:"14px 18px",borderRadius:14,border:`1px solid ${perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.3)" : "rgba(236,72,153,.25)"}`,background:perfect ? "rgba(250,204,21,.06)" : done ? "rgba(34,197,94,.05)" : "rgba(236,72,153,.06)",cursor:"pointer",fontFamily:ff,textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{fontSize:28,width:36,textAlign:"center"}}>{perfect ? "⭐" : done ? "✅" : lv.types.map(t => CHORD_TYPES[t].emoji).join("")}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"white",fontSize:15,fontWeight:700}}>{lv.name}</div>
                      <div style={{color:"#c4b5fd",fontSize:12}}>{lv.desc}</div>
                    </div>
                    <div style={{color:"#818cf8",fontSize:11}}>
                      {lv.needed} to pass · {lv.lives} ⛄
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Explain chord type
    if (cePhase === "explain") {
      const types = ceLv.types.map(i => CHORD_TYPES[i]);
      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:20,animation:"fadeIn .3s ease"}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 24px",maxWidth:440,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",textAlign:"center",animation:"slideIn .4s ease",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:36,marginBottom:8}}>{types.map(t => t.emoji).join(" ")}</div>
            <h2 style={{color:"white",margin:"0 0 12px",fontSize:22}}>{ceLv.name}</h2>

            {types.map((ct, i) => (
              <div key={i} style={{background:"rgba(99,102,241,.1)",borderRadius:14,padding:"12px 16px",marginBottom:10,textAlign:"left"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:ct.color,fontSize:16,fontWeight:700}}>{ct.emoji} {ct.name}</span>
                  <span style={{color:"#818cf8",fontSize:11}}>intervals: {ct.intervals.join("-")}</span>
                </div>
                <p style={{color:"#c4b5fd",fontSize:13,lineHeight:1.5,margin:"0 0 8px"}}>{ct.desc}</p>
                <button onClick={() => {
                  const notes = ct.intervals.map(hs => { const m = noteToMidi("C", 4) + hs; return midiToChromatic(m); });
                  playChordArpThenTogether(notes.map(n => [n.name, n.octave]));
                }} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${ct.color}44`,background:`${ct.color}15`,color:ct.color,fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🔊 Hear C {ct.name}
                </button>
              </div>
            ))}

            <div style={{color:"#a5b4fc",fontSize:12,margin:"12px 0"}}>
              Get {ceLv.needed} correct · You have {ceLv.lives} snowmen — 3 wrong melts one!
            </div>

            <button onClick={ceStartPractice}
              style={{padding:"12px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(236,72,153,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Level up
    if (cePhase === "levelUp") {
      const nextLv = CHORD_EAR_LEVELS[ceLevel + 1];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/><Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{ceSnowmenLost === 0 ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Complete!</h2>
            {ceSnowmenLost === 0 && <div style={{color:"#fde68a",fontSize:15,fontWeight:700,marginBottom:8}}>⭐ No Snowmen Lost! ⭐</div>}
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:6}}>Score: {ceScore} · Snowmen lost: {ceSnowmenLost}</div>
            <MeltingSnowman meltStage={0} maxStages={3}/>
            <div style={{color:"#818cf8",fontSize:13,marginBottom:12}}>
              Next: <span style={{color:"white",fontWeight:700}}>{nextLv.name}</span>
            </div>
            <button onClick={() => { setCeLevel(l => l + 1); setCePhase("explain"); }}
              style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(236,72,153,.4)"}}>
              Continue →
            </button>
          </div>
        </div>
      );
    }

    // Game over
    if (cePhase === "gameover") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease"}}>
            <MeltingSnowman meltStage={3} maxStages={3}/>
            <h2 style={{color:"white",fontSize:24,margin:"8px 0 4px"}}>All Snowmen Melted!</h2>
            <p style={{color:"#fca5a5",fontSize:14,marginBottom:4}}>You got {ceCorrect}/{ceLv.needed} correct</p>
            <p style={{color:"#a5b4fc",fontSize:13,marginBottom:16}}>Score: {ceScore}</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={ceStartPractice} style={{padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Try Again</button>
              <button onClick={() => setCePhase("select")} style={{padding:"12px 24px",borderRadius:14,border:"2px solid #ec4899",background:"transparent",color:"#f9a8d4",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Levels</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // All done
    if (cePhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={30}/><Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>Chord Master!</h2>
            <p style={{color:"#c4b5fd",fontSize:15,marginBottom:16}}>You've completed all chord ear training levels!</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startChordEar} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Play Again</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={15}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setCePhase("select")} style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#f9a8d4",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋 Levels</button>
            <div style={{background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {ceScore}</div>
          </div>
        </div>

        {/* Level info */}
        <div style={{color:"#f9a8d4",fontSize:12,marginBottom:4,zIndex:1}}>🎧 {ceLv.name}</div>

        {/* Progress bar */}
        <div style={{width:"100%",maxWidth:300,height:8,background:"rgba(255,255,255,.1)",borderRadius:4,marginBottom:6,zIndex:1,overflow:"hidden"}}>
          <div style={{width:`${(ceCorrect / ceLv.needed) * 100}%`,height:"100%",background:"linear-gradient(90deg,#ec4899,#f472b6)",borderRadius:4,transition:"width .3s"}}/>
        </div>
        <div style={{color:"#a5b4fc",fontSize:11,marginBottom:14,zIndex:1}}>{ceCorrect}/{ceLv.needed} correct</div>

        {/* Snowman + Lives */}
        <div style={{zIndex:1,display:"flex",alignItems:"flex-end",gap:16,marginBottom:10}}>
          <div style={{textAlign:"center"}}>
            <MeltingSnowman meltStage={ceMelt} maxStages={3}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,paddingBottom:30}}>
            <div style={{fontSize:11,color:"#a5b4fc",fontWeight:600}}>Snowmen left</div>
            <div style={{display:"flex",gap:4}}>
              {Array.from({length: ceLv.lives}).map((_, i) => (
                <span key={i} style={{fontSize:22,opacity: i < ceLives ? 1 : 0.2,transition:"opacity .3s"}}>{i < ceLives ? "⛄" : "💧"}</span>
              ))}
            </div>
            <div style={{fontSize:10,color:"#818cf8"}}>3 wrong = 1 melted</div>
          </div>
        </div>

        {ceQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Auto-play chord */}
            <ChordAutoPlay key={`${ceQ.root}${ceQ.rootOct}${ceQ.typeIdx}${ceCorrect}${ceMelt}`} notes={ceQ.notes}/>

            {/* Chord name + replay */}
            <div style={{background:"rgba(236,72,153,.1)",border:"1px solid rgba(236,72,153,.25)",borderRadius:16,padding:"10px 20px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:"white",marginBottom:8}}>{ceHL ? ceQ.displayName : ceQ.root + " ?"}</div>
              <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={() => playChordArpThenTogether(ceQ.notes.map(n => [n.name, n.octave]))}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🔊 Both
                </button>
                <button onClick={() => playChordArp(ceQ.notes.map(n => [n.name, n.octave]))}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎵 Separate
                </button>
                <button onClick={() => playChord(ceQ.notes.map(n => [n.name, n.octave]), 0.05)}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Together
                </button>
              </div>
            </div>

            {/* Feedback */}
            {ceHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:16,fontWeight:700,marginBottom:10,animation:"popIn .3s ease"}}>
                ✓ Correct! {ceQ.type.name} chord
              </div>
            )}
            {ceHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:14,fontWeight:600,marginBottom:10,animation:"shakeNote .35s ease"}}>
                ✗ Not quite! {ceMelt >= 3 ? "Snowman melted! 💧" : `(${3 - ceMelt} more before melt)`}
              </div>
            )}

            {/* Type buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:400}}>
              {ceLv.types.map(tIdx => {
                const ct = CHORD_TYPES[tIdx];
                const isCorrectHL = ceHL === "correct" && tIdx === ceQ.typeIdx;
                const isWrongHL = ceHL === "wrong" && tIdx !== ceQ.typeIdx;
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : isWrongHL ? "rgba(99,102,241,.15)"
                  : `linear-gradient(135deg,${ct.color}33,${ct.color}22)`;
                return (
                  <button key={tIdx} onClick={() => cePick(tIdx)} disabled={!!ceHL}
                    style={{padding:"14px 22px",borderRadius:14,border:`2px solid ${isCorrectHL ? "#22c55e" : ct.color}44`,background:btnBg,color:isCorrectHL ? "white" : ct.color,fontSize:16,fontWeight:700,fontFamily:ff,cursor:ceHL?"default":"pointer",transition:"all .15s",transform:isCorrectHL?"scale(1.08)":"scale(1)",opacity:ceHL && !isCorrectHL ? 0.5 : 1}}>
                    {ct.emoji} {ct.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CHORD MODE ──
  if (mode === "chord") {
    const needed = 4;
    const progress = chords.length;

    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#1e3a5f 100%)",fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={35}/><Confetti show={showConf}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#c4b5fd",fontWeight:600}}>⛄ {progress}/{needed}</div>
            <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {chScore}</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,marginBottom:14,zIndex:1}}>
          {Array.from({length:needed},(_,i)=>(
            <div key={i} style={{width:12,height:12,borderRadius:"50%",background:i<progress?"#22c55e":"rgba(255,255,255,.12)",border:i===progress&&!allDone?"2px solid #a78bfa":"2px solid transparent",transition:"all .3s"}}/>
          ))}
        </div>

        {/* Snowmen row */}
        <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:16,zIndex:1,minHeight:220}}>
          {chords.map((c,i)=><Snowman key={i} root={c.root} third={c.third} fifth={c.fifth} complete bouncing={bouncing} index={i} chordName={c.name}/>)}
          {!allDone && curChord && <Snowman root={curChord.root} third={chThird} fifth={chFifth} complete={false} bouncing={false} index={progress} chordName={curChord.displayName}/>}
          {!allDone && Array.from({length:Math.max(0,needed-progress-1)},(_,i)=>(
            <div key={`g${i}`} style={{width:100,height:200,opacity:.12}}><Snowman root="?" third={null} fifth={null} complete={false} bouncing={false} index={0}/></div>
          ))}
        </div>

        {/* Current chord controls */}
        {!allDone && curChord && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#a78bfa",marginBottom:2}}>Build a</div>
              <div style={{fontSize:22,fontWeight:700,color:"white"}}>{curChord.displayName} chord</div>
              <div style={{fontSize:14,color:"#c4b5fd",fontWeight:600}}>{chStep===0?`Select the 3rd of ${curChord.root}`:`Select the 5th of ${curChord.root}`}</div>
              <div style={{fontSize:11,color:"#818cf8",marginTop:4}}>{curChord.type.name==="Major"?"Major = root + M3 + P5":"Minor = root + m3 + P5"}</div>
              {chRound < 8 && <div style={{fontSize:10,color:"#6366f1",marginTop:3,opacity:.6}}>Hints fade after {8 - chRound} more chord{8 - chRound !== 1 ? "s" : ""}</div>}
            </div>

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 12px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,display:"flex",gap:0,animation:chHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <NoteOnStaff name={curChord.root} octave={curChord.rootOct} showLabel/>
              {chThird
                ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} highlight="correct" showLabel/>
                : chRound < 8
                  ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} ghost showLabel={false}/>
                  : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}/>}
              {chFifth
                ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} highlight="correct" showLabel/>
                : chRound < 8
                  ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} ghost showLabel={false}/>
                  : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}/>}
            </div>

            {/* Note buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
              {NOTE_ORDER.map(n=><NoteBtn key={n} note={n} onClick={chPick} disabled={chLocked} highlight={chBtnHL[n]}/>)}
            </div>
            <div style={{color:"#7c3aed",fontSize:11,marginTop:8,opacity:.5,zIndex:1}}>Press A–G on keyboard</div>
          </div>
        )}

        {/* All complete */}
        {allDone && (
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .6s ease"}}>
            <div style={{fontSize:42,marginBottom:8}}>🎉</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 8px"}}>Snowman Chorus!</h2>
            <p style={{color:"#c4b5fd",fontSize:14,margin:"0 0 6px"}}>You built {needed} chords: {chords.map(c=>c.name).join(" → ")}</p>
            <p style={{color:"#a5b4fc",fontSize:13,margin:"0 0 24px"}}>Score: {chScore} points</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={()=>{setChords([]);setAllDone(false);setBouncing(false);setShowConf(false);setChLocked(false);const q=genChordQ();setCurChord(q);setChStep(0);setChHL(null);setChBtnHL({});setChThird(null);setChFifth(null);}}
                style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(124,58,237,.4)"}}>Build More ⛄</button>
              <button onClick={()=>{playChordSequence(chords.map(c=>c.notes));setBouncing(true);setTimeout(()=>setBouncing(false),chords.length*1200+1000);}}
                style={{padding:"12px 28px",borderRadius:14,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Replay 🎵</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// Small helper to auto-play when ear-only question loads
function EarAutoPlay({ n1, o1, n2, o2 }) {
  useEffect(() => {
    const t = setTimeout(() => playSepThenTogether(n1, o1, n2, o2), 300);
    return () => clearTimeout(t);
  }, [n1, o1, n2, o2]);
  return null;
}
