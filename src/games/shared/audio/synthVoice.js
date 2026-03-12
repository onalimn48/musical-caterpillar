import { getAudioContext, getMasterOutputNode, resumeAudioContext } from "./audioContext.js";

const NOTE_OFFSETS = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function noteNameToMidi(noteName) {
  if (typeof noteName !== "string") return null;

  const match = noteName.trim().match(/^([A-G](?:#|b)?)(-?\d+)$/);
  if (!match) return null;

  const [, pitchClass, octaveText] = match;
  const semitoneOffset = NOTE_OFFSETS[pitchClass];
  if (typeof semitoneOffset !== "number") return null;

  const octave = Number(octaveText);
  if (!Number.isInteger(octave)) return null;

  return (octave + 1) * 12 + semitoneOffset;
}

export function noteNameToFrequency(noteName) {
  const midi = noteNameToMidi(noteName);
  return midi === null ? null : midiToFrequency(midi);
}

function createNoiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate;
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

function applyEnvelope(gainNode, ctx, when, patch, peakGain) {
  const effectiveAttack = patch.oscType === "sawtooth"
    ? Math.max(0.022, patch.attack)
    : patch.attack;
  const attackEnd = when + effectiveAttack;
  const decayEnd = attackEnd + patch.decay;
  const sustainLevel = Math.max(0.0001, peakGain * patch.sustain);

  gainNode.gain.cancelScheduledValues(when);
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(Math.max(0.0001, peakGain), attackEnd);
  gainNode.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
}

function playSynthNoteInternal(ctx, noteName, patch, duration = 0.9, when = ctx.currentTime, velocityMultiplier = 1) {
  const frequency = noteNameToFrequency(noteName);
  if (!frequency) return;
  const accentStrength = Math.min(1.8, Math.max(0.85, velocityMultiplier));
  const accentBoost = Math.max(0, accentStrength - 1);

  const oscillator = ctx.createOscillator();
  const harmonicOscillator = patch.oscType === "sine" ? ctx.createOscillator() : null;
  const resonanceOscillator = patch.oscType === "sine" ? ctx.createOscillator() : null;
  const triangleRingOscillator = patch.oscType === "triangle" ? ctx.createOscillator() : null;
  const noiseSource = patch.noiseMix > 0.001 ? ctx.createBufferSource() : null;
  const filter = ctx.createBiquadFilter();
  const resonanceFilter = ctx.createBiquadFilter();
  const gainNode = ctx.createGain();
  const harmonicGainNode = harmonicOscillator ? ctx.createGain() : null;
  const resonanceGainNode = resonanceOscillator ? ctx.createGain() : null;
  const triangleRingGainNode = triangleRingOscillator ? ctx.createGain() : null;
  const noiseGainNode = noiseSource ? ctx.createGain() : null;
  const resonanceMixGain = ctx.createGain();
  const lfoOscillator = patch.lfoDepth > 0.001 ? ctx.createOscillator() : null;
  const lfoGain = lfoOscillator ? ctx.createGain() : null;
  const pitchLfoGain = lfoOscillator ? ctx.createGain() : null;
  const output = getMasterOutputNode();

  if (!output) return;

  oscillator.type = patch.oscType;
  oscillator.frequency.setValueAtTime(frequency, when);
  if (harmonicOscillator) {
    harmonicOscillator.type = "triangle";
    harmonicOscillator.frequency.setValueAtTime(frequency * 2, when);
  }
  if (resonanceOscillator) {
    resonanceOscillator.type = "sine";
    resonanceOscillator.frequency.setValueAtTime(Math.min(frequency * 3.2, 4200), when);
  }
  if (triangleRingOscillator) {
    triangleRingOscillator.type = "sine";
    triangleRingOscillator.frequency.setValueAtTime(Math.min(frequency * 2.6, 3200), when);
  }
  if (noiseSource) {
    noiseSource.buffer = getNoiseBuffer(ctx);
  }

  filter.type = "lowpass";
  // Light key tracking keeps low-register previews audible without flattening the
  // brightness control too much across the rest of the note range.
  const keyTrackingBoost = Math.min(380, Math.max(40, (frequency - 110) * 0.55));
  const keyTrackedCutoff = Math.min(12000, Math.max(160, patch.cutoff + keyTrackingBoost + accentBoost * 900));
  filter.frequency.setValueAtTime(keyTrackedCutoff, when);
  filter.Q.setValueAtTime(patch.resonance, when);

  const brightness = Math.min(1, Math.max(0, (patch.cutoff - 240) / (4200 - 240)));
  const resonance = Math.min(1, Math.max(0, (patch.resonance - 0.6) / (12 - 0.6)));
  const noiseMix = Math.min(0.55, Math.max(0, patch.noiseMix || 0));
  const lfoDepth = Math.min(1, Math.max(0, patch.lfoDepth || 0));
  const lfoRate = Math.min(8, Math.max(0.2, patch.lfoRate || 1.8));
  const resonanceCenterMultiplier = patch.oscType === "square"
    ? 0.62 + brightness * 0.42
    : patch.oscType === "triangle"
      ? 0.72 + brightness * 0.46
      : patch.oscType === "sawtooth"
        ? 0.74 + brightness * 0.48
        : 1.05 + brightness * 0.85;
  const resonanceMixLevel = patch.oscType === "square"
    ? resonance * (0.085 + brightness * 0.1)
    : patch.oscType === "triangle"
      ? resonance * (0.11 + brightness * 0.12)
      : patch.oscType === "sawtooth"
        ? resonance * (0.065 + brightness * 0.08)
        : resonance * (0.05 + brightness * 0.085);

  resonanceFilter.type = "bandpass";
  resonanceFilter.frequency.setValueAtTime(
    Math.min(12000, Math.max(220, keyTrackedCutoff * resonanceCenterMultiplier)),
    when,
  );
  resonanceFilter.Q.setValueAtTime(2.4 + resonance * 18, when);
  resonanceMixGain.gain.setValueAtTime(0.0001, when);

  oscillator.connect(filter);
  oscillator.connect(resonanceFilter);
  if (harmonicOscillator && harmonicGainNode) {
    const harmonicLevel = 0.015 + brightness * 0.1 + resonance * 0.06;
    harmonicGainNode.gain.setValueAtTime(harmonicLevel, when);
    harmonicOscillator.connect(harmonicGainNode);
    harmonicGainNode.connect(filter);
    harmonicOscillator.connect(resonanceFilter);
  }
  if (resonanceOscillator && resonanceGainNode) {
    const resonanceLevel = resonance * (0.016 + brightness * 0.06);
    resonanceGainNode.gain.setValueAtTime(resonanceLevel, when);
    resonanceOscillator.connect(resonanceGainNode);
    resonanceGainNode.connect(filter);
    resonanceOscillator.connect(resonanceFilter);
  }
  if (triangleRingOscillator && triangleRingGainNode) {
    const triangleRingLevel = resonance * (0.02 + brightness * 0.03);
    triangleRingGainNode.gain.setValueAtTime(triangleRingLevel, when);
    triangleRingOscillator.connect(triangleRingGainNode);
    triangleRingGainNode.connect(filter);
    triangleRingOscillator.connect(resonanceFilter);
  }
  if (noiseSource && noiseGainNode) {
    const noiseLevel = noiseMix * (0.035 + brightness * 0.085);
    noiseGainNode.gain.setValueAtTime(noiseLevel, when);
    noiseSource.connect(noiseGainNode);
    noiseGainNode.connect(filter);
    noiseSource.connect(resonanceFilter);
  }
  filter.connect(gainNode);
  resonanceFilter.connect(resonanceMixGain);
  gainNode.connect(output);
  resonanceMixGain.connect(output);

  if (lfoOscillator && lfoGain) {
    lfoOscillator.type = "sine";
    lfoOscillator.frequency.setValueAtTime(lfoRate, when);
    const modulationAmount = lfoDepth * Math.max(120, keyTrackedCutoff * 0.34);
    lfoGain.gain.setValueAtTime(modulationAmount, when);
    lfoOscillator.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    if (pitchLfoGain) {
      const pitchDepthScale = patch.oscType === "sine"
        ? 0.028
        : patch.oscType === "triangle"
          ? 0.02
          : patch.oscType === "square"
            ? 0.015
            : 0.012;
      const pitchAmount = lfoDepth * Math.max(3.5, frequency * pitchDepthScale);
      pitchLfoGain.gain.setValueAtTime(pitchAmount, when);
      lfoOscillator.connect(pitchLfoGain);
      pitchLfoGain.connect(oscillator.frequency);
      if (harmonicOscillator) {
        const harmonicPitchLfoGain = ctx.createGain();
        harmonicPitchLfoGain.gain.setValueAtTime(pitchAmount * 2, when);
        lfoOscillator.connect(harmonicPitchLfoGain);
        harmonicPitchLfoGain.connect(harmonicOscillator.frequency);
      }
      if (resonanceOscillator) {
        const resonancePitchLfoGain = ctx.createGain();
        resonancePitchLfoGain.gain.setValueAtTime(pitchAmount * 3.2, when);
        lfoOscillator.connect(resonancePitchLfoGain);
        resonancePitchLfoGain.connect(resonanceOscillator.frequency);
      }
    }
  }

  const startTime = when;
  const stopTime = startTime + duration + patch.release + 0.08;
  const peakGain = Math.max(0.02, patch.volume * (1 + accentBoost * 1.05));
  const releaseStart = startTime + Math.max(duration * 0.65, patch.attack + patch.decay + 0.04);
  const pitchSmoothingTime = patch.oscType === "sawtooth" ? 0.016 : 0;
  const accentAttackReduction = Math.min(patch.attack * 0.45, accentBoost * 0.03);

  if (pitchSmoothingTime > 0) {
    oscillator.frequency.setValueAtTime(Math.max(40, frequency * 0.985), startTime);
    oscillator.frequency.linearRampToValueAtTime(frequency, startTime + pitchSmoothingTime);
    if (harmonicOscillator) {
      harmonicOscillator.frequency.setValueAtTime(Math.max(60, frequency * 2 * 0.985), startTime);
      harmonicOscillator.frequency.linearRampToValueAtTime(frequency * 2, startTime + pitchSmoothingTime);
    }
    if (resonanceOscillator) {
      const resonanceFrequency = Math.min(frequency * 3.2, 4200);
      resonanceOscillator.frequency.setValueAtTime(Math.max(80, resonanceFrequency * 0.985), startTime);
      resonanceOscillator.frequency.linearRampToValueAtTime(resonanceFrequency, startTime + pitchSmoothingTime);
    }
    if (triangleRingOscillator) {
      const triangleRingFrequency = Math.min(frequency * 2.6, 3200);
      triangleRingOscillator.frequency.setValueAtTime(Math.max(80, triangleRingFrequency * 0.99), startTime);
      triangleRingOscillator.frequency.linearRampToValueAtTime(triangleRingFrequency, startTime + pitchSmoothingTime);
    }
  }

  applyEnvelope(gainNode, ctx, startTime, {
    ...patch,
    attack: Math.max(0.005, patch.attack - accentAttackReduction),
  }, peakGain);
  gainNode.gain.setValueAtTime(Math.max(0.0001, peakGain * patch.sustain), releaseStart);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + patch.release);
  resonanceMixGain.gain.cancelScheduledValues(startTime);
  resonanceMixGain.gain.setValueAtTime(0.0001, startTime);
  const resonanceAttackFloor = patch.oscType === "sawtooth" ? 0.02 : 0.012;
  resonanceMixGain.gain.linearRampToValueAtTime(Math.max(0.0001, resonanceMixLevel), startTime + resonanceAttackFloor);
  resonanceMixGain.gain.setValueAtTime(Math.max(0.0001, resonanceMixLevel * 0.58), releaseStart);
  resonanceMixGain.gain.exponentialRampToValueAtTime(0.0001, releaseStart + patch.release * 0.75);
  if (noiseGainNode) {
    const noiseLevel = noiseMix * (0.035 + brightness * 0.085);
    noiseGainNode.gain.cancelScheduledValues(startTime);
    noiseGainNode.gain.setValueAtTime(0.0001, startTime);
    noiseGainNode.gain.linearRampToValueAtTime(Math.max(0.0001, noiseLevel), startTime + 0.015);
    noiseGainNode.gain.setValueAtTime(Math.max(0.0001, noiseLevel * 0.72), releaseStart);
    noiseGainNode.gain.exponentialRampToValueAtTime(0.0001, releaseStart + patch.release * 0.9);
  }

  oscillator.start(startTime);
  harmonicOscillator?.start(startTime);
  resonanceOscillator?.start(startTime);
  triangleRingOscillator?.start(startTime);
  noiseSource?.start(startTime);
  lfoOscillator?.start(startTime);
  oscillator.stop(stopTime);
  harmonicOscillator?.stop(stopTime);
  resonanceOscillator?.stop(stopTime);
  triangleRingOscillator?.stop(stopTime);
  noiseSource?.stop(stopTime);
  lfoOscillator?.stop(stopTime);
}

export async function playSynthPreview(noteName, patch, duration = 0.9) {
  const ctx = await resumeAudioContext();
  if (!ctx) return;

  playSynthNoteInternal(ctx, noteName, patch, duration, ctx.currentTime);
}

export function playScheduledSynthNote(noteName, patch, when, duration = 0.42, velocityMultiplier = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  playSynthNoteInternal(ctx, noteName, patch, duration, when, velocityMultiplier);
}

export function createAnalyser() {
  const ctx = getAudioContext();
  if (!ctx) return null;

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;
  return analyser;
}
