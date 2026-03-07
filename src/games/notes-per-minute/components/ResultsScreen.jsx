import { useEffect, useRef } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { ACCIDENTAL_DISPLAY_NAMES, CHROMATIC_NOTE_NAMES, NOTE_NAMES } from "../data/constants.js";

const restartBtnStyle = {
  padding: "14px 40px",
  background: "#6366f1",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
  marginTop: 20,
};

function buildLinePath(data, x, y) {
  return data.map((d, index) => `${index === 0 ? "M" : "L"}${x(d.group)},${y(d.accuracy)}`).join(" ");
}

function buildAreaPath(data, x, y, height) {
  if (!data.length) return "";
  const linePath = buildLinePath(data, x, y);
  const first = data[0];
  const last = data[data.length - 1];
  return `${linePath} L${x(last.group)},${height} L${x(first.group)},${height} Z`;
}

export default function ResultsScreen({ stats, clef, onRestart }) {
  const chartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    if (!stats || !chartRef.current) return;

    const svg = select(chartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (stats.rolling.length < 2) {
      g.append("text").attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14).text("Not enough data for chart");
      return;
    }

    const x = scaleLinear().domain([1, stats.rolling.length]).range([0, width]);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(stats.rolling.length).tickFormat(d => `${d}`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("path").datum(stats.rolling)
      .attr("fill", "rgba(99,102,241,0.15)")
      .attr("d", buildAreaPath(stats.rolling, x, y, height));

    g.append("path").datum(stats.rolling)
      .attr("fill", "none")
      .attr("stroke", "#818cf8")
      .attr("stroke-width", 2.5)
      .attr("d", buildLinePath(stats.rolling, x, y));

    g.selectAll(".dot").data(stats.rolling).enter().append("circle")
      .attr("cx", d => x(d.group))
      .attr("cy", d => y(d.accuracy))
      .attr("r", 4)
      .attr("fill", "#818cf8")
      .attr("stroke", "#0a0a0f")
      .attr("stroke-width", 2);

    g.append("text")
      .attr("x", width / 2).attr("y", height + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.3)")
      .attr("font-size", 12)
      .text("Groups of 5 notes →");

  }, [stats]);

  useEffect(() => {
    if (!stats || !barChartRef.current) return;

    const svg = select(barChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const labels = [...NOTE_NAMES, ...CHROMATIC_NOTE_NAMES.filter((n) => n.includes("#")), ...ACCIDENTAL_DISPLAY_NAMES.filter((n) => n.includes("b"))];
    const data = labels.map(n => ({
      note: n,
      accuracy: stats.noteStats[n].total > 0 ? (stats.noteStats[n].correct / stats.noteStats[n].total) * 100 : 0,
      total: stats.noteStats[n].total,
    })).filter(d => d.total > 0);

    const x = scaleBand().domain(data.map(d => d.note)).range([0, width]).padding(0.3);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`)
      .call(axisBottom(x))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 13).attr("font-weight", 600);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("x", d => x(d.note))
      .attr("y", d => y(d.accuracy))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.accuracy))
      .attr("rx", 4)
      .attr("fill", d => d.accuracy >= 80 ? "rgba(52,211,153,0.6)" : d.accuracy >= 50 ? "rgba(251,191,36,0.6)" : "rgba(248,113,113,0.6)");

    g.selectAll(".label").data(data).enter().append("text")
      .attr("x", d => x(d.note) + x.bandwidth() / 2)
      .attr("y", d => y(d.accuracy) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", 11)
      .text(d => `${Math.round(d.accuracy)}%`);

  }, [stats]);

  if (!stats) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0f", color: "#e8e6e1",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        <p>No results to show.</p>
        <button onClick={onRestart} style={restartBtnStyle}>Try Again</button>
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
      padding: "40px 20px",
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
        fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 300,
      }}>
        Results · {clef} Clef
      </div>

      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 96, fontWeight: 900, letterSpacing: -4,
        background: "linear-gradient(135deg, #e8e6e1, #818cf8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1,
      }}>
        {Math.round(stats.npm)}
      </div>
      <div style={{
        fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 40,
        fontWeight: 300, letterSpacing: 2,
      }}>
        Notes Per Minute
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 40,
        width: "100%",
        maxWidth: 600,
      }}>
        {[
          { label: "Correct", value: stats.correct, color: "#34d399" },
          { label: "Wrong", value: stats.wrong, color: "#f87171" },
          { label: "Accuracy", value: `${Math.round(stats.accuracy)}%`, color: "#818cf8" },
          { label: "Avg Time", value: `${stats.avgTime.toFixed(2)}s`, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "20px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 24,
        width: "100%",
        maxWidth: 560,
        marginBottom: 40,
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
        transition: "all 0.2s ease",
        marginBottom: 40,
      }}
      onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.target.style.transform = "translateY(0)"}
      >
        Try Again
      </button>
    </div>
  );
}
