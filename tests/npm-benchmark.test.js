import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPracticeConfig,
  getBenchmarkPresetById,
  NPM_BENCHMARK_PRESETS,
  validateRunConfig,
} from "../src/games/notes-per-minute/data/benchmarks.js";
import { buildNoteGroups } from "../src/games/notes-per-minute/data/noteGroups.js";
import { BASELINE_MIN_SAMPLES, getHesitationFeedback, getHesitationStats } from "../src/games/shared/fluency/hesitation.js";
import {
  getAccuracyPct,
  getAdvancedFluencyBonus,
  getFlowPct,
  MIN_ATTEMPTS_FOR_SCORE,
  getRateScore,
  scoreFluency,
} from "../src/games/shared/fluency/scoring.js";
import {
  buildBenchmarkHistoryByPreset,
  buildRunSummary,
  buildTeacherSnapshot,
  selectBestFluencyRun,
  selectFastestRawRun,
} from "../src/games/shared/fluency/sessionPayloads.js";
import {
  buildBenchmarkDashboard,
  loadBenchmarkSessions,
  persistBenchmarkSession,
} from "../src/games/notes-per-minute/state/storage.js";

function createAttempt({
  correct,
  time,
  note = "C",
  answered = "C",
  fullName = "C4",
  index = 0,
  position = 0,
  clef = "Treble",
}) {
  return {
    correct,
    time,
    note,
    answered,
    fullName,
    index,
    position,
    clef,
    noteGroups: buildNoteGroups({
      noteName: note,
      fullName,
      position,
      clef,
    }),
  };
}

function createBenchmarkSession({
  id,
  presetId,
  rawNpm,
  correctNotes = rawNpm,
  accuracy,
  flowPct = 96,
  rateScore = 100,
  fluencyScore,
  fluencyBand,
  advancedFluencyBonus = 0,
  hesitationCount = 0,
  qualifiedBenchmark,
  scoreEligible = true,
  attemptedNotes = Math.max(correctNotes, 15),
  completedAt,
}) {
  return {
    id,
    presetId,
    runType: "benchmark",
    benchmarkId: presetId,
    qualifiedBenchmark,
    officialBenchmark: qualifiedBenchmark,
    completedAt,
    summary: {
      rawNpm,
      correctNotes,
      correct: correctNotes,
      attemptedNotes,
      scoreEligible,
      accuracy,
      flowPct,
      rateScore,
      fluencyScore,
      advancedFluencyBonus,
      fluencyBand,
      hesitationCount,
      sessionDurationSeconds: 60,
      topDelayedNotes: [],
      topDelayedNoteGroups: [],
      weakNotes: [],
    },
  };
}

function installMockStorage(initialValues = {}) {
  const store = new Map(Object.entries(initialValues));
  globalThis.window = {
    storage: {
      async get(key) {
        if (!store.has(key)) throw new Error("Not found");
        return { key, value: store.get(key), shared: false };
      },
      async set(key, value) {
        store.set(key, value);
        return { key, value, shared: false };
      },
      async delete(key) {
        store.delete(key);
        return { key, deleted: true, shared: false };
      },
      async list(prefix = "") {
        return {
          keys: [...store.keys()].filter((key) => key.startsWith(prefix)),
          prefix,
          shared: false,
        };
      },
    },
  };
  return store;
}

test("benchmark presets are exact, explicit, and immutable", () => {
  const expected = [
    ["NPM-T1", "Treble", false],
    ["NPM-B1", "Bass", false],
    ["NPM-A1", "Alto", false],
    ["NPM-T2", "Treble", true],
    ["NPM-B2", "Bass", true],
    ["NPM-A2", "Alto", true],
  ];

  assert.deepEqual(
    NPM_BENCHMARK_PRESETS.map((preset) => preset.id),
    expected.map(([id]) => id),
  );

  for (const [id, clef, allowLedgerLines] of expected) {
    const preset = getBenchmarkPresetById(id);
    assert.ok(preset, `${id} should exist`);
    assert.equal(preset.clef, clef);
    assert.equal(preset.includeAccidentals, false);
    assert.equal(preset.allowLedgerLines, allowLedgerLines);
    assert.equal(preset.durationSeconds, 60);
    assert.equal(preset.inputMode, "keyboard");
    assert.equal(preset.scoringFormulaVersion, "fluency-v2");
    assert.ok(Number.isFinite(preset.notePool.low));
    assert.ok(Number.isFinite(preset.notePool.high));
    assert.ok(preset.notePool.low <= preset.notePool.high);
  }

  const practiceConfig = buildPracticeConfig({
    clef: "Bass",
    inputMode: "midi",
    durationSeconds: 90,
    allowLedgerLines: true,
    includeAccidentals: true,
  });
  assert.equal(practiceConfig.inputMode, "midi");
  assert.equal(practiceConfig.durationSeconds, 90);

  const presetAgain = getBenchmarkPresetById("NPM-T1");
  assert.equal(presetAgain.clef, "Treble");
  assert.equal(presetAgain.inputMode, "keyboard");
  assert.equal(presetAgain.durationSeconds, 60);
  assert.equal(presetAgain.includeAccidentals, false);
});

test("practice config sanitizes malformed settings and validation rejects broken configs", () => {
  const sanitized = buildPracticeConfig({
    clef: "Nope",
    inputMode: "weird",
    durationSeconds: -5,
    includeAccidentals: true,
  });

  assert.equal(sanitized.clef, "Treble");
  assert.equal(sanitized.inputMode, "keyboard");
  assert.equal(sanitized.durationSeconds, 60);
  assert.equal(sanitized.includeAccidentals, false);
  assert.deepEqual(validateRunConfig(sanitized), { valid: true });

  assert.deepEqual(validateRunConfig(null), { valid: false, reason: "Missing run config." });
  assert.deepEqual(
    validateRunConfig({ ...sanitized, notePool: { low: 4, high: 1 } }),
    { valid: false, reason: "Invalid note pool." },
  );
  assert.deepEqual(
    validateRunConfig({ ...sanitized, scoringFormulaVersion: "" }),
    { valid: false, reason: "Missing scoring formula version." },
  );
});

test("fluency scoring uses accuracy and flow first, with separate advanced bonus", () => {
  const slowAccurate = scoreFluency({ attemptedNotes: 12, correctNotes: 11, flowPct: 100 });
  const fastSloppy = scoreFluency({ attemptedNotes: 40, correctNotes: 24, flowPct: 100 });
  const fastAccurate = scoreFluency({ attemptedNotes: 35, correctNotes: 32, flowPct: 97.5 });
  const elite = scoreFluency({ attemptedNotes: 42, correctNotes: 40, flowPct: 100 });
  const boundaryBonus = getAdvancedFluencyBonus({ correctNotes: 30, accuracyPct: 85, flowPct: 80 });

  assert.equal(getAccuracyPct(12, 11), 91.66666666666666);
  assert.equal(getRateScore(11, 30), 36.666666666666664);
  assert.equal(getFlowPct({ attemptedNotes: 3, hesitationCount: 1 }), 66.66666666666667);
  assert.equal(getFlowPct({ attemptedNotes: 0, hesitationCount: 0 }), null);
  assert.equal(MIN_ATTEMPTS_FOR_SCORE, 15);

  assert.deepEqual(
    {
      fluencyScore: slowAccurate.fluencyScore,
      advancedFluencyBonus: slowAccurate.advancedFluencyBonus,
      band: slowAccurate.band,
    },
    {
      fluencyScore: 87.8,
      advancedFluencyBonus: 0,
      band: "Secure",
    },
  );
  assert.deepEqual(
    {
      fluencyScore: fastSloppy.fluencyScore,
      advancedFluencyBonus: fastSloppy.advancedFluencyBonus,
      band: fastSloppy.band,
    },
    {
      fluencyScore: 70,
      advancedFluencyBonus: 0,
      band: "Developing",
    },
  );
  assert.deepEqual(
    {
      fluencyScore: fastAccurate.fluencyScore,
      advancedFluencyBonus: fastAccurate.advancedFluencyBonus,
      band: fastAccurate.band,
    },
    {
      fluencyScore: 93.5,
      advancedFluencyBonus: 0.4,
      band: "Strong",
    },
  );
  assert.deepEqual(
    {
      fluencyScore: elite.fluencyScore,
      advancedFluencyBonus: elite.advancedFluencyBonus,
      band: elite.band,
    },
    {
      fluencyScore: 96.7,
      advancedFluencyBonus: 2.7,
      band: "Excellent",
    },
  );
  assert.equal(boundaryBonus.advancedFluencyBonus, 0);
});

test("hesitation calibration is retroactive and protected from threshold drift", () => {
  const events = [
    createAttempt({ correct: true, time: 1.0, note: "C", fullName: "C4", position: 0, index: 0 }),
    createAttempt({ correct: true, time: 1.0, note: "D", fullName: "D4", position: 1, index: 1 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 2 }),
    createAttempt({ correct: true, time: 4.0, note: "F", fullName: "F4", position: 3, index: 3 }),
    createAttempt({ correct: true, time: 1.0, note: "G", fullName: "G4", position: 4, index: 4 }),
    createAttempt({ correct: true, time: 1.0, note: "A", fullName: "A4", position: 5, index: 5 }),
    createAttempt({ correct: true, time: 2.0, note: "B", fullName: "B4", position: 6, index: 6 }),
    createAttempt({ correct: true, time: 1.1, note: "C", fullName: "C5", position: 7, index: 7 }),
  ];

  const hesitationStats = getHesitationStats(events);

  assert.equal(BASELINE_MIN_SAMPLES, 8);
  assert.equal(hesitationStats.initialBaselineSeconds, 1);
  assert.equal(hesitationStats.hesitationCount, 2);
  assert.equal(hesitationStats.hesitationEvents[0].index, 3);
  assert.equal(hesitationStats.hesitationEvents[1].index, 6);
  assert.equal(hesitationStats.hesitationEvents[0].thresholdSeconds, 1.75);
  assert.equal(hesitationStats.hesitationEvents[1].thresholdSeconds, 1.75);
  assert.equal(hesitationStats.flowPct, 75);
  assert.equal(hesitationStats.flowConfidence, "none");
});

test("run summaries keep standardized benchmark scoring separate from non-standard practice", () => {
  const preset = getBenchmarkPresetById("NPM-T1");
  const longPractice = buildPracticeConfig({ clef: "Bass", durationSeconds: 90 });

  const benchmarkResults = Array.from({ length: 35 }, (_, index) => (
    createAttempt({
      correct: index < 32,
      time: index === 10 ? 2.5 : 0.9,
      note: index % 2 === 0 ? "G" : "E",
      answered: index < 32 ? (index % 2 === 0 ? "G" : "E") : "B",
      fullName: index % 2 === 0 ? "G4" : "E4",
      position: index % 2 === 0 ? 4 : 2,
      index,
    })
  ));
  const practiceResults = Array.from({ length: 30 }, (_, index) => (
    createAttempt({
      correct: index < 27,
      time: 1.2,
      note: index % 2 === 0 ? "D" : "F",
      answered: index < 27 ? (index % 2 === 0 ? "D" : "F") : "A",
      fullName: index % 2 === 0 ? "D3" : "F3",
      position: index % 2 === 0 ? -9 : -7,
      clef: "Bass",
      index,
    })
  ));

  const benchmarkSummary = buildRunSummary({
    results: benchmarkResults,
    runConfig: preset,
    formulaVersion: preset.scoringFormulaVersion,
    qualificationAccuracy: preset.qualificationAccuracy,
  });
  const practiceSummary = buildRunSummary({
    results: practiceResults,
    runConfig: longPractice,
    formulaVersion: longPractice.scoringFormulaVersion,
    qualificationAccuracy: longPractice.qualificationAccuracy,
  });

  assert.equal(benchmarkSummary.accuracy, 91.4);
  assert.equal(benchmarkSummary.flowPct, 97.1);
  assert.equal(benchmarkSummary.flowConfidence, "full");
  assert.equal(benchmarkSummary.rateScore, 100);
  assert.equal(benchmarkSummary.fluencyScore, 93.4);
  assert.equal(benchmarkSummary.advancedFluencyBonus, 0.4);
  assert.equal(benchmarkSummary.qualified, true);

  assert.equal(practiceSummary.standardizedScoringEligible, false);
  assert.equal(practiceSummary.fluencyScore, null);
  assert.equal(practiceSummary.advancedFluencyBonus, null);
  assert.equal(practiceSummary.rawNpm, 18);
  assert.match(practiceSummary.standardizationNote, /60-second runs/);
});

test("scores are withheld below 15 attempts while baseline and flow remain separate concepts", () => {
  const tinyRun = getHesitationStats([
    createAttempt({ correct: true, time: 1.0, note: "C", fullName: "C4", position: 0, index: 0 }),
    createAttempt({ correct: true, time: 2.0, note: "D", fullName: "D4", position: 1, index: 1 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 2 }),
    createAttempt({ correct: true, time: 1.0, note: "F", fullName: "F4", position: 3, index: 3 }),
  ]);
  const underThresholdResults = Array.from({ length: 14 }, (_, index) => (
    createAttempt({
      correct: index < 13,
      time: index === 6 ? 2.4 : 1.0,
      note: index % 2 === 0 ? "C" : "D",
      answered: index < 13 ? (index % 2 === 0 ? "C" : "D") : "E",
      fullName: index % 2 === 0 ? "C4" : "D4",
      position: index % 2 === 0 ? 0 : 1,
      index,
    })
  ));
  const underThresholdSummary = buildRunSummary({
    results: underThresholdResults,
    runConfig: getBenchmarkPresetById("NPM-T1"),
    formulaVersion: "fluency-v2",
    qualificationAccuracy: 85,
  });
  const scoreEligibleResults = Array.from({ length: 15 }, (_, index) => (
    createAttempt({
      correct: true,
      time: index === 8 ? 2.0 : 1.0,
      note: index % 2 === 0 ? "E" : "F",
      answered: index % 2 === 0 ? "E" : "F",
      fullName: index % 2 === 0 ? "E4" : "F4",
      position: index % 2 === 0 ? 2 : 3,
      index,
    })
  ));
  const scoreEligibleSummary = buildRunSummary({
    results: scoreEligibleResults,
    runConfig: getBenchmarkPresetById("NPM-T1"),
    formulaVersion: "fluency-v2",
    qualificationAccuracy: 85,
  });

  assert.equal(tinyRun.flowConfidence, "none");
  assert.equal(tinyRun.flowPct, 75);
  assert.equal(underThresholdSummary.scoreEligible, false);
  assert.equal(underThresholdSummary.fluencyScore, null);
  assert.equal(underThresholdSummary.advancedFluencyBonus, null);
  assert.match(underThresholdSummary.scoreThresholdNote, /few more notes/);
  assert.equal(underThresholdSummary.flowConfidence, "none");
  assert.equal(scoreEligibleSummary.scoreEligible, true);
  assert.equal(scoreEligibleSummary.flowConfidence, "full");
  assert.ok(Number.isFinite(scoreEligibleSummary.fluencyScore));
});

test("flow confidence is full once score threshold is met", () => {
  const fullRun = getHesitationStats([
    createAttempt({ correct: true, time: 1.0, note: "C", fullName: "C4", position: 0, index: 0 }),
    createAttempt({ correct: true, time: 1.0, note: "D", fullName: "D4", position: 1, index: 1 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 2 }),
    createAttempt({ correct: true, time: 1.0, note: "F", fullName: "F4", position: 3, index: 3 }),
    createAttempt({ correct: true, time: 1.0, note: "G", fullName: "G4", position: 4, index: 4 }),
    createAttempt({ correct: true, time: 2.5, note: "A", fullName: "A4", position: 5, index: 5 }),
    createAttempt({ correct: true, time: 1.0, note: "B", fullName: "B4", position: 6, index: 6 }),
    createAttempt({ correct: true, time: 1.0, note: "C", fullName: "C5", position: 7, index: 7 }),
    createAttempt({ correct: true, time: 1.0, note: "D", fullName: "D5", position: 8, index: 8 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E5", position: 9, index: 9 }),
    createAttempt({ correct: true, time: 1.0, note: "F", fullName: "F5", position: 10, index: 10 }),
    createAttempt({ correct: true, time: 1.0, note: "G", fullName: "G5", position: 11, index: 11 }),
    createAttempt({ correct: true, time: 1.0, note: "A", fullName: "A5", position: 12, index: 12 }),
    createAttempt({ correct: true, time: 1.0, note: "B", fullName: "B5", position: 13, index: 13 }),
    createAttempt({ correct: true, time: 1.0, note: "C", fullName: "C6", position: 14, index: 14 }),
  ]);

  assert.equal(fullRun.flowConfidence, "full");
  assert.equal(fullRun.flowPct, 93.3);
});

test("hesitation feedback surfaces the actual delayed notes and note groups", () => {
  const results = [
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 0 }),
    createAttempt({ correct: true, time: 1.0, note: "D", fullName: "D4", position: 1, index: 1 }),
    createAttempt({ correct: true, time: 1.1, note: "E", fullName: "E4", position: 2, index: 2 }),
    createAttempt({ correct: true, time: 2.8, note: "G", fullName: "G4", position: 4, index: 3 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 4 }),
    createAttempt({ correct: true, time: 2.6, note: "G", fullName: "G4", position: 4, index: 5 }),
    createAttempt({ correct: false, time: 2.4, note: "G", answered: "A", fullName: "G4", position: 4, index: 6 }),
    createAttempt({ correct: true, time: 1.0, note: "E", fullName: "E4", position: 2, index: 7 }),
  ];

  const hesitationStats = getHesitationStats(results);
  const feedback = getHesitationFeedback({
    hesitationStats,
    weakNotes: [],
    accuracyPct: 87.5,
    runType: "benchmark",
  });

  assert.equal(hesitationStats.hesitationCount, 3);
  assert.equal(hesitationStats.topDelayedNotes?.[0], undefined);
  assert.equal(feedback.topDelayedNotes[0].label, "G4");
  assert.ok(feedback.topDelayedNoteGroups.some((entry) => entry.label === "line notes"));
  assert.ok(feedback.studentMessages.some((message) => /G4/.test(message)));
  assert.ok(feedback.teacherMessages.some((message) => /Top delayed notes/.test(message)));
});

test("benchmark history and teacher snapshots keep best fluency and fastest raw semantics separate", () => {
  const sessions = [
    createBenchmarkSession({
      id: "1",
      presetId: "NPM-T1",
      rawNpm: 34,
      correctNotes: 34,
      accuracy: 72,
      flowPct: 88,
      rateScore: 100,
      fluencyScore: 64.2,
      fluencyBand: "Emerging",
      advancedFluencyBonus: 0,
      qualifiedBenchmark: false,
      completedAt: 1,
    }),
    createBenchmarkSession({
      id: "2",
      presetId: "NPM-T1",
      rawNpm: 31,
      correctNotes: 31,
      accuracy: 92,
      flowPct: 94,
      rateScore: 100,
      fluencyScore: 94.1,
      fluencyBand: "Strong",
      advancedFluencyBonus: 0.8,
      hesitationCount: 1,
      qualifiedBenchmark: true,
      completedAt: 2,
    }),
    createBenchmarkSession({
      id: "3",
      presetId: "NPM-B1",
      rawNpm: 29,
      correctNotes: 29,
      accuracy: 90,
      flowPct: 91,
      rateScore: 96.7,
      fluencyScore: 91.4,
      fluencyBand: "Strong",
      advancedFluencyBonus: 0,
      qualifiedBenchmark: true,
      completedAt: 3,
    }),
  ];

  const history = buildBenchmarkHistoryByPreset(sessions);
  assert.equal(history["NPM-T1"].latest.id, "2");
  assert.equal(history["NPM-T1"].fastestRawRun.id, "1");
  assert.equal(history["NPM-T1"].bestFluencyRun.id, "2");
  assert.equal(history["NPM-T1"].bestAttempt.id, "1");
  assert.equal(history["NPM-B1"].latest.id, "3");

  const teacher = buildTeacherSnapshot(sessions);
  assert.equal(teacher.latestRawNpm, 29);
  assert.equal(teacher.bestRawNpm, 34);
  assert.equal(teacher.fastestRawRun.id, "1");
  assert.equal(teacher.bestFluencyRun.id, "2");
  assert.equal(teacher.bestFluencyScore, 94.1);
  assert.equal(teacher.bestFluencyRawNpm, 31);
  assert.equal(teacher.fastestRawNpm, 34);
  assert.equal(teacher.bestQualifiedRawNpm, 31);
  assert.equal(teacher.latestFluencyScore, 91.4);
  assert.equal(teacher.latestAdvancedFluencyBonus, 0);
  assert.equal(teacher.recentBenchmarkHistoryByPreset["NPM-T1"].length, 2);
});

test("best fluency run uses the specified tie-break order and fastest raw run stays separate", () => {
  const sessions = [
    createBenchmarkSession({
      id: "tie-1",
      presetId: "NPM-T2",
      rawNpm: 32,
      correctNotes: 32,
      accuracy: 91,
      flowPct: 93,
      rateScore: 100,
      fluencyScore: 95,
      fluencyBand: "Excellent",
      qualifiedBenchmark: true,
      completedAt: 1,
    }),
    createBenchmarkSession({
      id: "tie-2",
      presetId: "NPM-T2",
      rawNpm: 31,
      correctNotes: 31,
      accuracy: 94,
      flowPct: 90,
      rateScore: 100,
      fluencyScore: 95,
      fluencyBand: "Excellent",
      qualifiedBenchmark: true,
      completedAt: 2,
    }),
    createBenchmarkSession({
      id: "tie-3",
      presetId: "NPM-T2",
      rawNpm: 35,
      correctNotes: 35,
      accuracy: 83,
      flowPct: 97,
      rateScore: 100,
      fluencyScore: 93,
      fluencyBand: "Strong",
      qualifiedBenchmark: false,
      completedAt: 3,
    }),
  ];

  assert.equal(selectBestFluencyRun(sessions).id, "tie-2");
  assert.equal(selectFastestRawRun(sessions).id, "tie-3");
});

test("benchmark persistence appends repeated runs, ignores malformed data, and strips derived reporting snapshots", async () => {
  const malformedStoredPayload = JSON.stringify([
    { bad: true },
    createBenchmarkSession({
      id: "stored-1",
      presetId: "NPM-T1",
      rawNpm: 27,
      accuracy: 86,
      fluencyScore: 84.3,
      fluencyBand: "Secure",
      advancedFluencyBonus: 0,
      qualifiedBenchmark: true,
      completedAt: 1,
    }),
  ]);
  const storage = installMockStorage({
    "npm-benchmark-sessions-v1": malformedStoredPayload,
  });

  const sessionA = {
    ...createBenchmarkSession({
      id: "stored-2",
      presetId: "NPM-T1",
      rawNpm: 36,
      accuracy: 70,
      fluencyScore: 71.5,
      fluencyBand: "Developing",
      advancedFluencyBonus: 0,
      qualifiedBenchmark: false,
      completedAt: 2,
    }),
    reportingSnapshot: { duplicated: true },
  };
  const sessionB = createBenchmarkSession({
    id: "stored-3",
    presetId: "NPM-B1",
    rawNpm: 32,
    accuracy: 92,
    fluencyScore: 95.4,
    fluencyBand: "Strong",
    advancedFluencyBonus: 0.5,
    qualifiedBenchmark: true,
    completedAt: 3,
  });

  await persistBenchmarkSession(sessionA);
  await persistBenchmarkSession(sessionB);

  const loaded = await loadBenchmarkSessions();
  assert.equal(loaded.length, 3);
  assert.ok(loaded.every((session) => !("reportingSnapshot" in session)));

  const persistedRaw = JSON.parse(storage.get("npm-benchmark-sessions-v1"));
  assert.equal(persistedRaw.length, 3);
  assert.ok(persistedRaw.every((session) => !("reportingSnapshot" in session)));

  const dashboard = buildBenchmarkDashboard(loaded);
  assert.equal(dashboard.historyByPreset["NPM-T1"].latest.id, "stored-2");
  assert.equal(dashboard.historyByPreset["NPM-T1"].fastestRawRun.id, "stored-2");
  assert.equal(dashboard.historyByPreset["NPM-T1"].bestFluencyRun.id, "stored-1");
  assert.equal(dashboard.bestFluencySession.id, "stored-3");
  assert.equal(dashboard.fastestRawSession.id, "stored-2");
  assert.equal(dashboard.teacherSnapshot.bestRawNpm, 36);
  assert.equal(dashboard.teacherSnapshot.bestFluencyScore, 95.4);
  assert.equal(dashboard.teacherSnapshot.bestQualifiedRawNpm, 32);
});
