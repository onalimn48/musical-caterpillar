const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
let sharedAudioCtx = null;

function getAudioCtx() {
  if (!AudioCtxClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") sharedAudioCtx = new AudioCtxClass();
  if (sharedAudioCtx.state === "suspended") sharedAudioCtx.resume().catch(() => {});
  return sharedAudioCtx;
}

const NOTE_FREQ = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  "C#2": 69.3, "D#2": 77.78, "F#2": 92.5, "G#2": 103.83, "A#2": 116.54,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  "C#3": 138.59, "D#3": 155.56, "F#3": 185.0, "G#3": 207.65, "A#3": 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  "C#4": 277.18, "D#4": 311.13, "F#4": 369.99, "G#4": 415.3, "A#4": 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  "C#5": 554.37, "D#5": 622.25, "F#5": 739.99, "G#5": 830.61, "A#5": 932.33,
  C6: 1046.5, D6: 1174.7, E6: 1318.5, F6: 1396.9, G6: 1568.0, A6: 1760.0, B6: 1975.5,
  "C#6": 1108.73, "D#6": 1244.51, "F#6": 1479.98, "G#6": 1661.22, "A#6": 1864.66,
};

export function playNote(name, duration = 0.45) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const freq = NOTE_FREQ[name];
  if (!freq) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = freq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gain.gain.setValueAtTime(0.16, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  } catch (e) {
    // Ignore audio errors in unsupported/locked contexts.
  }
}
