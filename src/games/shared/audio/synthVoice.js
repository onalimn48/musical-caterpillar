import { getAudioContext, resumeAudioContext } from "./audioContext.js";

const NOTE_TO_MIDI = {
  C3: 48,
  D3: 50,
  E3: 52,
  G3: 55,
  A3: 57,
  C4: 60,
  D4: 62,
  E4: 64,
  G4: 67,
  A4: 69,
  C5: 72,
};

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteNameToFrequency(noteName) {
  const midi = NOTE_TO_MIDI[noteName];
  return midi ? midiToFrequency(midi) : null;
}

function applyEnvelope(gainNode, ctx, when, patch, peakGain) {
  const attackEnd = when + patch.attack;
  const decayEnd = attackEnd + patch.decay;
  const sustainLevel = Math.max(0.0001, peakGain * patch.sustain);

  gainNode.gain.cancelScheduledValues(when);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, peakGain), attackEnd);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
}

function playSynthNoteInternal(ctx, noteName, patch, duration = 0.9, when = ctx.currentTime) {
  const frequency = noteNameToFrequency(noteName);
  if (!frequency) return;

  const oscillator = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();

  oscillator.type = patch.oscType;
  oscillator.frequency.setValueAtTime(frequency, when);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(patch.cutoff, when);
  filter.Q.setValueAtTime(patch.resonance, when);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  const startTime = when;
  const stopTime = startTime + duration + patch.release + 0.08;
  const peakGain = Math.max(0.02, patch.volume);
  const releaseStart = startTime + Math.max(duration * 0.65, patch.attack + patch.decay + 0.04);

  applyEnvelope(gainNode, ctx, startTime, patch, peakGain);
  gainNode.gain.setValueAtTime(Math.max(0.0001, peakGain * patch.sustain), releaseStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + patch.release);

  oscillator.start(startTime);
  oscillator.stop(stopTime);
}

export async function playSynthPreview(noteName, patch, duration = 0.9) {
  const ctx = await resumeAudioContext();
  if (!ctx) return;

  playSynthNoteInternal(ctx, noteName, patch, duration, ctx.currentTime);
}

export function playScheduledSynthNote(noteName, patch, when, duration = 0.42) {
  const ctx = getAudioContext();
  if (!ctx) return;

  playSynthNoteInternal(ctx, noteName, patch, duration, when);
}

export function createAnalyser() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;
  return analyser;
}
