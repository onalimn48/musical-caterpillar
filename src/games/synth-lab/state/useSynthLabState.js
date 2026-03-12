import { useEffect, useRef, useState } from "react";
import { playSynthPreview } from "../../shared/audio/synthVoice.js";
import { resumeAudioContext } from "../../shared/audio/audioContext.js";
import {
  deleteSynthPatchRecord,
  loadSavedSynthPatches,
  loadSynthProgress,
  renameSynthPatchRecord,
  saveSynthPatchRecord,
  saveSynthProgress,
} from "../../shared/progression/storage.js";
import { DEFAULT_PATCH, initialState, NOTE_BUTTONS, OCTAVE_OPTIONS } from "./initialState.js";
import { SYNTH_LESSONS } from "./lessonDefinitions.js";

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

function buildPreviewNotes(octave) {
  return NOTE_BUTTONS.map((name, index) => `${name}${index === NOTE_BUTTONS.length - 1 ? octave + 1 : octave}`);
}

function isActiveLessonControl(activeLessonId, key) {
  const lesson = SYNTH_LESSONS.find((item) => item.id === activeLessonId);
  return Boolean(lesson?.visibleControls?.includes(key));
}

const DEFAULT_GARDEN_OVERVIEW = {
  id: null,
  title: "Choose a Garden Mission",
  goal: "Pick a mission to keep exploring sound, or stay in free play.",
  prompt: "Select a mission from the list when you want to focus on one control.",
  successText: "Completed missions stay marked Done.",
  visibleControls: [],
};

function getSynthLessonProgress(state) {
  if (!state.activeLessonId) {
    return {
      complete: false,
      summary: "Pick a mission to begin.",
    };
  }

  if (state.activeLessonId === "shape") {
    const complete = state.patch.oscType !== DEFAULT_PATCH.oscType;
    return {
      complete,
      summary: complete ? "A different voice shape is selected." : "Try a new voice shape.",
    };
  }

  if (state.activeLessonId === "brightness") {
    const complete = Math.abs(state.patch.cutoff - DEFAULT_PATCH.cutoff) >= 450;
    return {
      complete,
      summary: complete ? "Brightness moved clearly away from the starting sound." : "Move Brightness far enough to hear a clear difference.",
    };
  }

  if (state.activeLessonId === "tail") {
    const complete = Math.abs(state.patch.release - DEFAULT_PATCH.release) >= 0.14;
    return {
      complete,
      summary: complete ? "Tail length changed clearly from the starting note." : "Move Tail far enough to hear short vs long.",
    };
  }

  if (state.activeLessonId === "snap") {
    const complete = Math.abs(state.patch.attack - DEFAULT_PATCH.attack) >= 0.06;
    return {
      complete,
      summary: complete ? "Snap changed clearly from the starting note." : "Move Snap far enough to hear sharp vs soft.",
    };
  }

  if (state.activeLessonId === "ring") {
    const complete = Math.abs(state.patch.resonance - DEFAULT_PATCH.resonance) >= 0.4;
    return {
      complete,
      summary: complete ? "Ring changed clearly from the starting note." : "Raise or lower Ring enough to hear the edge change.",
    };
  }

  if (state.activeLessonId === "air") {
    const complete = (state.patch.noiseMix || 0) >= 0.09;
    return {
      complete,
      summary: complete ? "The sound is now airy." : "Raise Air until the note feels windy or dusty.",
    };
  }

  if (state.activeLessonId === "wiggle-depth") {
    const complete = (state.patch.lfoDepth || 0) >= 0.18;
    return {
      complete,
      summary: complete ? "The sound is now moving." : "Raise Wiggle until the sound clearly sways.",
    };
  }

  if (state.activeLessonId === "wiggle-speed") {
    const complete = (state.patch.lfoDepth || 0) >= 0.12 && Math.abs((state.patch.lfoRate || DEFAULT_PATCH.lfoRate) - DEFAULT_PATCH.lfoRate) >= 1.2;
    return {
      complete,
      summary: complete ? "Wiggle speed changed clearly from the starting motion." : "Keep some Wiggle on, then move Wiggle Speed far enough to hear slow vs fast.",
    };
  }

  return {
    complete: false,
    summary: "",
  };
}

export function useSynthLabState() {
  const [state, setState] = useState(initialState);
  const singTimerRef = useRef(null);
  const waveRafRef = useRef(null);
  const lessonToastTimerRef = useRef(null);
  const previousLessonProgressRef = useRef({
    lessonId: initialState.activeLessonId,
    complete: false,
  });
  const previewNotes = buildPreviewNotes(state.octave);
  const lessonProgress = getSynthLessonProgress(state);

  const derived = {
    brightness: clamp((state.patch.cutoff - 240) / (4200 - 240), 0, 1),
    resonance: clamp((state.patch.resonance - 0.6) / (12 - 0.6), 0, 1),
    air: clamp((state.patch.noiseMix || 0) / 0.55, 0, 1),
    wiggle: clamp(state.patch.lfoDepth || 0, 0, 1),
    wiggleRate: clamp(((state.patch.lfoRate || 1.8) - 0.2) / (8 - 0.2), 0, 1),
    tailGlow: clamp((state.patch.release - 0.08) / (1.1 - 0.08), 0, 1),
    snap: clamp((0.3 - state.patch.attack) / (0.3 - 0.01), 0, 1),
    lesson: SYNTH_LESSONS.find((item) => item.id === state.activeLessonId) || DEFAULT_GARDEN_OVERVIEW,
    lessons: SYNTH_LESSONS,
    noteButtons: previewNotes,
    octaveOptions: OCTAVE_OPTIONS,
    waveSpeed: getWaveSpeed(state.lastNoteIndex) * (1 + clamp(state.patch.lfoDepth || 0, 0, 1) * clamp((state.patch.lfoRate || 1.8) / 8, 0.1, 1) * 0.45),
    waveTravelMs: getWaveTravelMs(state.patch.release, state.lastNoteIndex),
    shapeLabel: state.patch.oscType === "sawtooth"
      ? "Spiky"
      : state.patch.oscType === "square"
        ? "Chunky"
        : state.patch.oscType === "triangle"
          ? "Pointed"
          : "Smooth",
    savedPatchCount: state.savedPatches.length,
    completedLessonCount: state.completedLessonIds.length,
    lessonIsComplete: Boolean(state.activeLessonId) && state.completedLessonIds.includes(state.activeLessonId),
    lessonProgress,
    suggestedPatchName: `${state.patch.oscType === "sawtooth"
      ? "Spiky"
      : state.patch.oscType === "square"
        ? "Chunky"
        : state.patch.oscType === "triangle"
          ? "Pointed"
          : "Smooth"} Garden ${state.savedPatches.length + 1}`,
  };

  useEffect(() => {
    const progress = loadSynthProgress();
    setState((current) => ({
      ...current,
      savedPatches: loadSavedSynthPatches(),
      activeLessonId: progress.completedLessonIds.length > 0 ? null : current.activeLessonId,
      progressLoaded: true,
      completedLessonIds: progress.completedLessonIds,
    }));
  }, []);

  useEffect(() => {
    if (!state.progressLoaded) return;
    saveSynthProgress({
      completedLessonIds: state.completedLessonIds,
    });
  }, [state.completedLessonIds, state.progressLoaded]);

  function setPhase(phase) {
    setState((current) => ({ ...current, phase }));
  }

  function updatePatch(key, value) {
    setState((current) => ({
      ...current,
      lessonArmed: isActiveLessonControl(current.activeLessonId, key) ? true : current.lessonArmed,
      lessonPreviewBeforeChange: current.lessonPreviewBeforeChange,
      lessonPreviewCount: isActiveLessonControl(current.activeLessonId, key) ? 0 : current.lessonPreviewCount,
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
    const noteIndex = Math.max(0, previewNotes.indexOf(noteName));
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
      lessonPreviewBeforeChange: current.lessonArmed ? current.lessonPreviewBeforeChange : true,
      lessonPreviewCount: current.lessonArmed ? current.lessonPreviewCount + 1 : current.lessonPreviewCount,
      singing: true,
      wavePhase: 0,
    }));
  }

  function resetPatch() {
    setState((current) => ({
      ...current,
      lessonArmed: true,
      lessonPreviewBeforeChange: false,
      lessonPreviewCount: 0,
      patch: DEFAULT_PATCH,
    }));
  }

  function saveCurrentPatch() {
    const patchId = `patch-${Date.now()}`;
    const patchName = state.draftPatchName.trim() || derived.suggestedPatchName;
    const patchRecord = {
      id: patchId,
      name: patchName,
      note: state.lastNote,
      patch: state.patch,
      roleTag: state.draftRoleTag,
      lessonId: state.activeLessonId,
      octave: state.octave,
    };

    const savedPatches = saveSynthPatchRecord(patchRecord);
    setState((current) => ({
      ...current,
      savedPatches,
      drawerOpen: true,
      lastSavedPatchName: patchName,
      draftPatchName: "",
      draftRoleTag: current.draftRoleTag,
    }));
  }

  function loadPatch(patchRecord) {
    setState((current) => ({
      ...current,
      lessonArmed: false,
      lessonPreviewBeforeChange: false,
      lessonPreviewCount: 0,
      patch: {
        ...patchRecord.patch,
      },
      lastNote: patchRecord.note || current.lastNote,
      lastNoteIndex: Math.max(0, buildPreviewNotes(patchRecord.octave || current.octave).indexOf(patchRecord.note || current.lastNote)),
      octave: patchRecord.octave || current.octave,
      draftRoleTag: patchRecord.roleTag || "",
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

  function advanceToNextLesson(currentLessonId) {
    const lessonIndex = SYNTH_LESSONS.findIndex((lesson) => lesson.id === currentLessonId);
    const nextLesson = SYNTH_LESSONS[lessonIndex + 1];
    if (!nextLesson) return currentLessonId;
    return nextLesson.id;
  }

  function completeLesson() {
    const alreadyCompleted = state.completedLessonIds.includes(state.activeLessonId);
    const lessonId = state.activeLessonId;
    const nextLessonId = advanceToNextLesson(lessonId);

    window.clearTimeout(lessonToastTimerRef.current);
    setState((current) => ({
      ...current,
      completedLessonIds: alreadyCompleted
        ? current.completedLessonIds
        : [...current.completedLessonIds, lessonId],
      activeLessonId: nextLessonId,
      lessonArmed: false,
      lessonPreviewBeforeChange: false,
      lessonPreviewCount: 0,
      lessonToast: alreadyCompleted ? "Mission already completed." : "Mission completed. Next lesson unlocked.",
    }));
    lessonToastTimerRef.current = window.setTimeout(() => {
      setState((current) => ({ ...current, lessonToast: "" }));
    }, 1800);
  }

  useEffect(() => {
    const previous = previousLessonProgressRef.current;
    const lessonChanged = previous.lessonId !== state.activeLessonId;

    previousLessonProgressRef.current = {
      lessonId: state.activeLessonId,
      complete: lessonProgress.complete,
    };

    if (lessonChanged) return undefined;
    if (!lessonProgress.complete) return undefined;
    if (!state.lessonArmed) return undefined;
    if (!state.lessonPreviewBeforeChange) return undefined;
    if (state.lessonPreviewCount < 1) return undefined;
    if (state.completedLessonIds.includes(state.activeLessonId)) return undefined;

    const lessonId = state.activeLessonId;
    const nextLessonId = advanceToNextLesson(lessonId);
    window.clearTimeout(lessonToastTimerRef.current);
    setState((current) => ({
      ...current,
      completedLessonIds: [...current.completedLessonIds, lessonId],
      activeLessonId: nextLessonId,
      lessonArmed: false,
      lessonPreviewBeforeChange: false,
      lessonPreviewCount: 0,
      lessonToast: nextLessonId === lessonId ? "Mission completed." : "Mission completed. Next lesson unlocked.",
    }));
    lessonToastTimerRef.current = window.setTimeout(() => {
      setState((current) => ({ ...current, lessonToast: "" }));
    }, 1800);

    return () => {
      window.clearTimeout(lessonToastTimerRef.current);
    };
  }, [lessonProgress.complete, state.activeLessonId, state.completedLessonIds, state.lessonArmed, state.lessonPreviewBeforeChange, state.lessonPreviewCount]);

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

  useEffect(() => () => {
    window.clearTimeout(lessonToastTimerRef.current);
  }, []);

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
      setLesson: (lessonId) => setState((current) => ({
        ...current,
        activeLessonId: lessonId,
        lessonArmed: false,
        lessonPreviewBeforeChange: false,
        lessonPreviewCount: 0,
      })),
      toggleDrawer: () => setState((current) => ({ ...current, drawerOpen: !current.drawerOpen })),
      setDrawerOpen: (open) => setState((current) => ({ ...current, drawerOpen: open })),
      clearSavedPatchNotice: () => setState((current) => ({ ...current, lastSavedPatchName: "" })),
      setDraftPatchName: (name) => setState((current) => ({ ...current, draftPatchName: name })),
      setDraftRoleTag: (roleTag) => setState((current) => ({ ...current, draftRoleTag: roleTag })),
      setOctave: (octave) => setState((current) => {
        const nextNotes = buildPreviewNotes(octave);
        const currentIndex = Math.max(0, previewNotes.indexOf(current.lastNote));
        return {
          ...current,
          octave,
          lastNote: nextNotes[currentIndex] || nextNotes[0],
          lastNoteIndex: currentIndex,
        };
      }),
      completeLesson,
      clearLessonToast: () => setState((current) => ({ ...current, lessonToast: "" })),
    },
  };
}
