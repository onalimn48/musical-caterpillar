import { useEffect, useRef, useState } from "react";
import { getAudioContext } from "../../shared/audio/audioContext.js";
import { playScheduledSynthNote, playSynthPreview } from "../../shared/audio/synthVoice.js";
import { createStepTransport } from "../../shared/audio/transport.js";
import { ensureSequencerAudioReady, playDrumHit } from "../../shared/audio/sequencerVoices.js";
import {
  deleteStudioProject,
  loadSavedSynthPatches,
  loadStudioProjects,
  renameStudioProject,
  saveStudioProject,
} from "../../shared/progression/storage.js";
import {
  AVAILABLE_NOTE_NAMES,
  createEmptySynthLane,
  createStarterSynthLanes,
  initialState,
  OCTAVE_OPTIONS,
  SEQUENCER_LANES,
  STARTER_PATTERNS,
  SYNTH_LANE_TEMPLATES,
} from "./initialState.js";

function clonePattern(pattern) {
  return Object.fromEntries(
    Object.entries(pattern).map(([laneId, steps]) => [laneId, [...steps]]),
  );
}

function cloneSynthLanes(synthLanes) {
  return synthLanes.map((lane) => ({
    ...lane,
    steps: [...lane.steps],
  }));
}

function buildLaneNotes(octave) {
  return AVAILABLE_NOTE_NAMES.map((name, index) => `${name}${index === AVAILABLE_NOTE_NAMES.length - 1 ? octave + 1 : octave}`);
}

export function useSequencerState() {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const transportRef = useRef(null);
  const uiTimersRef = useRef([]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const savedPatches = loadSavedSynthPatches();
    const savedProjects = loadStudioProjects();
    setState((current) => ({
      ...current,
      savedPatches,
      savedProjects,
      synthLanes: current.synthLanes.map((lane, index) => ({
        ...lane,
        patchId: lane.patchId || savedPatches[index]?.id || savedPatches[0]?.id || "",
      })),
    }));
  }, []);

  useEffect(() => {
    if (!state.audioReady) return undefined;

    const ctx = getAudioContext();
    if (!ctx) return undefined;

    const scheduleUiStep = (stepIndex, when) => {
      const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
      const timerId = window.setTimeout(() => {
        setState((current) => (current.isPlaying ? { ...current, currentStep: stepIndex } : current));
      }, delayMs);
      uiTimersRef.current.push(timerId);
    };

    transportRef.current = createStepTransport({
      context: ctx,
      getTempo: () => stateRef.current.tempo,
      getStepCount: () => stateRef.current.stepCount,
      onStep: (stepIndex, when) => {
        const current = stateRef.current;

        SEQUENCER_LANES.forEach((lane) => {
          if (current.pattern[lane.id][stepIndex]) {
            playDrumHit(lane.id, when);
          }
        });

        current.synthLanes.forEach((lane) => {
          const selectedPatch = current.savedPatches.find((patch) => patch.id === lane.patchId);
          const noteName = lane.steps[stepIndex];
          if (selectedPatch && noteName) {
            playScheduledSynthNote(noteName, selectedPatch.patch, when, 0.28);
          }
        });

        scheduleUiStep(stepIndex, when);
      },
    });

    return () => {
      transportRef.current?.stop();
      transportRef.current = null;
      uiTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      uiTimersRef.current = [];
    };
  }, [state.audioReady]);

  useEffect(() => {
    if (!state.audioReady) return undefined;

    const transport = transportRef.current;
    const ctx = getAudioContext();

    if (!transport || !ctx) return undefined;

    if (state.isPlaying) {
      transport.start(ctx.currentTime + 0.05);
    } else {
      transport.stop();
      uiTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      uiTimersRef.current = [];
      setState((current) => ({ ...current, currentStep: 0 }));
    }

    return () => {
      transport.stop();
    };
  }, [state.isPlaying, state.audioReady]);

  function setPhase(phase) {
    setState((current) => ({
      ...current,
      phase,
      isPlaying: phase === "menu" ? false : current.isPlaying,
      currentStep: phase === "menu" ? 0 : current.currentStep,
    }));
  }

  async function enterSequencer() {
    await ensureSequencerAudioReady();
    setState((current) => ({
      ...current,
      audioReady: true,
      phase: "builder",
    }));
  }

  async function togglePlayback() {
    await ensureSequencerAudioReady();
    setState((current) => ({
      ...current,
      audioReady: true,
      isPlaying: !current.isPlaying,
    }));
  }

  function toggleStep(laneId, stepIndex) {
    setState((current) => {
      const nextPattern = clonePattern(current.pattern);
      nextPattern[laneId][stepIndex] = !nextPattern[laneId][stepIndex];

      return {
        ...current,
        pattern: nextPattern,
        activePresetId: "custom",
      };
    });
  }

  function setTempo(tempo) {
    setState((current) => ({
      ...current,
      tempo,
    }));
  }

  function loadPreset(presetId) {
    setState((current) => ({
      ...current,
      pattern: clonePattern(STARTER_PATTERNS[presetId]),
      synthLanes: presetId === "empty"
        ? current.synthLanes.map((lane, index) => createEmptySynthLane(SYNTH_LANE_TEMPLATES[index], lane.patchId))
        : createStarterSynthLanes(current.synthLanes[0]?.patchId || "", current.synthLanes[1]?.patchId || ""),
      activePresetId: presetId,
    }));
  }

  function clearPattern() {
    setState((current) => ({
      ...current,
      pattern: clonePattern(STARTER_PATTERNS.empty),
      synthLanes: current.synthLanes.map((lane, index) => createEmptySynthLane(SYNTH_LANE_TEMPLATES[index], lane.patchId)),
      activePresetId: "empty",
    }));
  }

  async function previewLane(laneId) {
    await ensureSequencerAudioReady();
    setState((current) => ({ ...current, audioReady: true }));
    playDrumHit(laneId);
  }

  function setMelodyNote(laneId, stepIndex, noteName) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = [...lane.steps];
        steps[stepIndex] = noteName;
        return { ...lane, steps };
      });

      return {
        ...current,
        synthLanes,
      };
    });
  }

  function clearMelodyStep(laneId, stepIndex) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = [...lane.steps];
        steps[stepIndex] = null;
        return { ...lane, steps };
      });

      return {
        ...current,
        synthLanes,
      };
    });
  }

  async function previewPatch(laneId) {
    const lane = state.synthLanes.find((item) => item.id === laneId);
    const selectedPatch = state.savedPatches.find((patch) => patch.id === lane?.patchId);
    if (!selectedPatch) return;

    await ensureSequencerAudioReady();
    setState((current) => ({ ...current, audioReady: true }));
    playSynthPreview(`C${lane?.octave || 4}`, selectedPatch.patch, 0.55);
  }

  async function previewMelodyNote(laneId, noteName) {
    const lane = state.synthLanes.find((item) => item.id === laneId);
    const selectedPatch = state.savedPatches.find((patch) => patch.id === lane?.patchId);
    if (!selectedPatch) return;

    await ensureSequencerAudioReady();
    setState((current) => ({ ...current, audioReady: true }));
    playSynthPreview(noteName, selectedPatch.patch, 0.45);
  }

  function selectPatch(laneId, patchId) {
    setState((current) => ({
      ...current,
      synthLanes: current.synthLanes.map((lane) => (
        lane.id === laneId
          ? { ...lane, patchId }
          : lane
      )),
    }));
  }

  function setLaneOctave(laneId, octave) {
    setState((current) => ({
      ...current,
      synthLanes: current.synthLanes.map((lane) => (
        lane.id === laneId
          ? { ...lane, octave }
          : lane
      )),
    }));
  }

  function saveCurrentProject() {
    const projectRecord = {
      id: `project-${Date.now()}`,
      name: `Loop Trail Project ${state.savedProjects.length + 1}`,
      tempo: state.tempo,
      pattern: clonePattern(state.pattern),
      synthLanes: cloneSynthLanes(state.synthLanes),
      activePresetId: state.activePresetId,
    };

    const savedProjects = saveStudioProject(projectRecord);
    setState((current) => ({
      ...current,
      savedProjects,
    }));
  }

  function loadProject(projectRecord) {
    setState((current) => ({
      ...current,
      tempo: projectRecord.tempo ?? current.tempo,
      pattern: clonePattern(projectRecord.pattern ?? current.pattern),
      synthLanes: cloneSynthLanes(projectRecord.synthLanes ?? current.synthLanes),
      activePresetId: projectRecord.activePresetId ?? "custom",
      isPlaying: false,
      currentStep: 0,
    }));
  }

  function removeProject(projectId) {
    const savedProjects = deleteStudioProject(projectId);
    setState((current) => ({
      ...current,
      savedProjects,
    }));
  }

  function renameProject(projectId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const savedProjects = renameStudioProject(projectId, trimmed);
    setState((current) => ({
      ...current,
      savedProjects,
    }));
  }

  const derived = {
    lanes: SEQUENCER_LANES,
    presets: [
      { id: "trail", label: "Trail Groove" },
      { id: "bounce", label: "Bounce Beat" },
      { id: "empty", label: "Blank Path" },
    ],
    activeStepLabel: state.currentStep + 1,
    octaveOptions: OCTAVE_OPTIONS,
    savedProjectCount: state.savedProjects.length,
    synthLanes: state.synthLanes.map((lane) => ({
      ...lane,
      melodyNotes: buildLaneNotes(lane.octave),
      selectedPatch: state.savedPatches.find((patch) => patch.id === lane.patchId) || null,
    })),
  };

  return {
    state,
    derived,
    actions: {
      setPhase,
      enterSequencer,
      togglePlayback,
      toggleStep,
      setTempo,
      loadPreset,
      clearPattern,
      previewLane,
      setMelodyNote,
      clearMelodyStep,
      previewPatch,
      previewMelodyNote,
      selectPatch,
      setLaneOctave,
      saveCurrentProject,
      loadProject,
      removeProject,
      renameProject,
    },
  };
}
