import { useEffect, useRef, useState } from "react";
import { getAudioContext } from "../../shared/audio/audioContext.js";
import { playScheduledSynthNote, playSynthPreview } from "../../shared/audio/synthVoice.js";
import { createStepTransport } from "../../shared/audio/transport.js";
import { ensureSequencerAudioReady, playDrumHit } from "../../shared/audio/sequencerVoices.js";
import {
  deleteStudioProject,
  loadSavedSynthPatches,
  loadSequencerProgress,
  loadStudioProjects,
  renameStudioProject,
  saveSequencerProgress,
  saveSynthPatchRecords,
  saveStudioProject,
} from "../../shared/progression/storage.js";
import {
  AVAILABLE_NOTE_NAMES,
  cloneMelodySteps,
  cloneDrumPatches,
  clonePattern,
  createEmptyLoopVariant,
  createMelodyStep,
  createEmptySynthLane,
  createLoopVariant,
  createStarterSynthLanes,
  DRUM_PATCH_DEFAULTS,
  GATE_OPTIONS,
  initialState,
  normalizeMelodyStep,
  OCTAVE_OPTIONS,
  SEQUENCER_LANES,
  SECTION_LABELS,
  STARTER_PATTERNS,
  SYNTH_LANE_TEMPLATES,
  VARIANT_IDS,
} from "./initialState.js";
import { SEQUENCER_LESSONS } from "./lessonDefinitions.js";

function cloneSynthLanes(synthLanes) {
  return synthLanes.map((lane) => ({
    ...lane,
    steps: cloneMelodySteps(lane.steps),
  }));
}

function hydrateProjectSynthLanes(synthLanes = [], savedPatches = []) {
  return cloneSynthLanes(synthLanes).map((lane, index) => {
    const hasResolvedPatch = lane.patchId && savedPatches.some((patch) => patch.id === lane.patchId);
    const patchId = hasResolvedPatch
      ? lane.patchId
      : savedPatches.find((patch) => patch.id === lane.patchSnapshot?.id)?.id
        || savedPatches[index]?.id
        || savedPatches[0]?.id
        || "";
    return {
      ...lane,
      patchId,
      steps: cloneMelodySteps(lane.steps),
    };
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getShapeLabel(oscType) {
  return oscType === "sawtooth"
    ? "Spiky"
    : oscType === "square"
      ? "Chunky"
      : oscType === "triangle"
        ? "Pointed"
        : "Smooth";
}

function buildLaneNotes(octave) {
  return AVAILABLE_NOTE_NAMES.map((name, index) => `${name}${index === AVAILABLE_NOTE_NAMES.length - 1 ? octave + 1 : octave}`);
}

function getStepGateDuration(gate) {
  return gate === "short" ? 0.16 : gate === "long" ? 0.5 : 0.3;
}

function getStepAccentMultiplier(accent) {
  return accent ? 1.95 : 1;
}

function getGateLabel(gate) {
  return gate === "short" ? "Short" : gate === "long" ? "Long" : "Medium";
}

function cloneLoopVariants(loopVariants = initialState.loopVariants) {
  return Object.fromEntries(
    VARIANT_IDS.map((variantId) => [
      variantId,
      createLoopVariant(loopVariants?.[variantId] || (variantId === "A" ? initialState.loopVariants.A : createEmptyLoopVariant())),
    ]),
  );
}

function withActiveVariantState(current, nextVariantState) {
  return {
    ...current,
    activePresetId: "custom",
    lessonArmed: true,
    pattern: clonePattern(nextVariantState.pattern),
    drumPatches: cloneDrumPatches(nextVariantState.drumPatches),
    synthLanes: cloneSynthLanes(nextVariantState.synthLanes),
    loopVariants: {
      ...current.loopVariants,
      [current.activeVariantId]: createLoopVariant(nextVariantState),
    },
  };
}

function createUniqueProjectName(name, projects, excludeProjectId = "") {
  const trimmed = name.trim();
  if (!trimmed) return "";

  const existing = new Set(
    projects
      .filter((project) => project.id !== excludeProjectId)
      .map((project) => project.name.trim().toLowerCase()),
  );

  if (!existing.has(trimmed.toLowerCase())) {
    return trimmed;
  }

  let suffix = 2;
  let candidate = `${trimmed} ${suffix}`;
  while (existing.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = `${trimmed} ${suffix}`;
  }
  return candidate;
}

function attachPatchSnapshotsToSynthLanes(synthLanes = [], savedPatches = []) {
  return cloneSynthLanes(synthLanes).map((lane) => ({
    ...lane,
    patchSnapshot: savedPatches.find((patch) => patch.id === lane.patchId) || null,
  }));
}

function collectProjectPatches(loopVariants = {}, savedPatches = []) {
  const patchIds = new Set();

  Object.values(loopVariants).forEach((variant) => {
    variant?.synthLanes?.forEach((lane) => {
      if (lane?.patchId) {
        patchIds.add(lane.patchId);
      }
      if (lane?.patchSnapshot?.id) {
        patchIds.add(lane.patchSnapshot.id);
      }
    });
  });

  return [...patchIds]
    .map((patchId) => savedPatches.find((patch) => patch.id === patchId) || null)
    .filter(Boolean);
}

function countActiveSteps(steps = []) {
  return steps.filter(Boolean).length;
}

function getSequencerLessonProgress(state) {
  if (state.activeLessonId === "march-of-the-caterpillar") {
    const kick = state.pattern.kick || [];
    const complete = Boolean(kick[0] && kick[4]);
    return {
      complete,
      summary: complete ? "Kick lands on step 1 and step 5." : "Place kick on step 1 and step 5.",
    };
  }

  if (state.activeLessonId === "big-step-turn-step-sparkle-step") {
    const kickCount = countActiveSteps(state.pattern.kick);
    const snareCount = countActiveSteps(state.pattern.snare);
    const hatCount = countActiveSteps(state.pattern.hat);
    const complete = kickCount >= 1 && kickCount <= 4 && snareCount >= 1 && hatCount > snareCount && hatCount >= 4;
    return {
      complete,
      summary: complete
        ? "Kick is sparse, snare marks turns, hat is busiest."
        : "Keep kick sparse, add at least one snare, and make hat the busiest lane.",
    };
  }

  if (state.activeLessonId === "high-trail-low-trail") {
    const activeSynthLanes = state.synthLanes.filter((lane) => lane.patchId);
    const melodyLanesWithNotes = state.synthLanes.filter((lane) => countActiveSteps(lane.steps) >= 1);
    const octaveSpread = Math.abs((state.synthLanes[0]?.octave || 0) - (state.synthLanes[1]?.octave || 0));
    const complete = activeSynthLanes.length >= 2 && melodyLanesWithNotes.length >= 2 && octaveSpread >= 1;
    return {
      complete,
      summary: complete
        ? "Both melody lanes have sounds, notes, and different octaves."
        : "Give both melody lanes a patch and at least one note, with different octaves.",
    };
  }

  return {
    complete: false,
    summary: "",
  };
}

function advanceToNextLesson(currentLessonId) {
  const lessonIndex = SEQUENCER_LESSONS.findIndex((lesson) => lesson.id === currentLessonId);
  const nextLesson = SEQUENCER_LESSONS[lessonIndex + 1];
  return nextLesson?.id || currentLessonId;
}

export function useSequencerState() {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(state);
  const transportRef = useRef(null);
  const uiTimersRef = useRef([]);
  const lessonToastTimerRef = useRef(null);
  const previousLessonProgressRef = useRef({
    lessonId: initialState.activeLessonId,
    complete: false,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const lessonProgress = getSequencerLessonProgress(state);

  useEffect(() => {
    const savedPatches = loadSavedSynthPatches();
    const savedProjects = loadStudioProjects();
    const sequencerProgress = loadSequencerProgress();
    setState((current) => ({
      ...current,
      savedPatches,
      savedProjects,
      progressLoaded: true,
      completedLessonIds: sequencerProgress.completedLessonIds,
      synthLanes: current.synthLanes.map((lane, index) => ({
        ...lane,
        patchId: lane.patchId || savedPatches[index]?.id || savedPatches[0]?.id || "",
      })),
      loopVariants: Object.fromEntries(
        Object.entries(current.loopVariants).map(([variantId, variant]) => [
          variantId,
          {
            ...variant,
            synthLanes: variant.synthLanes.map((lane, index) => ({
              ...lane,
              patchId: lane.patchId || savedPatches[index]?.id || savedPatches[0]?.id || "",
            })),
          },
        ]),
      ),
    }));
  }, []);

  useEffect(() => {
    if (!state.progressLoaded) return;
    saveSequencerProgress({
      completedLessonIds: state.completedLessonIds,
    });
  }, [state.completedLessonIds, state.progressLoaded]);

  useEffect(() => {
    if (!state.audioReady) return undefined;

    const ctx = getAudioContext();
    if (!ctx) return undefined;

    const scheduleUiStep = (stepIndex, when) => {
      // Lead the animation slightly so render latency does not make the step marker feel behind the audio.
      const visualLeadMs = 22;
      const delayMs = Math.max(0, (when - ctx.currentTime) * 1000 - visualLeadMs);
      const timerId = window.setTimeout(() => {
        setState((current) => (current.isPlaying ? { ...current, currentStep: stepIndex } : current));
      }, delayMs);
      uiTimersRef.current.push(timerId);
    };

    transportRef.current = createStepTransport({
      context: ctx,
      getTempo: () => stateRef.current.tempo,
      getStepCount: () => (
        stateRef.current.playbackMode === "variant"
          ? stateRef.current.stepCount
          : Math.max(1, stateRef.current.stepCount * Math.max(1, stateRef.current.arrangementSections.length || 1))
      ),
      onStep: (stepIndex, when) => {
        const current = stateRef.current;
        const arrangementMode = current.playbackMode === "arrangement";
        const sectionCount = Math.max(1, current.arrangementSections.length || 1);
        const localStep = arrangementMode ? stepIndex % current.stepCount : stepIndex;
        const sectionIndex = arrangementMode ? Math.floor(stepIndex / current.stepCount) % sectionCount : 0;
        const variantId = arrangementMode
          ? current.arrangementSections[sectionIndex] || current.activeVariantId
          : current.playbackVariantId;
        const activeVariant = current.loopVariants[variantId] || current.loopVariants[current.activeVariantId];

        SEQUENCER_LANES.forEach((lane) => {
          if (activeVariant.pattern[lane.id][localStep]) {
            playDrumHit(lane.id, when, activeVariant.drumPatches[lane.id]);
          }
        });

        activeVariant.synthLanes.forEach((lane) => {
          const selectedPatch = current.savedPatches.find((patch) => patch.id === lane.patchId);
          const step = normalizeMelodyStep(lane.steps[localStep]);
          if (selectedPatch && step?.noteName) {
            playScheduledSynthNote(
              step.noteName,
              selectedPatch.patch,
              when,
              getStepGateDuration(step.gate),
              getStepAccentMultiplier(step.accent),
            );
          }
        });

        scheduleUiStep(localStep, when);
        const timerId = window.setTimeout(() => {
          setState((currentState) => (
            currentState.isPlaying
              ? { ...currentState, currentSectionIndex: arrangementMode ? sectionIndex : 0 }
              : currentState
          ));
        }, Math.max(0, (when - ctx.currentTime) * 1000 - 22));
        uiTimersRef.current.push(timerId);
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
      setState((current) => ({ ...current, currentStep: 0, currentSectionIndex: 0 }));
    }

    return () => {
      transport.stop();
    };
  }, [state.isPlaying, state.audioReady]);

  useEffect(() => {
    const previous = previousLessonProgressRef.current;
    const lessonChanged = previous.lessonId !== state.activeLessonId;
    const becameComplete = !previous.complete && lessonProgress.complete;

    previousLessonProgressRef.current = {
      lessonId: state.activeLessonId,
      complete: lessonProgress.complete,
    };

    if (lessonChanged) return undefined;
    if (!becameComplete) return undefined;
    if (!state.lessonArmed) return undefined;
    if (state.completedLessonIds.includes(state.activeLessonId)) return undefined;

    const completedLessonId = state.activeLessonId;
    const nextLessonId = advanceToNextLesson(completedLessonId);
    window.clearTimeout(lessonToastTimerRef.current);
    setState((current) => ({
      ...current,
      completedLessonIds: [...current.completedLessonIds, completedLessonId],
      activeLessonId: nextLessonId,
      lessonArmed: false,
      lessonToast: nextLessonId === completedLessonId
        ? "Mission completed."
        : "Mission completed. Next trail lesson unlocked.",
    }));
    lessonToastTimerRef.current = window.setTimeout(() => {
      setState((current) => ({ ...current, lessonToast: "" }));
    }, 1800);

    return () => {
      window.clearTimeout(lessonToastTimerRef.current);
    };
  }, [lessonProgress.complete, state.activeLessonId, state.completedLessonIds]);

  useEffect(() => () => {
    window.clearTimeout(lessonToastTimerRef.current);
  }, []);

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

      return withActiveVariantState(current, {
        pattern: nextPattern,
        drumPatches: current.drumPatches,
        synthLanes: current.synthLanes,
      });
    });
  }

  function setTempo(tempo) {
    setState((current) => ({
      ...current,
      tempo,
    }));
  }

  function loadPreset(presetId) {
    setState((current) => {
      const nextVariantState = {
        pattern: clonePattern(STARTER_PATTERNS[presetId]),
        drumPatches: current.drumPatches,
        synthLanes: presetId === "empty"
          ? current.synthLanes.map((lane, index) => createEmptySynthLane(SYNTH_LANE_TEMPLATES[index], lane.patchId))
          : createStarterSynthLanes(current.synthLanes[0]?.patchId || "", current.synthLanes[1]?.patchId || ""),
      };
      return {
        ...withActiveVariantState(current, nextVariantState),
        activePresetId: presetId,
      };
    });
  }

  function clearPattern() {
    setState((current) => ({
      ...withActiveVariantState(current, {
        pattern: clonePattern(STARTER_PATTERNS.empty),
        drumPatches: cloneDrumPatches(current.drumPatches),
        synthLanes: current.synthLanes.map((lane, index) => createEmptySynthLane(SYNTH_LANE_TEMPLATES[index], lane.patchId)),
      }),
      activePresetId: "empty",
    }));
  }

  async function previewLane(laneId) {
    await ensureSequencerAudioReady();
    setState((current) => ({ ...current, audioReady: true }));
    playDrumHit(laneId, null, stateRef.current.drumPatches[laneId]);
  }

  function updateDrumPatch(laneId, key, value) {
    setState((current) => withActiveVariantState(current, {
      pattern: current.pattern,
      drumPatches: {
        ...current.drumPatches,
        [laneId]: {
          ...current.drumPatches[laneId],
          [key]: value,
        },
      },
      synthLanes: current.synthLanes,
    }));
  }

  function setMelodyNote(laneId, stepIndex, noteName) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = cloneMelodySteps(lane.steps);
        const currentStep = normalizeMelodyStep(steps[stepIndex]);
        steps[stepIndex] = createMelodyStep(noteName, currentStep || {});
        return { ...lane, steps };
      });

      return withActiveVariantState(current, {
        pattern: current.pattern,
        drumPatches: current.drumPatches,
        synthLanes,
      });
    });
  }

  function clearMelodyStep(laneId, stepIndex) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = cloneMelodySteps(lane.steps);
        steps[stepIndex] = null;
        return { ...lane, steps };
      });

      return withActiveVariantState(current, {
        pattern: current.pattern,
        drumPatches: current.drumPatches,
        synthLanes,
      });
    });
  }

  function setMelodyStep(laneId, stepIndex, step) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = cloneMelodySteps(lane.steps);
        steps[stepIndex] = normalizeMelodyStep(step);
        return { ...lane, steps };
      });

      return withActiveVariantState(current, {
        pattern: current.pattern,
        drumPatches: current.drumPatches,
        synthLanes,
      });
    });
  }

  function cycleMelodyGate(laneId, stepIndex) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = cloneMelodySteps(lane.steps);
        const step = normalizeMelodyStep(steps[stepIndex]);
        if (!step) return lane;
        const currentGateIndex = Math.max(0, GATE_OPTIONS.indexOf(step.gate));
        const nextGate = GATE_OPTIONS[(currentGateIndex + 1) % GATE_OPTIONS.length];
        steps[stepIndex] = {
          ...step,
          gate: nextGate,
        };
        return { ...lane, steps };
      });

      return withActiveVariantState(current, {
        pattern: current.pattern,
        drumPatches: current.drumPatches,
        synthLanes,
      });
    });
  }

  function toggleMelodyAccent(laneId, stepIndex) {
    setState((current) => {
      const synthLanes = current.synthLanes.map((lane) => {
        if (lane.id !== laneId) return lane;
        const steps = cloneMelodySteps(lane.steps);
        const step = normalizeMelodyStep(steps[stepIndex]);
        if (!step) return lane;
        steps[stepIndex] = {
          ...step,
          accent: !step.accent,
        };
        return { ...lane, steps };
      });

      return withActiveVariantState(current, {
        pattern: current.pattern,
        drumPatches: current.drumPatches,
        synthLanes,
      });
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
    setState((current) => withActiveVariantState(current, {
      pattern: current.pattern,
      drumPatches: current.drumPatches,
      synthLanes: current.synthLanes.map((lane) => (
        lane.id === laneId
          ? { ...lane, patchId }
          : lane
      )),
    }));
  }

  function setLaneOctave(laneId, octave) {
    setState((current) => withActiveVariantState(current, {
      pattern: current.pattern,
      drumPatches: current.drumPatches,
      synthLanes: current.synthLanes.map((lane) => (
        lane.id === laneId
          ? { ...lane, octave }
          : lane
      )),
    }));
  }

  function saveCurrentProject() {
    const loopVariants = {
      ...cloneLoopVariants(state.loopVariants),
      [state.activeVariantId]: createLoopVariant({
        pattern: state.pattern,
        drumPatches: state.drumPatches,
        synthLanes: state.synthLanes,
      }),
    };
    const loopVariantsWithSnapshots = Object.fromEntries(
      Object.entries(loopVariants).map(([variantId, variant]) => [
        variantId,
        {
          ...variant,
          synthLanes: attachPatchSnapshotsToSynthLanes(variant.synthLanes, state.savedPatches),
        },
      ]),
    );
    const projectPatches = collectProjectPatches(loopVariantsWithSnapshots, state.savedPatches);
    const existingProject = state.savedProjects.find((project) => project.id === state.activeProjectId) || null;
    const projectId = existingProject?.id || `project-${Date.now()}`;
    const projectName = existingProject?.name || createUniqueProjectName(
      `Loop Trail Project ${state.savedProjects.length + 1}`,
      state.savedProjects,
    );
    const projectRecord = {
      id: projectId,
      name: projectName,
      tempo: state.tempo,
      loopVariants: loopVariantsWithSnapshots,
      arrangementSections: [...state.arrangementSections],
      activeVariantId: state.activeVariantId,
      pattern: clonePattern(state.pattern),
      drumPatches: cloneDrumPatches(state.drumPatches),
      synthLanes: attachPatchSnapshotsToSynthLanes(state.synthLanes, state.savedPatches),
      projectPatches,
      activePresetId: state.activePresetId,
    };

    const savedProjects = saveStudioProject(projectRecord);
    setState((current) => ({
      ...current,
      savedProjects,
      activeProjectId: projectRecord.id,
    }));
  }

  function loadProject(projectRecord) {
    const referencedPatches = [
      ...(projectRecord.projectPatches || []),
      ...((projectRecord.synthLanes || []).map((lane) => lane.patchSnapshot).filter(Boolean)),
    ].filter(Boolean);
    const mergedSavedPatches = referencedPatches.length
      ? saveSynthPatchRecords([...referencedPatches, ...state.savedPatches])
      : state.savedPatches;

    const restoredLoopVariants = projectRecord.loopVariants
      ? cloneLoopVariants(projectRecord.loopVariants)
      : {
        A: createLoopVariant({
          pattern: projectRecord.pattern ?? state.pattern,
          drumPatches: projectRecord.drumPatches ?? state.drumPatches,
          synthLanes: projectRecord.synthLanes ?? state.synthLanes,
        }),
        B: createEmptyLoopVariant(),
      };
    const activeVariantId = restoredLoopVariants[projectRecord.activeVariantId] ? projectRecord.activeVariantId : "A";
    const activeVariant = restoredLoopVariants[activeVariantId];

    setState((current) => ({
      ...current,
      savedPatches: mergedSavedPatches,
      tempo: projectRecord.tempo ?? current.tempo,
      loopVariants: Object.fromEntries(
        Object.entries(restoredLoopVariants).map(([variantId, variant]) => [
          variantId,
          {
            ...variant,
            synthLanes: hydrateProjectSynthLanes(variant.synthLanes, mergedSavedPatches),
          },
        ]),
      ),
      activeVariantId,
      arrangementSections: Array.isArray(projectRecord.arrangementSections) && projectRecord.arrangementSections.length
        ? projectRecord.arrangementSections.map((variantId) => (VARIANT_IDS.includes(variantId) ? variantId : "A")).slice(0, SECTION_LABELS.length)
        : ["A", "A", "B"],
      pattern: clonePattern(activeVariant.pattern),
      drumPatches: cloneDrumPatches(activeVariant.drumPatches),
      synthLanes: hydrateProjectSynthLanes(activeVariant.synthLanes, mergedSavedPatches),
      activeProjectId: projectRecord.id || "",
      activePresetId: projectRecord.activePresetId ?? "custom",
      lessonArmed: false,
      isPlaying: false,
      currentStep: 0,
      currentSectionIndex: 0,
    }));
  }

  function removeProject(projectId) {
    const savedProjects = deleteStudioProject(projectId);
    setState((current) => ({
      ...current,
      savedProjects,
      activeProjectId: current.activeProjectId === projectId ? "" : current.activeProjectId,
    }));
  }

  function renameProject(projectId, name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const nextName = createUniqueProjectName(trimmed, state.savedProjects, projectId);
    const savedProjects = renameStudioProject(projectId, nextName);
    setState((current) => ({
      ...current,
      savedProjects,
    }));
  }

  function selectVariant(variantId) {
    if (!VARIANT_IDS.includes(variantId)) return;

    setState((current) => {
      if (variantId === current.activeVariantId) return current;
      const currentVariants = {
        ...current.loopVariants,
        [current.activeVariantId]: createLoopVariant({
          pattern: current.pattern,
          drumPatches: current.drumPatches,
          synthLanes: current.synthLanes,
        }),
      };
      const nextVariant = currentVariants[variantId] || createEmptyLoopVariant();
      return {
        ...current,
        loopVariants: currentVariants,
        activeVariantId: variantId,
        lessonArmed: false,
        pattern: clonePattern(nextVariant.pattern),
        drumPatches: cloneDrumPatches(nextVariant.drumPatches),
        synthLanes: cloneSynthLanes(nextVariant.synthLanes),
        currentStep: 0,
        currentSectionIndex: 0,
        isPlaying: false,
      };
    });
  }

  function copyVariant(sourceVariantId, targetVariantId) {
    if (!VARIANT_IDS.includes(sourceVariantId) || !VARIANT_IDS.includes(targetVariantId) || sourceVariantId === targetVariantId) return;

    setState((current) => {
      const sourceVariant = sourceVariantId === current.activeVariantId
        ? createLoopVariant({
          pattern: current.pattern,
          drumPatches: current.drumPatches,
          synthLanes: current.synthLanes,
        })
        : createLoopVariant(current.loopVariants[sourceVariantId]);
      const loopVariants = {
        ...current.loopVariants,
        [sourceVariantId]: sourceVariant,
        [targetVariantId]: createLoopVariant(sourceVariant),
      };
      const nextState = {
        ...current,
        loopVariants,
      };
      if (targetVariantId === current.activeVariantId) {
        return {
          ...nextState,
          pattern: clonePattern(sourceVariant.pattern),
          drumPatches: cloneDrumPatches(sourceVariant.drumPatches),
          synthLanes: cloneSynthLanes(sourceVariant.synthLanes),
        };
      }
      return nextState;
    });
  }

  function cycleArrangementSection(sectionIndex) {
    setState((current) => {
      const arrangementSections = [...current.arrangementSections];
      const currentVariantIndex = Math.max(0, VARIANT_IDS.indexOf(arrangementSections[sectionIndex] || "A"));
      arrangementSections[sectionIndex] = VARIANT_IDS[(currentVariantIndex + 1) % VARIANT_IDS.length];
      return {
        ...current,
        arrangementSections,
      };
    });
  }

  const derived = {
    lanes: SEQUENCER_LANES,
    lesson: SEQUENCER_LESSONS.find((lesson) => lesson.id === state.activeLessonId) || SEQUENCER_LESSONS[0],
    lessons: SEQUENCER_LESSONS,
    variantOptions: VARIANT_IDS,
    completedLessonCount: state.completedLessonIds.length,
    lessonIsComplete: state.completedLessonIds.includes(state.activeLessonId),
    lessonProgress,
    arrangementSections: state.arrangementSections.map((variantId, index) => ({
      index,
      variantId,
      label: SECTION_LABELS[index] || `Part ${index + 1}`,
      active: index === state.currentSectionIndex,
    })),
    presets: [
      { id: "trail", label: "Trail Groove" },
      { id: "bounce", label: "Bounce Beat" },
      { id: "empty", label: "Blank Path" },
    ],
    drumLanes: SEQUENCER_LANES.map((lane) => {
      const patch = state.drumPatches[lane.id] || DRUM_PATCH_DEFAULTS[lane.id];
      return {
        ...lane,
        kind: "drum",
        patch,
        helperText: lane.id === "kick" ? "Big step" : lane.id === "snare" ? "Turn marker" : "Sparkle pulse",
        shapeLabel: getShapeLabel(patch.oscType),
        brightness: clamp((patch.cutoff - 240) / (4200 - 240), 0, 1),
        tailGlow: clamp((patch.release - 0.02) / (0.48 - 0.02), 0, 1),
        snap: clamp((0.3 - patch.attack) / (0.3 - 0.01), 0, 1),
      };
    }),
    activeStepLabel: state.currentStep + 1,
    activeSectionLabel: SECTION_LABELS[state.currentSectionIndex] || `Part ${state.currentSectionIndex + 1}`,
    playbackModeLabel: state.playbackMode === "variant" ? `Loop ${state.playbackVariantId} Only` : "Full Song",
    octaveOptions: OCTAVE_OPTIONS,
    savedProjectCount: state.savedProjects.length,
    synthLanes: state.synthLanes.map((lane) => {
      const selectedPatch = state.savedPatches.find((patch) => patch.id === lane.patchId) || null;
      return {
        ...lane,
        kind: "synth",
        helperText: selectedPatch ? selectedPatch.name : "Choose a saved Sound Garden patch",
        melodyNotes: buildLaneNotes(lane.octave),
        steps: cloneMelodySteps(lane.steps).map((step) => {
          const normalizedStep = normalizeMelodyStep(step);
          return normalizedStep
            ? {
              ...normalizedStep,
              gateLabel: getGateLabel(normalizedStep.gate),
            }
            : null;
        }),
        selectedPatch,
      };
    }),
  };

  derived.selectedLane = [...derived.drumLanes, ...derived.synthLanes]
    .find((lane) => lane.id === state.selectedLaneId) || derived.drumLanes[0] || derived.synthLanes[0] || null;

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
      updateDrumPatch,
      setMelodyNote,
      setMelodyStep,
      clearMelodyStep,
      cycleMelodyGate,
      toggleMelodyAccent,
      previewPatch,
      previewMelodyNote,
      selectPatch,
      setLaneOctave,
      selectLane: (laneId) => setState((current) => ({ ...current, selectedLaneId: laneId })),
      setLesson: (lessonId) => setState((current) => ({ ...current, activeLessonId: lessonId, lessonArmed: false })),
      completeLesson: () => {
        const alreadyCompleted = state.completedLessonIds.includes(state.activeLessonId);
        const nextLessonId = advanceToNextLesson(state.activeLessonId);
        window.clearTimeout(lessonToastTimerRef.current);
        setState((current) => ({
          ...current,
          completedLessonIds: alreadyCompleted ? current.completedLessonIds : [...current.completedLessonIds, state.activeLessonId],
          activeLessonId: nextLessonId,
          lessonArmed: false,
          lessonToast: alreadyCompleted ? "Mission already completed." : "Mission completed. Next trail lesson unlocked.",
        }));
        lessonToastTimerRef.current = window.setTimeout(() => {
          setState((current) => ({ ...current, lessonToast: "" }));
        }, 1800);
      },
      saveCurrentProject,
      loadProject,
      removeProject,
      renameProject,
      selectVariant,
      copyVariant,
      cycleArrangementSection,
      setPlaybackMode: (playbackMode, playbackVariantId = null) => setState((current) => ({
        ...current,
        playbackMode,
        playbackVariantId: playbackVariantId || current.playbackVariantId,
        currentStep: 0,
        currentSectionIndex: 0,
        isPlaying: false,
      })),
    },
  };
}
