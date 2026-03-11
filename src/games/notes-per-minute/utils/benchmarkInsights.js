function joinLabels(entries = [], limit = 2, key = "label") {
  const labels = entries
    .map((entry) => entry?.[key])
    .filter(Boolean)
    .slice(0, limit);

  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function getSecondHalfAccuracyDrop(rolling = []) {
  if (!Array.isArray(rolling) || rolling.length < 4) return 0;
  const midpoint = Math.floor(rolling.length / 2);
  const firstHalf = rolling.slice(0, midpoint);
  const secondHalf = rolling.slice(midpoint);
  if (!firstHalf.length || !secondHalf.length) return 0;

  const average = (items) => items.reduce((sum, item) => sum + (item.accuracy || 0), 0) / items.length;
  return average(firstHalf) - average(secondHalf);
}

export function getBelowThresholdDiagnosis(summary) {
  if (!summary) return null;

  const qualificationAccuracy = Number(summary.qualificationAccuracy || 85);
  const accuracyValue = Number(summary.accuracy || 0);
  if (accuracyValue >= qualificationAccuracy) return null;

  const rateScoreValue = Number(summary.rateScore || 0);
  const hesitationRateValue = Number(summary.hesitationRate || 0);
  const weakNoteCount = Array.isArray(summary.weakNotes) ? summary.weakNotes.length : 0;
  const weakNotesLabel = joinLabels(summary.weakNotes, 3, "note");
  const delayedGroupLabel = summary.topDelayedNoteGroups?.[0]?.label || "";
  const delayedNoteLabel = summary.topDelayedNotes?.[0]?.label || "";
  const staminaDrop = getSecondHalfAccuracyDrop(summary.rolling);

  if (rateScoreValue >= 90 && hesitationRateValue < 15) {
    return {
      code: "speed_over_accuracy",
      interpretation: "Below benchmark threshold. The student is answering quickly, but accuracy is not yet stable enough for an official score.",
      analysis: "The pace is already high enough for benchmark-level output, but the student is trading away too much accuracy to make the run count.",
      teacherMove: "Slow the pace slightly and prioritize clean note naming before the next benchmark attempt.",
    };
  }

  if (staminaDrop >= 15) {
    return {
      code: "stamina_dropoff",
      interpretation: "Below benchmark threshold. Accuracy weakened as the minute continued, so the student is not yet sustaining fluency across the full run.",
      analysis: "This looks less like a single-note problem and more like a stamina or consistency problem once the student is under a full minute of pressure.",
      teacherMove: "Practice sustaining accuracy across the full minute, not just early-run success, before benchmarking again.",
    };
  }

  if (weakNoteCount > 0 && delayedGroupLabel && hesitationRateValue >= 12) {
    return {
      code: "mixed_accuracy_hesitation",
      interpretation: `Below benchmark threshold. Accuracy on ${weakNotesLabel} and hesitation on ${delayedGroupLabel} both held this run back.`,
      analysis: `Note naming is still unstable on ${weakNotesLabel}, and automatic recognition slows down on ${delayedGroupLabel}.`,
      teacherMove: `Target ${weakNotesLabel} first, then rebuild speed with mixed reps on ${delayedGroupLabel}.`,
    };
  }

  if (!weakNoteCount && delayedGroupLabel && hesitationRateValue >= 12) {
    return {
      code: "hesitation_specific",
      interpretation: `Below benchmark threshold. Accuracy needs to reach 85%, and hesitation on ${delayedGroupLabel} was a clear constraint.`,
      analysis: `The student appears to know more of the notes than the benchmark result suggests, but recognition breaks down on ${delayedGroupLabel} under time pressure.`,
      teacherMove: `Keep note naming work light and add quick-recall reps on ${delayedGroupLabel} to reduce hesitation.`,
    };
  }

  if (weakNoteCount > 0 && weakNoteCount <= 2) {
    return {
      code: "narrow_note_problem",
      interpretation: `Below benchmark threshold. Most of the loss came from a small set of notes: ${weakNotesLabel}.`,
      analysis: "This looks like a narrow note-recognition problem rather than a broad fluency collapse.",
      teacherMove: `Isolate ${weakNotesLabel} in short accuracy-first sets, then rerun the benchmark.`,
    };
  }

  if (weakNoteCount >= 3) {
    return {
      code: "broad_accuracy_instability",
      interpretation: "Below benchmark threshold. Accuracy breakdown is spread across several notes, so the student needs more general note-reading stability first.",
      analysis: weakNotesLabel
        ? `Errors are spread across multiple notes, including ${weakNotesLabel}, which suggests the student is not yet benchmark-stable in this clef.`
        : "Errors are spread broadly enough that this run is better treated as diagnostic data than as near-benchmark performance.",
      teacherMove: "Postpone benchmarking and rebuild general note-reading stability in untimed or lightly timed practice.",
    };
  }

  if (accuracyValue >= 75 && hesitationRateValue >= 15 && rateScoreValue < 75) {
    return {
      code: "partial_knowledge_not_automatic",
      interpretation: "Below benchmark threshold. The student shows partial note knowledge, but recognition is not yet automatic enough to sustain benchmark accuracy.",
      analysis: delayedGroupLabel
        ? `The student can identify many notes, but hesitation on ${delayedGroupLabel} keeps automatic recognition from holding up across the minute.`
        : "The student appears to know a fair amount, but not well enough for quick and reliable recall under benchmark pressure.",
      teacherMove: "Treat this as an automaticity problem, not a first-time note-teaching problem.",
    };
  }

  if (accuracyValue >= 78 && rateScoreValue < 60 && hesitationRateValue >= 10) {
    return {
      code: "fragile_under_time_pressure",
      interpretation: "Below benchmark threshold. The student can read some notes correctly, but accuracy breaks down once time pressure builds.",
      analysis: "This profile suggests the student can work accurately at a calmer pace, but the benchmark still exposes fragility under sustained pressure.",
      teacherMove: "Use shorter timed sets before returning to the full 60-second benchmark.",
    };
  }

  if (weakNoteCount > 0) {
    return {
      code: "accuracy_specific",
      interpretation: `Below benchmark threshold. Accuracy on ${weakNotesLabel} held this run back from an official benchmark.`,
      analysis: `The most useful teaching target is note naming accuracy, especially on ${weakNotesLabel}.`,
      teacherMove: `Target ${weakNotesLabel} in short accuracy-first sets, then rerun once the student can stay above benchmark accuracy without guessing.`,
    };
  }

  return {
    code: "general_inconsistency",
    interpretation: "Below benchmark threshold. The student is not yet reading consistently enough across the full minute to post an official benchmark score.",
    analysis: delayedNoteLabel
      ? `The run does not collapse to a single clean pattern, but ${delayedNoteLabel} still stands out as the clearest visible slowdown.`
      : "The run is better used as diagnostic teaching data than as a formal benchmark, because the student is not yet consistently benchmark-stable.",
    teacherMove: "Use one more diagnostic practice run to separate guessing, hesitation, and note confusion before benchmarking again.",
  };
}

export function buildBelowThresholdAnalysis(session, summary) {
  if (!session || !summary || session.runType !== "benchmark" || session.qualifiedBenchmark) {
    return null;
  }

  const diagnosis = getBelowThresholdDiagnosis(summary);
  const lines = [
    `Use this run as diagnostic teaching data, not as the student's official benchmark. Accuracy finished at ${Math.round(summary.accuracy || 0)}%, so it did not meet the 85% benchmark threshold.`,
  ];

  if (diagnosis?.analysis) lines.push(`Instructional read: ${diagnosis.analysis}`);
  if (diagnosis?.teacherMove) lines.push(`Teacher move: ${diagnosis.teacherMove}`);

  return {
    title: "Below-Threshold Teacher Analysis",
    lines,
    diagnosis,
  };
}
