import { buildBelowThresholdAnalysis, getBelowThresholdDiagnosis } from "./benchmarkInsights.js";

export const BENCHMARK_RESULTS_CSV_COLUMNS = [
  "run_at",
  "student_label",
  "preset",
  "attempted",
  "correct",
  "accuracy_pct",
  "flow_pct",
  "rate_score",
  "fluency_score",
  "advanced_bonus",
  "fluency_band",
  "qualified",
  "official_benchmark",
  "scoring_formula_version",
  "median_response_time_ms",
  "hesitation_count",
  "hesitation_rate",
  "total_excess_delay_ms",
  "average_excess_delay_ms",
  "max_excess_delay_ms",
  "top_delayed_note",
  "top_delayed_note_group",
  "below_threshold_diagnosis",
  "below_threshold_analysis",
  "below_threshold_teacher_move",
  "teacher_rating",
];

export const CSV_HEADER_SESSION_STORAGE_KEY = "npm-benchmark-results-csv-header-copied";

function normalizeCellValue(value) {
  if (value == null) return "";
  return String(value);
}

function escapeCsvValue(value) {
  const normalized = normalizeCellValue(value);
  return normalized;
}

function toIsoString(value) {
  if (value == null || value === "") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function buildBenchmarkResultsCsvRecord({ session, studentLabel, teacherRating }) {
  const summary = session?.summary || {};
  const diagnosis = getBelowThresholdDiagnosis(summary);
  const analysis = buildBelowThresholdAnalysis(session, summary);
  return {
    run_at: toIsoString(session?.completedAt),
    student_label: studentLabel,
    preset: session?.presetId ?? "",
    attempted: summary.attemptedNotes,
    correct: summary.correctNotes,
    accuracy_pct: summary.accuracy,
    flow_pct: summary.flowPct,
    rate_score: summary.rateScore,
    fluency_score: summary.fluencyScore,
    advanced_bonus: summary.advancedFluencyBonus,
    fluency_band: summary.fluencyBand,
    qualified: summary.qualified,
    official_benchmark: session?.officialBenchmark,
    scoring_formula_version: summary.scoringFormulaVersion,
    median_response_time_ms: summary.medianResponseTimeMs,
    hesitation_count: summary.hesitationCount,
    hesitation_rate: summary.hesitationRate,
    total_excess_delay_ms: summary.totalExcessDelayMs,
    average_excess_delay_ms: summary.averageExcessDelayMs,
    max_excess_delay_ms: summary.maxExcessDelayMs,
    top_delayed_note: summary.topDelayedNotes?.[0]?.label ?? "",
    top_delayed_note_group: summary.topDelayedNoteGroups?.[0]?.label ?? "",
    below_threshold_diagnosis: diagnosis?.code ?? "",
    below_threshold_analysis: analysis?.lines?.find((line) => line.startsWith("Instructional read:")) ?? "",
    below_threshold_teacher_move: analysis?.lines?.find((line) => line.startsWith("Teacher move:")) ?? "",
    teacher_rating: teacherRating,
  };
}

export function buildBenchmarkResultsCsvRow({ session, studentLabel, teacherRating }) {
  const record = buildBenchmarkResultsCsvRecord({
    session,
    studentLabel,
    teacherRating,
  });

  return BENCHMARK_RESULTS_CSV_COLUMNS
    .map((column) => escapeCsvValue(record[column]))
    .join("\t");
}

export function buildBenchmarkResultsCsvHeader() {
  return BENCHMARK_RESULTS_CSV_COLUMNS.join("\t");
}
