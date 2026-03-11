import { getHesitationFeedback, getHesitationStats } from "./hesitation.js";
import { getMedian, MIN_ATTEMPTS_FOR_SCORE, scoreFluency } from "./scoring.js";

function average(values = []) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildNoteStatEntry() {
  return {
    correct: 0,
    total: 0,
    hesitationCount: 0,
    totalExcessDelaySeconds: 0,
    totalExcessDelayMs: 0,
  };
}

function buildGroupStatEntry(label, category) {
  return {
    label,
    category,
    hesitationCount: 0,
    totalExcessDelaySeconds: 0,
    totalExcessDelayMs: 0,
  };
}

function toSortedGroupEntries(map) {
  return Object.entries(map)
    .map(([id, entry]) => ({
      id,
      ...entry,
      averageExcessDelaySeconds: entry.hesitationCount > 0
        ? round(entry.totalExcessDelaySeconds / entry.hesitationCount, 3)
        : 0,
      averageExcessDelayMs: entry.hesitationCount > 0
        ? Math.round((entry.totalExcessDelaySeconds / entry.hesitationCount) * 1000)
        : 0,
      totalExcessDelaySeconds: round(entry.totalExcessDelaySeconds, 3),
    }))
    .sort((a, b) => {
      if (b.hesitationCount !== a.hesitationCount) return b.hesitationCount - a.hesitationCount;
      if (b.totalExcessDelaySeconds !== a.totalExcessDelaySeconds) {
        return b.totalExcessDelaySeconds - a.totalExcessDelaySeconds;
      }
      return a.label.localeCompare(b.label);
    });
}

export function buildWeakNoteList(noteStats, limit = 3) {
  return Object.entries(noteStats)
    .filter(([, stats]) => stats.total > 0)
    .map(([note, stats]) => ({
      note,
      total: stats.total,
      correct: stats.correct,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      hesitationCount: stats.hesitationCount || 0,
      totalExcessDelayMs: stats.totalExcessDelayMs || 0,
    }))
    .sort((a, b) => {
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      if ((b.hesitationCount || 0) !== (a.hesitationCount || 0)) return (b.hesitationCount || 0) - (a.hesitationCount || 0);
      return b.total - a.total;
    })
    .filter((entry) => entry.accuracy < 85)
    .slice(0, limit)
    .map((entry) => ({
      ...entry,
      accuracy: Math.round(entry.accuracy),
    }));
}

export function buildRollingAccuracy(results, size = 5) {
  const groups = [];
  for (let index = 0; index < results.length; index += size) {
    const chunk = results.slice(index, index + size);
    groups.push({
      group: Math.floor(index / size) + 1,
      accuracy: (chunk.filter((attempt) => attempt.correct).length / chunk.length) * 100,
      avgTime: average(chunk.map((attempt) => attempt.time)) || 0,
    });
  }
  return groups;
}

export function buildNoteStats(results, hesitationStats) {
  const hesitationByIndex = new Map(
    hesitationStats.hesitationEvents.map((event) => [event.index, event]),
  );

  return results.reduce((stats, attempt) => {
    const current = stats[attempt.note] || buildNoteStatEntry();
    const hesitationEvent = hesitationByIndex.get(attempt.index);
    const totalExcessDelaySeconds = current.totalExcessDelaySeconds + (hesitationEvent?.excessDelaySeconds || 0);

    return {
      ...stats,
      [attempt.note]: {
        correct: current.correct + (attempt.correct ? 1 : 0),
        total: current.total + 1,
        hesitationCount: current.hesitationCount + (hesitationEvent ? 1 : 0),
        totalExcessDelaySeconds: round(totalExcessDelaySeconds, 3),
        totalExcessDelayMs: Math.round(totalExcessDelaySeconds * 1000),
      },
    };
  }, {});
}

export function buildNoteGroupStats(results, hesitationStats) {
  const groupMap = {};
  const hesitationByIndex = new Map(
    hesitationStats.hesitationEvents.map((event) => [event.index, event]),
  );

  for (const attempt of results) {
    const groups = Array.isArray(attempt.noteGroups) ? attempt.noteGroups : [];
    const hesitationEvent = hesitationByIndex.get(attempt.index);
    for (const group of groups) {
      const current = groupMap[group.id] || buildGroupStatEntry(group.label, group.category);
      const totalExcessDelaySeconds = current.totalExcessDelaySeconds + (hesitationEvent?.excessDelaySeconds || 0);
      groupMap[group.id] = {
        label: group.label,
        category: group.category,
        hesitationCount: current.hesitationCount + (hesitationEvent ? 1 : 0),
        totalExcessDelaySeconds,
        totalExcessDelayMs: Math.round(totalExcessDelaySeconds * 1000),
      };
    }
  }

  return toSortedGroupEntries(groupMap).filter((entry) => entry.hesitationCount > 0);
}

function getCompletedAtValue(session) {
  const completedAt = session?.completedAt;
  if (Number.isFinite(completedAt)) return completedAt;
  if (typeof completedAt === "string") {
    const timestamp = new Date(completedAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
  return 0;
}

function getCorrectCount(session) {
  if (Number.isFinite(session?.summary?.correctNotes)) return session.summary.correctNotes;
  if (Number.isFinite(session?.summary?.correct)) return session.summary.correct;
  if (Number.isFinite(session?.summary?.rawNpm)) return session.summary.rawNpm;
  return 0;
}

function getAccuracyValue(session) {
  return Number.isFinite(session?.summary?.accuracy) ? session.summary.accuracy : -1;
}

function getFlowValue(session) {
  return Number.isFinite(session?.summary?.flowPct) ? session.summary.flowPct : -1;
}

function getRateValue(session) {
  return Number.isFinite(session?.summary?.rateScore) ? session.summary.rateScore : -1;
}

function getFluencyValue(session) {
  return Number.isFinite(session?.summary?.fluencyScore) ? session.summary.fluencyScore : -1;
}

function isOfficialBenchmarkRun(session) {
  return Boolean(session?.officialBenchmark || session?.qualifiedBenchmark || session?.summary?.qualified);
}

function isScoreEligibleRun(session) {
  if (typeof session?.summary?.scoreEligible === "boolean") return session.summary.scoreEligible;
  if (Number.isFinite(session?.summary?.attemptedNotes)) {
    return session.summary.attemptedNotes >= MIN_ATTEMPTS_FOR_SCORE;
  }
  return Number.isFinite(session?.summary?.fluencyScore);
}

function isBenchmarkSession(session) {
  return Boolean(session?.presetId || session?.benchmarkId || session?.runType === "benchmark");
}

function isStandardizedBenchmarkDuration(session) {
  if (Number.isFinite(session?.summary?.sessionDurationSeconds)) {
    return session.summary.sessionDurationSeconds === 60;
  }
  if (Number.isFinite(session?.config?.durationSeconds)) {
    return session.config.durationSeconds === 60;
  }
  return true;
}

function pickBestSession(sessions, predicate, comparator) {
  return sessions
    .filter(predicate)
    .reduce((best, session) => {
      if (!best) return session;
      return comparator(session, best) < 0 ? session : best;
    }, null);
}

function compareBestFluencyRun(a, b) {
  if (getFluencyValue(a) !== getFluencyValue(b)) return getFluencyValue(b) - getFluencyValue(a);
  if (getAccuracyValue(a) !== getAccuracyValue(b)) return getAccuracyValue(b) - getAccuracyValue(a);
  if (getFlowValue(a) !== getFlowValue(b)) return getFlowValue(b) - getFlowValue(a);
  if (getRateValue(a) !== getRateValue(b)) return getRateValue(b) - getRateValue(a);
  if (getCorrectCount(a) !== getCorrectCount(b)) return getCorrectCount(b) - getCorrectCount(a);
  return getCompletedAtValue(b) - getCompletedAtValue(a);
}

function compareFastestRawRun(a, b) {
  if (getCorrectCount(a) !== getCorrectCount(b)) return getCorrectCount(b) - getCorrectCount(a);
  if (getAccuracyValue(a) !== getAccuracyValue(b)) return getAccuracyValue(b) - getAccuracyValue(a);
  return getCompletedAtValue(b) - getCompletedAtValue(a);
}

export function selectBestFluencyRun(sessions = []) {
  return pickBestSession(
    sessions,
    (session) => (
      isBenchmarkSession(session)
      && isStandardizedBenchmarkDuration(session)
      && isOfficialBenchmarkRun(session)
      && isScoreEligibleRun(session)
      && Number.isFinite(session?.summary?.fluencyScore)
    ),
    compareBestFluencyRun,
  );
}

export function selectFastestRawRun(sessions = []) {
  return pickBestSession(
    sessions,
    (session) => isBenchmarkSession(session) && isStandardizedBenchmarkDuration(session),
    compareFastestRawRun,
  );
}

export function selectFastestQualifiedRawRun(sessions = []) {
  return pickBestSession(
    sessions,
    (session) => (
      isBenchmarkSession(session)
      && isStandardizedBenchmarkDuration(session)
      && isOfficialBenchmarkRun(session)
    ),
    compareFastestRawRun,
  );
}

export function buildBenchmarkHistoryByPreset(sessions, { recentLimit = 5 } = {}) {
  const grouped = sessions.reduce((history, session) => {
    const key = session?.presetId;
    if (!key) return history;
    const list = history[key] || [];
    list.push(session);
    return { ...history, [key]: list };
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([presetId, presetSessions]) => {
      const latest = presetSessions[presetSessions.length - 1] || null;
      const fastestRawRun = selectFastestRawRun(presetSessions);
      const bestFluencyRun = selectBestFluencyRun(presetSessions);
      const fastestQualifiedRawRun = selectFastestQualifiedRawRun(presetSessions);

      return [
        presetId,
        {
          latest,
          bestFluencyRun,
          fastestRawRun,
          fastestQualifiedRawRun,
          // Legacy aliases kept for compatibility with older callers.
          bestAttempt: fastestRawRun,
          bestQualified: fastestQualifiedRawRun,
          recent: presetSessions.slice(-recentLimit),
        },
      ];
    }),
  );
}

export function buildTeacherSnapshot(sessions, { recentLimit = 5 } = {}) {
  const historyByPreset = buildBenchmarkHistoryByPreset(sessions, { recentLimit });
  const latest = sessions[sessions.length - 1] || null;
  const fastestRawRun = selectFastestRawRun(sessions);
  const bestFluencyRun = selectBestFluencyRun(sessions);
  const fastestQualifiedRawRun = selectFastestQualifiedRawRun(sessions);

  return {
    latestRawNpm: latest?.summary.rawNpm ?? null,
    bestRawNpm: fastestRawRun?.summary.rawNpm ?? null,
    bestQualifiedRawNpm: fastestQualifiedRawRun?.summary.rawNpm ?? null,
    bestFluencyScore: bestFluencyRun?.summary.fluencyScore ?? null,
    bestFluencyRawNpm: bestFluencyRun?.summary.rawNpm ?? null,
    fastestRawNpm: fastestRawRun?.summary.rawNpm ?? null,
    latestFluencyScore: latest?.summary.fluencyScore ?? null,
    latestAdvancedFluencyBonus: latest?.summary.advancedFluencyBonus ?? null,
    latestAccuracy: latest?.summary.accuracy ?? null,
    latestFlow: latest?.summary.flowPct ?? null,
    bestFluencyRun,
    fastestRawRun,
    fastestQualifiedRawRun,
    medianResponseTime: latest?.summary.medianResponseTimeMs ?? null,
    weakNotes: latest?.summary.weakNotes || [],
    hesitationCount: latest?.summary.hesitationCount ?? 0,
    hesitationRate: latest?.summary.hesitationRate ?? 0,
    topDelayedNotes: latest?.summary.topDelayedNotes || [],
    topDelayedNoteGroups: latest?.summary.topDelayedNoteGroups || [],
    totalExcessDelayMs: latest?.summary.totalExcessDelayMs ?? 0,
    teacherGuidance: latest?.summary.teacherFeedback || [],
    recentBenchmarkHistoryByPreset: Object.fromEntries(
      Object.entries(historyByPreset).map(([presetId, history]) => [
        presetId,
        history.recent.map((session) => ({
          id: session.id,
          completedAt: session.completedAt,
          rawNpm: session.summary.rawNpm,
          accuracy: session.summary.accuracy,
          flowPct: session.summary.flowPct,
          fluencyScore: session.summary.fluencyScore,
          advancedFluencyBonus: session.summary.advancedFluencyBonus,
          fluencyBand: session.summary.fluencyBand,
          hesitationCount: session.summary.hesitationCount,
          qualifiedBenchmark: session.qualifiedBenchmark,
          officialBenchmark: session.officialBenchmark,
        })),
      ]),
    ),
  };
}

function buildPracticeStandardizationNote(runConfig) {
  if (runConfig.runType !== "practice" || runConfig.durationSeconds === 60) return null;
  return "Fluency Score and Advanced Fluency Bonus are standardized only on 60-second runs. This practice run uses raw NPM, accuracy, flow, and hesitation guidance instead.";
}

function buildScoreThresholdNote({ attemptedNotes, runConfig }) {
  if (attemptedNotes >= MIN_ATTEMPTS_FOR_SCORE) return null;
  if (runConfig.runType === "practice" && runConfig.durationSeconds !== 60) return null;
  return "Keep going! We need a few more notes to calculate your score.";
}

export function buildRunSummary({
  results,
  runConfig,
  formulaVersion,
  qualificationAccuracy,
}) {
  const attemptedNotes = results.length;
  const correctAttempts = results.filter((attempt) => attempt.correct);
  const correctNotes = correctAttempts.length;
  const allResponseTimes = results
    .map((attempt) => attempt.time)
    .filter((time) => Number.isFinite(time) && time >= 0);
  const medianResponseTimeSeconds = getMedian(allResponseTimes);
  const avgTime = attemptedNotes ? average(allResponseTimes) : 0;
  const sessionDurationSeconds = runConfig.durationSeconds || 60;
  const accuracy = attemptedNotes ? (correctNotes / attemptedNotes) * 100 : 0;
  const rawNpm = sessionDurationSeconds > 0 ? (correctNotes / sessionDurationSeconds) * 60 : 0;
  const hesitationStats = getHesitationStats(results);
  const noteStats = buildNoteStats(results, hesitationStats);
  const noteGroupStats = buildNoteGroupStats(results, hesitationStats);
  const weakNotes = buildWeakNoteList(noteStats);
  const isStandardizedDuration = sessionDurationSeconds === 60;
  const scoreEligible = attemptedNotes >= MIN_ATTEMPTS_FOR_SCORE;
  const standardizedScoring = isStandardizedDuration && scoreEligible
    ? scoreFluency({
      attemptedNotes,
      correctNotes,
      flowPct: hesitationStats.flowPct,
      formulaVersion,
    })
    : null;
  const guidance = getHesitationFeedback({
    hesitationStats,
    weakNotes,
    accuracyPct: accuracy,
    runType: runConfig.runType,
  });
  const qualified = runConfig.runType === "benchmark"
    ? accuracy >= qualificationAccuracy
    : false;

  return {
    attemptedNotes,
    correctNotes,
    correct: correctNotes,
    wrong: attemptedNotes - correctNotes,
    total: attemptedNotes,
    sessionDurationSeconds,
    accuracy: round(accuracy, 1),
    avgTime: round(avgTime || 0, 3),
    rawNpm: round(rawNpm || 0, 1),
    correctRateCount: correctNotes,
    rateScore: standardizedScoring?.breakdown.rateScore ?? null,
    standardizedScoringEligible: isStandardizedDuration && scoreEligible,
    minimumAttemptsForScore: MIN_ATTEMPTS_FOR_SCORE,
    scoreEligible,
    scoreThresholdNote: buildScoreThresholdNote({ attemptedNotes, runConfig }),
    standardizationNote: buildPracticeStandardizationNote(runConfig),
    flowPct: hesitationStats.flowPct,
    flowConfidence: hesitationStats.flowConfidence,
    noteStats,
    noteGroupStats,
    rolling: buildRollingAccuracy(results),
    weakNotes,
    hesitationCount: hesitationStats.hesitationCount,
    hesitationRate: hesitationStats.hesitationRate,
    nonHesitantCount: hesitationStats.nonHesitantCount,
    hesitationEvents: hesitationStats.hesitationEvents,
    hesitationTimeline: hesitationStats.events,
    hesitationCountsByNote: hesitationStats.hesitationCountsByNote,
    hesitationCountsByNoteGroup: hesitationStats.hesitationCountsByNoteGroup,
    totalExcessDelayMs: hesitationStats.totalExcessDelayMs,
    averageExcessDelayMs: hesitationStats.averageExcessDelayMs,
    maxExcessDelayMs: hesitationStats.maxExcessDelayMs,
    totalExcessDelayByNote: hesitationStats.totalExcessDelayByNote,
    totalExcessDelayByNoteGroup: hesitationStats.totalExcessDelayByNoteGroup,
    topDelayedNotes: guidance.topDelayedNotes,
    topDelayedNoteGroups: guidance.topDelayedNoteGroups,
    fluencyScore: standardizedScoring?.fluencyScore ?? null,
    fluencyBand: standardizedScoring?.band ?? null,
    scoringFormulaVersion: standardizedScoring?.formulaVersion ?? formulaVersion,
    fluencyBreakdown: standardizedScoring?.breakdown ?? null,
    advancedFluencyBonus: standardizedScoring?.advancedFluencyBonus ?? null,
    advancedBonusLabel: standardizedScoring?.advancedBonusLabel ?? null,
    advancedBonusBreakdown: standardizedScoring?.advancedBonusBreakdown ?? null,
    medianResponseTimeMs: medianResponseTimeSeconds == null ? null : Math.round(medianResponseTimeSeconds * 1000),
    medianResponseTimeSeconds: medianResponseTimeSeconds == null ? null : round(medianResponseTimeSeconds, 3),
    qualified,
    qualificationAccuracy,
    takeaway: guidance.takeaway,
    studentFeedback: guidance.studentMessages,
    teacherFeedback: guidance.teacherMessages,
  };
}
