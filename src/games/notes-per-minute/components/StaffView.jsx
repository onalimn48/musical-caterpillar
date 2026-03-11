import { NOTE_SPACING, STAFF_LEFT } from "../data/constants.js";
import { getStaffLines, needsLedgerLines, posToY } from "../data/staff.js";
import ClefGlyph from "./ClefGlyph.jsx";

export default function StaffView({ notes, currentIndex, clef }) {
  const staffLines = getStaffLines(clef);
  const svgWidth = 800;
  const svgHeight = 300;

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{
      background: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.15)",
    }}>
      {staffLines.map((pos, i) => {
        const y = posToY(pos, clef);
        return <line key={i} x1={40} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />;
      })}

      <ClefGlyph
        clef={clef}
        x={55}
        y={posToY(staffLines[2], clef)}
        color="rgba(255,255,255,0.6)"
      />

      <line
        x1={STAFF_LEFT + 40}
        y1={posToY(staffLines[0], clef) - 30}
        x2={STAFF_LEFT + 40}
        y2={posToY(staffLines[4], clef) + 30}
        stroke="rgba(99,102,241,0.5)"
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      {notes.map((note, i) => {
        const relIdx = i - currentIndex;
        const x = STAFF_LEFT + 40 + relIdx * NOTE_SPACING;
        if (x < 30 || x > svgWidth - 20) return null;
        const y = posToY(note.position, clef);
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const ledgers = needsLedgerLines(note.position, clef);

        let noteColor = "rgba(255,255,255,0.9)";
        if (isCurrent) noteColor = "#a5b4fc";
        if (isPast) noteColor = "rgba(255,255,255,0.15)";

        return (
          <g key={i} style={{ transition: "transform 0.2s ease-out" }}>
            {ledgers.map((lp, li) => (
              <line
                key={li}
                x1={x - 18}
                y1={posToY(lp, clef)}
                x2={x + 18}
                y2={posToY(lp, clef)}
                stroke={isPast ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"}
                strokeWidth={1.5}
              />
            ))}

            <ellipse
              cx={x}
              cy={y}
              rx={12}
              ry={8}
              fill={isCurrent ? noteColor : isPast ? "none" : "rgba(255,255,255,0.85)"}
              stroke={noteColor}
              strokeWidth={2.5}
              transform={`rotate(-10 ${x} ${y})`}
              style={isCurrent ? { filter: "drop-shadow(0 0 12px rgba(165,180,252,0.7))" } : {}}
            />

            {!isPast && note.accidental && (
              <text
                x={x - 21}
                y={y + 10}
                fill={noteColor}
                fontSize={28}
                fontFamily="'Noto Music','Segoe UI Symbol',serif"
                textAnchor="middle"
              >
                {note.accidental === "#" ? "♯" : "♭"}
              </text>
            )}

            {!isPast && (
              <line
                x1={note.position >= staffLines[2] ? x - 9 : x + 9}
                y1={y}
                x2={note.position >= staffLines[2] ? x - 9 : x + 9}
                y2={note.position >= staffLines[2] ? y + 40 : y - 40}
                stroke={noteColor}
                strokeWidth={2}
              />
            )}

            {isCurrent && (
              <circle cx={x} cy={y} r={20} fill="none" stroke="rgba(165,180,252,0.4)" strokeWidth={1.5}>
                <animate attributeName="r" values="18;24;18" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}
