import { getFlowConfidence, getFlowPct, getMedian } from "./scoring.js";

export const BASELINE_MIN_SAMPLES = 8;

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sortByHesitationImpact(a, b) {
  if (b.hesitationCount !== a.hesitationCount) return b.hesitationCount - a.hesitationCount;
  if (b.totalExcessDelaySeconds !== a.totalExcessDelaySeconds) {
    return b.totalExcessDelaySeconds - a.totalExcessDelaySeconds;
  }
  return a.label.localeCompare(b.label);
}

function normalizeNoteGroups(attempt) {
  if (Array.isArray(attempt?.noteGroups) && attempt.noteGroups.length > 0) {
    return attempt.noteGroups.filter((group) => group?.id && group?.label && group?.category);
  }
  const noteLabel = attempt?.note || attempt?.fullName || "Unknown note";
  return [
    {
      id: `note:${noteLabel}`,
      label: noteLabel,
      category: "note-name",
    },
  ];
}

function createAggregateEntry(label, category) {
  return {
    label,
    category,
    hesitationCount: 0,
    totalExcessDelaySeconds: 0,
    averageExcessDelaySeconds: 0,
    maxExcessDelaySeconds: 0,
  };
}

function accumulateAggregate(map, key, label, category, excessDelaySeconds) {
  const current = map[key] || createAggregateEntry(label, category);
  const nextCount = current.hesitationCount + 1;
  const nextTotal = current.totalExcessDelaySeconds + excessDelaySeconds;
  map[key] = {
    label,
    category,
    hesitationCount: nextCount,
    totalExcessDelaySeconds: round(nextTotal, 3),
    averageExcessDelaySeconds: round(nextTotal / nextCount, 3),
    maxExcessDelaySeconds: round(Math.max(current.maxExcessDelaySeconds, excessDelaySeconds), 3),
  };
}

function mapToSortedEntries(map) {
  return Object.entries(map)
    .map(([id, value]) => ({
      id,
      ...value,
      totalExcessDelayMs: Math.round(value.totalExcessDelaySeconds * 1000),
      averageExcessDelayMs: Math.round(value.averageExcessDelaySeconds * 1000),
      maxExcessDelayMs: Math.round(value.maxExcessDelaySeconds * 1000),
    }))
    .sort(sortByHesitationImpact);
}

function buildEventRecord(event, classification, { baselineSeconds, thresholdSeconds, calibration }) {
  const excessDelaySeconds = classification.hesitant ? classification.excessDelaySeconds : 0;
  return {
    index: event.index,
    note: event.note,
    fullName: event.fullName,
    correct: Boolean(event.correct),
    responseTimeSeconds: round(event.time, 3),
    responseTimeMs: Math.round(event.time * 1000),
    baselineSeconds: round(baselineSeconds, 3),
    baselineMs: Math.round(baselineSeconds * 1000),
    thresholdSeconds: round(thresholdSeconds, 3),
    thresholdMs: Math.round(thresholdSeconds * 1000),
    hesitant: classification.hesitant,
    excessDelaySeconds: round(excessDelaySeconds, 3),
    excessDelayMs: Math.round(excessDelaySeconds * 1000),
    calibration,
    noteGroups: normalizeNoteGroups(event),
  };
}

export function getInitialBaselineFromCalibration(noteEvents = []) {
  const calibrationTimes = noteEvents
    .map((event) => event?.time)
    .filter((time) => Number.isFinite(time) && time >= 0);
  return getMedian(calibrationTimes);
}

export function classifyHesitation({ rt, baseline, thresholdMultiplier = 1.75 }) {
  if (!Number.isFinite(rt) || rt < 0 || !Number.isFinite(baseline) || baseline < 0) {
    return {
      hesitant: false,
      excessDelaySeconds: 0,
    };
  }
  const thresholdSeconds = baseline * thresholdMultiplier;
  const hesitant = rt > thresholdSeconds;
  return {
    hesitant,
    excessDelaySeconds: hesitant ? Math.max(0, rt - thresholdSeconds) : 0,
  };
}

export function classifyCalibrationNotes(calibrationEvents, baseline, thresholdMultiplier = 1.75) {
  const thresholdSeconds = (baseline || 0) * thresholdMultiplier;
  const classifiedEvents = calibrationEvents.map((event) => {
    const classification = classifyHesitation({
      rt: event.time,
      baseline,
      thresholdMultiplier,
    });
    return buildEventRecord(event, classification, {
      baselineSeconds: baseline || 0,
      thresholdSeconds,
      calibration: true,
    });
  });

  const nonHesitantRtPool = classifiedEvents
    .filter((event) => !event.hesitant)
    .map((event) => event.responseTimeSeconds);

  return {
    thresholdSeconds,
    classifiedEvents,
    nonHesitantRtPool,
  };
}

export function updateRollingBaseline(nonHesitantRtPool, rt, rollingPoolSize = 10) {
  const nextPool = [...nonHesitantRtPool, rt]
    .filter((value) => Number.isFinite(value) && value >= 0)
    .slice(-rollingPoolSize);
  return {
    nonHesitantRtPool: nextPool,
    baseline: getMedian(nextPool),
  };
}

export function getHesitationStats(noteEvents = [], options = {}) {
  const {
    calibrationSize = BASELINE_MIN_SAMPLES,
    thresholdMultiplier = 1.75,
    rollingPoolSize = 10,
  } = options;
  const validEvents = noteEvents
    .filter((event) => Number.isFinite(event?.time) && event.time >= 0)
    .map((event, index) => ({
      ...event,
      index: Number.isFinite(event.index) ? event.index : index,
    }));

  if (!validEvents.length) {
    return {
      attemptedNotes: 0,
      hesitationCount: 0,
      hesitationRate: 0,
      nonHesitantCount: 0,
      flowPct: null,
      flowConfidence: "none",
      totalExcessDelaySeconds: 0,
      totalExcessDelayMs: 0,
      averageExcessDelaySeconds: 0,
      averageExcessDelayMs: 0,
      maxExcessDelaySeconds: 0,
      maxExcessDelayMs: 0,
      initialBaselineSeconds: null,
      initialBaselineMs: null,
      calibrationSizeUsed: 0,
      thresholdMultiplier,
      rollingPoolSize,
      events: [],
      hesitationEvents: [],
      hesitationCountsByNote: [],
      hesitationCountsByNoteGroup: [],
      totalExcessDelayByNote: [],
      totalExcessDelayByNoteGroup: [],
    };
  }

  const calibrationEvents = validEvents.slice(0, calibrationSize);
  const initialBaseline = getInitialBaselineFromCalibration(calibrationEvents);
  const {
    classifiedEvents: calibrationClassifications,
    nonHesitantRtPool: seededPool,
  } = classifyCalibrationNotes(calibrationEvents, initialBaseline || 0, thresholdMultiplier);

  let rollingBaseline = seededPool.length > 0 ? getMedian(seededPool) : initialBaseline;
  let rollingPool = [...seededPool];
  const classifiedEvents = [...calibrationClassifications];

  for (const event of validEvents.slice(calibrationSize)) {
    const baselineForEvent = Number.isFinite(rollingBaseline) && rollingBaseline > 0
      ? rollingBaseline
      : (initialBaseline || event.time || 0);
    const thresholdSeconds = baselineForEvent * thresholdMultiplier;
    const classification = classifyHesitation({
      rt: event.time,
      baseline: baselineForEvent,
      thresholdMultiplier,
    });

    const eventRecord = buildEventRecord(event, classification, {
      baselineSeconds: baselineForEvent,
      thresholdSeconds,
      calibration: false,
    });
    classifiedEvents.push(eventRecord);

    if (!classification.hesitant) {
      // Intentional: wrong-answer RTs are included in the rolling baseline
      // if they were non-hesitant. Correctness is not a filter here.
      // Only hesitant RTs are excluded (to prevent threshold drift).
      // This matches the spec: flow and hesitation track all answered notes,
      // not just correct ones. Rate and bonus use correctNotes separately.
      const nextBaseline = updateRollingBaseline(rollingPool, event.time, rollingPoolSize);
      rollingPool = nextBaseline.nonHesitantRtPool;
      rollingBaseline = nextBaseline.baseline ?? rollingBaseline;
    }
  }

  const hesitationEvents = classifiedEvents.filter((event) => event.hesitant);
  const noteMap = {};
  const groupMap = {};

  for (const event of hesitationEvents) {
    const noteKey = event.fullName || event.note || "Unknown note";
    accumulateAggregate(noteMap, noteKey, noteKey, event.fullName ? "full-note" : "note-name", event.excessDelaySeconds);
    for (const group of event.noteGroups) {
      accumulateAggregate(groupMap, group.id, group.label, group.category, event.excessDelaySeconds);
    }
  }

  const hesitationCount = hesitationEvents.length;
  const attemptedNotes = validEvents.length;
  const totalExcessDelaySeconds = hesitationEvents.reduce((sum, event) => sum + event.excessDelaySeconds, 0);
  const maxExcessDelaySeconds = hesitationEvents.reduce(
    (max, event) => Math.max(max, event.excessDelaySeconds),
    0,
  );
  const flowPct = getFlowPct({ attemptedNotes, hesitationCount });
  const flowConfidence = getFlowConfidence(attemptedNotes);
  const hesitationCountsByNote = mapToSortedEntries(noteMap);
  const hesitationCountsByNoteGroup = mapToSortedEntries(groupMap);

  return {
    attemptedNotes,
    hesitationCount,
    hesitationRate: round((hesitationCount / attemptedNotes) * 100, 1),
    nonHesitantCount: attemptedNotes - hesitationCount,
    flowPct: flowPct == null ? null : round(flowPct, 1),
    flowConfidence,
    totalExcessDelaySeconds: round(totalExcessDelaySeconds, 3),
    totalExcessDelayMs: Math.round(totalExcessDelaySeconds * 1000),
    averageExcessDelaySeconds: hesitationCount > 0 ? round(totalExcessDelaySeconds / hesitationCount, 3) : 0,
    averageExcessDelayMs: hesitationCount > 0 ? Math.round((totalExcessDelaySeconds / hesitationCount) * 1000) : 0,
    maxExcessDelaySeconds: round(maxExcessDelaySeconds, 3),
    maxExcessDelayMs: Math.round(maxExcessDelaySeconds * 1000),
    initialBaselineSeconds: initialBaseline == null ? null : round(initialBaseline, 3),
    initialBaselineMs: initialBaseline == null ? null : Math.round(initialBaseline * 1000),
    calibrationSizeUsed: calibrationEvents.length,
    thresholdMultiplier,
    rollingPoolSize,
    events: classifiedEvents,
    hesitationEvents,
    hesitationCountsByNote,
    hesitationCountsByNoteGroup,
    totalExcessDelayByNote: hesitationCountsByNote,
    totalExcessDelayByNoteGroup: hesitationCountsByNoteGroup,
  };
}

function joinLabels(entries, limit = 2) {
  return entries.slice(0, limit).map((entry) => entry.label).join(" and ");
}

export function getHesitationFeedback({
  hesitationStats,
  weakNotes = [],
  accuracyPct = 0,
  runType = "practice",
}) {
  const topNotes = hesitationStats.hesitationCountsByNote.slice(0, 3);
  const topGroups = hesitationStats.hesitationCountsByNoteGroup
    .filter((entry) => !["note-name", "full-note"].includes(entry.category))
    .slice(0, 3);
  const weakAccuracyNotes = weakNotes.slice(0, 3);
  const studentMessages = [];

  if (hesitationStats.hesitationCount === 0) {
    studentMessages.push(
      accuracyPct >= 90
        ? "You kept the round flowing with no hesitation spikes."
        : "Your flow stayed steady. Keep building accuracy on the notes that slipped.",
    );
  } else {
    if (topNotes.length > 0) {
      studentMessages.push(
        accuracyPct >= 85
          ? `You were accurate, but you slowed down most on ${joinLabels(topNotes)}.`
          : `Your biggest slowdowns showed up on ${joinLabels(topNotes)}.`,
      );
    }
    if (topGroups.length > 0) {
      studentMessages.push(`You hesitated more on ${topGroups[0].label}.`);
    }
    if (hesitationStats.maxExcessDelayMs > 0 && topNotes.length > 0) {
      studentMessages.push(
        `Your largest delay happened on ${topNotes[0].label} (${hesitationStats.maxExcessDelayMs} ms over your flow threshold).`,
      );
    }
  }

  if (weakAccuracyNotes.length > 0) {
    studentMessages.push(`Accuracy support: revisit ${joinLabels(weakAccuracyNotes.map((entry) => ({ label: entry.note })))}.`);
  }

  if (!studentMessages.length) {
    studentMessages.push(
      runType === "benchmark"
        ? "Keep building steady note recognition across the full minute."
        : "Use practice to smooth out hesitation on the notes that slow you down.",
    );
  }

  const teacherMessages = [];
  if (topNotes.length > 0) {
    teacherMessages.push(
      `Top delayed notes: ${topNotes.map((entry) => `${entry.label} (${entry.hesitationCount}, ${entry.totalExcessDelayMs} ms)`).join(", ")}.`,
    );
  }
  if (topGroups.length > 0) {
    teacherMessages.push(
      `Top delayed note groups: ${topGroups.map((entry) => `${entry.label} (${entry.hesitationCount}, ${entry.totalExcessDelayMs} ms)`).join(", ")}.`,
    );
  }
  if (weakAccuracyNotes.length > 0 && topNotes.length > 0) {
    const overlap = weakAccuracyNotes.filter((entry) => topNotes.some((delayed) => delayed.label === entry.note));
    teacherMessages.push(
      overlap.length > 0
        ? `Accuracy and hesitation overlap on ${overlap.map((entry) => entry.note).join(", ")}.`
        : `Delay-based difficulty differs from accuracy errors: weak notes ${weakAccuracyNotes.map((entry) => entry.note).join(", ")}, delayed notes ${topNotes.map((entry) => entry.label).join(", ")}.`,
    );
  } else if (topNotes.length > 0) {
    teacherMessages.push(
      accuracyPct >= 85
        ? "Student is accurate overall; hesitation is the main constraint."
        : "Both accuracy and hesitation should be monitored.",
    );
  }

  return {
    takeaway: studentMessages[0],
    studentMessages,
    teacherMessages,
    topDelayedNotes: topNotes,
    topDelayedNoteGroups: topGroups,
  };
}
