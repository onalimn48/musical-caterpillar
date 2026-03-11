import {
  DEFAULT_DURATION_SECONDS,
  FULL_CLEF_POSITION_RANGES,
  INSIDE_STAFF_POSITION_RANGES,
  NPM_BENCHMARK_QUALIFICATION_ACCURACY,
  NPM_FLUENCY_FORMULA_VERSION,
  SUPPORTED_CLEFS,
} from "./constants.js";

function isSupportedClef(clef) {
  return SUPPORTED_CLEFS.includes(clef);
}

function resolveRange(clef, allowLedgerLines) {
  return allowLedgerLines
    ? FULL_CLEF_POSITION_RANGES[clef]
    : INSIDE_STAFF_POSITION_RANGES[clef];
}

function normalizeDurationSeconds(durationSeconds) {
  return Number.isFinite(durationSeconds) && durationSeconds > 0
    ? durationSeconds
    : DEFAULT_DURATION_SECONDS;
}

function buildPreset({ id, clef, allowLedgerLines }) {
  const safeClef = isSupportedClef(clef) ? clef : "Treble";
  const safeAllowLedgerLines = Boolean(allowLedgerLines);
  const range = resolveRange(safeClef, safeAllowLedgerLines);

  return {
    id,
    clef: safeClef,
    label: id,
    description: `${safeClef} clef · ${safeAllowLedgerLines ? "ledger lines included" : "inside the staff"} · naturals only`,
    shortDescription: safeAllowLedgerLines ? "Naturals with ledger lines" : "Naturals inside the staff",
    runType: "benchmark",
    durationSeconds: DEFAULT_DURATION_SECONDS,
    inputMode: "keyboard",
    includeAccidentals: false,
    allowLedgerLines: safeAllowLedgerLines,
    notePool: {
      type: safeAllowLedgerLines ? "full-clef-range" : "inside-staff",
      low: range.low,
      high: range.high,
    },
    scoringFormulaVersion: NPM_FLUENCY_FORMULA_VERSION,
    qualificationAccuracy: NPM_BENCHMARK_QUALIFICATION_ACCURACY,
  };
}

export const NPM_BENCHMARK_PRESETS = [
  buildPreset({ id: "NPM-T1", clef: "Treble", allowLedgerLines: false }),
  buildPreset({ id: "NPM-B1", clef: "Bass", allowLedgerLines: false }),
  buildPreset({ id: "NPM-A1", clef: "Alto", allowLedgerLines: false }),
  buildPreset({ id: "NPM-T2", clef: "Treble", allowLedgerLines: true }),
  buildPreset({ id: "NPM-B2", clef: "Bass", allowLedgerLines: true }),
  buildPreset({ id: "NPM-A2", clef: "Alto", allowLedgerLines: true }),
];

export const DEFAULT_PRACTICE_SETTINGS = {
  clef: "Treble",
  inputMode: "keyboard",
  durationSeconds: DEFAULT_DURATION_SECONDS,
  allowLedgerLines: true,
  includeAccidentals: false,
};

export function getBenchmarkPresetById(id) {
  return NPM_BENCHMARK_PRESETS.find((preset) => preset.id === id) || null;
}

export function buildPracticeConfig(settings) {
  const nextSettings = {
    ...DEFAULT_PRACTICE_SETTINGS,
    ...(settings || {}),
  };
  const clef = isSupportedClef(nextSettings.clef) ? nextSettings.clef : DEFAULT_PRACTICE_SETTINGS.clef;
  const inputMode = nextSettings.inputMode === "midi" ? "midi" : "keyboard";
  const allowLedgerLines = Boolean(nextSettings.allowLedgerLines);
  const durationSeconds = normalizeDurationSeconds(nextSettings.durationSeconds);
  const includeAccidentals = inputMode === "midi" ? Boolean(nextSettings.includeAccidentals) : false;
  const range = resolveRange(clef, allowLedgerLines);

  return {
    id: "practice",
    label: "Practice",
    description: `${clef} clef practice`,
    runType: "practice",
    clef,
    inputMode,
    durationSeconds,
    includeAccidentals,
    allowLedgerLines,
    notePool: {
      type: allowLedgerLines ? "full-clef-range" : "inside-staff",
      low: range.low,
      high: range.high,
    },
    scoringFormulaVersion: NPM_FLUENCY_FORMULA_VERSION,
    qualificationAccuracy: NPM_BENCHMARK_QUALIFICATION_ACCURACY,
  };
}

export function validateRunConfig(runConfig) {
  if (!runConfig || typeof runConfig !== "object") {
    return { valid: false, reason: "Missing run config." };
  }
  if (!["benchmark", "practice"].includes(runConfig.runType)) {
    return { valid: false, reason: "Unsupported run type." };
  }
  if (!isSupportedClef(runConfig.clef)) {
    return { valid: false, reason: "Unsupported clef." };
  }
  if (!["keyboard", "midi"].includes(runConfig.inputMode)) {
    return { valid: false, reason: "Unsupported input mode." };
  }
  if (!Number.isFinite(runConfig.durationSeconds) || runConfig.durationSeconds <= 0) {
    return { valid: false, reason: "Invalid duration." };
  }
  if (!runConfig.notePool || !Number.isFinite(runConfig.notePool.low) || !Number.isFinite(runConfig.notePool.high) || runConfig.notePool.low > runConfig.notePool.high) {
    return { valid: false, reason: "Invalid note pool." };
  }
  if (!runConfig.scoringFormulaVersion) {
    return { valid: false, reason: "Missing scoring formula version." };
  }
  return { valid: true };
}
