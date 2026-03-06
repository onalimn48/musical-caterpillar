import { MIDI_NOTE_NAMES } from "./constants.js";

export function midiToNoteName(midiNum) {
  const name = MIDI_NOTE_NAMES[midiNum % 12];
  const octave = Math.floor(midiNum / 12) - 1;
  return { letter: name, fullName: `${name}${octave}`, isBlackKey: name.includes("#") };
}
