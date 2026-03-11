import { useEffect, useMemo, useRef, useState } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import {
  buildBenchmarkResultsCsvHeader,
  buildBenchmarkResultsCsvRow,
  CSV_HEADER_SESSION_STORAGE_KEY,
} from "../utils/csvExport.js";
import {
  buildBelowThresholdAnalysis,
  getBelowThresholdDiagnosis,
} from "../utils/benchmarkInsights.js";

function buildLinePath(data, x, y) {
  return data.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.group)},${y(point.accuracy)}`).join(" ");
}

function buildAreaPath(data, x, y, height) {
  if (!data.length) return "";
  const linePath = buildLinePath(data, x, y);
  const first = data[0];
  const last = data[data.length - 1];
  return `${linePath} L${x(last.group)},${height} L${x(first.group)},${height} Z`;
}

function getStatusMeta(session) {
  if (!session) {
    return {
      label: "No Results",
      description: "No completed session to show.",
      accent: "rgba(255,255,255,0.4)",
      pillBg: "rgba(255,255,255,0.08)",
      pillBorder: "rgba(255,255,255,0.12)",
    };
  }

  if (session.runType === "practice") {
    return {
      label: "Practice Run",
      description: session.summary?.standardizedScoringEligible
        ? "This practice run uses the same 60-second fluency model, but it does not count as an official benchmark."
        : "This practice run is longer-form or custom. Raw NPM, accuracy, flow, and hesitation guidance are shown without a standardized classroom score.",
      accent: "#a5b4fc",
      pillBg: "rgba(99,102,241,0.14)",
      pillBorder: "rgba(129,140,248,0.24)",
    };
  }

  if (session.qualifiedBenchmark) {
    return {
      label: "Official Benchmark",
      description: "This run met the benchmark accuracy threshold and counts as an official result.",
      accent: "#34d399",
      pillBg: "rgba(52,211,153,0.14)",
      pillBorder: "rgba(52,211,153,0.22)",
    };
  }

  return {
    label: "Below Benchmark Accuracy",
    description: "This run shows the full fluency breakdown, but it did not reach 85% accuracy, so it is not counted as an official benchmark score.",
    accent: "#fbbf24",
    pillBg: "rgba(251,191,36,0.12)",
    pillBorder: "rgba(251,191,36,0.22)",
  };
}

function joinLabels(entries = [], limit = 2, key = "label") {
  const labels = entries
    .map((entry) => entry?.[key])
    .filter(Boolean)
    .slice(0, limit);

  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function buildInterpretation({ session, summary, showAdvancedBonus, showStandardizedScore }) {
  if (!session || !summary) return "";

  const weakNotesLabel = joinLabels(summary.weakNotes, 2, "note");
  const delayedGroupLabel = summary.topDelayedNoteGroups?.[0]?.label || "";
  const delayedNoteLabel = summary.topDelayedNotes?.[0]?.label || "";
  const accuracyValue = Number(summary.accuracy || 0);
  const rateScoreValue = Number(summary.rateScore || 0);
  const flowValue = Number(summary.flowPct || 0);
  const accurateButNotAutomatic = accuracyValue >= 85 && rateScoreValue > 0 && rateScoreValue < 70 && flowValue > 0 && flowValue < 85;

  if (session.runType === "practice") {
    if (!showStandardizedScore) {
      if (delayedGroupLabel) {
        return `Practice run only. Your next gain is faster recognition on ${delayedGroupLabel}.`;
      }
      if (weakNotesLabel) {
        return `Practice run only. Accuracy still needs support on ${weakNotesLabel}.`;
      }
      return "Practice run only. Use this result to build steadier note recognition before benchmarking.";
    }

    if (delayedGroupLabel) {
      return `Practice score recorded. Accuracy held up, and the next gain is faster recognition on ${delayedGroupLabel}.`;
    }
    return "Practice score recorded. This run matches the benchmark timing, but it does not count as an official benchmark.";
  }

  if (session.qualifiedBenchmark) {
    if (showAdvancedBonus) {
      return "Official score with advanced fluency bonus. This was a high-quality run with strong accuracy, steady flow, and speed above the benchmark target.";
    }
    if (accurateButNotAutomatic) {
      if (delayedGroupLabel) {
        return `Official score. Accuracy is there, but fluency is not automatic yet; the next gain is reducing hesitation on ${delayedGroupLabel}.`;
      }
      return "Official score. Accuracy is there, but fluency is not automatic yet; the next gain is reducing hesitation so the student can sustain a faster pace.";
    }
    if (delayedGroupLabel) {
      return `Official score. Accuracy qualified, and the next gain is faster recognition on ${delayedGroupLabel}.`;
    }
    if (delayedNoteLabel) {
      return `Official score. Accuracy qualified, and ${delayedNoteLabel} was the note that slowed you down most.`;
    }
    return "Official score. This run qualified cleanly, and the next step is building more speed without losing accuracy.";
  }

  return getBelowThresholdDiagnosis(summary)?.interpretation
    || "Below benchmark threshold. Accuracy needs to reach 85% for this run to count as an official score.";
}

function formatDelayValue(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)} s`;
  }
  return `${ms} ms`;
}

function selectTakeawaySupportMessages(messages = [], takeaway = "") {
  const filtered = messages.filter((message) => message && message !== takeaway);
  const accuracySupport = filtered.find((message) => message.startsWith("Accuracy support:"));
  const generalMessage = filtered.find((message) => !message.startsWith("Accuracy support:"));
  const selected = [];

  if (generalMessage) selected.push(generalMessage);
  if (accuracySupport) selected.push(accuracySupport);

  return selected;
}

export default function ResultsScreen({ session, onRestart }) {
  const chartRef = useRef(null);
  const speedChartRef = useRef(null);
  const barChartRef = useRef(null);
  const hesitationChartRef = useRef(null);
  const thresholdChartRef = useRef(null);
  const fastestNotesChartRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const [studentLabel, setStudentLabel] = useState("Student 1");
  const [teacherRating, setTeacherRating] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [thresholdTooltip, setThresholdTooltip] = useState(null);

  const summary = session?.summary || null;
  const statusMeta = getStatusMeta(session);
  const showStandardizedScore = Boolean(summary?.standardizedScoringEligible && summary?.fluencyScore != null);
  const showAdvancedBonus = showStandardizedScore && Number(summary?.advancedFluencyBonus) > 0;
  const showFlowMetric = summary?.flowConfidence === "full" && summary?.flowPct != null;
  const showCopyResults = Boolean(
    session?.runType === "benchmark"
      && summary?.sessionDurationSeconds === 60
      && session?.presetId,
  );
  const heroValue = showStandardizedScore ? summary.fluencyScore.toFixed(1) : Math.round(summary?.rawNpm || 0);
  const heroLabel = showStandardizedScore ? "Fluency Score" : "Raw Notes Per Minute";
  const interpretation = buildInterpretation({
    session,
    summary,
    showAdvancedBonus,
    showStandardizedScore,
  });
  const belowThresholdAnalysis = buildBelowThresholdAnalysis(session, summary);
  const takeawaySupportMessages = selectTakeawaySupportMessages(summary?.studentFeedback || [], summary?.takeaway || "");

  const noteChartData = useMemo(() => {
    if (!summary?.noteStats) return [];
    return Object.entries(summary.noteStats)
      .map(([note, stats]) => ({
        note,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total: stats.total,
      }))
      .filter((entry) => entry.total > 0)
      .sort((a, b) => a.note.localeCompare(b.note));
  }, [summary]);

  const hesitationChartData = useMemo(() => {
    if (!summary?.hesitationCountsByNote) return [];
    return summary.hesitationCountsByNote.filter((entry) => entry.hesitationCount > 0);
  }, [summary]);

  const thresholdChartData = useMemo(() => {
    if (!summary?.hesitationTimeline) return [];
    return summary.hesitationTimeline
      .filter((entry) => Number.isFinite(entry?.thresholdMs) && Number.isFinite(entry?.responseTimeMs))
      .map((entry, index) => ({
        attempt: index + 1,
        noteLabel: entry.fullName || entry.note || "Unknown note",
        thresholdMs: entry.thresholdMs,
        baselineMs: entry.baselineMs,
        responseTimeMs: entry.responseTimeMs,
        hesitant: entry.hesitant,
        calibration: entry.calibration,
      }));
  }, [summary]);

  const fastestNotesChartData = useMemo(() => {
    const attempts = Array.isArray(session?.attempts) ? session.attempts : [];
    const noteMap = attempts.reduce((acc, attempt) => {
      if (!attempt?.note || !Number.isFinite(attempt?.time) || attempt.time < 0) return acc;
      const current = acc.get(attempt.note) || { note: attempt.note, totalTime: 0, attempts: 0 };
      current.totalTime += attempt.time;
      current.attempts += 1;
      acc.set(attempt.note, current);
      return acc;
    }, new Map());

    return [...noteMap.values()]
      .map((entry) => ({
        note: entry.note,
        attempts: entry.attempts,
        averageMs: Math.round((entry.totalTime / entry.attempts) * 1000),
      }))
      .sort((a, b) => {
        if (a.averageMs !== b.averageMs) return a.averageMs - b.averageMs;
        if (b.attempts !== a.attempts) return b.attempts - a.attempts;
        return a.note.localeCompare(b.note);
      })
      .slice(0, 8);
  }, [session]);

  const hesitationChartViewBoxHeight = Math.max(180, 70 + (hesitationChartData.length * 34));
  const thresholdChartViewBoxHeight = 220;
  const fastestNotesChartViewBoxHeight = Math.max(180, 70 + (fastestNotesChartData.length * 34));
  const notesPerSecondData = useMemo(() => {
    const durationSeconds = Math.max(1, Math.round(summary?.sessionDurationSeconds || 60));
    const attempts = Array.isArray(session?.attempts) ? session.attempts : [];
    const buckets = Array.from({ length: durationSeconds }, (_, index) => ({
      second: index + 1,
      count: 0,
    }));

    let elapsedSeconds = 0;
    for (const attempt of attempts) {
      if (!Number.isFinite(attempt?.time) || attempt.time < 0) continue;
      elapsedSeconds += attempt.time;
      const bucketIndex = Math.min(durationSeconds - 1, Math.max(0, Math.floor(elapsedSeconds)));
      buckets[bucketIndex].count += 1;
    }

    return buckets;
  }, [session, summary?.sessionDurationSeconds]);

  useEffect(() => {
    if (!summary || !chartRef.current) return;

    const svg = select(chartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (summary.rolling.length < 2) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14)
        .text("Not enough data for chart");
      return;
    }

    const x = scaleLinear().domain([1, summary.rolling.length]).range([0, width]);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(summary.rolling.length).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat((value) => `${value}%`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("path")
      .datum(summary.rolling)
      .attr("fill", "rgba(99,102,241,0.15)")
      .attr("d", buildAreaPath(summary.rolling, x, y, height));

    g.append("path")
      .datum(summary.rolling)
      .attr("fill", "none")
      .attr("stroke", "#818cf8")
      .attr("stroke-width", 2.5)
      .attr("d", buildLinePath(summary.rolling, x, y));

    g.selectAll(".dot")
      .data(summary.rolling)
      .enter()
      .append("circle")
      .attr("cx", (point) => x(point.group))
      .attr("cy", (point) => y(point.accuracy))
      .attr("r", 4)
      .attr("fill", "#818cf8")
      .attr("stroke", "#0a0a0f")
      .attr("stroke-width", 2);
  }, [summary]);

  useEffect(() => {
    if (!summary || !speedChartRef.current) return;

    const svg = select(speedChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 58 };
    const width = 500 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (notesPerSecondData.length < 2) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14)
        .text("Not enough data for notes-per-second chart");
      return;
    }

    const x = scaleLinear().domain([1, notesPerSecondData.length]).range([0, width]);
    const maxCount = Math.max(...notesPerSecondData.map((point) => point.count), 1);
    const y = scaleLinear().domain([0, maxCount]).nice().range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(Math.min(10, notesPerSecondData.length)).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(Math.min(5, maxCount + 1)).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".speed-bar")
      .data(notesPerSecondData)
      .enter()
      .append("rect")
      .attr("x", (point) => x(point.second) - 2.5)
      .attr("y", (point) => y(point.count))
      .attr("width", Math.max(4, width / notesPerSecondData.length - 1))
      .attr("height", (point) => height - y(point.count))
      .attr("rx", 2)
      .attr("fill", "rgba(52,211,153,0.72)");
  }, [notesPerSecondData, summary]);

  useEffect(() => {
    if (!summary || !barChartRef.current) return;

    const svg = select(barChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = scaleBand().domain(noteChartData.map((entry) => entry.note)).range([0, width]).padding(0.3);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", 13)
      .attr("font-weight", 600);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat((value) => `${value}%`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".bar")
      .data(noteChartData)
      .enter()
      .append("rect")
      .attr("x", (entry) => x(entry.note))
      .attr("y", (entry) => y(entry.accuracy))
      .attr("width", x.bandwidth())
      .attr("height", (entry) => height - y(entry.accuracy))
      .attr("rx", 4)
      .attr("fill", (entry) => (
        entry.accuracy >= 85 ? "rgba(52,211,153,0.6)" : entry.accuracy >= 65 ? "rgba(251,191,36,0.6)" : "rgba(248,113,113,0.6)"
      ));
  }, [noteChartData, summary]);

  useEffect(() => {
    if (!hesitationChartRef.current) return;

    const svg = select(hesitationChartRef.current);
    svg.selectAll("*").remove();

    const totalHeight = hesitationChartViewBoxHeight;
    const margin = { top: 20, right: 110, bottom: 36, left: 72 };
    const width = 500 - margin.left - margin.right;
    const height = totalHeight - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (!hesitationChartData.length) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14)
        .text("No hesitation spikes recorded");
      return;
    }

    const maxCount = Math.max(...hesitationChartData.map((entry) => entry.hesitationCount), 1);
    const x = scaleLinear().domain([0, maxCount]).nice().range([0, width]);
    const y = scaleBand().domain(hesitationChartData.map((entry) => entry.label)).range([0, height]).padding(0.24);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(Math.min(6, maxCount)).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);

    g.append("g")
      .call(axisLeft(y))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.55)")
      .attr("font-size", 12)
      .attr("font-weight", 600);

    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".bar")
      .data(hesitationChartData)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (entry) => y(entry.label))
      .attr("width", (entry) => x(entry.hesitationCount))
      .attr("height", y.bandwidth())
      .attr("rx", 5)
      .attr("fill", "rgba(251,191,36,0.72)");

    g.selectAll(".bar-label")
      .data(hesitationChartData)
      .enter()
      .append("text")
      .attr("x", (entry) => x(entry.hesitationCount) + 8)
      .attr("y", (entry) => (y(entry.label) || 0) + (y.bandwidth() / 2))
      .attr("dominant-baseline", "middle")
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", 11)
      .text((entry) => `${entry.hesitationCount} spikes · avg ${entry.averageExcessDelayMs} ms`);
  }, [hesitationChartData, hesitationChartViewBoxHeight]);

  useEffect(() => {
    if (!thresholdChartRef.current) return;

    const svg = select(thresholdChartRef.current);
    svg.selectAll("*").remove();

    const totalHeight = thresholdChartViewBoxHeight;
    const margin = { top: 20, right: 20, bottom: 40, left: 58 };
    const width = 500 - margin.left - margin.right;
    const height = totalHeight - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (thresholdChartData.length < 2) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14)
        .text("Not enough timing data for threshold chart");
      return;
    }

    const maxValue = Math.max(
      ...thresholdChartData.map((entry) => Math.max(entry.thresholdMs, entry.responseTimeMs, entry.baselineMs || 0)),
      1,
    );
    const x = scaleLinear().domain([1, thresholdChartData.length]).range([0, width]);
    const y = scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

    const thresholdPath = thresholdChartData
      .map((entry, index) => `${index === 0 ? "M" : "L"}${x(entry.attempt)},${y(entry.thresholdMs)}`)
      .join(" ");
    const responsePath = thresholdChartData
      .map((entry, index) => `${index === 0 ? "M" : "L"}${x(entry.attempt)},${y(entry.responseTimeMs)}`)
      .join(" ");
    const calibrationAttempts = thresholdChartData.filter((entry) => entry.calibration).length;

    if (calibrationAttempts > 0) {
      g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", x(calibrationAttempts) - x(1) + 8)
        .attr("height", height)
        .attr("fill", "rgba(255,255,255,0.03)");
    }

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(Math.min(8, thresholdChartData.length)).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat((value) => `${value} ms`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);

    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(251,191,36,0.95)")
      .attr("stroke-width", 2.5)
      .attr("d", thresholdPath);

    g.append("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(129,140,248,0.9)")
      .attr("stroke-width", 2)
      .attr("d", responsePath);

    g.selectAll(".response-dot")
      .data(thresholdChartData)
      .enter()
      .append("circle")
      .attr("cx", (entry) => x(entry.attempt))
      .attr("cy", (entry) => y(entry.responseTimeMs))
      .attr("r", 3.5)
      .attr("fill", (entry) => (entry.hesitant ? "#f87171" : "#34d399"))
      .attr("stroke", "#0a0a0f")
      .attr("stroke-width", 1.5);

    g.selectAll(".response-hit-area")
      .data(thresholdChartData)
      .enter()
      .append("circle")
      .attr("cx", (entry) => x(entry.attempt))
      .attr("cy", (entry) => y(entry.responseTimeMs))
      .attr("r", 11)
      .attr("fill", "transparent")
      .style("cursor", "pointer")
      .on("mouseenter mousemove", (event, entry) => {
        setThresholdTooltip({
          x: event.clientX,
          y: event.clientY,
          title: `Attempt ${entry.attempt} · ${entry.noteLabel}`,
          lines: [
            entry.calibration ? "Calibration note" : "Live run note",
            entry.hesitant ? "Hesitation spike" : "Below threshold",
            `Response: ${entry.responseTimeMs} ms`,
            `Threshold: ${entry.thresholdMs} ms`,
            `Baseline: ${entry.baselineMs} ms`,
          ],
        });
      })
      .on("mouseleave", () => {
        setThresholdTooltip(null);
      });
  }, [thresholdChartData, thresholdChartViewBoxHeight]);

  useEffect(() => {
    if (!fastestNotesChartRef.current) return;

    const svg = select(fastestNotesChartRef.current);
    svg.selectAll("*").remove();

    const totalHeight = fastestNotesChartViewBoxHeight;
    const margin = { top: 20, right: 110, bottom: 36, left: 72 };
    const width = 500 - margin.left - margin.right;
    const height = totalHeight - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (!fastestNotesChartData.length) {
      g.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14)
        .text("Not enough note timing data");
      return;
    }

    const maxAverage = Math.max(...fastestNotesChartData.map((entry) => entry.averageMs), 1);
    const x = scaleLinear().domain([0, maxAverage]).nice().range([0, width]);
    const y = scaleBand().domain(fastestNotesChartData.map((entry) => entry.note)).range([0, height]).padding(0.24);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(5).tickFormat((value) => `${value} ms`))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.4)")
      .attr("font-size", 11);

    g.append("g")
      .call(axisLeft(y))
      .selectAll("text")
      .attr("fill", "rgba(255,255,255,0.55)")
      .attr("font-size", 12)
      .attr("font-weight", 600);

    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".bar")
      .data(fastestNotesChartData)
      .enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", (entry) => y(entry.note))
      .attr("width", (entry) => x(entry.averageMs))
      .attr("height", y.bandwidth())
      .attr("rx", 5)
      .attr("fill", "rgba(52,211,153,0.68)");

    g.selectAll(".bar-label")
      .data(fastestNotesChartData)
      .enter()
      .append("text")
      .attr("x", (entry) => x(entry.averageMs) + 8)
      .attr("y", (entry) => (y(entry.note) || 0) + (y.bandwidth() / 2))
      .attr("dominant-baseline", "middle")
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", 11)
      .text((entry) => `avg ${entry.averageMs} ms · ${entry.attempts} attempts`);
  }, [fastestNotesChartData, fastestNotesChartViewBoxHeight]);

  useEffect(() => {
    setStudentLabel("Student 1");
    setTeacherRating("");
    setCopyStatus("");
  }, [session?.id, session?.completedAt]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    setThresholdTooltip(null);
  }, [session?.id, session?.completedAt]);

  async function handleCopyResultsRow() {
    if (!showCopyResults) return;

    const row = buildBenchmarkResultsCsvRow({
      session,
      studentLabel,
      teacherRating,
    });
    const header = buildBenchmarkResultsCsvHeader();
    const shouldIncludeHeader = window.sessionStorage.getItem(CSV_HEADER_SESSION_STORAGE_KEY) !== "true";
    const csvText = shouldIncludeHeader ? `${header}\n${row}` : row;

    try {
      await navigator.clipboard.writeText(csvText);
      if (shouldIncludeHeader) {
        window.sessionStorage.setItem(CSV_HEADER_SESSION_STORAGE_KEY, "true");
      }
      setCopyStatus("Copied!");
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopyStatus("");
      }, 1600);
    } catch {
      setCopyStatus("Clipboard unavailable");
    }
  }

  if (!session || !summary) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e6e1",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
      }}>
        <p>No results to show.</p>
        <button onClick={onRestart} style={{
          padding: "14px 32px",
          background: "#6366f1",
          border: "none",
          borderRadius: 12,
          color: "#fff",
          fontSize: 16,
          cursor: "pointer",
        }}>
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px 56px",
      position: "relative",
      overflow: "auto",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{
        position: "fixed", top: "-20%", left: "20%", width: "50%", height: "50%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      {thresholdTooltip ? (
        <div style={{
          position: "fixed",
          left: Math.min(thresholdTooltip.x + 16, window.innerWidth - 236),
          top: Math.max(18, thresholdTooltip.y - 14),
          transform: "translateY(-100%)",
          zIndex: 60,
          maxWidth: 220,
          pointerEvents: "none",
          background: "rgba(15,23,42,0.96)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: "10px 12px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>
            {thresholdTooltip.title}
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {thresholdTooltip.lines.map((line) => (
              <div key={line} style={{ fontSize: 12, color: "rgba(226,232,240,0.82)", lineHeight: 1.4 }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: statusMeta.pillBg,
        border: `1px solid ${statusMeta.pillBorder}`,
        color: statusMeta.accent,
        fontSize: 12,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        fontWeight: 700,
        marginBottom: 14,
      }}>
        {statusMeta.label}
      </div>

      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.34)", letterSpacing: 4, textTransform: "uppercase", marginBottom: 8, fontWeight: 300 }}>
        {session.benchmarkId || "Practice"} · {session.config.clef} Clef
      </div>

      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 96,
        fontWeight: 900,
        letterSpacing: -4,
        background: "linear-gradient(135deg, #e8e6e1, #818cf8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1.08,
        paddingBottom: 6,
      }}>
        {heroValue}
      </div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.44)", marginBottom: 10, fontWeight: 300, letterSpacing: 2 }}>
        {heroLabel}
      </div>
      {showStandardizedScore ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
          <div style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: "rgba(129,140,248,0.12)",
            border: "1px solid rgba(129,140,248,0.22)",
            color: "#c7d2fe",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}>
            {summary.fluencyBand}
          </div>
          <div style={{
            padding: "8px 12px",
            borderRadius: 999,
            background: showAdvancedBonus ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${showAdvancedBonus ? "rgba(52,211,153,0.22)" : "rgba(255,255,255,0.08)"}`,
            color: showAdvancedBonus ? "#6ee7b7" : "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
          }}>
            {showAdvancedBonus
              ? `Advanced Fluency Bonus +${summary.advancedFluencyBonus.toFixed(1)}`
              : "Advanced Fluency Bonus +0.0"}
          </div>
        </div>
      ) : null}
      {interpretation ? (
        <div style={{
          width: "100%",
          maxWidth: 760,
          marginBottom: 18,
          padding: "14px 18px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#e8e6e1",
          fontSize: 15,
          lineHeight: 1.55,
          textAlign: "center",
        }}>
          {interpretation}
        </div>
      ) : null}
      {belowThresholdAnalysis ? (
        <details style={{
          width: "100%",
          maxWidth: 760,
          marginBottom: 18,
          borderRadius: 16,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#f8fafc",
        }}>
          <summary style={{
            listStyle: "none",
            cursor: "pointer",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}>
            <span style={{ fontSize: 12, color: "#c7d2fe", letterSpacing: 1.6, textTransform: "uppercase", fontWeight: 700 }}>
              {belowThresholdAnalysis.title}
            </span>
            <span style={{ fontSize: 13, color: "rgba(226,232,240,0.56)", lineHeight: 1.5 }}>
              Instructional notes for below-threshold benchmark runs.
            </span>
          </summary>
          <div style={{
            display: "grid",
            gap: 8,
            padding: "0 20px 18px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            {belowThresholdAnalysis.lines.map((line) => (
              <div key={line} style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(248,250,252,0.84)" }}>
                {line}
              </div>
            ))}
          </div>
        </details>
      ) : null}
      <div style={{ maxWidth: 640, textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 28 }}>
        {statusMeta.description}
        {summary.standardizationNote ? ` ${summary.standardizationNote}` : ""}
        <div style={{ marginTop: 14 }}>
          <a
            href="/notes-per-minute-fluency"
            style={{
              color: "#c7d2fe",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              borderBottom: "1px solid rgba(199,210,254,0.45)",
              paddingBottom: 2,
            }}
          >
            How the benchmark works
          </a>
        </div>
      </div>

      {summary.scoreThresholdNote ? (
        <div style={{
          width: "100%",
          maxWidth: 760,
          marginBottom: 24,
          padding: "14px 16px",
          borderRadius: 14,
          background: "rgba(129,140,248,0.08)",
          border: "1px solid rgba(129,140,248,0.18)",
          color: "#c7d2fe",
          fontSize: 14,
          textAlign: "center",
        }}>
          {summary.scoreThresholdNote}
        </div>
      ) : null}

      {showCopyResults ? (
        <div style={{
          width: "100%",
          maxWidth: 760,
          marginBottom: 24,
          padding: 18,
          borderRadius: 18,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
            Export Results
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            alignItems: "end",
          }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>
                student_label
              </span>
              <input
                type="text"
                value={studentLabel}
                onChange={(event) => setStudentLabel(event.target.value)}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "#e8e6e1",
                  fontSize: 14,
                  padding: "12px 14px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>
                teacher_rating
              </span>
              <select
                value={teacherRating}
                onChange={(event) => setTeacherRating(event.target.value)}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#14141b",
                  color: "#e8e6e1",
                  fontSize: 14,
                  padding: "12px 14px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <option value="">Select rating</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
            <div style={{ display: "grid", gap: 8 }}>
              <button onClick={handleCopyResultsRow} style={{
                padding: "13px 18px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.9))",
                border: "none",
                borderRadius: 12,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.5,
              }}>
                Copy Results Row
              </button>
              <div style={{ minHeight: 20, fontSize: 13, color: copyStatus === "Copied!" ? "#6ee7b7" : "#fca5a5" }}>
                {copyStatus}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 16,
        marginBottom: 28,
        width: "100%",
        maxWidth: 760,
      }}>
        {(showStandardizedScore
          ? [
            { label: "Attempted Notes", value: `${summary.attemptedNotes}`, color: "#c4b5fd" },
            { label: "Correct Notes", value: `${summary.correctNotes}`, color: "#fbbf24" },
            { label: "Accuracy", value: `${Math.round(summary.accuracy)}%`, color: summary.accuracy >= 85 ? "#34d399" : "#fbbf24" },
            ...(showFlowMetric ? [{ label: "Flow", value: `${Math.round(summary.flowPct)}%`, color: "#a5b4fc" }] : []),
            {
              label: "Advanced Bonus",
              value: `+${(summary.advancedFluencyBonus || 0).toFixed(1)}`,
              color: showAdvancedBonus ? "#34d399" : "rgba(255,255,255,0.45)",
            },
            {
              label: "Band",
              value: summary.fluencyBand,
              color: "#c4b5fd",
            },
          ]
          : [
            { label: "Attempted Notes", value: `${summary.attemptedNotes}`, color: "#c4b5fd" },
            { label: "Correct Notes", value: `${summary.correctNotes}`, color: "#fbbf24" },
            { label: "Accuracy", value: `${Math.round(summary.accuracy)}%`, color: summary.accuracy >= 85 ? "#34d399" : "#fbbf24" },
            ...(showFlowMetric ? [{ label: "Flow", value: `${Math.round(summary.flowPct)}%`, color: "#a5b4fc" }] : []),
            { label: "Raw NPM", value: `${Math.round(summary.rawNpm)}`, color: "#fca5a5" },
            {
              label: "Standard Score",
              value: "60s only",
              color: "rgba(255,255,255,0.45)",
            },
          ]).map((metric) => (
          <div key={metric.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "20px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {metric.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: metric.color, fontVariantNumeric: "tabular-nums" }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {summary.flowConfidence === "none" ? (
        <div style={{
          width: "100%",
          maxWidth: 760,
          marginBottom: 24,
          padding: "14px 16px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.52)",
          fontSize: 14,
          textAlign: "center",
        }}>
          Not enough attempts to calculate flow
        </div>
      ) : null}

      <div style={{
        width: "100%",
        maxWidth: 760,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 22,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          Takeaway
        </div>
        <div style={{ fontSize: 18, color: "#e8e6e1", fontWeight: 600, marginBottom: 12 }}>
          {summary.takeaway}
        </div>
        {takeawaySupportMessages.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {takeawaySupportMessages.map((message) => (
              <div key={message} style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {message}
              </div>
            ))}
          </div>
        )}
        {summary.weakNotes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(248,113,113,0.72)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
              Accuracy Watch
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {summary.weakNotes.map((note) => (
                <div key={note.note} style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.18)",
                  color: "#fca5a5",
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {note.note} · {note.accuracy}%
                </div>
              ))}
            </div>
          </div>
        )}
        {summary.topDelayedNotes?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "rgba(251,191,36,0.78)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
              Top Delayed Notes
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {summary.topDelayedNotes.map((entry) => (
                <div key={entry.id} style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "rgba(251,191,36,0.08)",
                  border: "1px solid rgba(251,191,36,0.18)",
                  color: "#fcd34d",
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {entry.label} · {entry.hesitationCount} spikes
                </div>
              ))}
            </div>
          </div>
        )}
        {summary.topDelayedNoteGroups?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "rgba(199,210,254,0.78)", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8, fontWeight: 700 }}>
              Delay Patterns
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {summary.topDelayedNoteGroups.slice(0, 3).map((entry) => (
                <div key={entry.id} style={{
                  padding: "8px 12px",
                  borderRadius: 12,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(129,140,248,0.18)",
                  color: "#c7d2fe",
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {entry.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 16,
        marginBottom: 24,
        width: "100%",
        maxWidth: 760,
      }}>
        {[
          { label: "Hesitations", value: `${summary.hesitationCount}`, color: "#fbbf24" },
          { label: "Hesitation Rate", value: `${summary.hesitationRate}%`, color: "#a5b4fc" },
          { label: "Total Excess Delay", value: formatDelayValue(summary.totalExcessDelayMs), color: "#fca5a5" },
          { label: "Median Response", value: summary.medianResponseTimeMs != null ? `${summary.medianResponseTimeMs} ms` : "n/a", color: "#c4b5fd" },
        ].map((metric) => (
          <div key={metric.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "18px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {metric.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: metric.color, fontVariantNumeric: "tabular-nums" }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {summary.teacherFeedback?.length > 0 && (
        <div style={{
          width: "100%",
          maxWidth: 760,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 18,
          padding: 22,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Diagnostic Detail
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {summary.teacherFeedback.map((message) => (
              <div key={message} style={{ fontSize: 14, color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>
                {message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 24,
        width: "100%",
        maxWidth: 760,
        marginBottom: 28,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Per-Note Accuracy
          </div>
          <svg ref={barChartRef} width="100%" viewBox="0 0 500 180" />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Accuracy Over Time
          </div>
          <svg ref={chartRef} width="100%" viewBox="0 0 500 200" />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Fastest Notes by Avg Response
          </div>
          <svg ref={fastestNotesChartRef} width="100%" viewBox={`0 0 500 ${fastestNotesChartViewBoxHeight}`} />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Notes Entered Per Second
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 16 }}>
            Number of notes entered during each second of the run.
          </div>
          <svg ref={speedChartRef} width="100%" viewBox="0 0 500 200" />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Hesitation Threshold Over Time
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 16 }}>
            Gold line = hesitation threshold. Purple line = actual response time. Red dots crossed the threshold.
          </div>
          <svg ref={thresholdChartRef} width="100%" viewBox={`0 0 500 ${thresholdChartViewBoxHeight}`} />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Hesitation Spikes by Note
          </div>
          <svg ref={hesitationChartRef} width="100%" viewBox={`0 0 500 ${hesitationChartViewBoxHeight}`} />
        </div>
      </div>

      <button onClick={onRestart} style={{
        padding: "16px 48px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: 14,
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: 1,
        boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
      }}>
        Back to Menu
      </button>
    </div>
  );
}
