import { getAudioContext, resumeAudioContext } from "./audioContext.js";

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

function playKick(ctx, when) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(138, when);
  oscillator.frequency.exponentialRampToValueAtTime(46, when + 0.18);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.95, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.24);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.3);
}

function playSnare(ctx, when) {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(1300, when);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, when);
  noiseGain.gain.exponentialRampToValueAtTime(0.5, when + 0.008);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);

  const tone = ctx.createOscillator();
  tone.type = "triangle";
  tone.frequency.setValueAtTime(182, when);

  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(0.22, when);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  tone.connect(toneGain);
  toneGain.connect(ctx.destination);

  noise.start(when);
  noise.stop(when + 0.16);
  tone.start(when);
  tone.stop(when + 0.12);
}

function playHat(ctx, when) {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(5200, when);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.18, when + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.05);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(when);
  noise.stop(when + 0.06);
}

export async function ensureSequencerAudioReady() {
  return resumeAudioContext();
}

export function playDrumHit(laneId, when = null) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const hitTime = when ?? ctx.currentTime;

  if (laneId === "kick") {
    playKick(ctx, hitTime);
    return;
  }

  if (laneId === "snare") {
    playSnare(ctx, hitTime);
    return;
  }

  playHat(ctx, hitTime);
}
