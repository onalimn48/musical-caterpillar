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
  "per_note_accuracy_summary",
  "recurring_hesitation_notes",
  "below_threshold_diagnosis",
  "below_threshold_analysis",
  "below_threshold_teacher_move",
  "teacher_rating",
];

export const BENCHMARK_RESULTS_CSV_HEADER_LABELS = {
  run_at: "Run At",
  student_label: "Student",
  preset: "Benchmark",
  attempted: "Attempted Notes",
  correct: "Correct Notes",
  accuracy_pct: "Accuracy (%)",
  flow_pct: "Flow (%)",
  rate_score: "Rate Score",
  fluency_score: "Fluency Score",
  advanced_bonus: "Advanced Bonus",
  fluency_band: "Fluency Band",
  qualified: "Qualified",
  official_benchmark: "Official Benchmark",
  scoring_formula_version: "Scoring Formula",
  median_response_time_ms: "Median Response Time (ms)",
  hesitation_count: "Hesitation Spikes",
  hesitation_rate: "Hesitation Rate (%)",
  total_excess_delay_ms: "Total Hesitation Delay (ms)",
  average_excess_delay_ms: "Average Hesitation Delay (ms)",
  max_excess_delay_ms: "Largest Hesitation Delay (ms)",
  top_delayed_note: "Most Delayed Note",
  top_delayed_note_group: "Main Delay Pattern",
  per_note_accuracy_summary: "Per-Note Accuracy",
  recurring_hesitation_notes: "Recurring Hesitation Notes",
  below_threshold_diagnosis: "Below-Threshold Diagnosis",
  below_threshold_analysis: "Instructional Analysis",
  below_threshold_teacher_move: "Suggested Teacher Move",
  teacher_rating: "Teacher Rating",
};

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

function formatPerNoteAccuracy(summary = {}) {
  const noteStats = summary.noteStats || {};

  return Object.entries(noteStats)
    .map(([note, stats]) => {
      if (!stats || !Number.isFinite(stats.total) || stats.total <= 0) return null;
      const accuracy = (stats.correct / stats.total) * 100;
      return {
        note,
        accuracy,
        correct: stats.correct,
        total: stats.total,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return a.note.localeCompare(b.note);
    })
    .map((entry) => `${entry.note} ${Math.round(entry.accuracy)}% (${entry.correct}/${entry.total})`)
    .join("; ");
}

function formatRecurringHesitationNotes(summary = {}) {
  const entries = Array.isArray(summary.hesitationCountsByNote)
    ? summary.hesitationCountsByNote
    : [];

  return entries
    .filter((entry) => entry?.hesitationCount >= 2)
    .slice(0, 3)
    .map((entry) => `${entry.label} (${entry.hesitationCount} spikes, avg ${entry.averageExcessDelayMs} ms)`)
    .join("; ");
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
    per_note_accuracy_summary: formatPerNoteAccuracy(summary),
    recurring_hesitation_notes: formatRecurringHesitationNotes(summary),
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
  return BENCHMARK_RESULTS_CSV_COLUMNS
    .map((column) => BENCHMARK_RESULTS_CSV_HEADER_LABELS[column] || column)
    .join("\t");
}
