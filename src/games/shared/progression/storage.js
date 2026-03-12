const SYNTH_PATCH_STORAGE_KEY = "musical-caterpillar-synth-patches";
const STUDIO_PROJECT_STORAGE_KEY = "musical-caterpillar-studio-projects";
const SEQUENCER_PROGRESS_STORAGE_KEY = "musical-caterpillar-sequencer-progress";
const SYNTH_PROGRESS_STORAGE_KEY = "musical-caterpillar-synth-progress";
const DEFAULT_SYNTH_PATCH = {
  oscType: "sine",
  cutoff: 1600,
  resonance: 1.2,
  noiseMix: 0,
  lfoDepth: 0,
  lfoRate: 1.8,
  attack: 0.03,
  decay: 0.16,
  sustain: 0.68,
  release: 0.28,
  volume: 0.22,
};

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson(key, fallback) {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures so the current session still works.
  }
}

function normalizePatchRecord(entry) {
  if (!entry || typeof entry !== "object") return null;

  return {
    ...entry,
    patch: {
      ...DEFAULT_SYNTH_PATCH,
      ...(entry.patch && typeof entry.patch === "object" ? entry.patch : {}),
    },
    roleTag: typeof entry.roleTag === "string" ? entry.roleTag : "",
    lessonId: typeof entry.lessonId === "string" ? entry.lessonId : "",
  };
}

export function loadSavedSynthPatches() {
  return readJson(SYNTH_PATCH_STORAGE_KEY, [])
    .map(normalizePatchRecord)
    .filter(Boolean);
}

export function saveSynthPatchRecord(patchRecord) {
  const patches = loadSavedSynthPatches();
  const next = [patchRecord, ...patches.filter((entry) => entry.id !== patchRecord.id)].slice(0, 8);
  writeJson(SYNTH_PATCH_STORAGE_KEY, next);
  return next;
}

export function saveSynthPatchRecords(patchRecords) {
  const current = loadSavedSynthPatches();
  const next = [...patchRecords, ...current]
    .filter((entry, index, list) => entry?.id && list.findIndex((candidate) => candidate?.id === entry.id) === index)
    .slice(0, 8);
  writeJson(SYNTH_PATCH_STORAGE_KEY, next);
  return next;
}

export function deleteSynthPatchRecord(patchId) {
  const next = loadSavedSynthPatches().filter((entry) => entry.id !== patchId);
  writeJson(SYNTH_PATCH_STORAGE_KEY, next);
  return next;
}

export function renameSynthPatchRecord(patchId, name) {
  const next = loadSavedSynthPatches().map((entry) => (
    entry.id === patchId ? { ...entry, name } : entry
  ));
  writeJson(SYNTH_PATCH_STORAGE_KEY, next);
  return next;
}

export function loadStudioProjects() {
  return readJson(STUDIO_PROJECT_STORAGE_KEY, []);
}

export function saveStudioProject(projectRecord) {
  const projects = loadStudioProjects();
  const next = [projectRecord, ...projects.filter((entry) => entry.id !== projectRecord.id)].slice(0, 12);
  writeJson(STUDIO_PROJECT_STORAGE_KEY, next);
  return next;
}

export function deleteStudioProject(projectId) {
  const next = loadStudioProjects().filter((entry) => entry.id !== projectId);
  writeJson(STUDIO_PROJECT_STORAGE_KEY, next);
  return next;
}

export function renameStudioProject(projectId, name) {
  const next = loadStudioProjects().map((entry) => (
    entry.id === projectId ? { ...entry, name } : entry
  ));
  writeJson(STUDIO_PROJECT_STORAGE_KEY, next);
  return next;
}

export function loadSequencerProgress() {
  const progress = readJson(SEQUENCER_PROGRESS_STORAGE_KEY, {});
  return {
    completedLessonIds: Array.isArray(progress?.completedLessonIds)
      ? progress.completedLessonIds.filter((lessonId) => typeof lessonId === "string")
      : [],
  };
}

export function saveSequencerProgress(progress) {
  const normalized = {
    completedLessonIds: Array.isArray(progress?.completedLessonIds)
      ? progress.completedLessonIds.filter((lessonId) => typeof lessonId === "string")
      : [],
  };
  writeJson(SEQUENCER_PROGRESS_STORAGE_KEY, normalized);
  return normalized;
}

export function loadSynthProgress() {
  const progress = readJson(SYNTH_PROGRESS_STORAGE_KEY, {});
  return {
    completedLessonIds: Array.isArray(progress?.completedLessonIds)
      ? progress.completedLessonIds.filter((lessonId) => typeof lessonId === "string")
      : [],
  };
}

export function saveSynthProgress(progress) {
  const normalized = {
    completedLessonIds: Array.isArray(progress?.completedLessonIds)
      ? progress.completedLessonIds.filter((lessonId) => typeof lessonId === "string")
      : [],
  };
  writeJson(SYNTH_PROGRESS_STORAGE_KEY, normalized);
  return normalized;
}
