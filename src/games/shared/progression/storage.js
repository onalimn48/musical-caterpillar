const SYNTH_PATCH_STORAGE_KEY = "musical-caterpillar-synth-patches";
const STUDIO_PROJECT_STORAGE_KEY = "musical-caterpillar-studio-projects";

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

export function loadSavedSynthPatches() {
  return readJson(SYNTH_PATCH_STORAGE_KEY, []);
}

export function saveSynthPatchRecord(patchRecord) {
  const patches = loadSavedSynthPatches();
  const next = [patchRecord, ...patches.filter((entry) => entry.id !== patchRecord.id)].slice(0, 8);
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
