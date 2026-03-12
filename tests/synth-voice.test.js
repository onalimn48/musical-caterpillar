import assert from "node:assert/strict";
import test from "node:test";

import { midiToFrequency, noteNameToFrequency, noteNameToMidi } from "../src/games/shared/audio/synthVoice.js";

test("noteNameToMidi resolves natural notes across octaves for the sequencer", () => {
  assert.equal(noteNameToMidi("C3"), 48);
  assert.equal(noteNameToMidi("F4"), 65);
  assert.equal(noteNameToMidi("B4"), 71);
  assert.equal(noteNameToMidi("C5"), 72);
});

test("noteNameToFrequency returns frequencies for sequencer notes and rejects malformed names", () => {
  assert.equal(noteNameToFrequency("F4"), midiToFrequency(65));
  assert.equal(noteNameToFrequency("B4"), midiToFrequency(71));
  assert.equal(noteNameToFrequency("nope"), null);
});
