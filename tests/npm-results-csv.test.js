import assert from "node:assert/strict";
import test from "node:test";

import {
  BENCHMARK_RESULTS_CSV_COLUMNS,
  buildBenchmarkResultsCsvHeader,
  buildBenchmarkResultsCsvRecord,
  buildBenchmarkResultsCsvRow,
  CSV_HEADER_SESSION_STORAGE_KEY,
} from "../src/games/notes-per-minute/utils/csvExport.js";

function createSession(overrides = {}) {
  return {
    completedAt: "2026-03-10T22:15:30.000Z",
    presetId: "NPM-B2",
    officialBenchmark: true,
    summary: {
      attemptedNotes: 110,
      correctNotes: 105,
      accuracy: 95.5,
      flowPct: 92.4,
      rateScore: 100,
      fluencyScore: 96.3,
      advancedFluencyBonus: 1.7,
      fluencyBand: "Excellent",
      qualified: true,
      scoringFormulaVersion: "fluency-v2",
      medianResponseTimeMs: 640,
      hesitationCount: 6,
      hesitationRate: 5.5,
      totalExcessDelayMs: 2100,
      averageExcessDelayMs: 350,
      maxExcessDelayMs: 810,
      topDelayedNotes: [{ label: "G3" }],
      topDelayedNoteGroups: [{ label: "Bass clef line notes" }],
    },
    ...overrides,
  };
}

test("csv header matches the requested benchmark export columns", () => {
  assert.equal(
    buildBenchmarkResultsCsvHeader(),
    BENCHMARK_RESULTS_CSV_COLUMNS.join("\t"),
  );
  assert.equal(
    CSV_HEADER_SESSION_STORAGE_KEY,
    "npm-benchmark-results-csv-header-copied",
  );
});

test("csv export record maps the completed benchmark session fields exactly", () => {
  const session = createSession();
  const record = buildBenchmarkResultsCsvRecord({
    session,
    studentLabel: "Student 1",
    teacherRating: "4",
  });

  assert.deepEqual(record, {
    run_at: "2026-03-10T22:15:30.000Z",
    student_label: "Student 1",
    preset: "NPM-B2",
    attempted: 110,
    correct: 105,
    accuracy_pct: 95.5,
    flow_pct: 92.4,
    rate_score: 100,
    fluency_score: 96.3,
    advanced_bonus: 1.7,
    fluency_band: "Excellent",
    qualified: true,
    official_benchmark: true,
    scoring_formula_version: "fluency-v2",
    median_response_time_ms: 640,
    hesitation_count: 6,
    hesitation_rate: 5.5,
    total_excess_delay_ms: 2100,
    average_excess_delay_ms: 350,
    max_excess_delay_ms: 810,
    top_delayed_note: "G3",
    top_delayed_note_group: "Bass clef line notes",
    teacher_rating: "4",
  });
});

test("csv export row escapes values and leaves nullish fields blank", () => {
  const session = createSession({
    completedAt: "not-a-date",
    presetId: null,
    officialBenchmark: false,
    summary: {
      attemptedNotes: 18,
      correctNotes: 15,
      accuracy: 83.3,
      flowPct: null,
      rateScore: null,
      fluencyScore: null,
      advancedFluencyBonus: null,
      fluencyBand: null,
      qualified: false,
      scoringFormulaVersion: "fluency-v2",
      medianResponseTimeMs: null,
      hesitationCount: 2,
      hesitationRate: 11.1,
      totalExcessDelayMs: null,
      averageExcessDelayMs: null,
      maxExcessDelayMs: null,
      topDelayedNotes: [],
      topDelayedNoteGroups: [],
    },
  });

  const row = buildBenchmarkResultsCsvRow({
    session,
    studentLabel: "Teacher, \"A\"",
    teacherRating: "",
  });

  assert.equal(
    row,
    [
      "",
      "Teacher, \"A\"",
      "",
      "18",
      "15",
      "83.3",
      "",
      "",
      "",
      "",
      "",
      "false",
      "false",
      "fluency-v2",
      "",
      "2",
      "11.1",
      "",
      "",
      "",
      "",
      "",
      "",
    ].join("\t"),
  );
});
