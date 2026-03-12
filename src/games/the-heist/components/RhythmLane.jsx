import { memo, useMemo } from "react";

const DEFAULT_LAYOUT = {
  width: 720,
  laneY: 72,
  hitX: 86,
  spawnX: 692,
};

const DEFAULT_STANDALONE_EIGHTH_FLAG_PATH = "M8.7 -27 C15.8 -26.2, 17.2 -19.2, 13.2 -14.9 C16.8 -15.6, 17.9 -11.1, 15.6 -7.8 C12.9 -9.5, 10.8 -11, 8.7 -12.2 Z";

const DEFAULT_NOTATION = {
  useTemplateBeams: true,
  musicNotationFontFamily: "serif",
  standaloneEighthFlagPath: DEFAULT_STANDALONE_EIGHTH_FLAG_PATH,
};

function beamStemX(note) {
  switch (note.kind) {
    case "quarter":
    case "dotted_quarter":
      return (note.laneBaseX ?? note.x ?? 0) + 7.5;
    case "eighth":
      return (note.laneBaseX ?? note.x ?? 0) + 5.5;
    case "sixteenth":
    case "triplet":
      return (note.laneBaseX ?? note.x ?? 0) + 4.9;
    default:
      return (note.laneBaseX ?? note.x ?? 0) + 7;
  }
}

function buildTemplateBeamSegment(beamIdx, fromNote, toNote, overshoot = 0, beamLevel = beamIdx) {
  return {
    beamIdx,
    beamLevel,
    x1: beamStemX(fromNote) - (typeof overshoot === "number" ? overshoot : (overshoot?.left ?? 0)),
    x2: beamStemX(toNote) + (typeof overshoot === "number" ? overshoot : (overshoot?.right ?? 0)),
  };
}

function buildTemplateBeamGroup(sorted) {
  const patternKey = sorted.map(note => note.kind).join(",");
  const label = sorted.find(note => note.groupLabel)?.groupLabel || null;
  const labelX = (beamStemX(sorted[0]) + beamStemX(sorted[sorted.length - 1])) / 2;
  switch (patternKey) {
    case "eighth,eighth":
      return {
        segments: [buildTemplateBeamSegment(0, sorted[0], sorted[1], { left: -0.18, right: 1.5 })],
        beamCount: 1,
        label,
        labelX,
      };
    case "sixteenth,sixteenth":
      return {
        segments: [
          buildTemplateBeamSegment(0, sorted[0], sorted[1], { left: -0.16, right: -0.08 }),
          buildTemplateBeamSegment(1, sorted[0], sorted[1], { left: -0.16, right: -0.08 }),
        ],
        beamCount: 2,
        label,
        labelX,
      };
    case "triplet,triplet,triplet":
      return {
        segments: [buildTemplateBeamSegment(0, sorted[0], sorted[2], { left: 0, right: 1.65 })],
        beamCount: 1,
        label,
        labelX,
      };
    case "sixteenth,sixteenth,eighth":
      return {
        segments: [
          buildTemplateBeamSegment(0, sorted[0], sorted[2], { left: 0.05, right: 2.95 }, 1),
          buildTemplateBeamSegment(1, sorted[0], sorted[1], { left: -0.3, right: 1.1 }, 0),
        ],
        beamCount: 2,
        label,
        labelX,
      };
    case "eighth,sixteenth,sixteenth":
      return {
        segments: [
          buildTemplateBeamSegment(0, sorted[0], sorted[2], { left: 0.12, right: 2.55 }, 1),
          buildTemplateBeamSegment(1, sorted[1], sorted[2], { left: -0.04, right: 2.2 }, 0),
        ],
        beamCount: 2,
        label,
        labelX,
      };
    default:
      return null;
  }
}

function buildGenericBeamGroup(sorted) {
  const maxBeamCount = Math.max(...sorted.map(note => note.beamCount || 1));
  const mixedBeamGroup = new Set(sorted.map(note => note.kind)).size > 1;
  const uniformSixteenthGroup = sorted.length >= 3 && sorted.every(note => note.kind === "sixteenth");
  const beamOvershoot = mixedBeamGroup ? 1.4 : -0.14;
  const segments = [];
  for (let beamIdx = 0; beamIdx < maxBeamCount; beamIdx++) {
    let run = [];
    for (const note of sorted) {
      if ((note.beamCount || 0) > beamIdx) {
        run.push(note);
        continue;
      }
      if (run.length >= 2) {
        const overshoot = uniformSixteenthGroup
          ? beamIdx === 0
            ? { left: -0.14, right: 2.4 }
            : { left: -0.14, right: 2.8 }
          : beamOvershoot;
        segments.push(buildTemplateBeamSegment(beamIdx, run[0], run[run.length - 1], overshoot));
      }
      run = [];
    }
    if (run.length >= 2) {
      const overshoot = uniformSixteenthGroup
        ? beamIdx === 0
          ? { left: -0.14, right: 2.4 }
          : { left: -0.14, right: 2.8 }
        : beamOvershoot;
      segments.push(buildTemplateBeamSegment(beamIdx, run[0], run[run.length - 1], overshoot));
    }
  }
  return {
    segments,
    beamCount: maxBeamCount,
    labelX: (beamStemX(sorted[0]) + beamStemX(sorted[sorted.length - 1])) / 2,
    label: sorted.find(note => note.groupLabel)?.groupLabel || null,
  };
}

const RhythmLane = memo(function RhythmLane({
  notes,
  motionRef = null,
  showWaitHint = false,
  showHoldHint = false,
  beatsPerBar = 4,
  layout = DEFAULT_LAYOUT,
  notation = DEFAULT_NOTATION,
  showHitLine = true,
  showStartBarline = true,
  showEndBarline = true,
}) {
  const {
    width: laneWidth = DEFAULT_LAYOUT.width,
    laneY = DEFAULT_LAYOUT.laneY,
    hitX = DEFAULT_LAYOUT.hitX,
    spawnX = DEFAULT_LAYOUT.spawnX,
  } = layout;
  const {
    useTemplateBeams = DEFAULT_NOTATION.useTemplateBeams,
    musicNotationFontFamily = DEFAULT_NOTATION.musicNotationFontFamily,
    standaloneEighthFlagPath = DEFAULT_NOTATION.standaloneEighthFlagPath,
  } = notation;
  const { beamSegments, groupMap, phraseBarlines } = useMemo(() => {
    const nextBeamSegments = [];
    const nextGroupMap = new Map();
    for (const note of notes) {
      if (!note.groupId) continue;
      const group = nextGroupMap.get(note.groupId) || [];
      group.push(note);
      nextGroupMap.set(note.groupId, group);
    }
    for (const group of nextGroupMap.values()) {
      if (group.length < 2) continue;
      const sorted = [...group].sort((left, right) => left.hitTime - right.hitTime);
      nextBeamSegments.push(
        (useTemplateBeams && buildTemplateBeamGroup(sorted)) || buildGenericBeamGroup(sorted)
      );
    }
    const nextPhraseBarlines = [];
    const barlineNotes = notes.filter(note => Number.isFinite(note.absoluteBeatInRun) && Number.isFinite(note.pxPerBeat));
    if (barlineNotes.length) {
      const pxPerBeat = barlineNotes[0].pxPerBeat;
      const anchorX = barlineNotes.reduce(
        (sum, note) => sum + ((note.laneBaseX ?? note.x ?? 0) - note.absoluteBeatInRun * pxPerBeat),
        0
      ) / barlineNotes.length;
      const boundaryInset = Math.min(24, pxPerBeat * 0.24);
      const minBeat = Math.min(...barlineNotes.map(note => note.absoluteBeatInRun));
      const maxBeat = Math.max(...barlineNotes.map(note => note.absoluteBeatInRun));
      nextPhraseBarlines.push({
        key: "barline-start",
        x: anchorX - boundaryInset,
      });
      const firstBoundary = Math.ceil((minBeat + 0.001) / beatsPerBar) * beatsPerBar;
      for (let beat = firstBoundary; beat < maxBeat + beatsPerBar; beat += beatsPerBar) {
        nextPhraseBarlines.push({
          key: `barline-${beat}`,
          x: anchorX + beat * pxPerBeat - boundaryInset,
        });
      }
    }
    return {
      beamSegments: nextBeamSegments,
      groupMap: nextGroupMap,
      phraseBarlines: nextPhraseBarlines,
    };
  }, [notes, beatsPerBar, useTemplateBeams]);

  const getTemplateStemBoost = note => {
    if (!useTemplateBeams || !note.groupId) return 0;
    const group = groupMap.get(note.groupId);
    if (!group || group.length < 2) return 0;
    const sorted = [...group].sort((left, right) => left.hitTime - right.hitTime);
    const patternKey = sorted.map(entry => entry.kind).join(",");
    if (patternKey === "eighth,sixteenth,sixteenth" && sorted[0]?.id === note.id) return 6;
    if (patternKey === "sixteenth,sixteenth,eighth" && sorted[2]?.id === note.id) return 5;
    return 0;
  };

  const Note = ({ note }) => {
    const noteX = note.laneBaseX ?? note.x ?? 0;
    const isCountIn = note.kind === "count_in";
    const isHold = note.kind === "hold";
    const noteStyle = {
      quarter: { headRx: 9, headRy: 7, stemH: 28 },
      dotted_quarter: { headRx: 9, headRy: 7, stemH: 28 },
      eighth: { headRx: 7, headRy: 5.5, stemH: 22 },
      sixteenth: { headRx: 6.4, headRy: 5, stemH: 22 },
      triplet: { headRx: 6.4, headRy: 5, stemH: 22 },
    }[note.kind] || { headRx: 7, headRy: 5.5, stemH: 22 };
    const activeCol = isCountIn ? "#ffb347" : note.hit ? "#44ff88" : note.missed ? "#ff7755" : "#7ce7ff";
    const coreCol = isCountIn ? "#fff5dc" : note.hit ? "#d7ffea" : note.missed ? "#ffd1c8" : "#ffffff";
    if (isHold) {
      const isQuarterRest = note.holdStyle === "quarter_rest";
      const isHalfHold = note.holdStyle === "half_hold";
      const isWholeHold = note.holdStyle === "measure_rest";
      const isDottedHalfHold = note.holdStyle === "endless_hold";
      const laneW = spawnX - hitX;
      const holdWidth = Math.max(28, laneW * ((note.durationBeats || 1) / 4));
      if (isQuarterRest) {
        return (
          <g transform={`translate(${noteX},${laneY})`} opacity={note.missed ? 0.45 : 1}>
            <text
              x={0}
              y={1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={64}
              fill="#D4860A"
              stroke="#8F5A00"
              strokeWidth={0.55}
              paintOrder="stroke"
              fontFamily={musicNotationFontFamily}
              style={{ filter: "drop-shadow(0 0 8px #D4860A88)" }}
            >
              {"\uE4E5"}
            </text>
            {showWaitHint && (
              <text x={28} y={-14} textAnchor="start" fontSize={8} fill="#ffd792" fontFamily="monospace" letterSpacing={1.5}>
                WAIT
              </text>
            )}
          </g>
        );
      }
      if (isHalfHold || isWholeHold || isDottedHalfHold) {
        const showDurationTrail = false;
        const trailStartX = isWholeHold ? 13 : 11;
        const trailEndX = Math.max(trailStartX + 34, holdWidth);
        const noteFill = "#07101d";
        const noteStroke = "#ffd792";
        const noteCore = "#fff3d1";
        return (
          <g transform={`translate(${noteX},${laneY})`} opacity={note.missed ? 0.45 : 1}>
            {showDurationTrail && <line x1={trailStartX} y1={0} x2={trailEndX} y2={0} stroke="#D4860A" strokeWidth={10} strokeLinecap="round" opacity={0.14} />}
            {showDurationTrail && <line x1={trailStartX} y1={0} x2={trailEndX} y2={0} stroke={noteStroke} strokeWidth={3.2} strokeLinecap="round" opacity={0.5} />}
            {showDurationTrail && <line x1={trailStartX} y1={0} x2={trailEndX} y2={0} stroke={noteCore} strokeWidth={1.3} strokeLinecap="round" opacity={0.92} />}
            <ellipse cx={0} cy={0} rx={10} ry={7.2} fill={noteFill} stroke={noteStroke} strokeWidth={2.1} />
            <ellipse cx={0} cy={0} rx={4.3} ry={3} fill={noteFill} opacity={0.96} />
            {!isWholeHold && <rect x={8.5} y={-28} width={2.8} height={28} rx={1.4} fill={noteCore} opacity={0.95} />}
            {isDottedHalfHold && <circle cx={15.5} cy={0} r={2.3} fill={noteCore} opacity={0.95} />}
            {showDurationTrail && <line x1={trailEndX} y1={-6} x2={trailEndX} y2={6} stroke={noteStroke} strokeWidth={1.4} opacity={0.52} />}
            {showHoldHint && (isHalfHold || isWholeHold || isDottedHalfHold) && (
              <text x={28} y={-14} textAnchor="start" fontSize={8} fill="#ffd792" fontFamily="monospace" letterSpacing={1.5}>
                HOLD
              </text>
            )}
          </g>
        );
      }
      return (
        <g transform={`translate(${noteX},${laneY})`} opacity={note.missed ? 0.45 : 1}>
          <rect x={0} y={-10} width={holdWidth} height={20} rx={9} fill="#D4860A" opacity={0.14} />
          <rect x={0} y={-5.5} width={holdWidth} height={11} rx={5.5} fill="#D4860A" stroke="#ffd792" strokeWidth={1.1} />
          <rect x={0} y={-2} width={holdWidth} height={4} rx={2} fill="#fff0cc" opacity={0.55} />
        </g>
      );
    }
    const headRx = isCountIn ? 11 : noteStyle.headRx;
    const headRy = isCountIn ? 11 : noteStyle.headRy;
    const stemH = isCountIn ? 0 : noteStyle.stemH + (note.groupId ? 2 : 0) + getTemplateStemBoost(note);
    const isStandaloneEighth = note.kind === "eighth" && !note.groupId;
    if (isStandaloneEighth) {
      return (
        <g transform={`translate(${noteX},${laneY})`} opacity={note.missed ? 0.45 : 1}>
          <circle cx={0} cy={0} r={18} fill={activeCol} opacity={0.09} />
          <ellipse cx={-2} cy={1} rx={9} ry={7} fill={activeCol} stroke={coreCol} strokeWidth={1.3} />
          <ellipse cx={-2} cy={1} rx={6} ry={4.8} fill={coreCol} opacity={0.28} />
          <rect x={5.5} y={-29} width={3.2} height={30} rx={1.6} fill={coreCol} opacity={0.95} />
          <path
            d={standaloneEighthFlagPath}
            fill={activeCol}
            stroke={coreCol}
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
          {note.accent === "offbeat" && (
            <text x={0} y={-31} textAnchor="middle" fontSize={9} fill="#ffbf6b" fontFamily="monospace" letterSpacing={1}>
              +
            </text>
          )}
        </g>
      );
    }
    return (
      <g transform={`translate(${noteX},${laneY})`} opacity={note.missed ? 0.45 : 1}>
        <circle cx={0} cy={0} r={18} fill={activeCol} opacity={0.09} />
        <ellipse cx={0} cy={0} rx={headRx} ry={headRy} fill={activeCol} stroke={coreCol} strokeWidth={1.3} />
        <ellipse cx={0} cy={0} rx={headRx - 3} ry={headRy - 2.2} fill={coreCol} opacity={0.28} />
        {!isCountIn && <rect x={headRx - 1.5} y={-stemH} width={3} height={stemH} rx={1.5} fill={coreCol} opacity={0.92} />}
        {note.kind === "dotted_quarter" && <circle cx={headRx + 8} cy={0} r={2.4} fill={coreCol} />}
        {note.accent === "offbeat" && (
          <text x={0} y={-31} textAnchor="middle" fontSize={9} fill="#ffbf6b" fontFamily="monospace" letterSpacing={1}>
            +
          </text>
        )}
        {isCountIn && (
          <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#2b1400" fontFamily="monospace">
            {note.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <g>
      <rect x={18} y={laneY - 26} width={laneWidth - 36} height={54} rx={8} fill="#020714" opacity={0.72} />
      <line x1={hitX} y1={laneY} x2={spawnX} y2={laneY} stroke="#173052" strokeWidth={2} />
      <line x1={hitX} y1={laneY} x2={spawnX} y2={laneY} stroke="#60cfff" strokeWidth={9} opacity={0.05} />
      {showHitLine && (
        <>
          <rect x={hitX - 8} y={laneY - 24} width={16} height={48} rx={6} fill="#ffffff" opacity={0.1} />
          <line x1={hitX} y1={laneY - 27} x2={hitX} y2={laneY + 27} stroke="#ffffff" strokeWidth={3.5} />
          <line x1={hitX} y1={laneY - 27} x2={hitX} y2={laneY + 27} stroke="#7ce7ff" strokeWidth={11} opacity={0.16} />
          <text x={30} y={laneY - 30} fontSize={8} fill="#5da8d8" fontFamily="monospace" letterSpacing={2}>
            HIT LINE
          </text>
        </>
      )}
      <g ref={motionRef} transform="translate(0,0)">
        {phraseBarlines
          .filter(barline => (showStartBarline || barline.key !== "barline-start"))
          .filter(barline => (showEndBarline || barline.key !== `barline-${beatsPerBar}`))
          .map(barline => (
          <g key={barline.key}>
            <line x1={barline.x} y1={laneY - 22} x2={barline.x} y2={laneY + 22} stroke="#e8f6ff" strokeWidth={2.2} opacity={0.7} />
            <line x1={barline.x} y1={laneY - 24} x2={barline.x} y2={laneY + 24} stroke="#7ce7ff" strokeWidth={8} opacity={0.12} />
          </g>
        ))}
        {notes.map(note => <Note key={note.id} note={note} />)}
        {beamSegments.map((segment, index) => (
          <g key={index}>
            {segment.segments.map((beamSegment, beamIdx) => {
              const y = laneY - 22 - (beamSegment.beamLevel ?? beamSegment.beamIdx) * 7;
              return (
                <g key={beamIdx}>
                  <line x1={beamSegment.x1} y1={y} x2={beamSegment.x2} y2={y} stroke="#f0fbff" strokeWidth={5.2} opacity={0.98} strokeLinecap="butt" />
                  <line x1={beamSegment.x1} y1={y} x2={beamSegment.x2} y2={y} stroke="#7ce7ff" strokeWidth={11.5} opacity={0.26} strokeLinecap="butt" />
                </g>
              );
            })}
            {segment.label && (
              <text x={segment.labelX} y={laneY - 36 - (segment.beamCount - 1) * 7} textAnchor="middle" fontSize={9} fill="#ffe3aa" fontFamily="monospace">
                {segment.label}
              </text>
            )}
          </g>
        ))}
      </g>
    </g>
  );
});

export default RhythmLane;
