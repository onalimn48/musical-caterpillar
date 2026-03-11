import {
  buildBenchmarkHistoryByPreset,
  buildTeacherSnapshot,
  selectBestFluencyRun,
  selectFastestQualifiedRawRun,
  selectFastestRawRun,
} from "../../shared/fluency/sessionPayloads.js";

const STORAGE_KEY = "npm-benchmark-sessions-v1";

function sortByCompletedAt(a, b) {
  return (a.completedAt || 0) - (b.completedAt || 0);
}

function isStoredBenchmarkSession(session) {
  return Boolean(
    session &&
    typeof session === "object" &&
    typeof session.id === "string" &&
    typeof session.presetId === "string" &&
    session.summary &&
    Number.isFinite(session.summary.rawNpm) &&
    Number.isFinite(session.summary.accuracy) &&
    typeof session.summary.fluencyBand === "string",
  );
}

function stripDerivedReporting(sessionPayload) {
  const { reportingSnapshot, ...persistablePayload } = sessionPayload || {};
  return persistablePayload;
}

export async function loadBenchmarkSessions() {
  try {
    const response = await window.storage.get(STORAGE_KEY);
    if (!response?.value) return [];
    const sessions = JSON.parse(response.value);
    return Array.isArray(sessions)
      ? sessions.filter(isStoredBenchmarkSession).sort(sortByCompletedAt)
      : [];
  } catch (error) {
    return [];
  }
}

export async function persistBenchmarkSession(sessionPayload) {
  const existing = await loadBenchmarkSessions();
  const next = [...existing, stripDerivedReporting(sessionPayload)].sort(sortByCompletedAt).slice(-60);

  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Ignore storage failures so the benchmark still completes.
  }

  return next;
}

export function buildBenchmarkDashboard(sessions) {
  const historyByPreset = buildBenchmarkHistoryByPreset(sessions);
  const latestSession = sessions[sessions.length - 1] || null;
  const bestFluencySession = selectBestFluencyRun(sessions);
  const fastestRawSession = selectFastestRawRun(sessions);
  const fastestQualifiedRawSession = selectFastestQualifiedRawRun(sessions);

  return {
    sessions,
    latestSession,
    bestFluencySession,
    fastestRawSession,
    fastestQualifiedRawSession,
    // Legacy alias retained for compatibility with older callers.
    bestQualifiedSession: fastestQualifiedRawSession,
    historyByPreset,
    teacherSnapshot: buildTeacherSnapshot(sessions),
  };
}
