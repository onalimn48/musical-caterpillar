import { useEffect, useMemo, useRef, useState } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import {
  buildBenchmarkResultsCsvHeader,
  buildBenchmarkResultsCsvRow,
  CSV_HEADER_SESSION_STORAGE_KEY,
} from "../utils/csvExport.js";

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

export default function ResultsScreen({ session, onRestart }) {
  const chartRef = useRef(null);
  const barChartRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const [studentLabel, setStudentLabel] = useState("Student 1");
  const [teacherRating, setTeacherRating] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

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
    setStudentLabel("Student 1");
    setTeacherRating("");
    setCopyStatus("");
  }, [session?.id, session?.completedAt]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }
  }, []);

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
        lineHeight: 1,
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
      <div style={{ maxWidth: 640, textAlign: "center", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 28 }}>
        {statusMeta.description}
        {summary.standardizationNote ? ` ${summary.standardizationNote}` : ""}
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
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 16,
        marginBottom: 28,
        width: "100%",
        maxWidth: 760,
      }}>
        {(showStandardizedScore
          ? [
            { label: "Accuracy", value: `${Math.round(summary.accuracy)}%`, color: summary.accuracy >= 85 ? "#34d399" : "#fbbf24" },
            ...(showFlowMetric ? [{ label: "Flow", value: `${Math.round(summary.flowPct)}%`, color: "#a5b4fc" }] : []),
            { label: "Attempted Notes", value: `${summary.attemptedNotes}`, color: "#c4b5fd" },
            { label: "Correct Notes", value: `${summary.correctNotes}`, color: "#fbbf24" },
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
            { label: "Accuracy", value: `${Math.round(summary.accuracy)}%`, color: summary.accuracy >= 85 ? "#34d399" : "#fbbf24" },
            ...(showFlowMetric ? [{ label: "Flow", value: `${Math.round(summary.flowPct)}%`, color: "#a5b4fc" }] : []),
            { label: "Attempted Notes", value: `${summary.attemptedNotes}`, color: "#c4b5fd" },
            { label: "Correct Notes", value: `${summary.correctNotes}`, color: "#fbbf24" },
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
        {Array.isArray(summary.studentFeedback) && summary.studentFeedback.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {summary.studentFeedback.map((message) => (
              <div key={message} style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {message}
              </div>
            ))}
          </div>
        )}
        {summary.weakNotes.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
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
                Accuracy Watch · {note.note} · {note.accuracy}%
              </div>
            ))}
          </div>
        )}
        {summary.topDelayedNotes?.length > 0 && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
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
                Hesitation · {entry.label} · {entry.hesitationCount}
              </div>
            ))}
          </div>
        )}
        {summary.topDelayedNoteGroups?.length > 0 && (
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
                Group · {entry.label}
              </div>
            ))}
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
          { label: "Total Excess Delay", value: `${summary.totalExcessDelayMs} ms`, color: "#fca5a5" },
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
            Per-Note Accuracy
          </div>
          <svg ref={barChartRef} width="100%" viewBox="0 0 500 180" />
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
