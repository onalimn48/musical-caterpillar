import { useEffect, useRef, useState } from "react";
import { playSynthPreview } from "../../shared/audio/synthVoice.js";
import { resumeAudioContext } from "../../shared/audio/audioContext.js";
import {
  deleteSynthPatchRecord,
  loadSavedSynthPatches,
  renameSynthPatchRecord,
  saveSynthPatchRecord,
} from "../../shared/progression/storage.js";
import { DEFAULT_PATCH, initialState, LESSON_CARDS, NOTE_BUTTONS } from "./initialState.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getWaveSpeed(noteIndex) {
  return 0.9 + (noteIndex / Math.max(1, NOTE_BUTTONS.length - 1)) * 0.9;
}

function getWaveTravelMs(release, noteIndex) {
  const tailGlow = clamp((release - 0.08) / (1.1 - 0.08), 0, 1);
  return (300 + tailGlow * 420) / getWaveSpeed(noteIndex);
}

export function useSynthLabState() {
  const [state, setState] = useState(initialState);
  const singTimerRef = useRef(null);
  const waveRafRef = useRef(null);

  const derived = {
    brightness: clamp((state.patch.cutoff - 240) / (4200 - 240), 0, 1),
    tailGlow: clamp((state.patch.release - 0.08) / (1.1 - 0.08), 0, 1),
    snap: clamp((0.3 - state.patch.attack) / (0.3 - 0.01), 0, 1),
    lesson: LESSON_CARDS.find((item) => item.id === state.activeLessonId) || LESSON_CARDS[0],
    noteButtons: NOTE_BUTTONS,
    waveSpeed: getWaveSpeed(state.lastNoteIndex),
    waveTravelMs: getWaveTravelMs(state.patch.release, state.lastNoteIndex),
    shapeLabel: state.patch.oscType === "sawtooth"
      ? "Spiky"
      : state.patch.oscType === "square"
        ? "Chunky"
        : state.patch.oscType === "triangle"
          ? "Pointed"
          : "Smooth",
    savedPatchCount: state.savedPatches.length,
  };

  useEffect(() => {
    setState((current) => ({
      ...current,
      savedPatches: loadSavedSynthPatches(),
    }));
  }, []);

  function setPhase(phase) {
    setState((current) => ({ ...current, phase }));
  }

  function updatePatch(key, value) {
    setState((current) => ({
      ...current,
      patch: {
        ...current.patch,
        [key]: value,
      },
    }));
  }

  async function wakeAudioAndEnterLab() {
    await resumeAudioContext();
    setState((current) => ({
      ...current,
      audioReady: true,
      phase: "explore",
    }));
  }

  async function previewNote(noteName) {
    const noteIndex = Math.max(0, NOTE_BUTTONS.indexOf(noteName));
    const waveTravelMs = getWaveTravelMs(state.patch.release, noteIndex);

    await playSynthPreview(noteName, state.patch, 0.95);
    window.clearTimeout(singTimerRef.current);
    singTimerRef.current = window.setTimeout(() => {
      setState((current) => ({ ...current, singing: false, wavePhase: 0 }));
    }, waveTravelMs + 120);
    setState((current) => ({
      ...current,
      audioReady: true,
      lastNote: noteName,
      lastNoteIndex: noteIndex,
      singing: true,
      wavePhase: 0,
    }));
  }

  function resetPatch() {
    setState((current) => ({
      ...current,
      patch: DEFAULT_PATCH,
    }));
  }

  function saveCurrentPatch() {
    const patchId = `patch-${Date.now()}`;
    const patchRecord = {
      id: patchId,
      name: `${derived.shapeLabel} Garden ${state.savedPatches.length + 1}`,
      note: state.lastNote,
      patch: state.patch,
    };

    const savedPatches = saveSynthPatchRecord(patchRecord);
    setState((current) => ({
      ...current,
      savedPatches,
    }));
  }

  function loadPatch(patchRecord) {
    setState((current) => ({
      ...current,
      patch: {
        ...patchRecord.patch,
      },
      lastNote: patchRecord.note || current.lastNote,
      lastNoteIndex: Math.max(0, NOTE_BUTTONS.indexOf(patchRecord.note || current.lastNote)),
    }));
  }

  function deletePatch(patchId) {
    const savedPatches = deleteSynthPatchRecord(patchId);
    setState((current) => ({
      ...current,
      savedPatches,
    }));
  }

  function renamePatch(patchId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const savedPatches = renameSynthPatchRecord(patchId, trimmed);
    setState((current) => ({
      ...current,
      savedPatches,
    }));
  }

  async function previewSavedPatch(patchRecord) {
    await playSynthPreview(patchRecord.note || "C4", patchRecord.patch, 0.85);
  }

  useEffect(() => {
    if (!state.singing) {
      if (waveRafRef.current) {
        window.cancelAnimationFrame(waveRafRef.current);
        waveRafRef.current = null;
      }
      return undefined;
    }

    let startTime = null;

    const tick = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const normalizedPhase = Math.min(1.06, elapsed / derived.waveTravelMs);

      setState((current) => {
        if (!current.singing) {
          return current;
        }

        return {
          ...current,
          wavePhase: normalizedPhase,
        };
      });

      waveRafRef.current = window.requestAnimationFrame(tick);
    };

    waveRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (waveRafRef.current) {
        window.cancelAnimationFrame(waveRafRef.current);
        waveRafRef.current = null;
      }
    };
  }, [state.singing]);

  return {
    state,
    derived,
    actions: {
      setPhase,
      updatePatch,
      wakeAudioAndEnterLab,
      previewNote,
      resetPatch,
      saveCurrentPatch,
      loadPatch,
      deletePatch,
      renamePatch,
      previewSavedPatch,
      setLesson: (lessonId) => setState((current) => ({ ...current, activeLessonId: lessonId })),
    },
  };
}
