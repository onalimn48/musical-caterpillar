import { INTERVAL_DB, SONG_SNIPPETS } from "../data/intervals.js";
import { getFreq } from "../state/gameLogic.js";

const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
let sharedCtx = null;

function getCtx() {
  if (!AudioCtxClass) return null;
  if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new AudioCtxClass();
  if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

export function playNote(name, octave, duration = 0.5, delay = 0, type = "triangle") {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const freq = getFreq(name, octave);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.setValueAtTime(0.18, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {}
}

export function playTwoNotes(n1, o1, n2, o2, cb) {
  playNote(n1, o1, 0.55, 0);
  playNote(n2, o2, 0.55, 0.4);
  if (cb) setTimeout(cb, 950);
}

export function playTogether(n1, o1, n2, o2) {
  playNote(n1, o1, 0.8, 0);
  playNote(n2, o2, 0.8, 0);
}

export function playSepThenTogether(n1, o1, n2, o2) {
  playNote(n1, o1, 0.5, 0);
  playNote(n2, o2, 0.5, 0.4);
  playNote(n1, o1, 0.7, 1.0);
  playNote(n2, o2, 0.7, 1.0);
}

export function playSongSnippet(intervalIdx, dir) {
  const iv = INTERVAL_DB[intervalIdx];
  const key = iv.short + "_" + dir;
  const notes = SONG_SNIPPETS[key];
  if (!notes) return;
  let t = 0;
  notes.forEach(([name, oct, dur]) => {
    playNote(name, oct, dur, t);
    t += dur * 0.85;
  });
}

export function playChord(notes, stagger = 0.12) {
  notes.forEach(([n, o], i) => playNote(n, o, 0.8, i * stagger));
}

export function playChordArpThenTogether(notes) {
  const arpGap = 0.4;
  notes.forEach(([n, o], i) => playNote(n, o, 0.45, i * arpGap));
  const togetherDelay = notes.length * arpGap + 0.3;
  notes.forEach(([n, o], i) => playNote(n, o, 0.9, togetherDelay + i * 0.05));
}

export function playChordArp(notes) {
  notes.forEach(([n, o], i) => playNote(n, o, 0.5, i * 0.35));
}

export function playChordSequence(chords, onDone) {
  const gap = 1.2;
  chords.forEach((notes, ci) => {
    notes.forEach(([n, o], ni) => playNote(n, o, 0.9, ci * gap + ni * 0.06));
  });
  if (onDone) setTimeout(onDone, chords.length * gap * 1000 + 500);
}

export function playBuzz() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.value = 110;
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
}

export function playChime() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch (e) {}
}
