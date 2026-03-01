import { useState, useEffect, useCallback, useRef, useReducer } from "react";

// ═══════════════════════════════════════════════════════════
//  NOTE SPELLER — Music Note Reading Game
// ═══════════════════════════════════════════════════════════

const MUSIC_NOTES = new Set("ABCDEFG".split(""));

// ═══ WEB AUDIO — octave-accurate note tones ═══
const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

// Shared AudioContext singleton — reused across all sound functions
let _sharedCtx = null;
function getAudioCtx() {
  if (!AudioCtxClass) return null;
  if (!_sharedCtx || _sharedCtx.state === "closed") {
    _sharedCtx = new AudioCtxClass();
  }
  // Resume if suspended (browsers suspend until user gesture)
  if (_sharedCtx.state === "suspended") {
    _sharedCtx.resume().catch(() => {});
  }
  return _sharedCtx;
}

// Full frequency table by note+octave
const FREQ_TABLE = {
  C1: 32.70, D1: 36.71, E1: 41.20, F1: 43.65, G1: 49.00, A1: 55.00, B1: 61.74,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.0, B6: 1975.53,
};

// Map note letter + clef + extended to full note name with octave
// Treble standard: E4 F4 G4 A4 B4 C5 D5
// Treble extended: F3 A3 C4 G5 B5 D6 E6
// Bass standard: G2 A2 B2 C3 D3 E3 F3
// Bass extended: A1 G4 B3 C4 D4 E4 F4
const NOTE_NAMES = {
  treble: {
    standard: { E: "E4", F: "F4", G: "G4", A: "A4", B: "B4", C: "C5", D: "D5" },
    extended: { F: "F3", A: "A3", C: "C4", G: "G5", B: "B5", D: "D6", E: "E6" },
  },
  bass: {
    standard: { G: "G2", A: "A2", B: "B2", C: "C3", D: "D3", E: "E3", F: "F3" },
    extended: { A: "A1", B: "B3", C: "C4", D: "D4", E: "E4", F: "F4", G: "G4" },
  },
};

function getFrequency(note, clef, extended, songMode) {
  if (songMode) {
    const letter = note.charAt(0);
    const octave = note.length > 1 ? parseInt(note.charAt(1)) : (clef === "treble" ? 4 : 3);
    const name = letter + octave;
    return FREQ_TABLE[name] || 440;
  }
  const mode = extended ? "extended" : "standard";
  const noteName = NOTE_NAMES[clef]?.[mode]?.[note];
  return noteName ? (FREQ_TABLE[noteName] || 440) : 440;
}

function playNoteSound(freq, type = "correct") {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type === "correct" ? "triangle" : "sawtooth";
    osc.frequency.value = type === "correct" ? freq : 120;
    gain.gain.setValueAtTime(type === "correct" ? 0.18 : 0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === "correct" ? 0.45 : 0.2));
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + (type === "correct" ? 0.45 : 0.2));
  } catch (e) { /* audio not available */ }
}

function playSuccessChime() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.35);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.35);
    });
  } catch (e) {}
}

function playSongMelody(notes, clef, onStart, onEnd, rhythm) {
  const ctx = getAudioCtx();
  if (!ctx || !notes || !notes.length) return;
  if (onStart) onStart();
  try {
    const beatDur = 0.32; // seconds per beat (quarter note)
    let t = ctx.currentTime + 0.05;
    notes.forEach((raw, i) => {
      const letter = raw.charAt(0);
      const octave = raw.length > 1 ? parseInt(raw.charAt(1)) : (clef === "treble" ? 4 : 3);
      const name = letter + octave;
      const freq = FREQ_TABLE[name] || 440;
      const beats = rhythm && rhythm[i] ? rhythm[i] : 1;
      const dur = beats * beatDur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
      gain.gain.setValueAtTime(0.16, t + dur * 0.75);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    });
    const totalTime = (t - ctx.currentTime) * 1000 + 300;
    setTimeout(() => { if (onEnd) onEnd(); }, totalTime);
  } catch (e) { if (onEnd) onEnd(); }
}

function playPowerupSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    [880, 1108.73, 1318.51, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  } catch (e) {}
}

// ═══ DEDUPLICATED WORD BANKS ═══
function dedup(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.w)) return false;
    seen.add(item.w);
    return true;
  });
}

// Fisher-Yates shuffle
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick a scramble word — only words where ALL letters are music notes (A-G)
const SCRAMBLE_WORDS = [];  // populated after word banks are defined

const STAGE1_WORDS = dedup([
  { w: "BAD", h: "Not good" }, { w: "BED", h: "Where you sleep" }, { w: "BAG", h: "Carry things" },
  { w: "BEE", h: "Buzzy insect 🐝" }, { w: "ADD", h: "Put together" }, { w: "AGE", h: "How old you are" },
  { w: "ACE", h: "The best!" }, { w: "CAB", h: "Yellow taxi" }, { w: "DAD", h: "Your father" },
  { w: "DAB", h: "A little tap" }, { w: "EGG", h: "From a chicken 🥚" }, { w: "FAD", h: "Short trend" },
  { w: "FAB", h: "Fabulous!" }, { w: "FED", h: "Gave food to" }, { w: "FEE", h: "Money you pay" },
  { w: "GAB", h: "Chat a lot" }, { w: "GAG", h: "Funny joke" },
  { w: "AFF", h: "Short for affection" }, { w: "EBB", h: "Flow back out" },
  { w: "FIG", h: "A sweet fruit" }, { w: "GIG", h: "A music show" },
  { w: "BIG", h: "Not small" }, { w: "DIG", h: "Make a hole" },
  { w: "BIB", h: "Baby wears it" }, { w: "DID", h: "Past tense of do" }, { w: "BEG", h: "Ask nicely" },
  { w: "FACE", h: "In the mirror" }, { w: "FADE", h: "Slowly disappear" },
  { w: "CAGE", h: "Bird's home" }, { w: "BEAD", h: "Tiny jewel" },
  { w: "DEAF", h: "Cannot hear" }, { w: "EDGE", h: "The very end" },
  { w: "BADGE", h: "A pin you wear" }, { w: "AGED", h: "Gotten older" },
  { w: "GAFF", h: "A big mistake" }, { w: "BEEF", h: "Cow meat" },
  { w: "FEED", h: "Give food" }, { w: "DEED", h: "A brave act" },
  { w: "BABE", h: "A baby" }, { w: "CAFE", h: "Coffee shop ☕" },
  { w: "DACE", h: "A type of fish" }, { w: "GAGE", h: "A measuring tool" },
  { w: "ABBE", h: "A French monk" }, { w: "EDGED", h: "Had a border" },
  { w: "ADDED", h: "Put more in" }, { w: "FADED", h: "Lost color" },
  { w: "FACED", h: "Looked at bravely" }, { w: "CAGED", h: "Locked up" },
  { w: "BEADED", h: "Covered in beads" },
  { w: "FIB", h: "A small lie" }, { w: "DEF", h: "Definitely cool" }, { w: "GAD", h: "Roam around" },
  { w: "FOG", h: "Misty air 🌫️" }, { w: "FAN", h: "Keeps you cool" }, { w: "FUN", h: "Good times! 🎉" },
  { w: "FUR", h: "Soft animal coat" }, { w: "FIT", h: "In good shape 💪" }, { w: "BUG", h: "Tiny critter 🐛" },
  { w: "BUS", h: "Big yellow ride 🚌" }, { w: "BOB", h: "Move up and down" }, { w: "GUM", h: "Chew on it" },
  { w: "GEM", h: "Shiny jewel 💎" }, { w: "CUB", h: "Baby bear 🐻" }, { w: "CUP", h: "Drink from it ☕" },
  { w: "DUG", h: "Made a hole" }, { w: "GAP", h: "A space between" }, { w: "JAB", h: "A quick poke" },
  { w: "LAB", h: "Science room 🔬" }, { w: "NAB", h: "Grab quickly" }, { w: "NAG", h: "Keep bugging" },
  { w: "PAD", h: "Soft cushion" }, { w: "PEG", h: "A small pin" }, { w: "RAG", h: "Old cloth" },
  { w: "SOB", h: "Cry hard 😢" }, { w: "TAB", h: "A small flap" }, { w: "TAG", h: "You're it! 🏷️" },
  { w: "TUB", h: "Take a bath 🛁" }, { w: "TUG", h: "Pull hard" }, { w: "WAG", h: "Happy tail 🐕" },
  { w: "WEB", h: "Spider's home 🕸️" }, { w: "HUB", h: "Center of it all" }, { w: "JOB", h: "Work to do 💼" },
  { w: "RUG", h: "Floor carpet" }, { w: "SAG", h: "Droop down" },
]);

const STAGE2_WORDS = dedup([
  { w: "BRIDGE", h: "Cross water 🌉" }, { w: "PLANET", h: "Earth is one 🌍" },
  { w: "BASKET", h: "Hoops 🏀" }, { w: "DRAGON", h: "Breathes fire 🐉" },
  { w: "GENTLE", h: "Soft and kind" }, { w: "CASTLE", h: "King's home 🏰" },
  { w: "GARDEN", h: "Flowers grow 🌸" }, { w: "BLANKET", h: "Keeps you warm" },
  { w: "DANGER", h: "Watch out ⚠️" }, { w: "FINGER", h: "You have ten 🖐️" },
  { w: "BEACH", h: "Sandy place 🏖️" }, { w: "CHANGE", h: "Make different" },
  { w: "EAGLE", h: "Soaring bird 🦅" }, { w: "FLAME", h: "Fire 🔥" },
  { w: "GRAPE", h: "Purple fruit 🍇" }, { w: "DREAM", h: "In your sleep 💤" },
  { w: "FEAST", h: "Big meal 🍽️" }, { w: "MAGIC", h: "Abracadabra 🪄" },
  { w: "PIRATE", h: "Sails the seas 🏴‍☠️" }, { w: "SPACE", h: "Where stars are ✨" },
  { w: "BRAVE", h: "Not afraid" }, { w: "STAGE", h: "Performers 🎭" },
  { w: "GREAT", h: "Really good!" }, { w: "WHALE", h: "Huge sea animal 🐋" },
  { w: "DANCE", h: "Move to music 💃" }, { w: "HEART", h: "Beats in chest ❤️" },
  { w: "TIGER", h: "Striped cat 🐯" }, { w: "SNACK", h: "Little bite 🍪" },
  { w: "PLACE", h: "A location" }, { w: "TRACE", h: "Follow the line" },
  { w: "GRACE", h: "Elegant beauty" }, { w: "BRACE", h: "Hold on tight" },
  { w: "BLADE", h: "Sharp edge 🗡️" }, { w: "CRANE", h: "Tall bird or machine" },
  { w: "GRADE", h: "Your score in school" }, { w: "SHAKE", h: "Wiggle it" },
  { w: "PLATE", h: "Eat off of it 🍽️" }, { w: "STALE", h: "Not fresh" },
  { w: "SCALE", h: "Weigh things ⚖️" }, { w: "SPARE", h: "Extra one" },
  { w: "CHASE", h: "Run after 🏃" }, { w: "SHAPE", h: "Circle or square" },
  { w: "DRAPE", h: "Hang fabric" }, { w: "BLAZE", h: "Bright fire 🔥" },
  { w: "RANGE", h: "From here to there" }, { w: "MANGE", h: "Skin disease" },
  { w: "LEDGE", h: "Narrow shelf" }, { w: "HEDGE", h: "Green wall of bushes" },
  { w: "WEDGE", h: "Triangle shape" }, { w: "RIDGE", h: "Top of a mountain" },
  { w: "BADGE", h: "Pin you wear" }, { w: "JUDGE", h: "In a courtroom ⚖️" },
  { w: "FUDGE", h: "Chocolate treat 🍫" }, { w: "NUDGE", h: "Gentle push" },
  { w: "LARGE", h: "Really big" }, { w: "MERGE", h: "Combine together" },
  { w: "SURGE", h: "Sudden rush" }, { w: "PURGE", h: "Clean out" },
  { w: "PEACE", h: "No fighting ☮️" }, { w: "LEASE", h: "Rent agreement" },
  { w: "TEASE", h: "Playful joking" }, { w: "GEESE", h: "Plural of goose 🪿" },
  { w: "PIECE", h: "A part of" }, { w: "NIECE", h: "Sister's daughter" },
  { w: "PHONE", h: "Call someone 📱" }, { w: "STONE", h: "A rock 🪨" },
  { w: "GLOBE", h: "Round like Earth 🌎" }, { w: "THEME", h: "Main idea" },
  { w: "SCENE", h: "Part of a movie 🎬" }, { w: "NERVE", h: "Feeling bold" },
  { w: "SOLVE", h: "Find the answer" }, { w: "CURVE", h: "Not straight" },
  { w: "PASTE", h: "Stick things" }, { w: "WASTE", h: "Throw away 🗑️" },
  { w: "TASTE", h: "Flavor in your mouth" }, { w: "HASTE", h: "In a hurry" },
  { w: "FABLE", h: "A story with a lesson 📖" }, { w: "CLIFF", h: "Steep rock edge 🏔️" },
  { w: "BLUFF", h: "Pretend you have it" }, { w: "BRIEF", h: "Short and quick" },
  { w: "CHIEF", h: "The leader 👑" }, { w: "CRAFT", h: "Make something ✂️" },
  { w: "DWARF", h: "Very small person" }, { w: "GRIEF", h: "Deep sadness 😞" },
  { w: "SCARF", h: "Keeps your neck warm 🧣" }, { w: "SHELF", h: "Hold your books 📚" },
  { w: "THIEF", h: "Sneaky stealer 🦹" }, { w: "STUFF", h: "All your things" },
  { w: "SNIFF", h: "Smell something 👃" }, { w: "STAFF", h: "Team of workers" },
  { w: "STIFF", h: "Hard to bend" }, { w: "SWIFT", h: "Super fast 💨" },
  { w: "CABLE", h: "Thick wire 🔌" }, { w: "FLOCK", h: "Group of birds 🐦" },
  { w: "FORCE", h: "Power and strength 💥" }, { w: "FORGE", h: "Shape with fire 🔨" },
  { w: "FETCH", h: "Go get it 🐕" }, { w: "BENCH", h: "Sit in the park 🪑" },
  { w: "BUNCH", h: "A group together" }, { w: "DRIFT", h: "Float along 🍂" },
  { w: "BUFFET", h: "All-you-can-eat 🍽️" }, { w: "COFFEE", h: "Morning drink ☕" },
  { w: "FIDGET", h: "Can't sit still" }, { w: "DEFEAT", h: "Beat the other team" },
  { w: "DEFEND", h: "Protect and guard 🛡️" }, { w: "BEFORE", h: "Earlier in time ⏰" },
  { w: "FABRIC", h: "Cloth material 🧵" }, { w: "BELIEF", h: "What you trust in" },
  { w: "EFFECT", h: "The result of something" }, { w: "COBWEB", h: "Spider's old web 🕸️" },
  { w: "BOBSLED", h: "Icy race ride 🛷" },
]);

const STAGE3_WORDS = dedup([
  { w: "BADGE", h: "Pin you wear" }, { w: "FACE", h: "In the mirror" }, { w: "CAGE", h: "Bird's home" },
  { w: "EDGE", h: "The very end" }, { w: "FADE", h: "Disappear" }, { w: "BEAD", h: "Tiny jewel" },
  { w: "DEAF", h: "Cannot hear" }, { w: "BRIDGE", h: "Cross water 🌉" }, { w: "CASTLE", h: "King's home 🏰" },
  { w: "GARDEN", h: "Flowers 🌸" }, { w: "DANGER", h: "Watch out ⚠️" }, { w: "EAGLE", h: "Soaring 🦅" },
  { w: "FLAME", h: "Fire 🔥" }, { w: "GRAPE", h: "Purple fruit 🍇" }, { w: "FEAST", h: "Big meal 🍽️" },
  { w: "DANCE", h: "Move to music 💃" }, { w: "BRAVE", h: "Not afraid" }, { w: "STAGE", h: "Performers 🎭" },
  { w: "GREAT", h: "Really good!" }, { w: "BEACH", h: "Sandy place 🏖️" }, { w: "CHANGE", h: "Make different" },
  { w: "SPACE", h: "Stars ✨" }, { w: "FINGER", h: "You have ten 🖐️" }, { w: "DRAGON", h: "Fire! 🐉" },
  { w: "PLACE", h: "A location" }, { w: "TRACE", h: "Follow the line" },
  { w: "GRACE", h: "Elegant beauty" }, { w: "BLADE", h: "Sharp edge 🗡️" },
  { w: "CRANE", h: "Tall bird" }, { w: "GRADE", h: "School score" },
  { w: "CHASE", h: "Run after 🏃" }, { w: "BLAZE", h: "Bright fire 🔥" },
  { w: "RANGE", h: "From here to there" }, { w: "LEDGE", h: "Narrow shelf" },
  { w: "HEDGE", h: "Green bushes" }, { w: "RIDGE", h: "Mountain top" },
  { w: "JUDGE", h: "Courtroom ⚖️" }, { w: "FUDGE", h: "Chocolate 🍫" },
  { w: "LARGE", h: "Really big" }, { w: "MERGE", h: "Combine" },
  { w: "SURGE", h: "Sudden rush" }, { w: "PEACE", h: "No fighting ☮️" },
  { w: "GEESE", h: "Plural of goose 🪿" }, { w: "PIECE", h: "A part of" },
  { w: "SCENE", h: "Part of a movie 🎬" }, { w: "NERVE", h: "Feeling bold" },
  { w: "CURVE", h: "Not straight" }, { w: "TASTE", h: "Flavor" },
  { w: "ADDED", h: "Put more in" }, { w: "FACED", h: "Looked bravely" },
  { w: "CAGED", h: "Locked up" }, { w: "EDGED", h: "Had a border" },
  { w: "REFUGE", h: "A safe place 🏠" }, { w: "REBUFF", h: "Turn away sharply" },
  { w: "BEHALF", h: "In support of" }, { w: "ENGULF", h: "Swallow up completely" },
  { w: "REBUKE", h: "Scold someone" }, { w: "BUDGET", h: "Plan your money 💰" },
  { w: "RUBBLE", h: "Broken pieces of stone" }, { w: "FUMBLE", h: "Drop the ball 🏈" },
  { w: "FRIDGE", h: "Keeps food cold 🧊" }, { w: "BREEZE", h: "Gentle wind 🌬️" },
  { w: "FREEZE", h: "Turn to ice ❄️" }, { w: "CUDGEL", h: "A heavy stick" },
  { w: "BADGER", h: "Stripy animal 🦡" }, { w: "BAFFLE", h: "Really confuse" },
  { w: "BOBBLE", h: "Wobble around" }, { w: "BUCKLE", h: "Fasten your belt" },
  { w: "CANDLE", h: "Flickering light 🕯️" }, { w: "DAGGER", h: "Short sharp blade 🗡️" },
  { w: "LEAGUE", h: "A group of teams ⚽" }, { w: "VOYAGE", h: "A long journey 🚢" },
  { w: "FORAGE", h: "Search for food 🌿" }, { w: "MIRAGE", h: "Desert illusion 🏜️" },
  { w: "SAUSAGE", h: "Breakfast meat 🌭" }, { w: "CABBAGE", h: "Green veggie 🥬" },
  { w: "BANDAGE", h: "Wrap a wound 🩹" }, { w: "GARBAGE", h: "Throw it out 🗑️" },
  { w: "PACKAGE", h: "Delivered box 📦" }, { w: "MASSAGE", h: "Rub away stress 💆" },
  { w: "COURAGE", h: "Being brave 🦁" }, { w: "COTTAGE", h: "Cozy little house 🏡" },
  { w: "LUGGAGE", h: "Travel bags 🧳" }, { w: "PASSAGE", h: "A narrow path" },
  { w: "VILLAGE", h: "Small town 🏘️" }, { w: "AVERAGE", h: "Right in the middle" },
  { w: "BAGGAGE", h: "Stuff you carry" }, { w: "FOOTAGE", h: "Video recording 🎥" },
  { w: "STORAGE", h: "Where you keep things 📦" }, { w: "VINTAGE", h: "Cool and old-school 🎸" },
]);

const STAGES = [
  { id: 1, name: "On the Staff", desc: "Notes between the lines", words: STAGE1_WORDS, color: "#22c55e", threshold: 0, pts: 2 },
  { id: 2, name: "Longer Words", desc: "Some letters filled in", words: STAGE2_WORDS, color: "#3b82f6", threshold: 20, pts: 3 },
  { id: 3, name: "Off the Staff!", desc: "Ledger lines above & below", words: STAGE3_WORDS, color: "#f59e0b", threshold: 50, pts: 5 },
];

const ALL_WORDS = [...STAGE1_WORDS, ...STAGE2_WORDS, ...STAGE3_WORDS];
const ARCADE_WORDS = ALL_WORDS.filter((w, i, a) => a.findIndex(x => x.w === w.w) === i);

// Scramble mode: only use words where every letter is a music note
// Also filter out words with all identical letters and words shorter than 3
(() => {
  const seen = new Set();
  ALL_WORDS.forEach(w => {
    if (seen.has(w.w)) return;
    const allMusic = w.w.split("").every(ch => MUSIC_NOTES.has(ch));
    const unique = new Set(w.w.split("")).size;
    if (allMusic && w.w.length >= 3 && unique >= 2) {
      SCRAMBLE_WORDS.push(w);
      seen.add(w.w);
    }
  });
})();

function pickScrambleWord(usedList) {
  const pool = SCRAMBLE_WORDS.filter(w => !usedList.includes(w.w));
  const source = pool.length ? pool : SCRAMBLE_WORDS;
  return source[Math.floor(Math.random() * source.length)];
}

function makeScramble(word) {
  const letters = word.w.split("");
  // Shuffle until different from original (for words with distinct letters)
  let shuffled = shuffleArray(letters);
  let attempts = 0;
  while (shuffled.join("") === letters.join("") && attempts < 20) {
    shuffled = shuffleArray(letters);
    attempts++;
  }
  return shuffled;
}

// ═══ WEAK NOTES ANALYSIS ═══
function analyzeWeakNotes(stats) {
  const notes = "ABCDEFG".split("");
  const noteAccuracy = notes.map(n => {
    const attempts = (stats.noteAttempts || {})[n] || 0;
    const correct = (stats.noteCorrect || {})[n] || 0;
    const accuracy = attempts > 0 ? correct / attempts : -1; // -1 = never tried
    return { note: n, attempts, correct, accuracy };
  });
  // Sort by accuracy ascending (worst first), but put never-tried notes second
  const tried = noteAccuracy.filter(n => n.accuracy >= 0).sort((a, b) => a.accuracy - b.accuracy);
  const untried = noteAccuracy.filter(n => n.accuracy < 0);
  return [...tried, ...untried];
}

function getWeakNotesList(stats) {
  const analysis = analyzeWeakNotes(stats);
  // Weak = below 80% accuracy OR fewer than 5 attempts
  const weak = analysis.filter(n => n.accuracy < 0.8 || n.attempts < 5);
  return weak.length > 0 ? weak.slice(0, 4).map(n => n.note) : analysis.slice(0, 3).map(n => n.note);
}

function pickWeakWord(weakNotes, usedList) {
  // Score each word by how many of its note slots match weak notes
  const scored = ALL_WORDS.map(word => {
    const notes = word.w.split("").filter(ch => MUSIC_NOTES.has(ch));
    const weakCount = notes.filter(n => weakNotes.includes(n)).length;
    return { word, weakCount, ratio: weakCount / Math.max(notes.length, 1) };
  });
  // Filter to words with at least 1 weak note, prefer higher ratio
  const good = scored.filter(s => s.weakCount > 0 && !usedList.includes(s.word.w));
  const pool = good.length > 0 ? good : scored.filter(s => !usedList.includes(s.word.w));
  // Weight toward higher ratio
  pool.sort((a, b) => b.ratio - a.ratio);
  const top = pool.slice(0, Math.max(5, Math.floor(pool.length / 3)));
  return (top.length > 0 ? top : pool)[Math.floor(Math.random() * Math.max(top.length, 1))]?.word || ALL_WORDS[0];
}

// ═══ POWERUP DEFINITIONS ═══
const POWERUPS = {
  reveal: { id: "reveal", name: "Reveal", icon: "👁️", desc: "Shows the current note", cost: 20 },
  double: { id: "double", name: "2× Score", icon: "✨", desc: "Double points next word", cost: 35 },
  shield: { id: "shield", name: "Shield", icon: "🛡️", desc: "Wrong guess keeps streak", cost: 40 },
};


// ═══ LEVEL PROGRESSION (XP-based) ═══
const LEVEL_TITLES = [
  { level: 1, title: "Note Newbie", color: "#9ca3af", emoji: "🎒" },
  { level: 5, title: "Staff Starter", color: "#6ee7b7", emoji: "🌱" },
  { level: 10, title: "Clef Cadet", color: "#4ade80", emoji: "🎖️" },
  { level: 15, title: "Note Noticer", color: "#34d399", emoji: "👀" },
  { level: 20, title: "Music Pupil", color: "#22c55e", emoji: "📗" },
  { level: 25, title: "Staff Scout", color: "#a78bfa", emoji: "🔍" },
  { level: 30, title: "Clef Climber", color: "#8b5cf6", emoji: "🧗" },
  { level: 35, title: "Note Navigator", color: "#7c3aed", emoji: "🧭" },
  { level: 40, title: "Melody Maker", color: "#3b82f6", emoji: "🎹" },
  { level: 45, title: "Staff Sergeant", color: "#2563eb", emoji: "🎖️" },
  { level: 50, title: "Pitch Pro", color: "#f59e0b", emoji: "⭐" },
  { level: 55, title: "Note Knight", color: "#d97706", emoji: "⚔️" },
  { level: 60, title: "Clef Captain", color: "#ef4444", emoji: "🏅" },
  { level: 65, title: "Music Marshal", color: "#dc2626", emoji: "🎯" },
  { level: 70, title: "Staff Scholar", color: "#06b6d4", emoji: "📘" },
  { level: 75, title: "Grand Noter", color: "#0891b2", emoji: "🎓" },
  { level: 80, title: "Clef Commander", color: "#c084fc", emoji: "👑" },
  { level: 85, title: "Note Ninja", color: "#a855f7", emoji: "🥷" },
  { level: 90, title: "Music Monarch", color: "#e11d48", emoji: "👸" },
  { level: 95, title: "Staff Sorcerer", color: "#9333ea", emoji: "🧙" },
  { level: 100, title: "Legendary Maestro", color: "#f59e0b", emoji: "🏆" },
];

// XP needed to reach each level — progressive curve
// Levels 1-10: ~15 XP each (easy, word-driven)
// Levels 10-30: ~25 XP each (moderate)
// Levels 30-60: ~45 XP each (streaks start to matter)
// Levels 60-100: ~80 XP each (need consistent streaks)
function xpForLevel(lvl) {
  if (lvl <= 1) return 0;
  if (lvl <= 10) return 15 * (lvl - 1);                         // 0,15,30,...,135
  if (lvl <= 30) return 135 + 25 * (lvl - 10);                  // 135 + 25*1..20 = 160..635
  if (lvl <= 60) return 635 + 45 * (lvl - 30);                  // 635 + 45*1..30 = 680..1985
  return 1985 + 80 * (lvl - 60);                                // 1985 + 80*1..40 = 2065..5185
}

// XP awards:
// - Word completed: 10 XP
// - Each note in a streak (beyond 5): +2 XP bonus per note
// - Butterfly (10-streak): 30 XP bonus
// - Streak milestone 25: 75 XP bonus
// - Streak milestone 50: 150 XP bonus
// - Streak milestone 100: 300 XP bonus
// - Streak milestone 150+: 200 XP bonus each
function calcXpAward(wordCompleted, currentStreak, isButterflyNow, milestone) {
  let xp = 0;
  if (wordCompleted) xp += 10;
  // Streak bonus: each note beyond 5 in current streak adds 2 XP
  if (currentStreak > 5) xp += 2;
  // Butterfly bonus
  if (isButterflyNow) xp += 30;
  // Milestone bonuses
  if (milestone) {
    if (milestone.tier === "fire") xp += 75;       // 25 streak
    else if (milestone.tier === "star") xp += 150;  // 50 streak
    else if (milestone.tier === "legendary") xp += 300; // 100 streak
    else if (milestone.tier === "diamond") xp += 200;   // 150, 200, etc.
  }
  return xp;
}

function getPlayerLevel(xp) {
  for (let lvl = 100; lvl >= 1; lvl--) {
    if (xp >= xpForLevel(lvl)) return lvl;
  }
  return 1;
}

function getXpProgress(xp) {
  const level = getPlayerLevel(xp);
  if (level >= 100) return { level: 100, current: 0, needed: 0, pct: 100 };
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const needed = nextLevelXp - currentLevelXp;
  const current = xp - currentLevelXp;
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

function getLevelTitle(level) {
  let current = LEVEL_TITLES[0];
  for (const t of LEVEL_TITLES) {
    if (level >= t.level) current = t;
  }
  return current;
}

function getNextTitle(level) {
  for (const t of LEVEL_TITLES) {
    if (t.level > level) return t;
  }
  return null;
}

// ═══ NOTE POSITIONS ═══
const TREBLE_STD = { A: 3, B: 4, C: 5, D: 6, E: 0, F: 1, G: 2 };
const BASS_STD = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 0 };
const TREBLE_EXT = { A: -4, B: 11, C: -2, D: 13, E: 14, F: -6, G: 9 };
const BASS_EXT = { A: -6, B: 9, C: 10, D: 11, E: 12, F: 13, G: 14 };
// Song mode: C4 and D4 sit below the treble staff (ledger lines), 
// E4-G4 on staff, A4-B4 in upper staff. This matches real sheet music.
// Song mode position maps — support octave notation like "C", "C5", "C3"
// Positions must match REAL treble/bass clef so players read notes correctly
// Treble clef: E4=0 (bottom line), F4=1, G4=2, A4=3, B4=4 (top line), C5=5, D5=6, E5=7, F5=8
// Below staff: D4=-1, C4=-2, B3=-3, A3=-4
const TREBLE_SONG_MAP = {
  C3: -16, D3: -15, E3: -14, F3: -13, G3: -12, A3: -11, B3: -10,
  C4: -2, D4: -1, E4: 0, F4: 1, G4: 2, A4: 3, B4: 4,
  C5: 5, D5: 6, E5: 7, F5: 8, G5: 9, A5: 10, B5: 11,
};
const BASS_SONG_MAP = {
  E2: -2, F2: -1, G2: 0, A2: 1, B2: 2, C3: 3, D3: 4, E3: 5, F3: 6, G3: 7, A3: 8, B3: 9,
  C4: 10, D4: 11, E4: 12,
};
function songPos(noteStr, clef) {
  const letter = noteStr.charAt(0);
  const octave = noteStr.length > 1 ? parseInt(noteStr.charAt(1)) : 4;
  const key = letter + octave;
  const map = clef === "treble" ? TREBLE_SONG_MAP : BASS_SONG_MAP;
  if (map[key] !== undefined) return map[key];
  // Fallback: use octave 4 default position
  const base = clef === "treble"
    ? { C: -2, D: -1, E: 0, F: 1, G: 2, A: 3, B: 4 }
    : { C: 3, D: 4, E: 5, F: 6, G: 7, A: 8, B: 9 };
  return base[letter] || 0;
}

const STAFF_W = 100, STAFF_H = 155, TOP_LINE_Y = 52, LINE_GAP = 14;
const positionToY = (pos) => TOP_LINE_Y + 4 * LINE_GAP - pos * (LINE_GAP / 2);

function getLedgerLines(pos) {
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

// ═══ STAFF COMPONENT ═══
function Staff({ note, clef, highlight, showLabel, extended, dark, shake, songMode }) {
  let pos;
  if (songMode) {
    pos = songPos(note, clef);
  } else {
    const posMap = extended
      ? (clef === "treble" ? TREBLE_EXT : BASS_EXT)
      : (clef === "treble" ? TREBLE_STD : BASS_STD);
    pos = posMap[note];
  }
  const noteLetter = note.charAt(0); // strip octave for label
  const noteY = positionToY(pos);
  const noteX = 65;
  const ledgers = getLedgerLines(pos);
  const lineColor = dark ? "#5a5070" : "#8d7e72";
  const clefColor = dark ? "#8b7faa" : "#5a4a3a";
  const defaultNoteColor = dark ? "#e2d5f5" : "#2d1810";
  const fill = highlight === "correct" ? "#4ade80" : highlight === "wrong" ? "#f87171" : highlight === "reveal" ? "#fbbf24" : defaultNoteColor;
  const stemUp = pos < 4;
  return (
    <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
      style={shake ? { animation: "shakeNote 0.35s ease-in-out" } : undefined}>
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1="5" y1={TOP_LINE_Y + i * LINE_GAP} x2="95" y2={TOP_LINE_Y + i * LINE_GAP}
          stroke={lineColor} strokeWidth="1" />
      ))}
      {clef === "treble" ? (
        <g transform={`translate(8, ${TOP_LINE_Y - 1.31 * LINE_GAP}) scale(${LINE_GAP * 6.89 / 4066})`}>
          <path d="M 2002,7851 C 1941,7868 1886,7906 1835,7964 C 1784,8023 1759,8088 1759,8158 C 1759,8202 1774,8252 1803,8305 C 1832,8359 1876,8398 1933,8423 C 1952,8427 1961,8437 1961,8451 C 1961,8456 1954,8461 1937,8465 C 1846,8442 1771,8393 1713,8320 C 1655,8246 1625,8162 1623,8066 C 1626,7963 1657,7867 1716,7779 C 1776,7690 1853,7627 1947,7590 L 1878,7235 C 1724,7363 1599,7496 1502,7636 C 1405,7775 1355,7926 1351,8089 C 1353,8162 1368,8233 1396,8301 C 1424,8370 1466,8432 1522,8489 C 1635,8602 1782,8661 1961,8667 C 2022,8663 2087,8652 2157,8634 L 2002,7851 z M 2074,7841 L 2230,8610 C 2384,8548 2461,8413 2461,8207 C 2452,8138 2432,8076 2398,8021 C 2365,7965 2321,7921 2265,7889 C 2209,7857 2146,7841 2074,7841 z M 1869,6801 C 1902,6781 1940,6746 1981,6697 C 2022,6649 2062,6592 2100,6528 C 2139,6463 2170,6397 2193,6330 C 2216,6264 2227,6201 2227,6143 C 2227,6118 2225,6093 2220,6071 C 2216,6035 2205,6007 2186,5988 C 2167,5970 2143,5960 2113,5960 C 2053,5960 1999,5997 1951,6071 C 1914,6135 1883,6211 1861,6297 C 1838,6384 1825,6470 1823,6557 C 1828,6656 1844,6737 1869,6801 z M 1806,6859 C 1761,6697 1736,6532 1731,6364 C 1732,6256 1743,6155 1764,6061 C 1784,5967 1813,5886 1851,5816 C 1888,5746 1931,5693 1979,5657 C 2022,5625 2053,5608 2070,5608 C 2083,5608 2094,5613 2104,5622 C 2114,5631 2127,5646 2143,5666 C 2262,5835 2322,6039 2322,6277 C 2322,6390 2307,6500 2277,6610 C 2248,6719 2205,6823 2148,6920 C 2090,7018 2022,7103 1943,7176 L 2024,7570 C 2068,7565 2098,7561 2115,7561 C 2191,7561 2259,7577 2322,7609 C 2385,7641 2439,7684 2483,7739 C 2527,7793 2561,7855 2585,7925 C 2608,7995 2621,8068 2621,8144 C 2621,8262 2590,8370 2528,8467 C 2466,8564 2373,8635 2248,8681 C 2256,8730 2270,8801 2291,8892 C 2311,8984 2326,9057 2336,9111 C 2346,9165 2350,9217 2350,9268 C 2350,9347 2331,9417 2293,9479 C 2254,9541 2202,9589 2136,9623 C 2071,9657 1999,9674 1921,9674 C 1811,9674 1715,9643 1633,9582 C 1551,9520 1507,9437 1503,9331 C 1506,9284 1517,9240 1537,9198 C 1557,9156 1584,9122 1619,9096 C 1653,9069 1694,9055 1741,9052 C 1780,9052 1817,9063 1852,9084 C 1886,9106 1914,9135 1935,9172 C 1955,9209 1966,9250 1966,9294 C 1966,9353 1946,9403 1906,9444 C 1866,9485 1815,9506 1754,9506 L 1731,9506 C 1770,9566 1834,9597 1923,9597 C 1968,9597 2014,9587 2060,9569 C 2107,9550 2146,9525 2179,9493 C 2212,9461 2234,9427 2243,9391 C 2260,9350 2268,9293 2268,9222 C 2268,9174 2263,9126 2254,9078 C 2245,9031 2231,8968 2212,8890 C 2193,8813 2179,8753 2171,8712 C 2111,8727 2049,8735 1984,8735 C 1875,8735 1772,8713 1675,8668 C 1578,8623 1493,8561 1419,8481 C 1346,8401 1289,8311 1248,8209 C 1208,8108 1187,8002 1186,7892 C 1190,7790 1209,7692 1245,7600 C 1281,7507 1327,7419 1384,7337 C 1441,7255 1500,7180 1561,7113 C 1623,7047 1704,6962 1806,6859 z"
            fill={clefColor} transform="translate(-984, -5608)" />
        </g>
      ) : (
        <text x="22" y={TOP_LINE_Y + 3.55 * LINE_GAP} fontSize="80" fill={clefColor}
          fontFamily="'Noto Music','Segoe UI Symbol',serif" textAnchor="middle">𝄢</text>
      )}
      {ledgers.map((lp, i) => (
        <line key={`l${i}`} x1={noteX - 14} y1={positionToY(lp)} x2={noteX + 14} y2={positionToY(lp)}
          stroke={lineColor} strokeWidth="1" />
      ))}
      <ellipse cx={noteX} cy={noteY} rx="7.5" ry="5.5" fill={fill}
        transform={`rotate(-12,${noteX},${noteY})`} />
      {stemUp ? (
        <line x1={noteX + 7} y1={noteY} x2={noteX + 7} y2={noteY - 30} stroke={fill} strokeWidth="1.8" />
      ) : (
        <line x1={noteX - 7} y1={noteY} x2={noteX - 7} y2={noteY + 30} stroke={fill} strokeWidth="1.8" />
      )}
      {showLabel && (
        <text x={noteX} y={STAFF_H - 2} textAnchor="middle" fontSize="15" fontWeight="700"
          fill={highlight === "correct" ? "#4ade80" : highlight === "reveal" ? "#fbbf24" : "#f87171"}
          fontFamily="'Fredoka',sans-serif">{noteLetter}</text>
      )}
    </svg>
  );
}

// ═══ PRE-FILLED LETTER ═══
function PreFilled({ letter, dark }) {
  return (
    <div style={{
      width: STAFF_W, height: STAFF_H, display: "flex", alignItems: "center",
      justifyContent: "center", position: "relative"
    }}>
      <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}
        style={{ position: "absolute", top: 0, left: 0 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="5" y1={TOP_LINE_Y + i * LINE_GAP} x2="95" y2={TOP_LINE_Y + i * LINE_GAP}
            stroke={dark ? "#3a3050" : "#d6cfc7"} strokeWidth=".8" strokeDasharray="4 3" />
        ))}
      </svg>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: dark ? "linear-gradient(135deg,#312e81,#3730a3)" : "linear-gradient(135deg,#e0e7ff,#c7d2fe)",
        border: dark ? "2px solid #4f46e5" : "2px solid #a5b4fc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 700, color: dark ? "#a5b4fc" : "#4338ca",
        fontFamily: "'Fredoka',sans-serif",
        zIndex: 1, boxShadow: dark ? "0 2px 6px rgba(79,70,229,.3)" : "0 2px 6px rgba(67,56,202,.15)"
      }}>{letter}</div>
    </div>
  );
}

// ═══ CATERPILLAR ═══
function Caterpillar({ streak, isButterfly, milestone }) {
  const progress = streak % 10; // 0-9, where 0 after butterfly means "just transformed"
  const showTransform = isButterfly;

  // Determine current visual tier based on streak (persists between milestones)
  const tier = streak >= 100 && streak % 50 === 0 ? "diamond"
    : streak >= 100 ? "legendary"
    : streak >= 50 ? "star"
    : streak >= 25 ? "fire"
    : null;

  // Tier color palettes for segment overrides and effects
  const tierConfig = {
    fire: { segColors: ["#f97316","#ef4444","#fbbf24","#dc2626","#fb923c","#f59e0b","#ef4444","#f97316","#fbbf24","#dc2626"], glow: "#f97316", aura: "#ef444466", headFill: "#f97316", headStroke: "#dc2626", label: "🔥 ON FIRE!" },
    star: { segColors: ["#eab308","#fde047","#facc15","#fbbf24","#f59e0b","#fef08a","#eab308","#fde047","#facc15","#fbbf24"], glow: "#eab308", aura: "#eab30855", headFill: "#eab308", headStroke: "#a16207", label: "⭐ SUPERSTAR!" },
    legendary: { segColors: ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#ef4444","#f97316","#eab308"], glow: "#a855f7", aura: "#a855f744", headFill: "#8b5cf6", headStroke: "#6d28d9", label: "🌈 LEGENDARY!" },
    diamond: { segColors: ["#06b6d4","#a5f3fc","#e0f2fe","#c084fc","#ddd6fe","#67e8f9","#06b6d4","#a5f3fc","#c084fc","#e0f2fe"], glow: "#06b6d4", aura: "#06b6d444", headFill: "#06b6d4", headStroke: "#0891b2", label: "💎 DIAMOND!" },
  };
  const tc = tier ? tierConfig[tier] : null;

  // Butterfly state — wings flapping, sparkles
  if (showTransform) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: 160, height: 130 }}>
        {/* Sparkle burst */}
        {[0,1,2,3,4,5,6,7].map(i => {
          const angle = (i / 8) * Math.PI * 2;
          const r = 55;
          return <div key={i} style={{
            position: "absolute", left: 80 + Math.cos(angle) * r - 4, top: 55 + Math.sin(angle) * r - 4,
            width: 8, height: 8, borderRadius: "50%",
            background: ["#c084fc","#e879f9","#facc15","#4ade80","#60a5fa","#f87171","#fb923c","#93c5fd"][i],
            animation: `popIn .6s ease ${i * 0.08}s both`,
            opacity: 0.8,
          }} />;
        })}
        <svg width="160" height="130" viewBox="0 0 160 130" style={{ animation: "bfly 2s ease-in-out infinite" }}>
          {/* Wings — grow in */}
          <g style={{ animation: "popIn .8s ease .2s both" }}>
            <ellipse cx="42" cy="58" rx="34" ry="38" fill={tc ? tc.segColors[0] : "#c084fc"} opacity=".85" transform="rotate(-15,42,58)">
              <animateTransform attributeName="transform" type="rotate" values="-15,42,58;-5,42,58;-15,42,58" dur=".7s" repeatCount="indefinite" /></ellipse>
            <ellipse cx="42" cy="72" rx="22" ry="26" fill={tc ? tc.segColors[2] : "#e879f9"} opacity=".7" transform="rotate(-15,42,72)">
              <animateTransform attributeName="transform" type="rotate" values="-15,42,72;-5,42,72;-15,42,72" dur=".7s" repeatCount="indefinite" /></ellipse>
            <ellipse cx="118" cy="58" rx="34" ry="38" fill={tc ? tc.segColors[0] : "#c084fc"} opacity=".85" transform="rotate(15,118,58)">
              <animateTransform attributeName="transform" type="rotate" values="15,118,58;5,118,58;15,118,58" dur=".7s" repeatCount="indefinite" /></ellipse>
            <ellipse cx="118" cy="72" rx="22" ry="26" fill={tc ? tc.segColors[2] : "#e879f9"} opacity=".7" transform="rotate(15,118,72)">
              <animateTransform attributeName="transform" type="rotate" values="15,118,72;5,118,72;15,118,72" dur=".7s" repeatCount="indefinite" /></ellipse>
          </g>
          {/* Body */}
          <ellipse cx="80" cy="70" rx="8" ry="30" fill={tc ? tc.headFill : "#5b21b6"} />
          {/* Head */}
          <circle cx="80" cy="38" r="13" fill={tc ? tc.headFill : "#5b21b6"} />
          {/* Top hat */}
          <rect x="67" y="13" width="26" height="17" rx="2" fill="#1e1b4b" />
          <rect x="63" y="28" width="34" height="5" rx="2" fill="#1e1b4b" />
          <rect x="70" y="17" width="20" height="2.5" rx="1" fill={tc ? tc.glow : "#c084fc"} opacity=".5" />
          {/* Eyes */}
          <circle cx="74" cy="36" r="4" fill="white" /><circle cx="86" cy="36" r="4" fill="white" />
          <circle cx="75" cy="36.5" r="2" fill="#1e1b4b" /><circle cx="87" cy="36.5" r="2" fill="#1e1b4b" />
          <circle cx="75.8" cy="35" r=".8" fill="white" /><circle cx="87.8" cy="35" r=".8" fill="white" />
          {/* Rosy cheeks */}
          <circle cx="68" cy="42" r="3.5" fill="#f9a8d4" opacity=".45" />
          <circle cx="92" cy="42" r="3.5" fill="#f9a8d4" opacity=".45" />
          {/* Big smile */}
          <path d="M72 44Q80 52 88 44" stroke={tc ? tc.glow + "cc" : "#c4b5fd"} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Antennae */}
          <line x1="72" y1="14" x2="62" y2="5" stroke={tc ? tc.headFill : "#5b21b6"} strokeWidth="1.5" /><circle cx="62" cy="5" r="2.5" fill={tc ? tc.glow : "#e879f9"} />
          <line x1="88" y1="14" x2="98" y2="5" stroke={tc ? tc.headFill : "#5b21b6"} strokeWidth="1.5" /><circle cx="98" cy="5" r="2.5" fill={tc ? tc.glow : "#e879f9"} />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontFamily: "'Fredoka',sans-serif", color: tc ? tc.headFill : "#7c3aed", fontWeight: 600, marginTop: -6 }}>{tc ? tc.label : "✨ Butterfly!"} {streak} notes!</div>
    </div>
  );

  // Caterpillar state — always 10 segments, fill left to right toward head
  const defaultColors = ["#4ade80","#86efac","#facc15","#fde047","#fb923c","#fdba74","#f87171","#fca5a5","#60a5fa","#93c5fd"];
  const colors = tc ? tc.segColors : defaultColors;
  const headFill = tc ? tc.headFill : "#4ade80";
  const headStroke = tc ? tc.headStroke : "#16a34a";
  const headX = 186;
  const headY = 42;
  const segSpacing = 15.5;
  const startX = headX - 10 * segSpacing;

  // Flame/sparkle particles for tiered caterpillar
  const particles = tier ? Array.from({ length: tier === "legendary" ? 12 : tier === "diamond" ? 10 : 8 }).map((_, i) => {
    const segIdx = i % 10;
    const cx = startX + segIdx * segSpacing;
    const cy = 45 + Math.sin(segIdx * 0.8) * 3;
    const offX = (Math.random() - 0.5) * 16;
    const offY = -8 - Math.random() * 18;
    const size = 2 + Math.random() * 3;
    const particleEmoji = tier === "fire" ? "🔥" : tier === "star" ? "✦" : tier === "legendary" ? "✦" : "💎";
    const delay = i * 0.15;
    return { cx: cx + offX, cy: cy + offY, size, emoji: particleEmoji, delay, color: tc.segColors[i % tc.segColors.length] };
  }) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative" }}>
        <svg width="210" height="80" viewBox="0 0 210 80">
          {/* Aura glow behind segments when tiered */}
          {tc && (
            <ellipse cx={headX - 5 * segSpacing + startX / 2 + 50} cy="45" rx="110" ry="28"
              fill={tc.aura} opacity=".5">
              <animate attributeName="opacity" values=".3;.6;.3" dur="2s" repeatCount="indefinite" />
            </ellipse>
          )}
          {/* 10 body segments */}
          {Array.from({ length: 10 }).map((_, i) => {
            const cx = startX + i * segSpacing;
            const cy = 45 + Math.sin(i * 0.8) * 3;
            const filled = i < progress;
            const isNext = i === progress;
            const segColor = filled ? colors[i] : "#e5e7eb";
            return (
              <g key={i}>
                {/* Segment glow for tiered */}
                {tc && filled && (
                  <circle cx={cx} cy={cy} r="12" fill={tc.glow} opacity=".2">
                    <animate attributeName="opacity" values=".1;.3;.1" dur={`${1.2 + i * 0.1}s`} repeatCount="indefinite" />
                    <animate attributeName="r" values="10;14;10" dur={`${1.2 + i * 0.1}s`} repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={cx} cy={cy} r={filled ? 8.5 : 7} fill={segColor}
                  stroke={filled ? (tc ? tc.glow + "88" : "#fff") : "#d1d5db"}
                  strokeWidth={filled ? 2 : 1.5} style={{ transition: "all .3s ease" }}>
                  {filled && i === progress - 1 && <animate attributeName="r" values="7;9;8.5" dur=".3s" fill="freeze" />}
                </circle>
                {filled && <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize="9" fill="white" fontFamily="serif">{"\u266A"}</text>}
                {/* Tiny feet */}
                <line x1={cx - 2} y1={cy + 7} x2={cx - 3} y2={cy + 13} stroke={filled ? colors[i] + "88" : "#d1d5db"} strokeWidth="1" />
                <line x1={cx + 2} y1={cy + 7} x2={cx + 3} y2={cy + 13} stroke={filled ? colors[i] + "88" : "#d1d5db"} strokeWidth="1" />
                {/* Glow on next-to-fill */}
                {isNext && streak > 0 && <circle cx={cx} cy={cy} r="11" fill="none" stroke={tc ? tc.glow : "#facc15"} strokeWidth="1" opacity=".4">
                  <animate attributeName="opacity" values=".2;.5;.2" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="r" values="10;13;10" dur="1.5s" repeatCount="indefinite" />
                </circle>}
              </g>
            );
          })}
          {/* Head */}
          <circle cx={headX} cy={headY} r="14" fill={headFill} stroke={headStroke} strokeWidth="2" />
          {/* Head glow for tiered */}
          {tc && <circle cx={headX} cy={headY} r="18" fill="none" stroke={tc.glow} strokeWidth="1.5" opacity=".3">
            <animate attributeName="opacity" values=".2;.5;.2" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="r" values="16;20;16" dur="1.5s" repeatCount="indefinite" />
          </circle>}
          {/* Top hat */}
          <rect x={headX - 10} y={headY - 27} width="20" height="14" rx="2" fill="#1a1a2e" />
          <rect x={headX - 14} y={headY - 15} width="28" height="4.5" rx="2" fill="#1a1a2e" />
          <rect x={headX - 8} y={headY - 24} width="16" height="2" rx="1" fill={tc ? tc.glow : "#4ade80"} opacity=".4" />
          {/* Eyes */}
          <circle cx={headX - 5} cy={headY - 3} r="3.8" fill="white" /><circle cx={headX + 5} cy={headY - 3} r="3.8" fill="white" />
          <circle cx={headX - 4.2} cy={headY - 2.5} r="2" fill="#1a1a2e" /><circle cx={headX + 5.8} cy={headY - 2.5} r="2" fill="#1a1a2e" />
          <circle cx={headX - 3.5} cy={headY - 3.8} r=".7" fill="white" /><circle cx={headX + 6.5} cy={headY - 3.8} r=".7" fill="white" />
          {/* Cheeks */}
          <circle cx={headX - 11} cy={headY + 3} r="3" fill={tc ? tc.glow + "55" : "#f9a8d4"} opacity=".45" />
          <circle cx={headX + 11} cy={headY + 3} r="3" fill={tc ? tc.glow + "55" : "#f9a8d4"} opacity=".45" />
          {/* Smile — gets bigger as progress grows */}
          <path d={`M${headX - 7} ${headY + 4}Q${headX} ${headY + 6 + progress * 0.6} ${headX + 7} ${headY + 4}`} stroke={tc ? tc.headStroke : "#15803d"} strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Antennae */}
          <line x1={headX - 6} y1={headY - 15} x2={headX - 13} y2={headY - 26} stroke={headStroke} strokeWidth="1.5" />
          <circle cx={headX - 13} cy={headY - 26} r="2.5" fill={tc ? tc.glow : "#facc15"}>
            {tc && <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />}
          </circle>
          <line x1={headX + 6} y1={headY - 15} x2={headX + 13} y2={headY - 26} stroke={headStroke} strokeWidth="1.5" />
          <circle cx={headX + 13} cy={headY - 26} r="2.5" fill={tc ? tc.glow : "#facc15"}>
            {tc && <animate attributeName="r" values="2;3.5;2" dur="1s" repeatCount="indefinite" />}
          </circle>
        </svg>
        {/* Floating particles above caterpillar for tiered */}
        {particles.map((p, i) => (
          <div key={`p${i}`} style={{
            position: "absolute", left: p.cx, top: p.cy,
            fontSize: p.size + 4, lineHeight: 1,
            color: p.color,
            animation: `catFloat ${1.5 + Math.random()}s ease-in-out ${p.delay}s infinite`,
            pointerEvents: "none", opacity: 0.7,
          }}>{p.emoji === "💎" ? "💎" : p.emoji === "🔥" ? "🔥" : <span style={{ color: p.color }}>✦</span>}</div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: -4 }}>
        <span style={{ fontSize: 16 }}>{tier === "fire" ? "🔥" : tier === "star" ? "⭐" : tier === "legendary" ? "🌈" : tier === "diamond" ? "💎" : "🔥"}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: tc ? tc.glow : (streak > 0 ? "#f59e0b" : "#d1d5db"), fontFamily: "'Fredoka',sans-serif" }}>{streak}</span>
        <span style={{ fontSize: 10, color: tc ? tc.glow + "cc" : "#9ca3af", fontFamily: "'Fredoka',sans-serif" }}>
          {tc ? `— ${tc.label}` : streak === 0 ? "— Name the notes!" : progress === 0 ? "— 10 more for 🦋" : `— ${10 - progress} more for 🦋`}
        </span>
      </div>
    </div>
  );
}

function Confetti({ show }) {
  if (!show) return null;
  return (<div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999 }}>
    {Array.from({ length: 40 }).map((_, i) => (
      <div key={i} style={{
        position: "absolute", left: `${Math.random() * 100}%`, top: -12,
        width: 6 + Math.random() * 8, height: 6 + Math.random() * 8,
        background: `hsl(${Math.random() * 360},75%,55%)`,
        borderRadius: Math.random() > .5 ? "50%" : "2px",
        animation: `cfall ${1.4 + Math.random()}s ease-in ${Math.random() * .5}s forwards`
      }} />
    ))}
  </div>);
}

// ═══ STREAK MILESTONE CELEBRATION ═══
function StreakCelebration({ milestone }) {
  if (!milestone) return null;
  const { tier, streak, emoji, title, color } = milestone;

  const particleCount = tier === "legendary" ? 60 : tier === "diamond" ? 50 : tier === "star" ? 45 : 30;
  const palettes = {
    fire: ["#f97316", "#ef4444", "#fbbf24", "#dc2626", "#fb923c", "#f59e0b"],
    star: ["#eab308", "#fde047", "#facc15", "#fbbf24", "#f59e0b", "#fef08a"],
    legendary: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"],
    diamond: ["#06b6d4", "#a5f3fc", "#e0f2fe", "#c084fc", "#ddd6fe", "#f0f9ff"],
  };
  const colors = palettes[tier] || palettes.fire;

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1002 }}>
      {/* Screen flash */}
      <div style={{
        position: "absolute", inset: 0,
        background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
        animation: "milestoneFlash 1.5s ease-out forwards",
      }} />

      {/* Center burst text */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        animation: "milestonePop 2.5s ease-out forwards",
        zIndex: 1003,
      }}>
        <div style={{ fontSize: tier === "legendary" ? 72 : 60, lineHeight: 1, animation: "milestoneSpin 0.8s ease-out" }}>
          {emoji}
        </div>
        <div style={{
          fontSize: tier === "legendary" ? 32 : 26, fontWeight: 800,
          color, textShadow: `0 0 20px ${color}88, 0 0 40px ${color}44`,
          fontFamily: "'Fredoka',sans-serif",
          letterSpacing: 3,
        }}>{title}</div>
        <div style={{
          fontSize: 18, fontWeight: 700, color: "#fff",
          textShadow: "0 2px 8px rgba(0,0,0,.5)",
          fontFamily: "'Fredoka',sans-serif",
          marginTop: 4,
        }}>{streak} notes perfect!</div>
      </div>

      {/* Particle burst */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 80 + Math.random() * 200;
        const size = 4 + Math.random() * (tier === "legendary" ? 10 : 7);
        const c = colors[i % colors.length];
        return (
          <div key={i} style={{
            position: "absolute",
            left: "50%", top: "50%",
            width: size, height: size,
            background: c,
            borderRadius: Math.random() > 0.4 ? "50%" : tier === "diamond" ? "2px" : "3px",
            boxShadow: `0 0 ${size}px ${c}88`,
            transform: `translate(-50%, -50%)`,
            animation: `milestoneBurst ${1 + Math.random() * 0.8}s ease-out ${Math.random() * 0.3}s forwards`,
            "--burst-x": `${Math.cos(angle) * dist}px`,
            "--burst-y": `${Math.sin(angle) * dist}px`,
            opacity: 0,
          }} />
        );
      })}

      {/* Ring expansion (star/legendary/diamond) */}
      {(tier === "star" || tier === "legendary" || tier === "diamond") && (
        <>
          <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 20, height: 20,
            borderRadius: "50%",
            border: `3px solid ${color}`,
            transform: "translate(-50%, -50%)",
            animation: "milestoneRing 1.2s ease-out 0.2s forwards",
            opacity: 0,
          }} />
          {tier !== "star" && <div style={{
            position: "absolute", left: "50%", top: "50%",
            width: 20, height: 20,
            borderRadius: "50%",
            border: `2px solid ${colors[1]}`,
            transform: "translate(-50%, -50%)",
            animation: "milestoneRing 1.4s ease-out 0.4s forwards",
            opacity: 0,
          }} />}
        </>
      )}

      {/* Rainbow arc (legendary only) */}
      {tier === "legendary" && (
        <div style={{
          position: "absolute", left: "50%", top: "55%",
          width: 300, height: 150,
          transform: "translate(-50%, -50%)",
          borderRadius: "150px 150px 0 0",
          border: "6px solid transparent",
          borderTop: "6px solid #ef4444",
          boxShadow: `
            inset 0 3px 0 #f97316,
            inset 0 6px 0 #eab308,
            inset 0 9px 0 #22c55e,
            inset 0 12px 0 #3b82f6,
            inset 0 15px 0 #8b5cf6
          `,
          animation: "milestoneRainbow 2s ease-out 0.3s both",
          opacity: 0,
        }} />
      )}
    </div>
  );
}

function NoteBtn({ note, onPick, disabled, gold }) {
  const [hovered, setHovered] = useState(false);
  const borderColor = gold ? "#f59e0b" : "#5b21b6";
  const bg1 = gold ? (hovered ? "#fef3c7" : "#fffbeb") : (hovered ? "#ddd6fe" : "#ede9fe");
  const bg2 = gold ? (hovered ? "#fde68a" : "#fef3c7") : (hovered ? "#c4b5fd" : "#ddd6fe");
  const textColor = gold ? "#92400e" : "#5b21b6";
  return (
    <button onClick={() => onPick(note)} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: "clamp(44px, 12vw, 56px)", height: "clamp(44px, 12vw, 56px)", borderRadius: "50%", border: `3px solid ${borderColor}`,
        background: `linear-gradient(135deg,${bg1},${bg2})`, color: textColor,
        fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 700, fontFamily: "'Fredoka',sans-serif",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .3 : 1,
        transform: hovered && !disabled ? "scale(1.12)" : "scale(1)",
        transition: "all .15s ease", boxShadow: `0 3px 10px ${borderColor}22`,
        WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
        minWidth: 44, minHeight: 44,
      }}>{note}</button>
  );
}


// ═══ LEVEL BADGE ═══
function LevelBadge({ stats, style }) {
  const xpInfo = getXpProgress(stats.xp || 0);
  const level = xpInfo.level;
  const titleInfo = getLevelTitle(level);
  const next = getNextTitle(level);
  const progress = xpInfo.pct;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
      borderRadius: 10, padding: "4px 10px",
      border: `1.5px solid ${titleInfo.color}33`,
      fontSize: 11, fontFamily: "'Fredoka',sans-serif",
      ...style,
    }}>
      <span style={{ fontSize: 14 }}>{titleInfo.emoji}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: titleInfo.color, fontSize: 11 }}>Lv.{level}</span>
          <span style={{ fontWeight: 600, color: "#374151", fontSize: 10 }}>{titleInfo.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 60, height: 3, borderRadius: 2, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: titleInfo.color, width: `${progress}%`, transition: "width .3s ease" }} />
          </div>
          <span style={{ fontSize: 8, color: "#9ca3af", fontWeight: 500 }}>{xpInfo.current}/{xpInfo.needed}</span>
        </div>
      </div>
    </div>
  );
}

// Dark variant for dark-themed modes
function LevelBadgeDark({ stats, style }) {
  const xpInfo = getXpProgress(stats.xp || 0);
  const level = xpInfo.level;
  const titleInfo = getLevelTitle(level);
  const next = getNextTitle(level);
  const progress = xpInfo.pct;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(26,17,40,0.8)", backdropFilter: "blur(8px)",
      borderRadius: 10, padding: "4px 10px",
      border: `1.5px solid ${titleInfo.color}44`,
      fontSize: 11, fontFamily: "'Fredoka',sans-serif",
      ...style,
    }}>
      <span style={{ fontSize: 14 }}>{titleInfo.emoji}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: titleInfo.color, fontSize: 11 }}>Lv.{level}</span>
          <span style={{ fontWeight: 600, color: "#d1d5db", fontSize: 10 }}>{titleInfo.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 60, height: 3, borderRadius: 2, background: "#2a1f3a", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: titleInfo.color, width: `${progress}%`, transition: "width .3s ease" }} />
          </div>
          <span style={{ fontSize: 8, color: "#6b7280", fontWeight: 500 }}>{xpInfo.current}/{xpInfo.needed}</span>
        </div>
      </div>
    </div>
  );
}


// ═══ STAFF HINT OVERLAY ═══
function StaffHint({ clef, onClose }) {
  const isTreble = clef === "treble";
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1001,
      fontFamily: "'Fredoka',sans-serif",
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 24, padding: "24px 28px", maxWidth: 380, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", textAlign: "center",
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ color: "#5b21b6", margin: "0 0 16px", fontSize: 20 }}>
          {isTreble ? "𝄞 Treble Clef" : "𝄢 Bass Clef"} Notes
        </h3>

        {/* Staff diagram */}
        <svg width="320" height="160" viewBox="0 0 320 160" style={{ marginBottom: 12 }}>
          {/* Staff lines */}
          {[0,1,2,3,4].map(i => (
            <line key={i} x1="10" y1={40 + i * 16} x2="310" y2={40 + i * 16} stroke="#8d7e72" strokeWidth="1.2" />
          ))}

          {isTreble ? (
            <>
              {/* Treble clef symbol */}
              <text x="22" y={40 + 3.2 * 16} fontSize="60" fill="#5a4a3a" fontFamily="'Noto Music','Segoe UI Symbol',serif" textAnchor="middle">𝄞</text>

              {/* Lines: E G B D F */}
              {[
                { note: "E", y: 40 + 4 * 16, color: "#ef4444" },
                { note: "G", y: 40 + 3 * 16, color: "#f97316" },
                { note: "B", y: 40 + 2 * 16, color: "#eab308" },
                { note: "D", y: 40 + 1 * 16, color: "#22c55e" },
                { note: "F", y: 40 + 0 * 16, color: "#3b82f6" },
              ].map(({ note, y, color }) => (
                <g key={note}>
                  <circle cx={60 + "EGBDF".indexOf(note) * 55} cy={y} rx="8" ry="6" fill={color} />
                  <text x={60 + "EGBDF".indexOf(note) * 55} y={y + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
                </g>
              ))}

              {/* Spaces: F A C E */}
              {[
                { note: "F", y: 40 + 3.5 * 16, color: "#8b5cf6" },
                { note: "A", y: 40 + 2.5 * 16, color: "#ec4899" },
                { note: "C", y: 40 + 1.5 * 16, color: "#06b6d4" },
                { note: "E", y: 40 + 0.5 * 16, color: "#10b981" },
              ].map(({ note, y, color }, i) => (
                <g key={note + i}>
                  <circle cx={80 + i * 55} cy={y} rx="8" ry="6" fill={color} opacity="0.85" />
                  <text x={80 + i * 55} y={y + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
                </g>
              ))}
            </>
          ) : (
            <>
              {/* Bass clef symbol */}
              <text x="22" y={40 + 2.8 * 16} fontSize="50" fill="#5a4a3a" fontFamily="'Noto Music','Segoe UI Symbol',serif" textAnchor="middle">𝄢</text>

              {/* Lines: G B D F A */}
              {[
                { note: "G", y: 40 + 4 * 16, color: "#ef4444" },
                { note: "B", y: 40 + 3 * 16, color: "#f97316" },
                { note: "D", y: 40 + 2 * 16, color: "#eab308" },
                { note: "F", y: 40 + 1 * 16, color: "#22c55e" },
                { note: "A", y: 40 + 0 * 16, color: "#3b82f6" },
              ].map(({ note, y, color }, i) => (
                <g key={note}>
                  <circle cx={60 + i * 55} cy={y} rx="8" ry="6" fill={color} />
                  <text x={60 + i * 55} y={y + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
                </g>
              ))}

              {/* Spaces: A C E G */}
              {[
                { note: "A", y: 40 + 3.5 * 16, color: "#8b5cf6" },
                { note: "C", y: 40 + 2.5 * 16, color: "#ec4899" },
                { note: "E", y: 40 + 1.5 * 16, color: "#06b6d4" },
                { note: "G", y: 40 + 0.5 * 16, color: "#10b981" },
              ].map(({ note, y, color }, i) => (
                <g key={note + i}>
                  <circle cx={80 + i * 55} cy={y} rx="8" ry="6" fill={color} opacity="0.85" />
                  <text x={80 + i * 55} y={y + 4.5} textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Fredoka',sans-serif">{note}</text>
                </g>
              ))}
            </>
          )}
        </svg>

        {/* Mnemonics */}
        <div style={{ background: "#f5f3ff", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>
            📏 Lines {isTreble ? "(bottom to top)" : "(bottom to top)"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            {isTreble
              ? <>
                  <span style={{ color: "#ef4444" }}>E</span>very{" "}
                  <span style={{ color: "#f97316" }}>G</span>ood{" "}
                  <span style={{ color: "#eab308" }}>B</span>urger{" "}
                  <span style={{ color: "#22c55e" }}>D</span>eserves{" "}
                  <span style={{ color: "#3b82f6" }}>F</span>ries
                </>
              : <>
                  <span style={{ color: "#ef4444" }}>G</span>ood{" "}
                  <span style={{ color: "#f97316" }}>B</span>ears{" "}
                  <span style={{ color: "#eab308" }}>D</span>o{" "}
                  <span style={{ color: "#22c55e" }}>F</span>ind{" "}
                  <span style={{ color: "#3b82f6" }}>A</span>pples
                </>
            }
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6", marginBottom: 6 }}>
            📐 Spaces {isTreble ? "(bottom to top)" : "(bottom to top)"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>
            {isTreble
              ? <>
                  <span style={{ color: "#8b5cf6" }}>F</span>{" "}
                  <span style={{ color: "#ec4899" }}>A</span>{" "}
                  <span style={{ color: "#06b6d4" }}>C</span>{" "}
                  <span style={{ color: "#10b981" }}>E</span>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}> — it spells FACE!</span>
                </>
              : <>
                  <span style={{ color: "#8b5cf6" }}>A</span>ll{" "}
                  <span style={{ color: "#ec4899" }}>C</span>ows{" "}
                  <span style={{ color: "#06b6d4" }}>E</span>at{" "}
                  <span style={{ color: "#10b981" }}>G</span>rass
                </>
            }
          </div>
        </div>

        <button onClick={onClose} style={{
          width: "100%", padding: 10, borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white",
          fontSize: 15, fontWeight: 600, fontFamily: "'Fredoka',sans-serif", cursor: "pointer",
        }}>Got it!</button>
      </div>
    </div>
  );
}

// ═══ POWERUP BUTTON ═══
function PowerupBtn({ powerup, count, score, onBuy, onUse, disabled }) {
  const [hovered, setHovered] = useState(false);
  const canBuy = score >= powerup.cost;
  const hasOne = count > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && !disabled && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
          background: "#1f2937", color: "#fff", fontSize: 11, fontWeight: 500, fontFamily: "'Fredoka',sans-serif",
          padding: "5px 9px", borderRadius: 8, whiteSpace: "nowrap", zIndex: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,.25)", pointerEvents: "none",
        }}>
          {powerup.desc}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid #1f2937",
          }} />
        </div>
      )}
      <button
        onClick={() => { if (hasOne && !disabled) onUse(powerup.id); else if (canBuy && !disabled) onBuy(powerup.id); }}
        disabled={disabled || (!hasOne && !canBuy)}
        style={{
          width: 50, height: 50, borderRadius: 12, position: "relative",
          border: hasOne ? "2.5px solid #f59e0b" : canBuy ? "2.5px solid #7c3aed44" : "2.5px solid #e5e7eb",
          background: hasOne ? "linear-gradient(135deg,#fffbeb,#fef3c7)" : canBuy ? "linear-gradient(135deg,#f5f3ff,#ede9fe)" : "#f9fafb",
          cursor: disabled || (!hasOne && !canBuy) ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : (!hasOne && !canBuy) ? 0.35 : 1,
          transform: hovered && !disabled && (hasOne || canBuy) ? "scale(1.1)" : "scale(1)",
          transition: "all .15s ease", fontSize: 22, lineHeight: 1,
        }}>
        {powerup.icon}
        {hasOne && <span style={{
          position: "absolute", top: -6, right: -6, background: "#f59e0b", color: "white",
          borderRadius: "50%", width: 18, height: 18, fontSize: 11, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Fredoka',sans-serif"
        }}>{count}</span>}
      </button>
      <div style={{ fontSize: 9, color: hasOne ? "#f59e0b" : "#9ca3af", fontWeight: 600, fontFamily: "'Fredoka',sans-serif", textAlign: "center" }}>
        {hasOne ? "Use" : `⭐${powerup.cost}`}
      </div>
    </div>
  );
}

// ═══ STATS PANEL ═══
function StatsPanel({ stats, onClose, fontFamily }) {
  const accuracy = stats.totalGuesses > 0 ? Math.round((stats.correctGuesses / stats.totalGuesses) * 100) : 0;
  const noteAccuracy = {};
  "ABCDEFG".split("").forEach(n => {
    const total = stats.noteAttempts?.[n] || 0;
    const correct = stats.noteCorrect?.[n] || 0;
    noteAccuracy[n] = total > 0 ? Math.round((correct / total) * 100) : null;
  });
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily
    }}>
      <div style={{
        background: "white", borderRadius: 24, padding: "28px 32px", maxWidth: 400, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)"
      }}>
        <h2 style={{ color: "#5b21b6", textAlign: "center", margin: "0 0 18px", fontSize: 22 }}>📊 Your Stats</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Words Done", value: stats.wordsCompleted || 0 },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Best Note Streak", value: `${stats.bestStreak || 0} 🔥` },
            { label: "Total XP", value: `${stats.xp || 0} ✨` },
            { label: "Butterflies", value: `🦋 ${stats.butterflies || 0}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#f5f3ff", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#5b21b6" }}>{value}</div>
              <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Note Accuracy</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {"ABCDEFG".split("").map(n => {
              const pct = noteAccuracy[n];
              const bg = pct === null ? "#f3f4f6" : pct >= 80 ? "#dcfce7" : pct >= 50 ? "#fef9c3" : "#fef2f2";
              const color = pct === null ? "#d1d5db" : pct >= 80 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
              return (
                <div key={n} style={{ width: 40, textAlign: "center", background: bg, borderRadius: 8, padding: "6px 2px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{n}</div>
                  <div style={{ fontSize: 10, color, fontWeight: 500 }}>{pct !== null ? `${pct}%` : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: "100%", padding: 10, borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white",
          fontSize: 15, fontWeight: 600, fontFamily, cursor: "pointer"
        }}>Close</button>
      </div>
    </div>
  );
}

// ═══ REDUCER ═══
function pickWord(words, usedList) {
  const pool = words.filter(w => !usedList.includes(w.w));
  const source = pool.length ? pool : words;
  return source[Math.floor(Math.random() * source.length)];
}
function getSlots(word) {
  const si = [];
  word.w.split("").forEach((ch, i) => { if (MUSIC_NOTES.has(ch)) si.push(i); });
  return si;
}

const INIT_POWERUPS = { reveal: 0, double: 0, shield: 0 };

// Streak milestone tiers: 10=butterfly(existing), 25=fire, 50=star, 100=legendary, then every 50=diamond
function getStreakMilestone(streak) {
  if (streak === 25) return { tier: "fire", streak, emoji: "🔥", title: "ON FIRE!", color: "#f97316" };
  if (streak === 50) return { tier: "star", streak, emoji: "⭐", title: "SUPERSTAR!", color: "#eab308" };
  if (streak === 100) return { tier: "legendary", streak, emoji: "🌈", title: "LEGENDARY!", color: "#a855f7" };
  if (streak > 100 && streak % 50 === 0) return { tier: "diamond", streak, emoji: "💎", title: "DIAMOND!", color: "#06b6d4" };
  return null;
}

const INITIAL_STATE = {
  phase: "menu", clef: null,
  word: null, slots: [], slotIndex: 0, guessed: {}, highlights: {},
  streak: 0, score: 0, stageIndex: 0,
  isButterfly: false, showConfetti: false,
  streakMilestone: null, // { tier: "fire"|"star"|"legendary"|"diamond", streak: N }
  message: "", usedWords: [], isDone: false, wrongCount: 0, slotWrongCount: 0,
  completed: 0, unlockedStages: [0], popup: null,
  // Arcade
  arcadeScore: 0, arcadeOver: false, arcadeClef: null,
  arcadeWordDone: false, // for holding on last note
  showLeaderboard: false, enteringName: false, arcadeInitials: "",
  arcadePool: null, arcadePractice: false,
  // Transition
  transitioning: false,
  // Powerups
  powerups: { ...INIT_POWERUPS },
  doubleActive: false, // 2x active for current word
  shieldActive: false, // shield active for current word
  // Stats
  stats: {
    wordsCompleted: 0, correctGuesses: 0, totalGuesses: 0,
    bestStreak: 0, butterflies: 0, xp: 0, noteAttempts: {}, noteCorrect: {},
  },
  showStats: false,
  // Story mode
  storyChapter: 0,
  storyComplete: false,
  storyWordDone: false,
  // Streak LB
  showStreakLB: false,
  streakLBEntering: false,
  streakInitials: "",
  lastBigStreak: 0,
  // Song mode
  songIndex: 0,
  songNoteIndex: 0,
  songNotes: null,
  songDone: false,
  songCorrect: 0,
  songNoteWrongCount: 0,
  // Weak notes practice
  weakNotes: null, // array of weak note letters
  weakScore: 0,
  weakTotal: 0,
  // Scramble mode
  scrambleWord: null,        // the word object {w, h}
  scrambleNotes: null,       // shuffled array of note letters
  scrambleOrigOrder: null,   // original indices for display
  scrambleGuessed: {},       // { slotIndex: noteLetter }
  scrambleHL: {},            // { slotIndex: "correct"|"wrong"|"reveal" }
  scrambleSlotIndex: 0,      // which slot (word position) to fill next
  scrambleDone: false,
  scrambleScore: 0,
  scrambleTotal: 0,
  scrambleWrongCount: 0,     // per-slot wrong count (resets each slot)
  scrambleHintsUsed: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case "START": {
      // Start at the player's highest unlocked stage (or the one they were last on)
      const startStage = Math.min(state.stageIndex, STAGES.length - 1);
      const word = pickWord(STAGES[startStage].words, []);
      return {
        ...INITIAL_STATE,
        phase: "game", clef: action.clef, unlockedStages: state.unlockedStages,
        stageIndex: startStage, score: state.score,
        word, slots: getSlots(word), message: `Hint: "${word.h}"`,
        stats: state.stats, powerups: state.powerups,
      };
    }
    case "MENU":
      return { ...INITIAL_STATE, unlockedStages: state.unlockedStages, stageIndex: state.stageIndex, score: state.score, stats: state.stats, powerups: state.powerups };

    case "LOAD_STATS":
      return { ...state, stats: action.stats };

    case "LOAD_POWERUPS":
      return { ...state, powerups: { ...INIT_POWERUPS, ...action.powerups } };

    case "LOAD_PROGRESS": {
      // Restore unlocked stages, last stage index, and score
      const unlocked = (action.unlockedStages || [0]).filter(i => i < STAGES.length);
      if (unlocked.length === 0) unlocked.push(0);
      const stageIdx = Math.min(action.stageIndex ?? 0, STAGES.length - 1);
      const savedScore = action.score ?? 0;
      return { ...state, unlockedStages: unlocked, stageIndex: stageIdx, score: savedScore };
    }

    // ═══ POWERUP ACTIONS ═══
    case "BUY_POWERUP": {
      const pu = POWERUPS[action.id];
      if (!pu || state.score < pu.cost) return state;
      return {
        ...state,
        score: state.score - pu.cost,
        powerups: { ...state.powerups, [action.id]: (state.powerups[action.id] || 0) + 1 },
        message: `Bought ${pu.icon} ${pu.name}!`,
      };
    }
    case "USE_REVEAL": {
      if (!state.powerups.reveal || state.isDone || !state.word || !state.slots.length) return state;
      const targetIdx = state.slots[state.slotIndex];
      const expected = state.word.w[targetIdx];
      return {
        ...state,
        powerups: { ...state.powerups, reveal: state.powerups.reveal - 1 },
        highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
        message: `${POWERUPS.reveal.icon} That note is ${expected}!`,
      };
    }
    case "USE_DOUBLE": {
      if (!state.powerups.double || state.isDone) return state;
      return {
        ...state,
        powerups: { ...state.powerups, double: state.powerups.double - 1 },
        doubleActive: true,
        message: `${POWERUPS.double.icon} 2× points on this word!`,
      };
    }
    case "USE_SHIELD": {
      if (!state.powerups.shield || state.isDone) return state;
      return {
        ...state,
        powerups: { ...state.powerups, shield: state.powerups.shield - 1 },
        shieldActive: true,
        message: `${POWERUPS.shield.icon} Streak protected!`,
      };
    }

    case "PICK": {
      if (state.isDone || !state.word || !state.slots.length) return state;
      const targetIdx = state.slots[state.slotIndex];
      const expected = state.word.w[targetIdx];
      const newStats = { ...state.stats };
      newStats.totalGuesses = (newStats.totalGuesses || 0) + 1;
      newStats.noteAttempts = { ...newStats.noteAttempts };
      newStats.noteAttempts[expected] = (newStats.noteAttempts[expected] || 0) + 1;

      if (action.note !== expected) {
        const newSlotWrongs = state.slotWrongCount + 1;
        const loseStreak = !state.shieldActive;
        const newShield = false; // shield consumed on wrong
        const newStreak = loseStreak ? 0 : state.streak;
        if (newSlotWrongs >= 3) {
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
            wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
            streak: newStreak, shieldActive: newShield,
            message: state.shieldActive ? `🛡️ Shield! That note is ${expected}!` : `That note is ${expected}! Remember it!`,
            stats: newStats,
          };
        }
        return {
          ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
          wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
          streak: newStreak, shieldActive: newShield,
          message: state.shieldActive
            ? `🛡️ Shield absorbed it! (${3 - newSlotWrongs} tries left)`
            : `Not quite — try again! (${3 - newSlotWrongs} tries left)`,
          stats: newStats,
        };
      }

      // Correct note!
      const newStreak = state.streak + 1;
      newStats.correctGuesses = (newStats.correctGuesses || 0) + 1;
      newStats.noteCorrect = { ...newStats.noteCorrect };
      newStats.noteCorrect[expected] = (newStats.noteCorrect[expected] || 0) + 1;
      if (newStreak > (newStats.bestStreak || 0)) newStats.bestStreak = newStreak;
      const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };

      // Streak XP bonus per correct note (beyond streak of 5)
      if (newStreak > 5) newStats.xp = (newStats.xp || 0) + 2;

      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0, streak: newStreak, stats: newStats };
      }

      // Word complete
      const stage = STAGES[state.stageIndex];
      let pts = stage.pts;
      const butterfly = newStreak > 0 && newStreak % 10 === 0; // butterfly every 10 correct notes
      if (butterfly) pts += 10;
      if (state.doubleActive) pts *= 2;

      // Check for streak milestones (25, 50, 100, every 50 after)
      const milestone = getStreakMilestone(newStreak);
      if (milestone) pts += milestone.streak; // bonus points = streak count

      newStats.wordsCompleted = (newStats.wordsCompleted || 0) + 1;
      if (butterfly) newStats.butterflies = (newStats.butterflies || 0) + 1;

      // Award XP
      const xpGain = calcXpAward(true, newStreak, butterfly, milestone);
      newStats.xp = (newStats.xp || 0) + xpGain;
      const oldLevel = getPlayerLevel((state.stats.xp || 0));
      const newLevel = getPlayerLevel(newStats.xp);
      const leveledUp = newLevel > oldLevel;

      const levelUpStr = leveledUp ? ` 🆙 Level ${newLevel}!` : "";
      const milestoneMsg = milestone
        ? `${milestone.emoji} ${milestone.title} ${newStreak} notes! +${pts}!${levelUpStr}`
        : butterfly
          ? `🦋 BUTTERFLY! ${newStreak} notes! +${pts}!${levelUpStr}`
          : `🎵 "${state.word.w}" — +${pts}! (${newStreak}🔥)${levelUpStr}`;

      return {
        ...state, guessed: newGuessed, highlights: newHL, isDone: true, streak: newStreak,
        score: state.score + pts, completed: state.completed + 1,
        isButterfly: butterfly, showConfetti: butterfly || !!milestone, slotWrongCount: 0,
        streakMilestone: milestone,
        doubleActive: false, shieldActive: false,
        message: milestoneMsg,
        stats: newStats,
      };
    }

    case "ADVANCE_AFTER_REVEAL": {
      const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
      }
      const newStats = { ...state.stats, wordsCompleted: (state.stats.wordsCompleted || 0) + 1 };
      newStats.xp = (newStats.xp || 0) + 5; // partial XP for reveal-assisted word
      return {
        ...state, guessed: newGuessed, highlights: newHL, isDone: true, streak: 0,
        score: state.score + 1, completed: state.completed + 1, slotWrongCount: 0,
        doubleActive: false, shieldActive: false,
        message: `"${state.word.w}" — Keep practicing!`, stats: newStats,
      };
    }

    case "CLEAR_WRONG": {
      const newHL = { ...state.highlights };
      delete newHL[action.index];
      return { ...state, highlights: newHL };
    }

    case "NEXT": {
      const stageIdx = action.stageIndex ?? state.stageIndex;
      const stage = STAGES[stageIdx];
      const newUsed = [...state.usedWords, state.word?.w].filter(Boolean);
      const word = pickWord(stage.words, newUsed);
      return {
        ...state, word, slots: getSlots(word), slotIndex: 0, guessed: {}, highlights: {},
        isDone: false, wrongCount: 0, slotWrongCount: 0,
        message: `Hint: "${word.h}"`, usedWords: newUsed,
        isButterfly: false, showConfetti: false, streakMilestone: null, doubleActive: false, shieldActive: false,
        streak: action.resetStreak ? 0 : state.streak,
        stageIndex: stageIdx, popup: null, transitioning: false,
      };
    }

    case "SKIP": return reducer(state, { type: "NEXT", resetStreak: true });

    case "UNLOCK":
      return { ...state, unlockedStages: [...state.unlockedStages, action.index], stageIndex: action.index, popup: STAGES[action.index] };

    case "DISMISS": {
      const stage = STAGES[state.stageIndex];
      const word = pickWord(stage.words, []);
      return {
        ...state, popup: null, word, slots: getSlots(word), slotIndex: 0,
        guessed: {}, highlights: {}, isDone: false, wrongCount: 0, slotWrongCount: 0,
        message: `Hint: "${word.h}"`, usedWords: [],
        isButterfly: false, showConfetti: false, streakMilestone: null,
      };
    }

    case "SWITCH": {
      const stage = STAGES[action.index];
      const word = pickWord(stage.words, []);
      return {
        ...state, stageIndex: action.index, word, slots: getSlots(word), slotIndex: 0,
        guessed: {}, highlights: {}, isDone: false, wrongCount: 0, slotWrongCount: 0,
        message: `Hint: "${word.h}"`, usedWords: [],
      };
    }

    case "RESET_BFLY": return { ...state, isButterfly: false, showConfetti: false, streakMilestone: null };
    case "TRANSITION": return { ...state, transitioning: true };
    case "SHOW_STATS": return { ...state, showStats: true };
    case "HIDE_STATS": return { ...state, showStats: false };

    // ═══ ARCADE ═══
    case "ARCADE_START": {
      const word = pickWord(action.pool || ARCADE_WORDS, []);
      return {
        ...INITIAL_STATE,
        phase: "arcade", clef: action.clef, arcadeClef: action.clef,
        unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
        word, slots: getSlots(word), message: "Name the notes!",
        arcadeScore: 0, arcadeOver: false, arcadeWordDone: false,
        arcadePool: action.pool || null, arcadePractice: action.practice || false,
      };
    }

    case "ARCADE_PICK": {
      if (state.isDone || state.arcadeOver || state.arcadeWordDone || !state.word || !state.slots.length) return state;
      const targetIdx = state.slots[state.slotIndex];
      const expected = state.word.w[targetIdx];

      if (action.note !== expected) {
        return { ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" }, message: "Try again!" };
      }

      const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      const newScore = state.arcadeScore + 1;

      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, arcadeScore: newScore };
      }

      // Word complete — hold briefly so last note sound plays
      return {
        ...state, guessed: newGuessed, highlights: newHL, arcadeScore: newScore,
        arcadeWordDone: true, message: `🎵 "${state.word.w}"!`,
      };
    }

    case "ARCADE_ADVANCE": {
      // Called after brief hold on word completion
      const pool = state.arcadePool || ARCADE_WORDS;
      const newUsed = [...state.usedWords, state.word.w];
      const word = pickWord(pool, newUsed);
      return {
        ...state, guessed: {}, highlights: {}, slotIndex: 0,
        word, slots: getSlots(word), message: "Name the notes!",
        usedWords: newUsed, isDone: false, arcadeWordDone: false,
      };
    }

    case "ARCADE_CLEAR": {
      const newHL = { ...state.highlights };
      delete newHL[action.index];
      return { ...state, highlights: newHL };
    }

    case "ARCADE_END":
      return { ...state, arcadeOver: true, enteringName: !state.arcadePractice, arcadeInitials: "" };

    case "SET_INIT": return { ...state, arcadeInitials: action.value.toUpperCase().slice(0, 3) };
    case "SUBMIT": return { ...state, enteringName: false, showLeaderboard: true };
    case "SHOW_LB": return { ...state, showLeaderboard: true };
    case "HIDE_LB": return { ...state, showLeaderboard: false };

    // ═══ STREAK LEADERBOARD ═══
    case "SHOW_STREAK_LB": return { ...state, showStreakLB: true };
    case "HIDE_STREAK_LB": return { ...state, showStreakLB: false, streakLBEntering: false };
    case "STREAK_LB_ENTER": return { ...state, streakLBEntering: true, streakInitials: "", lastBigStreak: action.streak };
    case "SET_STREAK_INIT": return { ...state, streakInitials: action.value.toUpperCase().slice(0, 3) };
    case "SUBMIT_STREAK": return { ...state, streakLBEntering: false, showStreakLB: true };

    // ═══ STORY MODE ═══
    case "STORY_START": {
      const ch = STORY_CHAPTERS[0];
      const word = ch.word;
      return {
        ...INITIAL_STATE,
        phase: "story", clef: action.clef,
        unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
        word, slots: getSlots(word), message: `Hint: "${word.h}"`,
        storyChapter: 0, storyComplete: false, storyWordDone: false,
      };
    }
    case "STORY_PICK": {
      if (state.storyWordDone || !state.word || !state.slots.length) return state;
      const targetIdx = state.slots[state.slotIndex];
      const expected = state.word.w[targetIdx];
      if (action.note !== expected) {
        const newSlotWrongs = state.slotWrongCount + 1;
        if (newSlotWrongs >= 3) {
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
            wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
            message: `That note is ${expected}! Remember it!`,
          };
        }
        return {
          ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
          wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
          message: `Not quite — try again! (${3 - newSlotWrongs} tries left)`,
        };
      }
      // Correct
      const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
      }
      // Word done!
      return { ...state, guessed: newGuessed, highlights: newHL, storyWordDone: true, message: "✨ Spell complete!" };
    }
    case "STORY_ADVANCE_REVEAL": {
      const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
      }
      return { ...state, guessed: newGuessed, highlights: newHL, storyWordDone: true, message: "✨ Spell complete!" };
    }
    case "STORY_NEXT": {
      const nextCh = state.storyChapter + 1;
      if (nextCh >= STORY_CHAPTERS.length) {
        return { ...state, storyComplete: true };
      }
      const ch = STORY_CHAPTERS[nextCh];
      const word = ch.word;
      return {
        ...state, storyChapter: nextCh, word, slots: getSlots(word), slotIndex: 0,
        guessed: {}, highlights: {}, storyWordDone: false, wrongCount: 0, slotWrongCount: 0,
        message: `Hint: "${word.h}"`,
      };
    }
    case "STORY_CLEAR": {
      const newHL = { ...state.highlights };
      delete newHL[action.index];
      return { ...state, highlights: newHL };
    }

    // ═══ SONG MODE ═══
    case "SONG_START": {
      const idx = Math.floor(Math.random() * SONGS.length);
      const song = SONGS[idx];
      return {
        ...INITIAL_STATE,
        phase: "song", clef: action.clef,
        unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
        songIndex: idx, songNoteIndex: 0, songNotes: song.notes,
        songDone: false, songCorrect: 0, songNoteWrongCount: 0,
        message: `🎵 ${song.title} — Name each note!`,
      };
    }
    case "SONG_SELECT": {
      const song = SONGS[action.index];
      return {
        ...state,
        songIndex: action.index, songNoteIndex: 0, songNotes: song.notes,
        highlights: {}, songDone: false, songCorrect: 0, songNoteWrongCount: 0,
        message: `🎵 ${song.title} — Name each note!`,
      };
    }
    case "SONG_PICK": {
      if (state.songDone || !state.songNotes) return state;
      const raw = state.songNotes[state.songNoteIndex];
      const expected = raw.charAt(0); // strip octave number for comparison
      if (action.note !== expected) {
        const newSongWrongs = state.songNoteWrongCount + 1;
        if (newSongWrongs >= 3) {
          // Reveal the note after 3 wrong attempts, then auto-advance
          const revealHL = { ...state.highlights, [state.songNoteIndex]: "reveal" };
          if (state.songNoteIndex + 1 >= state.songNotes.length) {
            return { ...state, highlights: revealHL, songDone: true, songCorrect: state.songCorrect, songNoteWrongCount: 0, message: "🎉 Song complete!" };
          }
          return { ...state, highlights: revealHL, songNoteIndex: state.songNoteIndex + 1, songNoteWrongCount: 0, message: `That note is ${expected}! Remember it!` };
        }
        return { ...state, highlights: { ...state.highlights, [state.songNoteIndex]: "wrong" }, songNoteWrongCount: newSongWrongs, message: `Not quite — try again! (${3 - newSongWrongs} tries left)` };
      }
      const newHL = { ...state.highlights, [state.songNoteIndex]: "correct" };
      const newCorrect = state.songCorrect + 1;
      if (state.songNoteIndex + 1 >= state.songNotes.length) {
        return { ...state, highlights: newHL, songDone: true, songCorrect: newCorrect, songNoteWrongCount: 0, message: "🎉 Song complete! Beautiful!" };
      }
      return { ...state, highlights: newHL, songNoteIndex: state.songNoteIndex + 1, songCorrect: newCorrect, songNoteWrongCount: 0 };
    }
    case "SONG_CLEAR": {
      const newHL = { ...state.highlights };
      delete newHL[action.index];
      return { ...state, highlights: newHL };
    }

    // ═══ WEAK NOTES PRACTICE ═══
    case "WEAK_START": {
      const weakNotes = getWeakNotesList(state.stats);
      const word = pickWeakWord(weakNotes, []);
      return {
        ...INITIAL_STATE, phase: "weak", clef: action.clef,
        unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
        weakNotes, word, slots: getSlots(word), slotIndex: 0,
        guessed: {}, highlights: {}, weakScore: 0, weakTotal: 0,
        message: `Focus on: ${weakNotes.join(", ")}`,
      };
    }
    case "WEAK_PICK": {
      if (state.isDone || !state.word || !state.slots.length) return state;
      const targetIdx = state.slots[state.slotIndex];
      const expected = state.word.w[targetIdx];
      const newStats = { ...state.stats };
      newStats.totalGuesses = (newStats.totalGuesses || 0) + 1;
      newStats.noteAttempts = { ...newStats.noteAttempts };
      newStats.noteAttempts[expected] = (newStats.noteAttempts[expected] || 0) + 1;
      const newWeakTotal = state.weakTotal + 1;

      if (action.note !== expected) {
        const newSlotWrongs = state.slotWrongCount + 1;
        if (newSlotWrongs >= 3) {
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
            slotWrongCount: newSlotWrongs, weakTotal: newWeakTotal,
            message: `That note is ${expected} — study it!`, stats: newStats,
          };
        }
        return {
          ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
          slotWrongCount: newSlotWrongs, weakTotal: newWeakTotal,
          message: `Not quite — try again! (${3 - newSlotWrongs} left)`, stats: newStats,
        };
      }
      // Correct
      newStats.correctGuesses = (newStats.correctGuesses || 0) + 1;
      newStats.noteCorrect = { ...newStats.noteCorrect };
      newStats.noteCorrect[expected] = (newStats.noteCorrect[expected] || 0) + 1;
      const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      const newWeakScore = state.weakScore + 1;

      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0, weakScore: newWeakScore, weakTotal: newWeakTotal, stats: newStats };
      }
      // Word done
      newStats.wordsCompleted = (newStats.wordsCompleted || 0) + 1;
      newStats.xp = (newStats.xp || 0) + 10; // XP for weak notes word
      return {
        ...state, guessed: newGuessed, highlights: newHL, isDone: true, slotWrongCount: 0,
        weakScore: newWeakScore, weakTotal: newWeakTotal, stats: newStats,
        message: `✨ "${state.word.w}" complete! ${newWeakScore}/${newWeakTotal} correct`,
      };
    }
    case "WEAK_NEXT": {
      const word = pickWeakWord(state.weakNotes, [...state.usedWords, state.word?.w].filter(Boolean));
      return {
        ...state, word, slots: getSlots(word), slotIndex: 0,
        guessed: {}, highlights: {}, isDone: false, slotWrongCount: 0,
        usedWords: [...state.usedWords, state.word?.w].filter(Boolean),
        message: `Focus on: ${state.weakNotes.join(", ")}`,
      };
    }
    case "WEAK_ADVANCE_REVEAL": {
      const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
      const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
      if (state.slotIndex + 1 < state.slots.length) {
        return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
      }
      return { ...state, guessed: newGuessed, highlights: newHL, isDone: true, slotWrongCount: 0, message: `"${state.word.w}" — Keep practicing!` };
    }
    case "WEAK_CLEAR": {
      const newHL = { ...state.highlights };
      delete newHL[action.index];
      return { ...state, highlights: newHL };
    }

    // ═══ SCRAMBLE MODE ═══
    case "SCRAMBLE_START": {
      const word = pickScrambleWord([]);
      const scrambled = makeScramble(word);
      return {
        ...INITIAL_STATE,
        phase: "scramble", clef: action.clef,
        unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
        score: state.score,
        scrambleWord: word,
        scrambleNotes: scrambled,
        scrambleGuessed: {},
        scrambleHL: {},
        scrambleSlotIndex: 0,
        scrambleDone: false,
        scrambleScore: 0,
        scrambleTotal: 0,
        scrambleWrongCount: 0,
        scrambleHintsUsed: 0,
        message: `🔀 Unscramble! Hint: "${word.h}"`,
      };
    }
    case "SCRAMBLE_PICK": {
      if (state.scrambleDone || !state.scrambleWord) return state;
      const expected = state.scrambleWord.w[state.scrambleSlotIndex];
      
      if (action.note !== expected) {
        const newWrongs = state.scrambleWrongCount + 1;
        if (newWrongs >= 3) {
          // Reveal this slot and auto-advance
          const revealHL = { ...state.scrambleHL, [state.scrambleSlotIndex]: "reveal" };
          const revealGuessed = { ...state.scrambleGuessed, [state.scrambleSlotIndex]: expected };
          const nextIdx = state.scrambleSlotIndex + 1;
          if (nextIdx >= state.scrambleWord.w.length) {
            return { ...state, scrambleHL: revealHL, scrambleGuessed: revealGuessed, scrambleDone: true, scrambleWrongCount: 0, scrambleTotal: state.scrambleTotal + 1, message: `That was "${state.scrambleWord.w}"! Keep practicing!` };
          }
          return { ...state, scrambleHL: revealHL, scrambleGuessed: revealGuessed, scrambleSlotIndex: nextIdx, scrambleWrongCount: 0, scrambleTotal: state.scrambleTotal + 1, message: `That letter is ${expected}! (${nextIdx + 1}/${state.scrambleWord.w.length})` };
        }
        return { ...state, scrambleHL: { ...state.scrambleHL, [state.scrambleSlotIndex]: "wrong" }, scrambleWrongCount: newWrongs, message: `Not quite — try again! (${3 - newWrongs} tries left)` };
      }
      
      // Correct!
      const newGuessed = { ...state.scrambleGuessed, [state.scrambleSlotIndex]: action.note };
      const newHL = { ...state.scrambleHL, [state.scrambleSlotIndex]: "correct" };
      const newTotal = state.scrambleTotal + 1;
      const newScore = state.scrambleScore + 1;
      const nextIdx2 = state.scrambleSlotIndex + 1;
      
      if (nextIdx2 >= state.scrambleWord.w.length) {
        return { ...state, scrambleGuessed: newGuessed, scrambleHL: newHL, scrambleDone: true, scrambleWrongCount: 0, scrambleScore: newScore, scrambleTotal: newTotal, message: `🎉 "${state.scrambleWord.w}" — Great job!` };
      }
      return { ...state, scrambleGuessed: newGuessed, scrambleHL: newHL, scrambleSlotIndex: nextIdx2, scrambleWrongCount: 0, scrambleScore: newScore, scrambleTotal: newTotal };
    }
    case "SCRAMBLE_NEXT": {
      const newUsed = [...state.usedWords, state.scrambleWord?.w].filter(Boolean);
      const word = pickScrambleWord(newUsed);
      const scrambled = makeScramble(word);
      return {
        ...state,
        scrambleWord: word,
        scrambleNotes: scrambled,
        scrambleGuessed: {},
        scrambleHL: {},
        scrambleSlotIndex: 0,
        scrambleDone: false,
        scrambleWrongCount: 0,
        scrambleHintsUsed: 0,
        usedWords: newUsed,
        message: `🔀 Unscramble! Hint: "${word.h}"`,
      };
    }
    case "SCRAMBLE_CLEAR": {
      const newHL = { ...state.scrambleHL };
      delete newHL[action.index];
      return { ...state, scrambleHL: newHL };
    }

    default: return state;
  }
}

// ═══ LEADERBOARD ═══
let leaderboardData = [];
function addLBScore(ini, sc, clef) {
  leaderboardData.push({ initials: ini, score: sc, clef, date: Date.now() });
  leaderboardData.sort((a, b) => b.score - a.score);
  if (leaderboardData.length > 20) leaderboardData = leaderboardData.slice(0, 20);
}
function getLB() { return [...leaderboardData]; }
async function loadLB() { try { const r = await window.storage.get("notenamer-lb"); if (r?.value) leaderboardData = JSON.parse(r.value); } catch (e) {} }
async function saveLB() { try { await window.storage.set("notenamer-lb", JSON.stringify(leaderboardData), true); } catch (e) {} }
async function loadStats() { try { const r = await window.storage.get("notenamer-stats"); if (r?.value) return JSON.parse(r.value); } catch (e) {} return null; }
async function saveStats(s) { try { await window.storage.set("notenamer-stats", JSON.stringify(s)); } catch (e) {} }
async function loadPowerups() { try { const r = await window.storage.get("notenamer-pu"); if (r?.value) return JSON.parse(r.value); } catch (e) {} return null; }
async function savePowerups(p) { try { await window.storage.set("notenamer-pu", JSON.stringify(p)); } catch (e) {} }
async function loadProgress() { try { const r = await window.storage.get("notenamer-progress"); if (r?.value) return JSON.parse(r.value); } catch (e) {} return null; }
async function saveProgress(p) { try { await window.storage.set("notenamer-progress", JSON.stringify(p)); } catch (e) {} }

// ═══ STREAK LEADERBOARD ═══
let streakLBData = [];
function addStreakScore(ini, streak, clef) {
  streakLBData.push({ initials: ini, streak, clef, date: Date.now() });
  streakLBData.sort((a, b) => b.streak - a.streak);
  if (streakLBData.length > 20) streakLBData = streakLBData.slice(0, 20);
}
function getStreakLB() { return [...streakLBData]; }
async function loadStreakLB() { try { const r = await window.storage.get("notenamer-streaks"); if (r?.value) streakLBData = JSON.parse(r.value); } catch (e) {} }
async function saveStreakLB() { try { await window.storage.set("notenamer-streaks", JSON.stringify(streakLBData), true); } catch (e) {} }


// ═══ STORY MODE — 6-chapter fantasy adventure ═══
const STORY_CHAPTERS = [
  {
    id: 1,
    title: "The Enchanted Gate",
    narrative: "Deep in the Whispering Woods, you discover a moss-covered gate sealed with musical runes. To open it, you must name the notes that form the ancient password...",
    word: { w: "BADGE", h: "A crest on the gate" },
    bg: "#1a2e1a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0d1b2a"/><stop offset="100%" stopColor="#1b3a2a"/></linearGradient>
          <linearGradient id="gate1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b6914"/><stop offset="100%" stopColor="#5c4510"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky1)"/>
        {/* Stars */}
        {[40,90,140,200,260,310,70,170,250].map((x,i)=><circle key={i} cx={x} cy={10+i*8%60} r={1+i%2} fill="#fffbe6" opacity={0.5+i%3*0.2}/>)}
        {/* Trees */}
        <polygon points="30,200 50,80 70,200" fill="#0a3a1a" opacity=".8"/>
        <polygon points="290,200 310,90 330,200" fill="#0a3a1a" opacity=".8"/>
        <polygon points="10,200 35,100 60,200" fill="#0d4520" opacity=".6"/>
        <polygon points="300,200 325,95 350,200" fill="#0d4520" opacity=".6"/>
        {/* Ground */}
        <ellipse cx="180" cy="210" rx="200" ry="40" fill="#1a3a1a"/>
        {/* Gate */}
        <rect x="135" y="70" width="15" height="120" fill="url(#gate1)" rx="3"/>
        <rect x="210" y="70" width="15" height="120" fill="url(#gate1)" rx="3"/>
        <path d="M135 70 Q180 30 225 70" fill="none" stroke="#8b6914" strokeWidth="8"/>
        <path d="M140 70 Q180 35 220 70" fill="none" stroke="#d4a017" strokeWidth="3"/>
        {/* Runes on gate */}
        {["♪","♫","♩"].map((r,i)=><text key={i} x={165+i*15} y={120+i*12} fontSize="14" fill={done?"#4ade80":"#f59e0b"} textAnchor="middle" fontFamily="serif" opacity={done?1:0.6+Math.sin(i)*0.3}>{r}</text>)}
        {/* Glow when done */}
        {done && <ellipse cx="180" cy="110" rx="50" ry="60" fill="#4ade80" opacity=".15"/>}
        {/* Moss */}
        {[140,155,170,185,200,215].map((x,i)=><circle key={`m${i}`} cx={x} cy={188+i%3*2} r={3+i%2} fill="#2d5a2d" opacity=".7"/>)}
        {/* Fireflies */}
        <circle cx="100" cy="100" r="2" fill="#facc15" opacity=".8"><animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite"/></circle>
        <circle cx="260" cy="80" r="2" fill="#facc15" opacity=".6"><animate attributeName="opacity" values=".6;1;.6" dur="1.5s" repeatCount="indefinite"/></circle>
      </svg>
    ),
  },
  {
    id: 2,
    title: "The Dragon's Bridge",
    narrative: "Beyond the gate lies a canyon with a crumbling bridge. A young dragon guards it, demanding a toll — not gold, but a word spelled in music!",
    word: { w: "CAGE", h: "The dragon's old home" },
    bg: "#2a1a0a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a0a2e"/><stop offset="60%" stopColor="#4a1a0a"/><stop offset="100%" stopColor="#2a1a0a"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky2)"/>
        {/* Lava glow */}
        <ellipse cx="180" cy="195" rx="160" ry="15" fill="#ff4500" opacity=".3"/>
        <ellipse cx="180" cy="190" rx="120" ry="8" fill="#ff6b35" opacity=".2"/>
        {/* Canyon walls */}
        <polygon points="0,100 0,200 120,200 100,130" fill="#3a2010"/>
        <polygon points="360,100 360,200 240,200 260,130" fill="#3a2010"/>
        {/* Bridge */}
        <line x1="100" y1="130" x2="260" y2="130" stroke="#8b6914" strokeWidth="5"/>
        <line x1="100" y1="130" x2="100" y2="115" stroke="#6b5410" strokeWidth="3"/>
        <line x1="260" y1="130" x2="260" y2="115" stroke="#6b5410" strokeWidth="3"/>
        {[120,150,180,210,240].map((x,i)=><line key={i} x1={x} y1="130" x2={x} y2="115" stroke="#6b5410" strokeWidth="1.5" strokeDasharray="2 2"/>)}
        <path d="M100 115 Q180 105 260 115" fill="none" stroke="#8b6914" strokeWidth="2"/>
        {/* Dragon */}
        <ellipse cx="180" cy="95" rx="20" ry="14" fill={done?"#4ade80":"#dc2626"} opacity=".9"/>
        <circle cx="180" cy="78" r="10" fill={done?"#4ade80":"#dc2626"}/>
        <circle cx="176" cy="76" r="2.5" fill="#fffbe6"/><circle cx="184" cy="76" r="2.5" fill="#fffbe6"/>
        <circle cx="176.5" cy="76.5" r="1.2" fill="#1a1a2e"/><circle cx="184.5" cy="76.5" r="1.2" fill="#1a1a2e"/>
        {/* Wings */}
        <path d="M160 90 Q145 70 155 85" fill={done?"#22c55e":"#b91c1c"} opacity=".7"/>
        <path d="M200 90 Q215 70 205 85" fill={done?"#22c55e":"#b91c1c"} opacity=".7"/>
        {/* Fire breath (if not done) */}
        {!done && <><ellipse cx="180" cy="62" rx="6" ry="4" fill="#f59e0b" opacity=".7"><animate attributeName="ry" values="4;6;4" dur="0.5s" repeatCount="indefinite"/></ellipse>
        <ellipse cx="180" cy="55" rx="4" ry="3" fill="#fbbf24" opacity=".5"><animate attributeName="opacity" values=".3;.7;.3" dur="0.4s" repeatCount="indefinite"/></ellipse></>}
        {/* Happy puffs when done */}
        {done && <text x="180" y="60" textAnchor="middle" fontSize="16">💚</text>}
      </svg>
    ),
  },
  {
    id: 3,
    title: "The Crystal Cave",
    narrative: "Inside the mountain, crystals hum with ancient melodies. A sealed chamber blocks your path — its lock responds only to the language of music notes.",
    word: { w: "EDGE", h: "The crystal's sharp side" },
    bg: "#0a1a2e",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <rect width="360" height="200" fill="#0a0e1a"/>
        {/* Cave walls */}
        <path d="M0 0 L60 70 L20 200 L0 200Z" fill="#1a1e2e"/>
        <path d="M360 0 L300 70 L340 200 L360 200Z" fill="#1a1e2e"/>
        <path d="M0 0 L120 30 L180 0 L240 25 L360 0 L360 10 L0 10Z" fill="#1a1e2e"/>
        {/* Crystals */}
        {[{x:80,h:60,c:"#818cf8"},{x:130,h:45,c:"#c084fc"},{x:220,h:55,c:"#38bdf8"},{x:270,h:40,c:"#e879f9"},{x:160,h:35,c:"#67e8f9"}].map((cr,i)=>(
          <g key={i}>
            <polygon points={`${cr.x-8},200 ${cr.x},${200-cr.h} ${cr.x+8},200`}
              fill={done?cr.c:cr.c} opacity={done?0.9:0.5}/>
            {done&&<polygon points={`${cr.x-8},200 ${cr.x},${200-cr.h} ${cr.x+8},200`}
              fill={cr.c} opacity=".3"><animate attributeName="opacity" values=".2;.5;.2" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/></polygon>}
          </g>
        ))}
        {/* Stalactites */}
        {[50,110,190,250,320].map((x,i)=><polygon key={`st${i}`} points={`${x-5},0 ${x},${25+i*5} ${x+5},0`} fill="#2a2e3e"/>)}
        {/* Sealed door */}
        <rect x="145" y="90" width="70" height="100" fill="#2a2040" rx="5" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        <circle cx="180" cy="135" r="8" fill="none" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        {done && <path d="M176 135 L180 140 L188 130" stroke="#4ade80" strokeWidth="2.5" fill="none"/>}
        {/* Glow particles */}
        {done && [150,170,190,210].map((x,i)=><circle key={`g${i}`} cx={x} cy={100+i*10} r="2" fill="#4ade80" opacity=".6"><animate attributeName="cy" values={`${100+i*10};${90+i*10};${100+i*10}`} dur={`${2+i*0.5}s`} repeatCount="indefinite"/></circle>)}
      </svg>
    ),
  },
  {
    id: 4,
    title: "The Enchantress's Garden",
    narrative: "You emerge into a magical garden where flowers bloom to the sound of music. The enchantress offers you a gift — if you can name her favorite melody.",
    word: { w: "GRACE", h: "Elegant beauty" },
    bg: "#1a2a1a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a0a3a"/><stop offset="100%" stopColor="#1a3a2a"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky4)"/>
        {/* Moon */}
        <circle cx="300" cy="35" r="20" fill="#fef3c7" opacity=".8"/>
        <circle cx="308" cy="30" r="18" fill="#1a0a3a"/>
        {/* Ground */}
        <ellipse cx="180" cy="210" rx="200" ry="35" fill="#1a3a1a"/>
        {/* Flowers */}
        {[{x:60,c:"#f472b6"},{x:100,c:"#c084fc"},{x:150,c:"#fb923c"},{x:210,c:"#38bdf8"},{x:260,c:"#f472b6"},{x:310,c:"#a78bfa"}].map((f,i)=>(
          <g key={i}>
            <line x1={f.x} y1="200" x2={f.x} y2={155-i%3*5} stroke="#16a34a" strokeWidth="2"/>
            <circle cx={f.x} cy={150-i%3*5} r={done?8:5} fill={f.c} opacity={done?0.9:0.5}>
              {done&&<animate attributeName="r" values="7;9;7" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>}
            </circle>
            {done&&<circle cx={f.x} cy={150-i%3*5} r="3" fill="#fef3c7" opacity=".6"/>}
          </g>
        ))}
        {/* Enchantress */}
        <ellipse cx="180" cy="155" rx="12" ry="25" fill="#7c3aed"/>
        <circle cx="180" cy="125" r="10" fill="#fde68a"/>
        <circle cx="176" cy="123" r="2" fill="#5b21b6"/><circle cx="184" cy="123" r="2" fill="#5b21b6"/>
        <path d="M175 128Q180 132 185 128" stroke="#7c3aed" strokeWidth="1.5" fill="none"/>
        {/* Hat */}
        <polygon points="165,118 180,95 195,118" fill="#5b21b6"/>
        <circle cx="180" cy="93" r="3" fill="#fbbf24"/>
        {/* Wand */}
        <line x1="195" y1="140" x2="215" y2="120" stroke="#d4a017" strokeWidth="2"/>
        <circle cx="215" cy="118" r="3" fill="#fbbf24"><animate attributeName="opacity" values=".5;1;.5" dur="1s" repeatCount="indefinite"/></circle>
        {/* Sparkles */}
        {done && [140,170,200,230].map((x,i)=><text key={i} x={x} y={130+i*8} fontSize="10" opacity=".7"><animate attributeName="opacity" values=".3;1;.3" dur={`${1+i*0.4}s`} repeatCount="indefinite"/>✨</text>)}
      </svg>
    ),
  },
  {
    id: 5,
    title: "The Wizard's Tower",
    narrative: "The tower spirals into the clouds, its door sealed by the most complex spell yet. Inside lies the legendary Staff of Songs. Focus — this one is tricky!",
    word: { w: "FADED", h: "Lost its color" },
    bg: "#1a1a2e",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0a0a1e"/><stop offset="100%" stopColor="#1a1a3e"/></linearGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky5)"/>
        {/* Stars */}
        {[30,70,120,180,240,290,340,55,160,310].map((x,i)=><circle key={i} cx={x} cy={8+i*6%50} r={0.8+i%3*0.5} fill="#fffbe6" opacity={0.4+i%4*0.15}/>)}
        {/* Tower */}
        <rect x="155" y="50" width="50" height="150" fill="#2a2040" rx="3"/>
        <polygon points="150,50 180,15 210,50" fill="#3a2060"/>
        <circle cx="180" cy="25" r="4" fill="#fbbf24"><animate attributeName="opacity" values=".5;1;.5" dur="1.5s" repeatCount="indefinite"/></circle>
        {/* Windows */}
        {[75,105,140].map((y,i)=><rect key={i} x="170" y={y} width="20" height="15" rx="8" fill={done?"#4ade80":"#fbbf24"} opacity={done?.7:.3}/>)}
        {/* Door */}
        <rect x="168" y="170" width="24" height="30" fill="#1a1030" rx="12" stroke={done?"#4ade80":"#6366f1"} strokeWidth="2"/>
        {/* Clouds */}
        <ellipse cx="80" cy="40" rx="40" ry="15" fill="#2a2a4e" opacity=".5"/>
        <ellipse cx="290" cy="55" rx="35" ry="12" fill="#2a2a4e" opacity=".4"/>
        {/* Lightning when not done */}
        {!done && <path d="M100 0 L105 30 L95 32 L102 60" stroke="#818cf8" strokeWidth="1.5" fill="none" opacity=".4"><animate attributeName="opacity" values="0;.6;0" dur="3s" repeatCount="indefinite"/></path>}
        {/* Celebration */}
        {done && <><text x="180" y="8" textAnchor="middle" fontSize="14">⭐</text><text x="160" y="45" fontSize="10">🎵</text><text x="200" y="45" fontSize="10">🎵</text></>}
      </svg>
    ),
  },
  {
    id: 6,
    title: "The Final Spell",
    narrative: "With the Staff of Songs in hand, you stand before the Great Hall. One final melody will break the curse and restore music to the realm forever!",
    word: { w: "DANCE", h: "Move to music 💃" },
    bg: "#2a1a3a",
    scene: (done) => (
      <svg viewBox="0 0 360 200" style={{ width: "100%", maxWidth: 360, borderRadius: 16 }}>
        <defs>
          <linearGradient id="sky6" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={done?"#0a2a1a":"#1a0a2a"}/><stop offset="100%" stopColor={done?"#1a4a2a":"#2a1a3a"}/></linearGradient>
          <radialGradient id="glow6" cx="50%" cy="50%"><stop offset="0%" stopColor={done?"#4ade80":"#c084fc"} stopOpacity=".3"/><stop offset="100%" stopColor="transparent"/></radialGradient>
        </defs>
        <rect width="360" height="200" fill="url(#sky6)"/>
        {/* Grand hall pillars */}
        {[60,120,240,300].map((x,i)=><rect key={i} x={x-8} y="40" width="16" height="160" fill="#2a2040" rx="4"/>)}
        {/* Arch */}
        <path d="M60 40 Q180 -10 300 40" fill="none" stroke="#5b21b6" strokeWidth="6"/>
        <path d="M65 40 Q180 -5 295 40" fill="none" stroke="#7c3aed" strokeWidth="2"/>
        {/* Central glow */}
        <circle cx="180" cy="110" r="60" fill="url(#glow6)"/>
        {/* Hero with staff */}
        <ellipse cx="180" cy="155" rx="10" ry="22" fill="#3b82f6"/>
        <circle cx="180" cy="128" r="9" fill="#fde68a"/>
        <circle cx="176" cy="126" r="2" fill="#1e1b4b"/><circle cx="184" cy="126" r="2" fill="#1e1b4b"/>
        <path d="M176 131Q180 134 184 131" stroke="#92400e" strokeWidth="1" fill="none"/>
        {/* Staff */}
        <line x1="195" y1="130" x2="200" y2="80" stroke="#d4a017" strokeWidth="2.5"/>
        <circle cx="200" cy="78" r="5" fill={done?"#4ade80":"#c084fc"}><animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite"/></circle>
        {/* Musical notes floating */}
        {done && ["♪","♫","♩","♬","♪","♫"].map((n,i)=>(
          <text key={i} x={80+i*40} y={40+i%3*20} fontSize="16" fill={["#4ade80","#fbbf24","#f472b6","#38bdf8","#a78bfa","#fb923c"][i]} opacity=".8">
            <animate attributeName="y" values={`${40+i%3*20};${30+i%3*20};${40+i%3*20}`} dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
            {n}
          </text>
        ))}
        {/* Victory text */}
        {done && <text x="180" y="190" textAnchor="middle" fontSize="11" fill="#4ade80" fontFamily="'Fredoka',sans-serif" fontWeight="700">🎵 Music Restored! 🎵</text>}
      </svg>
    ),
  },
];

// ═══ SONG MODE — play along with melodies ═══
// All songs in C major, melody (right hand) only
// Sources cross-referenced from multiple music education sites
const SONGS = [
  {
    id: 1, title: "Ode to Joy", composer: "Beethoven", genre: "Classical",
    color: "#7c3aed",
    notes: ["E","E","F","G","G","F","E","D","C","C","D","E","E","D","D",
            "E","E","F","G","G","F","E","D","C","C","D","E","D","C","C"],
    // 4/4 time, quarter=1 beat. E.D D is dotted quarter + eighth + half
    rhythm: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2,
             1,1,1,1, 1,1,1,1, 1,1,1,1, 1.5,0.5,2],
  },
  {
    id: 2, title: "Twinkle Twinkle", composer: "Traditional", genre: "Folk",
    color: "#3b82f6",
    notes: ["C","C","G","G","A","A","G",
            "F","F","E","E","D","D","C",
            "G","G","F","F","E","E","D",
            "G","G","F","F","E","E","D",
            "C","C","G","G","A","A","G",
            "F","F","E","E","D","D","C"],
    // quarter quarter quarter quarter quarter quarter half, repeated
    rhythm: [1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2,
             1,1,1,1,1,1,2],
  },
  {
    id: 3, title: "Jingle Bells", composer: "Pierpont", genre: "Holiday",
    color: "#dc2626",
    notes: ["E","E","E","E","E","E","E","G","C","D","E",
            "F","F","F","F","F","E","E","E","G","G","F","D","C"],
    // E E E(h) | E E E(h) | E G C D | E(w)
    // F F F F | F E E E | G G F D | C(w)
    rhythm: [1,1,2, 1,1,2, 1,1,1,1, 4,
             1,1,1,1, 1,1,0.5,0.5, 1,1,1,1, 4],
  },
  {
    id: 4, title: "Amazing Grace", composer: "Newton", genre: "Folk",
    color: "#22c55e",
    notes: ["G","C","E","C","E","D","C","A","G","C","E","C","E","D","G"],
    // 3/4 time: pickup(1) | C(2) E(1) C(1) E(1) | D(2) C(1) | A(2) G(1) | C(2) E(1) C(1) E(1) | D(2) G(2)
    rhythm: [1, 2,1,1,1, 2,1, 2,1, 2,1,1,1, 2,2],
  },
  {
    id: 5, title: "Mary Had a Little Lamb", composer: "Traditional", genre: "Folk",
    color: "#f59e0b",
    notes: ["E","D","C","D","E","E","E",
            "D","D","D","E","G","G",
            "E","D","C","D","E","E","E","E",
            "D","D","E","D","C"],
    // E D C D | E E E(h) | D D D(h) | E G G(h)
    // E D C D | E E E E | D D E D | C(w)
    rhythm: [1,1,1,1, 1,1,2, 1,1,2, 1,1,2,
             1,1,1,1, 1,1,1,1, 1,1,1,1, 4],
  },
  {
    id: 6, title: "When the Saints", composer: "Traditional", genre: "Folk",
    color: "#e879f9",
    notes: ["C","E","F","G","C","E","F","G","C","E","F","G","E","C","E","D",
            "E","E","D","C","C","E","G","G","F","E","F","G","E","C","D","C"],
    // Oh when the saints (pickup feel): C(1) E(1) F(1) G(4) repeated pattern
    rhythm: [1,1,1,4, 1,1,1,4, 1,1,1,2, 1,1,1,2,
             1,1,1,2, 1,1,1,1, 1,1,1,2, 1,1,1,4],
  },
  {
    id: 7, title: "Shake It Off", composer: "Taylor Swift", genre: "Pop",
    color: "#ec4899",
    notes: ["C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","C5","D5","D5","D5","E5","C5","A","G","E","C",
            "C5","D5","E5","C5","C5","D5","E5","C5"],
    // Syncopated pop feel — eighth notes with longer holds
    rhythm: [0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,0.5,0.5,0.5,1, 1,0.5,0.5,0.5,1,
             0.5,0.5,1,1, 0.5,0.5,1,2],
  },
  {
    id: 8, title: "Espresso", composer: "Sabrina Carpenter", genre: "Pop",
    color: "#f97316",
    notes: ["D","A","C5","C5","C5","E5","A","A","A","B",
            "G","G","G","B","C5","B","B","A",
            "C5","C5","C5","E5","A","A","A","B",
            "G","G","B","C5","B","B","A"],
    // Laid-back pop groove (10+8+8+7=33)
    rhythm: [1,0.5,0.5,0.5,0.5,1, 0.5,0.5,0.5,1.5,
             0.5,0.5,0.5,0.5,1, 0.5,0.5,2,
             0.5,0.5,0.5,0.5,1, 0.5,0.5,1.5,
             0.5,0.5,1,0.5,0.5,0.5,2],
  },
  {
    id: 9, title: "Golden", composer: "HUNTR/X (Demon Hunters)", genre: "Pop",
    color: "#eab308",
    notes: ["A","C5","F5","E5",
            "G","B","A5","G5",
            "B","D5","G5","F5","E5",
            "A","C5","F5","E5",
            "G","B","A5","G5",
            "B","D5","G5"],
    // Anthemic ascending feel — longer sustained notes
    rhythm: [1,1,1,2,
             1,1,1,2,
             1,1,1,1,2,
             1,1,1,2,
             1,1,1,2,
             1,1,4],
  },
];

// ═══ POWERUPS BAR (extracted from App) ═══
function PowerupsBar({ powerups, score, isDone, onBuy, onUse }) {
  return (
    <div style={{
      display: "flex", gap: 8, justifyContent: "center", alignItems: "flex-start",
      padding: "8px 12px", borderRadius: 14,
      background: "#f5f3ff66",
      border: "1px solid #e5e7eb",
      marginBottom: 8,
    }}>
      {Object.values(POWERUPS).map(pu => (
        <PowerupBtn key={pu.id} powerup={pu} count={powerups[pu.id] || 0}
          score={score} onBuy={onBuy} onUse={onUse}
          disabled={isDone} />
      ))}
    </div>
  );
}

// ═══ LEADERBOARD OVERLAY (extracted from App) ═══
function LBOverlay({ leaderboard, onClose, fontFamily }) {
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily }}>
    <div style={{ background: "#0f0a1a", borderRadius: 20, padding: "28px 32px", maxWidth: 380, width: "90%", border: "3px solid #f59e0b", boxShadow: "0 0 40px #f59e0b44" }}>
      <h2 style={{ color: "#f59e0b", textAlign: "center", margin: "0 0 16px", fontSize: 22, letterSpacing: 2 }}>🏆 LEADERBOARD</h2>
      {leaderboard.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 14 }}>No scores yet!</p> :
        <div style={{ maxHeight: 300, overflowY: "auto" }}>{leaderboard.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? "#f59e0b15" : i < 3 ? "#1a1128" : "#12091e", border: i === 0 ? "1px solid #f59e0b44" : "1px solid #2a1f3a" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: i === 0 ? "#f59e0b" : i < 3 ? "#c084fc" : "#6b7280", fontWeight: 700, fontSize: 16, width: 28 }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 16, letterSpacing: 3, fontFamily: "monospace" }}>{e.initials}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>{e.clef === "treble" ? "𝄞" : "𝄢"}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 18 }}>{e.score}</span>
            </div>
          </div>))}</div>}
      <button onClick={onClose} style={{ marginTop: 16, width: "100%", padding: 10, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily, cursor: "pointer" }}>Close</button>
    </div>
  </div>);
}

// ═══ STREAK LEADERBOARD OVERLAY (extracted from App) ═══
function StreakLBOverlay({ state, dispatch, streakLB, addStreakScore, saveStreakLB, getStreakLB, setStreakLB, fontFamily }) {
  const ff = fontFamily;
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily: ff }}>
    <div style={{ background: "#0f0a1a", borderRadius: 20, padding: "28px 32px", maxWidth: 380, width: "90%", border: "3px solid #c084fc", boxShadow: "0 0 40px #c084fc44" }}>
      <h2 style={{ color: "#c084fc", textAlign: "center", margin: "0 0 16px", fontSize: 22, letterSpacing: 2 }}>🔥 STREAK RECORDS</h2>

      {state.streakLBEntering ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#fbbf24", fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{state.lastBigStreak} 🔥</div>
          <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 14 }}>Amazing streak! Enter your initials:</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 44, height: 52, borderRadius: 10, border: `3px solid ${state.streakInitials[i] ? "#c084fc" : "#3a2d50"}`, background: "#1a1128", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#c084fc", fontFamily: "monospace" }}>{state.streakInitials[i] || "_"}</div>))}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => (
              <button key={ch} onClick={() => { if (state.streakInitials.length < 3) dispatch({ type: "SET_STREAK_INIT", value: state.streakInitials + ch }); }}
                style={{ width: 32, height: 32, borderRadius: 7, border: "2px solid #3a2d50", background: "#1a1128", color: "#e2e8f0", fontSize: 12, fontWeight: 600, fontFamily: ff, cursor: "pointer", opacity: state.streakInitials.length >= 3 ? .3 : 1 }}>{ch}</button>))}
            <button onClick={() => dispatch({ type: "SET_STREAK_INIT", value: state.streakInitials.slice(0, -1) })}
              style={{ width: 44, height: 32, borderRadius: 7, border: "2px solid #dc2626", background: "#1a1128", color: "#f87171", fontSize: 10, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>DEL</button>
          </div>
          <button onClick={() => { if (state.streakInitials.length === 3) { addStreakScore(state.streakInitials, state.lastBigStreak, state.clef); saveStreakLB(); setStreakLB(getStreakLB()); dispatch({ type: "SUBMIT_STREAK" }); } }}
            disabled={state.streakInitials.length !== 3}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "none", background: state.streakInitials.length === 3 ? "linear-gradient(135deg,#c084fc,#7c3aed)" : "#2a1f3a", color: state.streakInitials.length === 3 ? "white" : "#6b7280", fontSize: 15, fontWeight: 700, fontFamily: ff, cursor: state.streakInitials.length === 3 ? "pointer" : "not-allowed" }}>Save Streak</button>
        </div>
      ) : (
        <>
          {streakLB.length === 0 ? <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 14 }}>No streaks yet! Get 5+ in a row!</p> :
            <div style={{ maxHeight: 300, overflowY: "auto" }}>{streakLB.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 4, background: i === 0 ? "#c084fc15" : i < 3 ? "#1a1128" : "#12091e", border: i === 0 ? "1px solid #c084fc44" : "1px solid #2a1f3a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: i === 0 ? "#c084fc" : i < 3 ? "#f59e0b" : "#6b7280", fontWeight: 700, fontSize: 16, width: 28 }}>{i === 0 ? "🔥" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600, fontSize: 16, letterSpacing: 3, fontFamily: "monospace" }}>{e.initials}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#9ca3af", fontSize: 11 }}>{e.clef === "treble" ? "𝄞" : "𝄢"}</span>
                  <span style={{ color: "#c084fc", fontWeight: 700, fontSize: 18 }}>{e.streak}🔥</span>
                </div>
              </div>))}</div>}
          <button onClick={() => dispatch({ type: "HIDE_STREAK_LB" })} style={{ marginTop: 16, width: "100%", padding: 10, borderRadius: 12, border: "2px solid #c084fc", background: "transparent", color: "#c084fc", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Close</button>
        </>
      )}
    </div>
  </div>);
}

// ═══ ARCADE END (extracted from App) ═══
function ArcadeEnd({ state, dispatch, leaderboard, setLeaderboard, clearTimer, fontFamily }) {
  const ff = fontFamily;
  return (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily: ff }}>
    <div style={{ background: "#0f0a1a", borderRadius: 24, padding: "32px 36px", maxWidth: 380, width: "90%", textAlign: "center", border: "3px solid #f59e0b", boxShadow: "0 0 60px #f59e0b33" }}>
      <div style={{ fontSize: 42, marginBottom: 8 }}>⏱️</div>
      <h2 style={{ color: "#f59e0b", margin: "0 0 4px", fontSize: 24 }}>TIME'S UP!</h2>
      <div style={{ color: "#e2e8f0", fontSize: 42, fontWeight: 700, margin: "12px 0" }}>{state.arcadeScore}</div>
      <div style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>notes named correctly</div>

      {state.arcadePractice ? (
        <div>
          <div style={{ color: "#c084fc", fontSize: 13, marginBottom: 16 }}>Practice Arcade — scores not saved</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { clearTimer(); dispatch({ type: "ARCADE_START", clef: state.arcadeClef, pool: STAGE1_WORDS, practice: true }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Play Again</button>
            <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #6b7280", background: "transparent", color: "#9ca3af", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Menu</button>
          </div>
        </div>
      ) : state.enteringName ? (
        <div>
          <div style={{ color: "#c084fc", fontSize: 14, marginBottom: 10, fontWeight: 600 }}>Enter your initials:</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
            {[0, 1, 2].map(i => (<div key={i} style={{ width: 48, height: 56, borderRadius: 10, border: `3px solid ${state.arcadeInitials[i] ? "#f59e0b" : "#3a2d50"}`, background: "#1a1128", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#f59e0b", fontFamily: "monospace", letterSpacing: 2 }}>{state.arcadeInitials[i] || "_"}</div>))}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(ch => (
              <button key={ch} onClick={() => { if (state.arcadeInitials.length < 3) dispatch({ type: "SET_INIT", value: state.arcadeInitials + ch }); }}
                style={{ width: 34, height: 34, borderRadius: 7, border: "2px solid #3a2d50", background: "#1a1128", color: "#e2e8f0", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer", opacity: state.arcadeInitials.length >= 3 ? .3 : 1 }}>{ch}</button>))}
            <button onClick={() => dispatch({ type: "SET_INIT", value: state.arcadeInitials.slice(0, -1) })}
              style={{ width: 48, height: 34, borderRadius: 7, border: "2px solid #dc2626", background: "#1a1128", color: "#f87171", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>DEL</button>
          </div>
          <button onClick={() => { if (state.arcadeInitials.length === 3) { addLBScore(state.arcadeInitials, state.arcadeScore, state.arcadeClef); saveLB(); setLeaderboard(getLB()); dispatch({ type: "SUBMIT" }); } }}
            disabled={state.arcadeInitials.length !== 3}
            style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: state.arcadeInitials.length === 3 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#2a1f3a", color: state.arcadeInitials.length === 3 ? "white" : "#6b7280", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: state.arcadeInitials.length === 3 ? "pointer" : "not-allowed" }}>Submit Score</button>
        </div>
      ) : (
        <div>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>{leaderboard.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderRadius: 8, marginBottom: 3, background: e.initials === state.arcadeInitials && e.score === state.arcadeScore ? "#f59e0b22" : "#1a1128", border: e.initials === state.arcadeInitials && e.score === state.arcadeScore ? "1px solid #f59e0b" : "1px solid #2a1f3a" }}>
              <span style={{ color: i < 3 ? "#f59e0b" : "#9ca3af", fontWeight: 700, fontSize: 14 }}>{i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}{" "}<span style={{ color: "#e2e8f0", letterSpacing: 2, fontFamily: "monospace" }}>{e.initials}</span></span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{e.score}</span>
            </div>))}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => { clearTimer(); dispatch({ type: "ARCADE_START", clef: state.arcadeClef }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #f59e0b", background: "transparent", color: "#f59e0b", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Play Again</button>
            <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }}
              style={{ flex: 1, padding: 12, borderRadius: 12, border: "2px solid #6b7280", background: "transparent", color: "#9ca3af", fontSize: 15, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Menu</button>
          </div>
        </div>
      )}
    </div>
  </div>);
}

// ═══════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakLB, setStreakLB] = useState([]);
  const startTimeRef = useRef(null);
  const [speakWords, setSpeakWords] = useState(false);
  const [playingSong, setPlayingSong] = useState(false);
  const [showStaffHint, setShowStaffHint] = useState(false);
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected");
  const ff = "'Fredoka',sans-serif";

  // ═══ MIDI SETUP ═══
  const MIDI_NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
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

  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!midiDevice) return;
    const onMsg = (e) => {
      const [status, noteNum, velocity] = e.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const name = MIDI_NOTE_NAMES[noteNum % 12];
        if (name.includes("#")) return; // ignore black keys
        const s = stateRef.current;
        if (s.phase === "game" && !s.isDone) dispatchRef.current({ type: "PICK", note: name });
        else if (s.phase === "arcade" && !s.arcadeOver && !s.arcadeWordDone) dispatchRef.current({ type: "ARCADE_PICK", note: name });
        else if (s.phase === "story" && !s.storyWordDone) dispatchRef.current({ type: "STORY_PICK", note: name });
        else if (s.phase === "song" && !s.songDone) dispatchRef.current({ type: "SONG_PICK", note: name });
        else if (s.phase === "weak" && !s.isDone) dispatchRef.current({ type: "WEAK_PICK", note: name });
        else if (s.phase === "scramble" && !s.scrambleDone) dispatchRef.current({ type: "SCRAMBLE_PICK", note: name });
      }
    };
    midiDevice.onmidimessage = onMsg;
    return () => { midiDevice.onmidimessage = null; };
  }, [midiDevice]);

  function speakWord(word) {
    if (!speakWords || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.85;
    u.pitch = 1.1;
    u.volume = 0.4;
    window.speechSynthesis.speak(u);
  }

  // Load saved data on mount
  useEffect(() => {
    loadLB().then(() => setLeaderboard(getLB()));
    loadStreakLB().then(() => setStreakLB(getStreakLB()));
    loadStats().then(saved => { if (saved) dispatch({ type: "LOAD_STATS", stats: saved }); });
    loadPowerups().then(saved => {
      if (saved) dispatch({ type: "LOAD_POWERUPS", powerups: saved });
    });
    loadProgress().then(saved => {
      if (saved) dispatch({ type: "LOAD_PROGRESS", unlockedStages: saved.unlockedStages, stageIndex: saved.stageIndex, score: saved.score });
    });
  }, []);

  // Persist stats + powerups
  const prevStatsRef = useRef(state.stats);
  const prevPURef = useRef(state.powerups);
  useEffect(() => {
    if (state.stats !== prevStatsRef.current) { prevStatsRef.current = state.stats; saveStats(state.stats); }
  }, [state.stats]);
  useEffect(() => {
    if (state.powerups !== prevPURef.current) { prevPURef.current = state.powerups; savePowerups(state.powerups); }
  }, [state.powerups]);

  // Persist unlocked stages, current stage, and score
  const prevProgressRef = useRef({ unlockedStages: state.unlockedStages, stageIndex: state.stageIndex, score: state.score });
  useEffect(() => {
    const prev = prevProgressRef.current;
    if (state.unlockedStages !== prev.unlockedStages || state.stageIndex !== prev.stageIndex || state.score !== prev.score) {
      prevProgressRef.current = { unlockedStages: state.unlockedStages, stageIndex: state.stageIndex, score: state.score };
      saveProgress({ unlockedStages: state.unlockedStages, stageIndex: state.stageIndex, score: state.score });
    }
  }, [state.unlockedStages, state.stageIndex, state.score]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ═══ SPEAK WORD ON COMPLETION ═══
  useEffect(() => {
    if ((state.isDone || state.storyWordDone) && state.word) speakWord(state.word.w);
  }, [state.isDone, state.storyWordDone]);

  // ═══ KEYBOARD INPUT ═══
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (!"ABCDEFG".includes(key)) return;
      if (state.phase === "game" && !state.isDone) dispatch({ type: "PICK", note: key });
      else if (state.phase === "arcade" && !state.arcadeOver && !state.arcadeWordDone) dispatch({ type: "ARCADE_PICK", note: key });
      else if (state.phase === "story" && !state.storyWordDone) dispatch({ type: "STORY_PICK", note: key });
      else if (state.phase === "song" && !state.songDone) dispatch({ type: "SONG_PICK", note: key });
      else if (state.phase === "weak" && !state.isDone) dispatch({ type: "WEAK_PICK", note: key });
      else if (state.phase === "scramble" && !state.scrambleDone) dispatch({ type: "SCRAMBLE_PICK", note: key });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, state.isDone, state.arcadeOver, state.arcadeWordDone, state.storyWordDone, state.songDone, state.scrambleDone]);

  // ═══ ARCADE TIMER ═══
  useEffect(() => {
    if (state.phase !== "arcade" || state.arcadeOver) return;
    clearTimer();
    setTimeLeft(60);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) { clearInterval(timerRef.current); dispatch({ type: "ARCADE_END" }); }
    }, 50);
    return clearTimer;
  }, [state.phase, state.arcadeOver, clearTimer]);

  // ═══ WRONG HIGHLIGHT CLEAR ═══
  useEffect(() => {
    const actionType = state.phase === "arcade" ? "ARCADE_CLEAR" : state.phase === "story" ? "STORY_CLEAR" : state.phase === "song" ? "SONG_CLEAR" : state.phase === "weak" ? "WEAK_CLEAR" : "CLEAR_WRONG";
    const wrongEntry = Object.entries(state.highlights).find(([, v]) => v === "wrong");
    if (!wrongEntry) return;
    const t = setTimeout(() => dispatch({ type: actionType, index: Number(wrongEntry[0]) }), state.phase === "arcade" ? 300 : 500);
    return () => clearTimeout(t);
  }, [state.highlights, state.phase]);

  // ═══ SCRAMBLE WRONG HIGHLIGHT CLEAR ═══
  useEffect(() => {
    if (state.phase !== "scramble" || !state.scrambleHL) return;
    const wrongEntry = Object.entries(state.scrambleHL).find(([, v]) => v === "wrong");
    if (!wrongEntry) return;
    const t = setTimeout(() => dispatch({ type: "SCRAMBLE_CLEAR", index: Number(wrongEntry[0]) }), 500);
    return () => clearTimeout(t);
  }, [state.scrambleHL, state.phase]);

  // ═══ REVEAL AUTO-ADVANCE ═══
  useEffect(() => {
    const revealEntry = Object.entries(state.highlights).find(([, v]) => v === "reveal");
    if (!revealEntry) return;
    if (state.phase === "story") {
      const t = setTimeout(() => dispatch({ type: "STORY_ADVANCE_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    if (state.phase === "weak") {
      const t = setTimeout(() => dispatch({ type: "WEAK_ADVANCE_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    // Normal game mode
    if (state.phase === "game" && state.slotWrongCount >= 3) {
      const t = setTimeout(() => dispatch({ type: "ADVANCE_AFTER_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => dispatch({ type: "ADVANCE_AFTER_REVEAL" }), 1500);
    return () => clearTimeout(t);
  }, [state.highlights, state.phase, state.slotWrongCount]);

  // ═══ ARCADE WORD DONE — brief hold then advance ═══
  useEffect(() => {
    if (!state.arcadeWordDone) return;
    const t = setTimeout(() => dispatch({ type: "ARCADE_ADVANCE" }), 500);
    return () => clearTimeout(t);
  }, [state.arcadeWordDone]);

  // ═══ WEAK MODE AUTO-ADVANCE ═══
  useEffect(() => {
    if (state.phase !== "weak" || !state.isDone) return;
    const t = setTimeout(() => dispatch({ type: "WEAK_NEXT" }), 1800);
    return () => clearTimeout(t);
  }, [state.phase, state.isDone]);

  // ═══ PLAY SOUNDS ON HIGHLIGHT CHANGES (octave-accurate) ═══
  const prevHLRef = useRef({});
  const prevScrambleHLRef = useRef({});
  useEffect(() => {
    const prev = prevHLRef.current;
    // Determine if extended notes are in use
    let extended = false;
    const isSongMode = state.phase === "song";
    if (state.phase === "game") extended = STAGES[state.stageIndex]?.id === 3;
    else if (state.phase === "arcade") extended = state.word && state.word.w.length >= 5;
    // story mode and song mode use standard (non-extended) positions
    Object.entries(state.highlights).forEach(([idx, val]) => {
      if (prev[idx] !== val) {
        if (val === "correct" || val === "reveal") {
          const slotWordIdx = isSongMode ? Number(idx) : state.slots[Number(idx)];
          const note = isSongMode
            ? (state.songNotes && state.songNotes[slotWordIdx]) 
            : state.word?.w[slotWordIdx];
          if (note && MUSIC_NOTES.has(note.charAt(0))) {
            const freq = getFrequency(note, state.clef || "treble", extended, isSongMode);
            playNoteSound(freq, "correct");
          }
        } else if (val === "wrong") {
          playNoteSound(120, "wrong");
        }
      }
    });
    prevHLRef.current = { ...state.highlights };

    // Scramble mode sounds
    if (state.phase === "scramble" && state.scrambleHL) {
      const prevS = prevScrambleHLRef.current;
      Object.entries(state.scrambleHL).forEach(([idx, val]) => {
        if (prevS[idx] !== val) {
          if (val === "correct" || val === "reveal") {
            const note = state.scrambleWord?.w[Number(idx)];
            if (note && MUSIC_NOTES.has(note)) {
              const freq = getFrequency(note, state.clef || "treble", false, false);
              playNoteSound(freq, "correct");
            }
          } else if (val === "wrong") {
            playNoteSound(120, "wrong");
          }
        }
      });
      prevScrambleHLRef.current = { ...state.scrambleHL };
    }
  }, [state.highlights, state.scrambleHL, state.slots, state.word, state.clef, state.stageIndex, state.phase, state.songNotes, state.scrambleWord]);

  // ═══ AUTO-ADVANCE (normal mode) ═══
  useEffect(() => {
    if (state.phase !== "game" || !state.isDone) return;
    if (state.streakMilestone || state.isButterfly) {
      playSuccessChime();
      // Milestone celebrations get more time than butterfly
      const delay = state.streakMilestone
        ? (state.streakMilestone.tier === "legendary" ? 3800 : state.streakMilestone.tier === "diamond" ? 3200 : 3000)
        : 2800;
      const t = setTimeout(() => {
        dispatch({ type: "RESET_BFLY" });
        // Offer streak LB entry on big milestones (20, 30, 40...)
        if (state.streak >= 20 && state.streak % 10 === 0) {
          dispatch({ type: "STREAK_LB_ENTER", streak: state.streak });
        } else {
          // Continue to next word
          for (let i = 0; i < STAGES.length; i++) {
            if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
              dispatch({ type: "UNLOCK", index: i }); return;
            }
          }
          dispatch({ type: "TRANSITION" });
          setTimeout(() => dispatch({ type: "NEXT" }), 300);
        }
      }, delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      for (let i = 0; i < STAGES.length; i++) {
        if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
          dispatch({ type: "UNLOCK", index: i }); return;
        }
      }
      dispatch({ type: "TRANSITION" });
      setTimeout(() => dispatch({ type: "NEXT" }), 300);
    }, 1400);
    return () => clearTimeout(t);
  }, [state.phase, state.isDone, state.isButterfly, state.streakMilestone, state.score, state.unlockedStages, state.streak]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // ═══ SONG MODE SCROLL ═══
  const songScrollRef = useRef(null);
  const noteRefs = useRef({});
  useEffect(() => {
    if (state.phase !== "song") return;
    const container = songScrollRef.current;
    const currentEl = noteRefs.current[state.songNoteIndex];
    if (!container || !currentEl) return;
    const containerRect = container.getBoundingClientRect();
    const noteRect = currentEl.getBoundingClientRect();
    const noteCenter = noteRect.left + noteRect.width / 2 - containerRect.left + container.scrollLeft;
    const targetScroll = noteCenter - containerRect.width / 2;
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, [state.songNoteIndex, state.phase]);
  useEffect(() => {
    if (songScrollRef.current) songScrollRef.current.scrollLeft = 0;
    noteRefs.current = {};
  }, [state.songIndex]);

  // ═══ CONTINUE AFTER STREAK LB ═══
  const prevStreakLBRef = useRef(false);
  useEffect(() => {
    // Only fire when streak LB flow just ended (was true, now false)
    const wasInLB = prevStreakLBRef.current;
    const inLB = state.streakLBEntering || state.showStreakLB;
    prevStreakLBRef.current = inLB;
    if (!wasInLB || inLB) return; // Only continue when LB just closed
    if (state.phase !== "game" || !state.isDone) return;
    for (let i = 0; i < STAGES.length; i++) {
      if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
        dispatch({ type: "UNLOCK", index: i }); return;
      }
    }
    dispatch({ type: "TRANSITION" });
    setTimeout(() => dispatch({ type: "NEXT" }), 300);
  }, [state.streakLBEntering, state.showStreakLB, state.phase, state.isDone, state.score, state.unlockedStages]);



  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
    @keyframes cfall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
    @keyframes bfly{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
    @keyframes popIn{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
    @keyframes glow{0%,100%{box-shadow:0 0 8px #f59e0b44}50%{box-shadow:0 0 20px #f59e0baa}}
    @keyframes shakeNote{0%{transform:translateX(0)}15%{transform:translateX(-6px)}30%{transform:translateX(5px)}45%{transform:translateX(-4px)}60%{transform:translateX(3px)}75%{transform:translateX(-2px)}100%{transform:translateX(0)}}
    @keyframes fadeSlideIn{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
    @keyframes fadeSlideOut{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-8px)}}
    @keyframes puPop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
    @keyframes milestoneFlash{0%{opacity:1}100%{opacity:0}}
    @keyframes milestonePop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}15%{transform:translate(-50%,-50%) scale(1.3);opacity:1}30%{transform:translate(-50%,-50%) scale(1);opacity:1}85%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(0.8);opacity:0}}
    @keyframes milestoneSpin{0%{transform:scale(0) rotate(-180deg)}60%{transform:scale(1.3) rotate(15deg)}100%{transform:scale(1) rotate(0deg)}}
    @keyframes milestoneBurst{0%{transform:translate(-50%,-50%);opacity:1}100%{transform:translate(calc(-50% + var(--burst-x)),calc(-50% + var(--burst-y)));opacity:0}}
    @keyframes milestoneRing{0%{width:20px;height:20px;opacity:.8}100%{width:350px;height:350px;opacity:0}}
    @keyframes milestoneRainbow{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}40%{opacity:.7;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.1)}}
    @keyframes catFloat{0%{transform:translateY(0);opacity:.7}50%{transform:translateY(-10px);opacity:.3}100%{transform:translateY(0);opacity:.7}}
    .songScroll::-webkit-scrollbar{display:none}
    .songScroll{-ms-overflow-style:none;scrollbar-width:none}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    button{touch-action:manipulation}
    html,body{overscroll-behavior:none}
    @media(max-width:480px){
      .noteGrid{gap:6px !important}
    }
    @media(max-width:380px){
      svg{max-width:100%}
    }
    .staffRow{display:flex;justify-content:center;flex-wrap:nowrap;border-radius:16px;padding:6px 4px;margin-bottom:6px;max-width:600px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
    @media(max-width:500px){.staffRow{transform:scale(0.82);transform-origin:center top;margin-bottom:-12px}}
    @media(max-width:380px){.staffRow{transform:scale(0.68);transform-origin:center top;margin-bottom:-22px}}
    `;
  const bgGradient = "linear-gradient(160deg,#fefce8 0%,#f0fdf4 40%,#ede9fe 100%)";
  const fullArcadeUnlocked = state.unlockedStages.includes(2);

  // Powerup handler
  const handleUsePowerup = (id) => {
    if (id === "reveal") { dispatch({ type: "USE_REVEAL" }); playPowerupSound(); }
    else if (id === "double") { dispatch({ type: "USE_DOUBLE" }); playPowerupSound(); }
    else if (id === "shield") { dispatch({ type: "USE_SHIELD" }); playPowerupSound(); }
  };
  const handleBuyPowerup = (id) => { dispatch({ type: "BUY_POWERUP", id }); playPowerupSound(); };

  // PowerupsBar, LBOverlay, StreakLBOverlay, ArcadeEnd are now defined outside App




  // ═══════════════════════════════════════
  //  MENU
  // ═══════════════════════════════════════
  if (state.phase === "menu") return (
    <div style={{ minHeight: "100vh", background: bgGradient, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: ff, padding: "24px 16px env(safe-area-inset-bottom, 24px)" }}>
      <style>{css}</style>
      {state.showLeaderboard && <LBOverlay leaderboard={leaderboard} onClose={() => dispatch({ type: "HIDE_LB" })} fontFamily={ff} />}
      {state.showStreakLB && <StreakLBOverlay state={state} dispatch={dispatch} streakLB={streakLB} addStreakScore={addStreakScore} saveStreakLB={saveStreakLB} getStreakLB={getStreakLB} setStreakLB={setStreakLB} fontFamily={ff} />}
      {state.showStats && <StatsPanel stats={state.stats} onClose={() => dispatch({ type: "HIDE_STATS" })} fontFamily={ff} />}

      <LevelBadge stats={state.stats} style={{ marginBottom: 12 }} />

      <div style={{ fontSize: 56, marginBottom: 8 }}>
        <svg width="160" height="140" viewBox="0 0 200 170">
          {/* Body segments curving upward */}
          <circle cx="52" cy="128" r="14" fill="#4ade80" stroke="#fff" strokeWidth="2"/>
          <text x="52" y="132" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="49" y1="140" x2="47" y2="148" stroke="#4ade8088" strokeWidth="1.5"/>
          <line x1="55" y1="140" x2="57" y2="148" stroke="#4ade8088" strokeWidth="1.5"/>
          <circle cx="72" cy="120" r="14" fill="#86efac" stroke="#fff" strokeWidth="2"/>
          <text x="72" y="124" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♫</text>
          <line x1="69" y1="132" x2="67" y2="140" stroke="#86efac88" strokeWidth="1.5"/>
          <line x1="75" y1="132" x2="77" y2="140" stroke="#86efac88" strokeWidth="1.5"/>
          <circle cx="90" cy="110" r="14" fill="#facc15" stroke="#fff" strokeWidth="2"/>
          <text x="90" y="114" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="87" y1="122" x2="85" y2="130" stroke="#facc1588" strokeWidth="1.5"/>
          <line x1="93" y1="122" x2="95" y2="130" stroke="#facc1588" strokeWidth="1.5"/>
          <circle cx="107" cy="98" r="14" fill="#fde047" stroke="#fff" strokeWidth="2"/>
          <text x="107" y="102" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♫</text>
          <line x1="104" y1="110" x2="102" y2="118" stroke="#fde04788" strokeWidth="1.5"/>
          <line x1="110" y1="110" x2="112" y2="118" stroke="#fde04788" strokeWidth="1.5"/>
          <circle cx="122" cy="88" r="14" fill="#fb923c" stroke="#fff" strokeWidth="2"/>
          <text x="122" y="92" textAnchor="middle" fontSize="11" fill="white" fontFamily="serif">♪</text>
          <line x1="119" y1="100" x2="117" y2="108" stroke="#fb923c88" strokeWidth="1.5"/>
          <line x1="125" y1="100" x2="127" y2="108" stroke="#fb923c88" strokeWidth="1.5"/>
          {/* Head */}
          <circle cx="140" cy="70" r="22" fill="#4ade80" stroke="#16a34a" strokeWidth="3"/>
          {/* Top hat */}
          <rect x="122" y="28" width="36" height="24" rx="3" fill="#1a1a2e"/>
          <rect x="116" y="49" width="48" height="7" rx="3" fill="#1a1a2e"/>
          <rect x="126" y="34" width="28" height="4" rx="2" fill="#4ade80" opacity="0.4"/>
          {/* Eyes */}
          <circle cx="132" cy="65" r="6" fill="white"/><circle cx="148" cy="65" r="6" fill="white"/>
          <circle cx="133.5" cy="66" r="3.2" fill="#1a1a2e"/><circle cx="149.5" cy="66" r="3.2" fill="#1a1a2e"/>
          <circle cx="134.5" cy="64" r="1.2" fill="white"/><circle cx="150.5" cy="64" r="1.2" fill="white"/>
          {/* Rosy cheeks */}
          <circle cx="124" cy="74" r="5" fill="#f9a8d4" opacity="0.45"/>
          <circle cx="156" cy="74" r="5" fill="#f9a8d4" opacity="0.45"/>
          {/* Smile */}
          <path d="M130 78 Q140 88 150 78" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Antennae */}
          <line x1="130" y1="49" x2="118" y2="26" stroke="#16a34a" strokeWidth="2"/>
          <circle cx="118" cy="26" r="4" fill="#facc15"/>
          <line x1="150" y1="49" x2="162" y2="26" stroke="#16a34a" strokeWidth="2"/>
          <circle cx="162" cy="26" r="4" fill="#facc15"/>
        </svg>
      </div>
      <h1 style={{ fontSize: "clamp(28px,6vw,46px)", color: "#5b21b6", margin: "0 0 6px", textShadow: "2px 2px 0 #ddd6fe", textAlign: "center" }}>Note Speller</h1>
      <p style={{ color: "#7c3aed", fontSize: 15, marginBottom: 8, textAlign: "center", maxWidth: 380, lineHeight: 1.5 }}>
        Read the notes to spell words! 10 in a row = butterfly!</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {STAGES.map(st => (<div key={st.id} style={{ background: "white", borderRadius: 8, padding: "4px 10px", border: `2px solid ${st.color}33`, fontSize: 11, color: st.color, fontWeight: 600 }}>Stage {st.id}: {st.name}</div>))}
      </div>

      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12, fontWeight: 600 }}>Choose your clef:</p>
      {midiStatus === "connected" && (
        <div style={{background:"#ecfdf5",border:"1px solid #86efac",borderRadius:10,padding:"4px 12px",marginBottom:10,fontSize:12,color:"#16a34a",fontWeight:600}}>🎹 MIDI keyboard connected</div>
      )}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", justifyContent: "center", marginBottom: 18 }}>
        {[{ id: "treble", label: "Treble Clef", sym: "𝄞" }, { id: "bass", label: "Bass Clef", sym: "𝄢" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "START", clef: c.id })} style={{
            padding: "18px 30px", borderRadius: 18, border: "3px solid #5b21b6",
            background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", cursor: "pointer",
            fontSize: 16, fontWeight: 600, fontFamily: ff, color: "#5b21b6",
            boxShadow: "0 4px 16px rgba(91,33,182,.1)", transition: "all .2s ease"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 38, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      {/* ═══ STORY MODE ═══ */}
      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>📖 Story Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>A fantasy adventure! Spell words to advance through the story.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {[{ id: "treble", label: "Story (Treble)", sym: "📖" }, { id: "bass", label: "Story (Bass)", sym: "📖" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "STORY_START", clef: c.id })}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #dc2626", background: "linear-gradient(135deg,#fef2f2,#fecaca)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#991b1b", boxShadow: "0 4px 16px rgba(220,38,38,.1)", transition: "all .2s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      {/* ═══ SONG MODE ═══ */}
      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f59e0b" }}>🎵 Song Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>Play along with famous melodies! See notes on staff and name them.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {[{ id: "treble", label: "Songs (Treble)", sym: "🎵" }, { id: "bass", label: "Songs (Bass)", sym: "🎵" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "SONG_START", clef: c.id })}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #f59e0b", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#92400e", boxShadow: "0 4px 16px rgba(245,158,11,.1)", transition: "all .2s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

            {/* ═══ PRACTICE WEAK NOTES ═══ */}
      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#8b5cf6" }}>🔀 Scramble Mode</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>Notes are scrambled! Read them all, figure out the word, then spell it in order.</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {[{ id: "treble", label: "Scramble (Treble)", sym: "🔀" }, { id: "bass", label: "Scramble (Bass)", sym: "🔀" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "SCRAMBLE_START", clef: c.id })}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #8b5cf6", background: "linear-gradient(135deg,#f5f3ff,#ede9fe)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#5b21b6", boxShadow: "0 4px 16px rgba(139,92,246,.1)", transition: "all .2s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      {/* ═══ PRACTICE WEAK NOTES (original) ═══ */}
      <div style={{ width: "100%", maxWidth: 380, height: 1, background: "#e5e7eb", marginBottom: 16 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#dc2626" }}>🎯 Practice Weak Notes</span>
        <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>NEW</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 340 }}>
        {(state.stats.totalGuesses || 0) < 10
          ? "Play some rounds first so we can find your weak spots!"
          : "Auto-targets the notes you struggle with most!"}
      </p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {[{ id: "treble", label: "Weak (Treble)", sym: "🎯" }, { id: "bass", label: "Weak (Bass)", sym: "🎯" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "WEAK_START", clef: c.id })}
            disabled={(state.stats.totalGuesses || 0) < 10}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #dc2626", background: (state.stats.totalGuesses || 0) >= 10 ? "linear-gradient(135deg,#fef2f2,#fecaca)" : "#f3f4f6", cursor: (state.stats.totalGuesses || 0) >= 10 ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 600, fontFamily: ff, color: (state.stats.totalGuesses || 0) >= 10 ? "#991b1b" : "#9ca3af", boxShadow: "0 4px 16px rgba(220,38,38,.1)", transition: "all .2s ease", opacity: (state.stats.totalGuesses || 0) >= 10 ? 1 : 0.5 }}
            onMouseEnter={e => { if ((state.stats.totalGuesses || 0) >= 10) e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      {/* Practice Arcade */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#22c55e" }}>🎮 Practice Arcade</span>
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 12, textAlign: "center", maxWidth: 320 }}>60 seconds, Stage 1 words only. No leaderboard!</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {[{ id: "treble", label: "Practice Treble", sym: "𝄞" }, { id: "bass", label: "Practice Bass", sym: "𝄢" }].map(c => (
          <button key={c.id} onClick={() => dispatch({ type: "ARCADE_START", clef: c.id, pool: STAGE1_WORDS, practice: true })}
            style={{ padding: "10px 18px", borderRadius: 14, border: "3px solid #22c55e", background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: ff, color: "#166534", boxShadow: "0 4px 16px rgba(34,197,94,.12)", transition: "all .2s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 22, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      {/* Full Arcade */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: fullArcadeUnlocked ? "#f59e0b" : "#9ca3af" }}>⏱️ Full Arcade</span>
        {!fullArcadeUnlocked && <span style={{ fontSize: 11, color: "#d1d5db", background: "#f3f4f6", borderRadius: 6, padding: "2px 8px" }}>🔒 Unlock Stage 3</span>}
      </div>
      <p style={{ color: "#9ca3af", fontSize: 12, marginBottom: 14, textAlign: "center", maxWidth: 320 }}>60 seconds, all words, leaderboard enabled!</p>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 20, opacity: fullArcadeUnlocked ? 1 : .4 }}>
        {[{ id: "treble", label: "Arcade Treble", sym: "𝄞" }, { id: "bass", label: "Arcade Bass", sym: "𝄢" }].map(c => (
          <button key={c.id} onClick={() => { if (fullArcadeUnlocked) dispatch({ type: "ARCADE_START", clef: c.id }); }}
            disabled={!fullArcadeUnlocked}
            style={{ padding: "12px 22px", borderRadius: 14, border: "3px solid #f59e0b", background: "linear-gradient(135deg,#fffbeb,#fef3c7)", cursor: fullArcadeUnlocked ? "pointer" : "not-allowed", fontSize: 14, fontWeight: 600, fontFamily: ff, color: "#92400e", boxShadow: fullArcadeUnlocked ? "0 4px 16px rgba(245,158,11,.15)" : "none", transition: "all .2s ease", animation: fullArcadeUnlocked ? "glow 2s ease-in-out infinite" : "none" }}
            onMouseEnter={e => { if (fullArcadeUnlocked) e.currentTarget.style.transform = "scale(1.05) translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "" }}
          ><span style={{ fontSize: 26, display: "block", marginBottom: 2 }}>{c.sym}</span>{c.label}</button>))}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {leaderboard.length > 0 && <button onClick={() => dispatch({ type: "SHOW_LB" })} style={{ background: "none", border: "2px solid #f59e0b44", borderRadius: 10, padding: "6px 18px", color: "#f59e0b", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>🏆 Arcade LB</button>}
        <button onClick={() => dispatch({ type: "SHOW_STATS" })} style={{ background: "none", border: "2px solid #7c3aed44", borderRadius: 10, padding: "6px 18px", color: "#7c3aed", fontSize: 13, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📊 Stats</button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  //  ARCADE
  // ═══════════════════════════════════════
  if (state.phase === "arcade") {
    const letters = state.word ? state.word.w.split("") : [];
    const slotSet = new Set(state.slots);
    const slotMap = {}; state.slots.forEach((wi, si) => { slotMap[wi] = si; });
    const useExt = state.word && state.word.w.length >= 5;
    const pct = timeLeft / 60 * 100;
    const tc = pct > 50 ? "#4ade80" : pct > 20 ? "#f59e0b" : "#ef4444";
    const noteCount = letters.length;
    const noteScale = noteCount > 5 ? Math.max(0.7, 5 / noteCount) : 1;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0f0a1a,#1a1128,#12091e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{css}</style>
        {state.arcadeOver && <ArcadeEnd state={state} dispatch={dispatch} leaderboard={leaderboard} setLeaderboard={setLeaderboard} clearTimer={clearTimer} fontFamily={ff} />}

        <div style={{ width: "100%", maxWidth: 500, marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Quit</button>
            <LevelBadgeDark stats={state.stats} />
            <div style={{ color: tc, fontSize: 28, fontWeight: 700, fontFamily: "'Courier New',monospace", animation: timeLeft < 10 ? "pulse .5s ease-in-out infinite" : "none" }}>
              {Math.ceil(timeLeft)}s
            </div>
            <div style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "white", borderRadius: 12, padding: "4px 14px", fontSize: 20, fontWeight: 700 }}>{state.arcadeScore}</div>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#2a1f3a", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 4, background: tc, width: `${pct}%`, transition: "width .1s linear" }} />
          </div>
        </div>

        <div style={{ color: "#9ca3af", fontSize: 11, marginBottom: 6 }}>
          {state.clef === "treble" ? "𝄞 Treble" : "𝄢 Bass"}
          {state.arcadePractice && <span style={{ color: "#22c55e", marginLeft: 8 }}>Practice</span>}
        </div>

        <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

        <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto", transform: noteScale < 1 ? `scale(${noteScale})` : undefined, transformOrigin: "center top" }}>
          {letters.map((ch, wi) => {
            const isSlot = slotSet.has(wi); const si = slotMap[wi];
            const active = isSlot && si === state.slotIndex && !state.arcadeOver && !state.arcadeWordDone;
            const hlVal = isSlot ? state.highlights[si] || null : null;
            if (!isSlot) return <PreFilled key={wi} letter={ch} dark />;
            return (<div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #f59e0b" : "2px solid transparent", background: active ? "#f59e0b11" : "transparent", transition: "all .2s ease", animation: active ? "bounce 1s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct"} extended={useExt} dark shake={hlVal === "wrong"} />
            </div>);
          })}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 480 }}>
          {letters.map((ch, wi) => {
            const isSlot = slotSet.has(wi); const si = slotMap[wi]; const got = isSlot && state.guessed[si];
            return (<div key={wi} style={{ width: 32, height: 38, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#312e81,#3730a3)" : got ? "linear-gradient(135deg,#4ade80,#16a34a)" : "#1a1128", border: !isSlot ? "2px solid #4338ca" : "2px solid #2a1f3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#a5b4fc" : got ? "white" : "#5a5070", transition: "all .2s ease", animation: got ? "popIn .2s ease" : "none" }}>
              {!isSlot ? ch : (got ? state.guessed[si] : "·")}
            </div>);
          })}
        </div>

        <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
          {["A", "B", "C", "D", "E", "F", "G"].map(n => (
            <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "ARCADE_PICK", note })} disabled={state.arcadeOver || state.arcadeWordDone} gold />))}
        </div>
        <div style={{ color: "#5a5070", fontSize: 11, marginTop: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <span>💡 Press A–G on keyboard!</span>
          <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
        </div>
        {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  SONG MODE
  // ═══════════════════════════════════════
  if (state.phase === "song") {
    const song = SONGS[state.songIndex];
    const notes = state.songNotes || [];
    // Show a window of notes around current position
    const progress = notes.length > 0 ? Math.round((state.songCorrect / notes.length) * 100) : 0;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0f0a1a,#1a1128,#12091e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{css}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 540, marginBottom: 8 }}>
          <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
          <LevelBadgeDark stats={state.stats} />
          <div style={{ color: song.color, fontSize: 14, fontWeight: 700 }}>🎵 {song.title}</div>
          <div style={{ color: "#6b7280", fontSize: 11 }}>{song.composer}</div>
        </div>

        {/* Song selector */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
          {SONGS.map((s, i) => (
            <button key={s.id} onClick={() => dispatch({ type: "SONG_SELECT", index: i })}
              style={{
                padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, fontFamily: ff,
                border: `2px solid ${i === state.songIndex ? s.color : s.color + "44"}`,
                background: i === state.songIndex ? s.color + "22" : "transparent",
                color: s.color, cursor: "pointer",
              }}>{s.title}</button>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", maxWidth: 400, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ color: "#9ca3af", fontSize: 11 }}>Note {Math.min(state.songNoteIndex + 1, notes.length)}/{notes.length}</span>
            <span style={{ color: song.color, fontSize: 11, fontWeight: 600 }}>{progress}%</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: "#2a1f3a", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: song.color, width: `${progress}%`, transition: "width .2s ease" }} />
          </div>
        </div>

        <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

        {/* Staff — all notes, auto-scrolls to current */}
        <div ref={songScrollRef} className="songScroll" style={{ display: "flex", justifyContent: "flex-start", flexWrap: "nowrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 700, width: "100%", overflowX: "auto" }}>
          {notes.map((note, i) => {
            const isCurrent = i === state.songNoteIndex && !state.songDone;
            const hlVal = state.highlights[i] || null;
            const isPast = i < state.songNoteIndex;
            return (
              <div key={i} ref={el => { noteRefs.current[i] = el; }} style={{
                borderRadius: 12, flexShrink: 0,
                border: isCurrent ? `2px solid ${song.color}` : "2px solid transparent",
                background: isCurrent ? song.color + "11" : "transparent",
                opacity: isPast ? 0.5 : 1,
                transition: "all .2s ease",
                animation: isCurrent ? "bounce 1s ease-in-out infinite" : "none",
              }}>
                <Staff note={note} clef={state.clef} highlight={hlVal || (isPast ? "correct" : null)}
                  showLabel={isPast || hlVal === "correct" || hlVal === "reveal"} extended={false} dark
                  shake={hlVal === "wrong"} songMode />
              </div>
            );
          })}
        </div>

        {/* Note index indicators */}
        <div style={{ display: "flex", gap: 2, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 500 }}>
          {notes.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i < state.songNoteIndex ? "#4ade80" : i === state.songNoteIndex ? song.color : "#3a3050",
              transition: "all .15s ease",
            }} />
          ))}
        </div>

        {!state.songDone ? (
          <>
            <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
              {["A", "B", "C", "D", "E", "F", "G"].map(n => (
                <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "SONG_PICK", note })} disabled={state.songDone} gold />))}
            </div>
            <div style={{ color: "#5a5070", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span>💡 Press A–G on keyboard!</span>
              <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
            </div>
            {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
            <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Song Complete!</div>
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>{state.songCorrect}/{notes.length} notes</div>
            <button onClick={() => playSongMelody(notes, state.clef, () => setPlayingSong(true), () => setPlayingSong(false), song.rhythm)}
              disabled={playingSong}
              style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: playingSong ? "#d1d5db" : "linear-gradient(135deg,#f59e0b,#f97316)", color: "white", fontSize: 15, fontWeight: 700, fontFamily: ff, cursor: playingSong ? "default" : "pointer", marginBottom: 12, transition: "all .2s" }}>
              {playingSong ? "🎵 Playing..." : "🎵 Listen to Melody"}
            </button>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => dispatch({ type: "SONG_SELECT", index: state.songIndex })}
                style={{ padding: "10px 22px", borderRadius: 12, border: `2px solid ${song.color}`, background: "transparent", color: song.color, fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Replay</button>
              {state.songIndex + 1 < SONGS.length && (
                <button onClick={() => dispatch({ type: "SONG_SELECT", index: state.songIndex + 1 })}
                  style={{ padding: "10px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${song.color},${song.color}cc)`, color: "white", fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Next Song →</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  STORY MODE
  // ═══════════════════════════════════════
  if (state.phase === "story") {
    const chapter = STORY_CHAPTERS[state.storyChapter];
    const letters = state.word ? state.word.w.split("") : [];
    const slotSet = new Set(state.slots);
    const slotMap = {}; state.slots.forEach((wi, si) => { slotMap[wi] = si; });

    if (state.storyComplete) {
      return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#0a2a1a,#1a4a2a,#0a3a1a)", fontFamily: ff, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <style>{css}</style>
          <Confetti show={true} />
          <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
          <h1 style={{ color: "#4ade80", fontSize: 32, margin: "0 0 8px", textAlign: "center" }}>Quest Complete!</h1>
          <p style={{ color: "#86efac", fontSize: 16, textAlign: "center", maxWidth: 360, lineHeight: 1.6, marginBottom: 8 }}>
            You've restored music to the realm! The Whispering Woods sing once more, the dragon hums along, and the enchantress dances with joy.
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>Chapters completed: {STORY_CHAPTERS.length}/{STORY_CHAPTERS.length}</p>
          {STORY_CHAPTERS[STORY_CHAPTERS.length - 1].scene(true)}
          <button onClick={() => dispatch({ type: "MENU" })} style={{ marginTop: 20, padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#4ade80,#16a34a)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer" }}>Back to Menu</button>
        </div>
      );
    }

    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${chapter.bg},#0a0a1a)`, fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{css}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 500, marginBottom: 8 }}>
          <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Quit</button>
          <LevelBadgeDark stats={state.stats} />
          <div style={{ color: "#c084fc", fontSize: 12, fontWeight: 600 }}>Chapter {chapter.id}/{STORY_CHAPTERS.length}</div>
          <div style={{ width: 50 }} />
        </div>

        {/* Chapter progress dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {STORY_CHAPTERS.map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < state.storyChapter ? "#4ade80" : i === state.storyChapter ? "#c084fc" : "#3a3050", transition: "all .3s ease" }} />
          ))}
        </div>

        <h2 style={{ color: "#e2e8f0", fontSize: 20, margin: "0 0 8px", textAlign: "center" }}>{chapter.title}</h2>

        {/* SVG Scene */}
        <div style={{ marginBottom: 12, width: "100%", maxWidth: 360 }}>
          {chapter.scene(state.storyWordDone)}
        </div>

        {/* Narrative */}
        <div style={{ background: "#1a112888", borderRadius: 12, padding: "10px 18px", marginBottom: 10, border: "1px solid #2a1f3a", maxWidth: 420, textAlign: "center" }}>
          <p style={{ color: "#c4b5fd", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{chapter.narrative}</p>
        </div>

        <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 8, border: "1px solid #2a1f3a", fontSize: 13, color: "#fbbf24", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

        {/* Staff */}
        <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "#1a1128", borderRadius: 16, padding: "6px 8px", border: "1px solid #2a1f3a", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto" }}>
          {letters.map((ch, wi) => {
            const isSlot = slotSet.has(wi); const si = slotMap[wi];
            const active = isSlot && si === state.slotIndex && !state.storyWordDone;
            const hlVal = isSlot ? state.highlights[si] || null : null;
            if (!isSlot) return <PreFilled key={wi} letter={ch} dark />;
            return (<div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #c084fc" : "2px solid transparent", background: active ? "#c084fc11" : "transparent", transition: "all .2s ease", animation: active ? "bounce 1s ease-in-out infinite" : "none" }}>
              <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={false} dark shake={hlVal === "wrong"} />
            </div>);
          })}
        </div>

        {/* Letter tiles */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 480 }}>
          {letters.map((ch, wi) => {
            const isSlot = slotSet.has(wi); const si = slotMap[wi]; const got = isSlot && state.guessed[si];
            return (<div key={wi} style={{ width: 32, height: 38, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#312e81,#3730a3)" : got ? "linear-gradient(135deg,#4ade80,#16a34a)" : "#1a1128", border: !isSlot ? "2px solid #4338ca" : "2px solid #2a1f3a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#a5b4fc" : got ? "white" : "#5a5070", transition: "all .2s ease", animation: got ? "popIn .2s ease" : "none" }}>
              {!isSlot ? ch : (got ? state.guessed[si] : "·")}
            </div>);
          })}
        </div>

        {!state.storyWordDone ? (
          <>
            <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
              {["A", "B", "C", "D", "E", "F", "G"].map(n => (
                <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "STORY_PICK", note })} disabled={state.storyWordDone} gold />))}
            </div>
            <div style={{ color: "#5a5070", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span>💡 Press A–G on keyboard!</span>
              <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
            </div>
            {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
          </>
        ) : (
          <button onClick={() => dispatch({ type: "STORY_NEXT" })}
            style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#c084fc,#7c3aed)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer", animation: "popIn .4s ease", marginTop: 8 }}>
            {state.storyChapter + 1 >= STORY_CHAPTERS.length ? "🏆 Finish Quest!" : "Continue →"}
          </button>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  SCRAMBLE MODE
  // ═══════════════════════════════════════
  if (state.phase === "scramble") {
    const word = state.scrambleWord;
    const scrambledNotes = state.scrambleNotes || [];
    const wordLetters = word ? word.w.split("") : [];
    const pct = state.scrambleTotal > 0 ? Math.round(state.scrambleScore / state.scrambleTotal * 100) : 0;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#1a0a2e,#2d1b69,#1a0a2e)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{css}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 540, marginBottom: 8 }}>
          <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
          <LevelBadgeDark stats={state.stats} />
          <div style={{ color: "#8b5cf6", fontSize: 16, fontWeight: 700 }}>🔀 Scramble Mode</div>
          <div style={{ color: "#6b7280", fontSize: 11 }}>{state.scrambleScore}/{state.scrambleTotal} correct</div>
        </div>

        {/* Message */}
        <div style={{ background: "#1a1128", borderRadius: 12, padding: "6px 18px", marginBottom: 12, border: "1px solid #2a1f3a", fontSize: 13, color: "#c084fc", fontWeight: 500, maxWidth: 460, textAlign: "center" }}>{state.message}</div>

        {/* Scrambled notes — the puzzle */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", marginBottom: 6 }}>📖 These notes are scrambled — read them and figure out the word!</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", background: "#1a1128", borderRadius: 16, padding: "8px 12px", border: "1px solid #2a1f3a" }}>
            {scrambledNotes.map((note, i) => (
              <div key={i} style={{ borderRadius: 10, border: "2px solid #8b5cf644", background: "#1a112844", padding: "2px 0" }}>
                <Staff note={note} clef={state.clef} highlight={null} showLabel={false} extended={false} dark />
              </div>
            ))}
          </div>
        </div>

        {/* Answer slots — the word to build */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#9ca3af", fontSize: 11, textAlign: "center", marginBottom: 6 }}>🎯 Spell the word in the correct order:</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap" }}>
            {wordLetters.map((ch, i) => {
              const isCurrent = i === state.scrambleSlotIndex && !state.scrambleDone;
              const hl = state.scrambleHL[i] || null;
              const guessed = state.scrambleGuessed[i];
              return (
                <div key={i} style={{
                  width: 48, height: 56, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  border: isCurrent ? "3px solid #8b5cf6" : hl === "correct" ? "3px solid #4ade80" : hl === "reveal" ? "3px solid #fbbf24" : hl === "wrong" ? "3px solid #f87171" : "3px solid #3a3050",
                  background: isCurrent ? "#8b5cf611" : hl === "correct" ? "#4ade8011" : hl === "reveal" ? "#fbbf2411" : "#1a1128",
                  transition: "all .2s ease",
                  animation: isCurrent ? "bounce 1s ease-in-out infinite" : hl === "wrong" ? "shakeNote 0.35s ease-in-out" : "none",
                }}>
                  <span style={{
                    fontSize: 24, fontWeight: 700, fontFamily: "'Fredoka',sans-serif",
                    color: guessed ? (hl === "correct" ? "#4ade80" : hl === "reveal" ? "#fbbf24" : "#e2d5f5") : "#3a3050",
                  }}>
                    {guessed || "?"}
                  </span>
                  <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 500 }}>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {!state.scrambleDone ? (
          <>
            <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
              {["A", "B", "C", "D", "E", "F", "G"].map(n => (
                <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "SCRAMBLE_PICK", note })} disabled={state.scrambleDone} gold />))}
            </div>
            <div style={{ color: "#5a5070", fontSize: 11, marginTop: 10, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span>💡 Press A–G on keyboard!</span>
              <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
            </div>
            {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 42, marginBottom: 8 }}>{state.scrambleScore > 0 ? "🎉" : "📝"}</div>
            <div style={{ color: "#4ade80", fontSize: 18, fontWeight: 700, marginBottom: 4 }}>"{word.w}"</div>
            <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>{word.h}</div>
            <button onClick={() => dispatch({ type: "SCRAMBLE_NEXT" })}
              style={{ padding: "12px 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer", transition: "all .2s" }}>
              Next Word →
            </button>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  PRACTICE WEAK NOTES
  // ═══════════════════════════════════════
  if (state.phase === "weak") {
    const wLetters = state.word ? state.word.w.split("") : [];
    const wSlotSet = new Set(state.slots);
    const wSlotMap = {}; state.slots.forEach((wi, si) => { wSlotMap[wi] = si; });
    const analysis = analyzeWeakNotes(state.stats);
    const pct = state.weakTotal > 0 ? Math.round(state.weakScore / state.weakTotal * 100) : 0;

    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#fef2f2,#fce7f3,#ede9fe)", fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <style>{css}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 500, marginBottom: 10 }}>
          <button onClick={() => dispatch({ type: "MENU" })} style={{ background: "none", border: "none", fontSize: 13, color: "#9ca3af", cursor: "pointer", fontFamily: ff }}>← Menu</button>
          <LevelBadge stats={state.stats} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <span style={{ color: "#dc2626", fontSize: 16, fontWeight: 700 }}>Weak Notes Practice</span>
          </div>
          <div style={{ background: "#dc262622", borderRadius: 10, padding: "4px 10px" }}>
            <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>{pct}%</span>
          </div>
        </div>

        {/* Weakness report card */}
        <div style={{ background: "white", borderRadius: 16, padding: "12px 16px", width: "100%", maxWidth: 500, marginBottom: 12, border: "2px solid #fecaca" }}>
          <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 600, marginBottom: 8 }}>Your Note Accuracy:</div>
          <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
            {analysis.map(n => {
              const isWeak = state.weakNotes?.includes(n.note);
              const accPct = n.accuracy >= 0 ? Math.round(n.accuracy * 100) : null;
              const color = accPct === null ? "#d1d5db" : accPct >= 80 ? "#4ade80" : accPct >= 60 ? "#facc15" : "#f87171";
              return (
                <div key={n.note} style={{ textAlign: "center", padding: "4px 8px", borderRadius: 8, background: isWeak ? "#fef2f2" : "#f9fafb", border: isWeak ? "2px solid #f87171" : "1px solid #e5e7eb", minWidth: 40 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: isWeak ? "#dc2626" : "#374151" }}>{n.note}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color }}>{accPct !== null ? `${accPct}%` : "new"}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>{n.attempts > 0 ? `${n.attempts}×` : ""}</div>
                </div>
              );
            })}
          </div>
          {state.weakNotes && (
            <div style={{ fontSize: 11, color: "#dc2626", marginTop: 6, textAlign: "center", fontWeight: 500 }}>
              Focusing on: {state.weakNotes.map(n => <span key={n} style={{ fontWeight: 700, margin: "0 2px" }}>{n}</span>)}
            </div>
          )}
        </div>

        {/* Score bar */}
        <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 13, color: "#6b7280" }}>
          <span>✅ {state.weakScore} correct</span>
          <span>📝 {state.weakTotal} total</span>
          <span>🎯 {pct}% accuracy</span>
        </div>

        {/* Staff */}
        {state.word && (
          <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "white", borderRadius: 16, padding: "6px 8px", boxShadow: "0 2px 14px rgba(0,0,0,.06)", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto" }}>
            {wLetters.map((ch, wi) => {
              const isSlot = wSlotSet.has(wi); const si = wSlotMap[wi];
              const active = isSlot && si === state.slotIndex && !state.isDone;
              const hlVal = isSlot ? state.highlights[si] || null : null;
              if (!isSlot) return <PreFilled key={wi} letter={ch} />;
              return (<div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #dc2626" : "2px solid transparent", background: active ? "#fef2f2" : "transparent", transition: "all .25s ease", animation: active ? "bounce 1.2s ease-in-out infinite" : "none" }}>
                <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={false} shake={hlVal === "wrong"} />
              </div>);
            })}
          </div>
        )}

        {/* Message */}
        <div style={{ color: "#991b1b", fontSize: 14, fontWeight: 500, marginBottom: 8, textAlign: "center", minHeight: 22 }}>{state.message}</div>

        {/* Word display */}
        {state.word && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {wLetters.map((ch, wi) => {
              const isSlot = wSlotSet.has(wi);
              const si = wSlotMap[wi];
              const got = state.guessed[si];
              const hl = state.highlights[si];
              const isWeak = state.weakNotes?.includes(ch);
              let bg = !isSlot ? (isWeak ? "#fecaca" : "#ede9fe") : got ? "#4ade80" : "white";
              if (hl === "wrong") bg = "#f87171";
              if (hl === "reveal") bg = "#f59e0b";
              const isCurrent = isSlot && si === state.slotIndex && !state.isDone;
              return (
                <div key={wi} style={{ width: 40, height: 46, borderRadius: 10, background: bg, border: isCurrent ? "3px solid #dc2626" : isWeak && !isSlot ? "2px solid #f87171" : "2px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, fontFamily: ff, color: !isSlot ? (isWeak ? "#dc2626" : "#5b21b6") : got ? "white" : "#9ca3af", transition: "all .2s ease", animation: hl === "wrong" ? "shakeNote .4s ease" : got ? "popIn .2s ease" : isCurrent ? "pulse 1.5s ease-in-out infinite" : "none" }}>
                  {!isSlot ? ch : (got ? state.guessed[si] : "·")}
                </div>
              );
            })}
          </div>
        )}

        {/* Note buttons */}
        {!state.isDone ? (
          <div>
            <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
              {["A", "B", "C", "D", "E", "F", "G"].map(n => {
                const isWeak = state.weakNotes?.includes(n);
                return <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "WEAK_PICK", note })} disabled={state.isDone} gold={isWeak} />;
              })}
            </div>
            <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 10, textAlign: "center", display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <span>Press A–G on keyboard! Weak notes highlighted gold.</span>
              <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #dc262644", borderRadius: 8, padding: "3px 10px", color: "#dc2626", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
            </div>
            {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}
          </div>
        ) : (
          <div style={{ textAlign: "center", animation: "popIn .3s ease" }}>
            <div style={{ color: "#4ade80", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Next word coming...</div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  NORMAL GAME
  // ═══════════════════════════════════════
  const letters = state.word ? state.word.w.split("") : [];
  const slotSet = new Set(state.slots);
  const useExt = STAGES[state.stageIndex].id === 3;
  const slotMap = {}; state.slots.forEach((wi, si) => { slotMap[wi] = si; });
  const stage = STAGES[state.stageIndex];
  const noteCount = letters.length;
  const noteScale = noteCount > 5 ? Math.max(0.7, 5 / noteCount) : 1;

  return (
    <div style={{ minHeight: "100vh", background: bgGradient, fontFamily: ff, padding: "14px 14px calc(120px + env(safe-area-inset-bottom, 0px))", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{css}</style>
      <Confetti show={state.showConfetti} />
      <StreakCelebration milestone={state.streakMilestone} />
      {state.showStats && <StatsPanel stats={state.stats} onClose={() => dispatch({ type: "HIDE_STATS" })} fontFamily={ff} />}
      {state.showStreakLB && <StreakLBOverlay state={state} dispatch={dispatch} streakLB={streakLB} addStreakScore={addStreakScore} saveStreakLB={saveStreakLB} getStreakLB={getStreakLB} setStreakLB={setStreakLB} fontFamily={ff} />}

      {state.popup && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, fontFamily: ff }}>
        <div style={{ background: "white", borderRadius: 24, padding: "32px 44px", textAlign: "center", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,.3)", animation: "popIn .4s ease" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
          <h2 style={{ color: state.popup.color, margin: "0 0 6px", fontSize: 22 }}>Stage {state.popup.id} Unlocked!</h2>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{state.popup.name}</div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>{state.popup.desc}</div>
          <button onClick={() => dispatch({ type: "DISMISS" })} style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: `linear-gradient(135deg,${state.popup.color},${state.popup.color}cc)`, color: "white", fontSize: 16, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Let's Go!</button>
        </div>
      </div>)}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 560, marginBottom: 4 }}>
        <button onClick={() => { clearTimer(); dispatch({ type: "MENU" }); }} style={{ background: "none", border: "none", fontSize: 13, color: "#7c3aed", cursor: "pointer", fontFamily: ff, fontWeight: 500 }}>← Back</button>
        <LevelBadge stats={state.stats} />
        <div style={{ background: `${stage.color}18`, border: `2px solid ${stage.color}44`, borderRadius: 8, padding: "2px 8px", fontSize: 11, color: stage.color, fontWeight: 600 }}>Stage {stage.id}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setSpeakWords(v => !v)} title={speakWords ? "Word reading: ON" : "Word reading: OFF"} style={{ background: "none", border: "none", fontSize: 14, color: speakWords ? "#7c3aed" : "#9ca3af", cursor: "pointer", padding: 0, position: "relative" }}>🔊{!speakWords && <span style={{ position: "absolute", top: -1, left: -1, fontSize: 16, color: "#ef4444" }}>╲</span>}</button>
          <button onClick={() => dispatch({ type: "SHOW_STATS" })} style={{ background: "none", border: "none", fontSize: 14, color: "#9ca3af", cursor: "pointer", padding: 0 }}>📊</button>
          {state.stats.butterflies > 0 && <div style={{ background: "linear-gradient(135deg,#c084fc,#a855f7)", color: "white", borderRadius: 12, padding: "4px 10px", fontSize: 14, fontWeight: 700 }}>🦋 {state.stats.butterflies}</div>}
          <div style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white", borderRadius: 12, padding: "4px 14px", fontSize: 16, fontWeight: 700 }}>⭐ {state.score}</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>{state.clef === "treble" ? "𝄞 Treble" : "𝄢 Bass"} · Word #{state.completed + 1}</div>
      <div style={{ margin: "4px 0 6px" }}><Caterpillar streak={state.streak} isButterfly={state.isButterfly} milestone={state.streakMilestone} /></div>

      {/* Active powerup indicators */}
      {(state.doubleActive || state.shieldActive) && (
        <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          {state.doubleActive && <span style={{ fontSize: 11, color: "#f59e0b", background: "#fef3c7", borderRadius: 6, padding: "2px 8px", fontWeight: 600, animation: "pulse 1.5s ease-in-out infinite" }}>✨ 2× Active</span>}
          {state.shieldActive && <span style={{ fontSize: 11, color: "#3b82f6", background: "#dbeafe", borderRadius: 6, padding: "2px 8px", fontWeight: 600, animation: "pulse 1.5s ease-in-out infinite" }}>🛡️ Shield Active</span>}
        </div>
      )}

      <PowerupsBar powerups={state.powerups} score={state.score} isDone={state.isDone} onBuy={handleBuyPowerup} onUse={handleUsePowerup} />

      <div style={{ background: "white", borderRadius: 12, padding: "7px 18px", marginBottom: 8, boxShadow: "0 2px 10px rgba(0,0,0,.06)", fontSize: 13, color: "#4b5563", fontWeight: 500, maxWidth: 460, textAlign: "center", lineHeight: 1.4, animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>{state.message}</div>

      <div className="staffRow" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0, background: "white", borderRadius: 16, padding: "6px 8px", boxShadow: "0 2px 14px rgba(0,0,0,.06)", marginBottom: 6, maxWidth: 600, width: "100%", overflowX: "auto", transform: noteScale < 1 ? `scale(${noteScale})` : undefined, transformOrigin: "center top", animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi); const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.isDone;
          const hlVal = isSlot ? state.highlights[si] || null : null;
          if (!isSlot) return <PreFilled key={wi} letter={ch} />;
          return (<div key={wi} style={{ borderRadius: 12, border: active ? "2px solid #7c3aed" : "2px solid transparent", background: active ? "#f5f3ff" : "transparent", transition: "all .25s ease", animation: active ? "bounce 1.2s ease-in-out infinite" : "none" }}>
            <Staff note={ch} clef={state.clef} highlight={hlVal} showLabel={hlVal === "correct" || hlVal === "reveal"} extended={useExt} shake={hlVal === "wrong"} />
          </div>);
        })}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14, justifyContent: "center", flexWrap: "wrap", maxWidth: 480, animation: state.transitioning ? "fadeSlideOut 0.3s ease forwards" : "fadeSlideIn 0.3s ease" }}>
        {letters.map((ch, wi) => {
          const isSlot = slotSet.has(wi); const si = slotMap[wi];
          const active = isSlot && si === state.slotIndex && !state.isDone;
          const got = isSlot && state.guessed[si];
          return (<div key={wi} style={{ width: 33, height: 39, borderRadius: 8, background: !isSlot ? "linear-gradient(135deg,#e0e7ff,#c7d2fe)" : got ? "linear-gradient(135deg,#4ade80,#22c55e)" : "white", border: active ? "2.5px solid #7c3aed" : !isSlot ? "2px solid #a5b4fc" : "2px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, fontFamily: ff, color: !isSlot ? "#4338ca" : got ? "white" : "#d1d5db", transition: "all .3s ease", animation: got ? "popIn .3s ease" : "none" }}>
            {!isSlot ? ch : (got ? state.guessed[si] : "·")}
          </div>);
        })}
      </div>

      <div style={{ display: "flex", gap: "clamp(4px,1.5vw,8px)", flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {["A", "B", "C", "D", "E", "F", "G"].map(n => (
          <NoteBtn key={n} note={n} onPick={note => dispatch({ type: "PICK", note })} disabled={state.isDone} />))}
      </div>
      <div style={{ color: "#b4a0d0", fontSize: 11, marginTop: 8, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
        <span>💡 Press A–G on your keyboard!</span>
        <button onClick={() => setShowStaffHint(true)} style={{ background: "none", border: "1.5px solid #c084fc44", borderRadius: 8, padding: "3px 10px", color: "#c084fc", fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>📏 Staff Hint</button>
      </div>
      {showStaffHint && <StaffHint clef={state.clef} onClose={() => setShowStaffHint(false)} />}

      {state.wrongCount >= 3 && !state.isDone && <button onClick={() => dispatch({ type: "SKIP" })} style={{ marginTop: 10, background: "none", border: "2px solid #d1d5db", borderRadius: 10, padding: "6px 18px", color: "#9ca3af", fontSize: 12, fontFamily: ff, fontWeight: 500, cursor: "pointer" }}>Skip →</button>}

      {state.unlockedStages.length > 1 && <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {state.unlockedStages.map(si => (<button key={si} onClick={() => { clearTimer(); dispatch({ type: "SWITCH", index: si }); }} style={{ padding: "4px 10px", borderRadius: 8, border: `2px solid ${STAGES[si].color}${si === state.stageIndex ? "" : "44"}`, background: si === state.stageIndex ? `${STAGES[si].color}18` : "white", color: STAGES[si].color, fontSize: 11, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Stage {STAGES[si].id}</button>))}
      </div>}
    </div>
  );
}
