const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
let sharedCtx = null;
const pianoBufferPromises = new Map();

const SEMITONES = {
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

const SAMPLE_FILES = [
  ["A0", "A0v4.ogg"],
  ["C1", "C1v4.ogg"],
  ["D#1", "Ds1v4.ogg"],
  ["F#1", "Fs1v4.ogg"],
  ["A1", "A1v4.ogg"],
  ["C2", "C2v4.ogg"],
  ["D#2", "Ds2v4.ogg"],
  ["F#2", "Fs2v4.ogg"],
  ["A2", "A2v4.ogg"],
  ["C3", "C3v4.ogg"],
  ["D#3", "Ds3v4.ogg"],
  ["F#3", "Fs3v4.ogg"],
  ["A3", "A3v4.ogg"],
  ["C4", "C4v4.ogg"],
  ["D#4", "Ds4v4.ogg"],
  ["F#4", "Fs4v4.ogg"],
  ["A4", "A4v4.ogg"],
  ["C5", "C5v4.ogg"],
  ["D#5", "Ds5v4.ogg"],
  ["F#5", "Fs5v4.ogg"],
  ["A5", "A5v4.ogg"],
  ["C6", "C6v4.ogg"],
  ["D#6", "Ds6v4.ogg"],
  ["F#6", "Fs6v4.ogg"],
  ["A6", "A6v4.ogg"],
  ["C7", "C7v4.ogg"],
  ["D#7", "Ds7v4.ogg"],
  ["F#7", "Fs7v4.ogg"],
  ["A7", "A7v4.ogg"],
  ["C8", "C8v4.ogg"],
];

function noteToMidi(name, octave) {
  return SEMITONES[name] + (octave + 1) * 12;
}

function parseNoteString(note) {
  const match = /^([A-G](?:#|b)?)(-?\d+)$/.exec(note);
  if (!match) return null;
  return { name: match[1], octave: Number(match[2]) };
}

const PIANO_SAMPLE_URLS = SAMPLE_FILES.map(([sampleKey, file]) => {
  const parsed = parseNoteString(sampleKey);
  const stem = file.replace(/\.ogg$/, "");
  return {
    sampleKey,
    urls: [
      `/chord-snowman-piano/${encodeURIComponent(file)}`,
      `/chord-snowman-piano/${encodeURIComponent(`${stem}.mp3`)}`,
    ],
    midi: noteToMidi(parsed.name, parsed.octave),
  };
});

export function getSharedAudioContext() {
  if (!AudioCtxClass) return null;
  if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new AudioCtxClass();
  if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

function getNearestSample(midi) {
  let nearest = PIANO_SAMPLE_URLS[0];
  let smallestDiff = Infinity;

  for (const sample of PIANO_SAMPLE_URLS) {
    const diff = Math.abs(sample.midi - midi);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearest = sample;
    }
  }

  return nearest;
}

function loadPianoBuffer(sample) {
  const ctx = getSharedAudioContext();
  if (!ctx) return Promise.resolve(null);

  if (!pianoBufferPromises.has(sample.sampleKey)) {
    pianoBufferPromises.set(
      sample.sampleKey,
      sample.urls
        .reduce(
          (promise, url) =>
            promise.catch(() =>
              fetch(url).then((response) => {
                if (!response.ok) {
                  throw new Error(`Failed to fetch ${url}: ${response.status}`);
                }
                return response.arrayBuffer().then((arrayBuffer) =>
                  ctx.decodeAudioData(arrayBuffer.slice(0)).then((buffer) => ({ ...sample, buffer, resolvedUrl: url })),
                );
              }),
            ),
          Promise.reject(),
        )
        .catch((error) => {
          pianoBufferPromises.delete(sample.sampleKey);
          throw error;
        }),
    );
  }

  return pianoBufferPromises.get(sample.sampleKey);
}

export function warmPianoSamples() {
  Promise.allSettled(PIANO_SAMPLE_URLS.map((sample) => loadPianoBuffer(sample))).catch(() => {});
}

export function playSampledPianoNote({ name, octave, midi, duration = 0.5, delay = 0, onFallback }) {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  const resolvedMidi = typeof midi === "number" ? midi : noteToMidi(name, octave);
  const nearest = getNearestSample(resolvedMidi);

  loadPianoBuffer(nearest)
    .then((sample) => {
      if (!sample?.buffer) {
        onFallback?.();
        return;
      }

      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = sample.buffer;
      source.playbackRate.value = 2 ** ((resolvedMidi - sample.midi) / 12);
      source.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + delay;
      const releaseStart = t + Math.max(0.12, duration * 0.92);
      const stopTime = t + duration + 0.26;

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.32, t + 0.01);
      gain.gain.setValueAtTime(0.32, releaseStart);
      gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

      source.start(t);
      source.stop(stopTime + 0.02);
    })
    .catch((error) => {
      console.warn("Piano sample fallback:", error);
      onFallback?.();
    });
}
