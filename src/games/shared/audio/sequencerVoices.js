import { getAudioContext, getMasterOutputNode, resumeAudioContext } from "./audioContext.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

let sharedNoiseBuffer = null;

function getNoiseBuffer(ctx) {
  if (!sharedNoiseBuffer || sharedNoiseBuffer.sampleRate !== ctx.sampleRate) {
    sharedNoiseBuffer = createNoiseBuffer(ctx);
  }

  return sharedNoiseBuffer;
}

const DEFAULT_DRUM_PATCHES = {
  kick: {
    oscType: "sine",
    cutoff: 1500,
    attack: 0.03,
    release: 0.24,
    volume: 0.95,
  },
  snare: {
    oscType: "triangle",
    cutoff: 1300,
    attack: 0.04,
    release: 0.14,
    volume: 0.5,
  },
  hat: {
    oscType: "square",
    cutoff: 5200,
    attack: 0.015,
    release: 0.05,
    volume: 0.18,
  },
};

function getDrumPatch(laneId, patch) {
  return {
    ...DEFAULT_DRUM_PATCHES[laneId],
    ...patch,
  };
}

function getEffectiveAttackTime(rawAttack, release, multiplier, min, max, releaseRatio = 0.25) {
  const normalized = clamp((rawAttack - 0.01) / (0.3 - 0.01), 0, 1);
  const curved = normalized * normalized;
  return Math.min(
    min + (max - min) * curved * multiplier,
    Math.max(min, release * releaseRatio),
  );
}

function playKick(ctx, when, patch) {
  const resolvedPatch = getDrumPatch("kick", patch);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const output = getMasterOutputNode();

  if (!output) return;

  oscillator.type = resolvedPatch.oscType;
  oscillator.frequency.setValueAtTime(138, when);
  oscillator.frequency.exponentialRampToValueAtTime(
    clamp(resolvedPatch.cutoff / 24, 38, 220),
    when + clamp(resolvedPatch.release * 0.75, 0.08, 0.36),
  );

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume, 0.05, 1.2),
    when + getEffectiveAttackTime(resolvedPatch.attack, resolvedPatch.release, 1, 0.002, 0.045, 0.22),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, when + clamp(resolvedPatch.release, 0.05, 0.48));

  oscillator.connect(gain);
  gain.connect(output);
  oscillator.start(when);
  oscillator.stop(when + clamp(resolvedPatch.release + 0.08, 0.14, 0.6));
}

function playSnare(ctx, when, patch) {
  const resolvedPatch = getDrumPatch("snare", patch);
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const output = getMasterOutputNode();

  if (!output) return;

  const snapNormalized = clamp((resolvedPatch.attack - 0.01) / (0.3 - 0.01), 0, 1);
  const snapCurve = Math.pow(snapNormalized, 0.7);
  const sharpness = 1 - snapCurve;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(
    clamp(resolvedPatch.cutoff * (0.82 + sharpness * 0.24), 650, 4200),
    when,
  );
  noiseFilter.Q.setValueAtTime(0.9 + sharpness * 1.4, when);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, when);
  noiseGain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume * (0.7 + sharpness * 0.3), 0.05, 0.8),
    when + (0.002 + 0.05 * snapCurve),
  );
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + clamp(resolvedPatch.release * 1.15, 0.05, 0.34));

  const tone = ctx.createOscillator();
  tone.type = resolvedPatch.oscType;
  tone.frequency.setValueAtTime(
    clamp((resolvedPatch.cutoff / 7) * (0.88 + sharpness * 0.2), 140, 560),
    when,
  );
  tone.frequency.exponentialRampToValueAtTime(
    clamp((resolvedPatch.cutoff / 12) * (0.86 + sharpness * 0.18), 90, 320),
    when + clamp(resolvedPatch.release * 0.7, 0.03, 0.18),
  );

  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.0001, when);
  toneGain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume * (0.34 + sharpness * 0.28), 0.04, 0.42),
    when + (0.002 + 0.036 * snapCurve),
  );
  toneGain.gain.exponentialRampToValueAtTime(0.0001, when + clamp(resolvedPatch.release * 0.95, 0.05, 0.24));

  const transientFilter = ctx.createBiquadFilter();
  transientFilter.type = "bandpass";
  transientFilter.frequency.setValueAtTime(
    clamp(resolvedPatch.cutoff * (1.05 + sharpness * 0.22), 1200, 5200),
    when,
  );
  transientFilter.Q.setValueAtTime(1.4 + sharpness * 3.2, when);

  const transientGain = ctx.createGain();
  transientGain.gain.setValueAtTime(0.0001, when);
  transientGain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume * sharpness * 0.12, 0.0001, 0.08),
    when + 0.0015,
  );
  transientGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.012 + sharpness * 0.012);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(output);
  noise.connect(transientFilter);
  transientFilter.connect(transientGain);
  transientGain.connect(output);

  tone.connect(toneGain);
  toneGain.connect(output);

  noise.start(when);
  noise.stop(when + clamp(resolvedPatch.release + 0.06, 0.09, 0.38));
  tone.start(when);
  tone.stop(when + clamp(resolvedPatch.release + 0.05, 0.08, 0.28));
}

function playHat(ctx, when, patch) {
  const resolvedPatch = getDrumPatch("hat", patch);
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  const output = getMasterOutputNode();

  if (!output) return;

  const snapNormalized = clamp((resolvedPatch.attack - 0.01) / (0.3 - 0.01), 0, 1);
  const sharpness = 1 - snapNormalized;
  const snapCurve = Math.pow(snapNormalized, 0.72);
  const brightnessDrop = 1 - snapCurve * 0.78;
  const brightnessNormalized = clamp((resolvedPatch.cutoff - 600) / (6000 - 600), 0, 1);
  const baseHighpass = 900 + brightnessNormalized * 7800;
  const transientCenter = 1800 + brightnessNormalized * 8800;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(
    clamp(baseHighpass * (0.82 + sharpness * 0.4), 900, 10400),
    when,
  );
  filter.frequency.exponentialRampToValueAtTime(
    clamp(baseHighpass * brightnessDrop, 700, 8200),
    when + clamp(resolvedPatch.release * 0.7, 0.02, 0.16),
  );

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume * (0.78 + sharpness * 0.38), 0.03, 0.42),
    when + getEffectiveAttackTime(resolvedPatch.attack, resolvedPatch.release, 1.15, 0.001, 0.03, 0.2),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, when + clamp(resolvedPatch.release * 1.2, 0.03, 0.3));

  const transientFilter = ctx.createBiquadFilter();
  transientFilter.type = "bandpass";
  transientFilter.frequency.setValueAtTime(
    clamp(transientCenter * (0.82 + sharpness * 0.96), 1800, 12000),
    when,
  );
  transientFilter.Q.setValueAtTime(1 + brightnessNormalized * 2 + sharpness * 5.6, when);

  const transientGain = ctx.createGain();
  transientGain.gain.setValueAtTime(0.0001, when);
  transientGain.gain.exponentialRampToValueAtTime(
    clamp(resolvedPatch.volume * sharpness * 0.34, 0.0001, 0.11),
    when + 0.0012,
  );
  transientGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.008 + sharpness * 0.018);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  noise.connect(transientFilter);
  transientFilter.connect(transientGain);
  transientGain.connect(output);

  noise.start(when);
  noise.stop(when + clamp(resolvedPatch.release * 1.15 + 0.03, 0.05, 0.34));
}

export async function ensureSequencerAudioReady() {
  return resumeAudioContext();
}

export function playDrumHit(laneId, when = null, patch = null) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const hitTime = when ?? ctx.currentTime;

  if (laneId === "kick") {
    playKick(ctx, hitTime, patch);
    return;
  }

  if (laneId === "snare") {
    playSnare(ctx, hitTime, patch);
    return;
  }

  playHat(ctx, hitTime, patch);
}
