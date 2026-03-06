import { useEffect, useRef, useState } from "react";
import { MIDI_NAMES } from "../data/midi.js";

export function useMidiInput({ mode, tPhase, onTrainingPick, onClassicPick, onChordPick }) {
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected");

  const modeRef = useRef(mode);
  const tPhaseRef = useRef(tPhase);
  const tPickRef = useRef(onTrainingPick);
  const cPickRef = useRef(onClassicPick);
  const chPickRef = useRef(onChordPick);

  modeRef.current = mode;
  tPhaseRef.current = tPhase;
  tPickRef.current = onTrainingPick;
  cPickRef.current = onClassicPick;
  chPickRef.current = onChordPick;

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }
    navigator.requestMIDIAccess().then(access => {
      const update = () => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          setMidiDevice(inputs[0]);
          setMidiStatus("connected");
        } else {
          setMidiDevice(null);
          setMidiStatus("disconnected");
        }
      };
      update();
      access.onstatechange = update;
    }).catch(() => setMidiStatus("unsupported"));
  }, []);

  useEffect(() => {
    if (!midiDevice) return;
    const onMsg = e => {
      const [status, noteNum, velocity] = e.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const name = MIDI_NAMES[noteNum % 12];
        if (name.includes("#")) return;
        const m = modeRef.current;
        if (m === "training" && tPhaseRef.current === "practice") tPickRef.current(name);
        else if (m === "classic") cPickRef.current(name);
        else if (m === "chord") chPickRef.current(name);
      }
    };
    midiDevice.onmidimessage = onMsg;
    return () => {
      midiDevice.onmidimessage = null;
    };
  }, [midiDevice]);

  return { midiDevice, midiStatus };
}
