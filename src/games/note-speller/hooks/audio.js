import { getRenderedNoteName } from "../data/staff.js";
import { getSharedAudioContext, playSampledPianoNote, warmPianoSamples } from "../../shared/audio/pianoSampler.js";

function getAudioCtx() {
  return getSharedAudioContext();
}

const FREQ_TABLE = {
  C1: 32.70, D1: 36.71, E1: 41.20, F1: 43.65, G1: 49.00, A1: 55.00, B1: 61.74,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, F6: 1396.91, G6: 1567.98, A6: 1760.0, B6: 1975.53,
};

export function getFrequency(note, clef, extended, songMode) {
  const noteName = getRenderedNoteName(note, clef, { extended, songMode });
  return FREQ_TABLE[noteName] || 440;
}

export function playNoteSound(freq, type = "correct") {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (type === "correct") {
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    playSampledPianoNote({
      midi,
      duration: 0.45,
      onFallback: () => playSynthNote(ctx, freq, type),
    });
    return;
  }
  playSynthNote(ctx, freq, type);
}

function playSynthNote(ctx, freq, type) {
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
  } catch (e) {}
}

export { warmPianoSamples };

export function playSuccessChime() {
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

export function playSongMelody(notes, clef, onStart, onEnd, rhythm) {
  const ctx = getAudioCtx();
  if (!ctx || !notes || !notes.length) return;
  if (onStart) onStart();
  try {
    const beatDur = 0.32;
    let t = ctx.currentTime + 0.05;
    notes.forEach((raw, i) => {
      const name = getRenderedNoteName(raw, clef, { songMode: true });
      const beats = rhythm && rhythm[i] ? rhythm[i] : 1;
      const dur = beats * beatDur;
      const noteMatch = /^([A-G])(\d)$/.exec(name);
      if (noteMatch) {
        playSampledPianoNote({
          name: noteMatch[1],
          octave: Number(noteMatch[2]),
          duration: dur * 0.95,
          delay: t - ctx.currentTime,
          onFallback: () => playSynthScheduled(ctx, FREQ_TABLE[name] || 440, t, dur),
        });
      } else {
        playSynthScheduled(ctx, FREQ_TABLE[name] || 440, t, dur);
      }
      t += dur;
    });
    const totalTime = (t - ctx.currentTime) * 1000 + 300;
    setTimeout(() => { if (onEnd) onEnd(); }, totalTime);
  } catch (e) { if (onEnd) onEnd(); }
}

function playSynthScheduled(ctx, freq, time, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.16, time + 0.02);
  gain.gain.setValueAtTime(0.16, time + duration * 0.75);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 0.95);
  osc.start(time);
  osc.stop(time + duration);
}

export function playPowerupSound() {
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
