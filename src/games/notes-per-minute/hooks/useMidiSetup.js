import { useEffect, useState } from "react";

export function useMidiSetup() {
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected");

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }

    navigator.requestMIDIAccess().then((access) => {
      const updateDevices = () => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          setMidiDevice(inputs[0]);
          setMidiStatus("connected");
        } else {
          setMidiDevice(null);
          setMidiStatus("disconnected");
        }
      };

      updateDevices();
      access.onstatechange = updateDevices;
    }).catch(() => {
      setMidiStatus("unsupported");
    });
  }, []);

  return { midiDevice, midiStatus };
}
