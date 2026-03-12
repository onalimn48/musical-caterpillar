function Section({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(226,232,240,.56)" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function PillButton({ active, children, onClick, accent = "#d9f99d", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 14,
        border: active ? `1px solid ${accent}` : "1px solid rgba(255,255,255,.12)",
        background: active ? `${accent}22` : "rgba(255,255,255,.07)",
        color: disabled ? "rgba(226,232,240,.42)" : "white",
        padding: "10px 12px",
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}

function RangeScale({ leftLabel, rightLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 4, fontSize: 11, color: "rgba(226,232,240,.58)" }}>
      <span>{leftLabel}</span>
      <span>{rightLabel}</span>
    </div>
  );
}

function RoleBadge({ roleTag }) {
  if (!roleTag) return null;

  const colors = {
    bass: { fg: "#fde68a", bg: "rgba(245,158,11,.14)", border: "rgba(245,158,11,.28)" },
    lead: { fg: "#f9a8d4", bg: "rgba(244,114,182,.14)", border: "rgba(244,114,182,.28)" },
    sparkle: { fg: "#67e8f9", bg: "rgba(103,232,249,.14)", border: "rgba(103,232,249,.28)" },
    pad: { fg: "#86efac", bg: "rgba(134,239,172,.14)", border: "rgba(134,239,172,.28)" },
    weird: { fg: "#c4b5fd", bg: "rgba(196,181,253,.14)", border: "rgba(196,181,253,.28)" },
  };
  const palette = colors[roleTag] || { fg: "#e2e8f0", bg: "rgba(255,255,255,.08)", border: "rgba(255,255,255,.14)" };

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "3px 7px",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.7,
      color: palette.fg,
      background: palette.bg,
      border: `1px solid ${palette.border}`,
    }}>
      {roleTag}
    </span>
  );
}

export default function LaneInspector({ lane, actions, octaveOptions, savedPatches }) {
  if (!lane) {
    return (
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(226,232,240,.7)" }}>
        Select a lane to edit its pattern or sound.
      </div>
    );
  }

  const isDrumLane = lane.kind === "drum";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ borderRadius: 18, padding: "14px 16px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>{lane.icon}</span>
          <div>
            <div style={{ fontSize: 18, color: lane.color }}>{lane.label} {isDrumLane ? "Drum" : "Melody"} Lane</div>
            <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>{lane.helperText}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.72)" }}>
          {isDrumLane ? "Shape how this trail lane feels, then return to the grid and place steps." : "Pick a sound and octave for this melody lane, then drag notes into the trail. Each placed note can also get Accent and Gate badges on the grid."}
        </div>
      </div>

      {isDrumLane ? (
        <Section label="Sound">
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>Wave</span>
            <select
              value={lane.patch.oscType}
              onChange={(event) => actions.updateDrumPatch(lane.id, "oscType", event.target.value)}
              style={{
                borderRadius: 12,
                border: `1px solid ${lane.color}55`,
                background: "rgba(15,23,42,.42)",
                color: "white",
                padding: "10px 12px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <option value="sine">Smooth</option>
              <option value="triangle">Pointed</option>
              <option value="square">Chunky</option>
              <option value="sawtooth">Spiky</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>Brightness</span>
            <input
              className="loop-trail-range"
              type="range"
              min={lane.id === "hat" ? "2400" : "240"}
              max={lane.id === "hat" ? "9000" : "4200"}
              step="10"
              value={lane.patch.cutoff}
              onChange={(event) => actions.updateDrumPatch(lane.id, "cutoff", Number(event.target.value))}
            />
            <RangeScale leftLabel="Dark" rightLabel="Bright" />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>Tail</span>
            <input
              className="loop-trail-range"
              type="range"
              min="0.02"
              max="0.48"
              step="0.01"
              value={lane.patch.release}
              onChange={(event) => actions.updateDrumPatch(lane.id, "release", Number(event.target.value))}
            />
            <RangeScale leftLabel="Short" rightLabel="Long" />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>Snap</span>
            <input
              className="loop-trail-range"
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              value={lane.patch.attack}
              onChange={(event) => actions.updateDrumPatch(lane.id, "attack", Number(event.target.value))}
            />
            <RangeScale leftLabel="Sharp" rightLabel="Soft" />
          </label>
          <button
            onClick={() => actions.previewLane(lane.id)}
            style={{
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.08)",
              color: "white",
              borderRadius: 14,
              padding: "10px 12px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Hear Lane
          </button>
        </Section>
      ) : (
        <>
          <Section label="Sound">
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>Octave</span>
              <select
                value={lane.octave}
                onChange={(event) => actions.setLaneOctave(lane.id, Number(event.target.value))}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${lane.color}66`,
                  background: "rgba(15,23,42,.42)",
                  color: "white",
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {octaveOptions.map((octave) => (
                  <option key={`${lane.id}-oct-${octave}`} value={octave}>
                    Octave {octave}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => actions.previewPatch(lane.id)}
              disabled={!lane.selectedPatch}
              style={{
                border: "1px solid rgba(255,255,255,.14)",
                background: lane.selectedPatch ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)",
                color: lane.selectedPatch ? "white" : "rgba(226,232,240,.42)",
                borderRadius: 14,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 700,
                cursor: lane.selectedPatch ? "pointer" : "default",
              }}
            >
              Hear Patch
            </button>
          </Section>
          <Section label="Patch Choice">
            <div style={{ display: "grid", gap: 8 }}>
              {savedPatches.length ? savedPatches.map((patch) => (
                <PillButton
                  key={`${lane.id}-${patch.id}`}
                  active={lane.patchId === patch.id}
                  onClick={() => actions.selectPatch(lane.id, patch.id)}
                  accent={lane.color}
                >
                  <span style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                    <span>{patch.name}</span>
                    <RoleBadge roleTag={patch.roleTag} />
                  </span>
                </PillButton>
              )) : (
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(226,232,240,.66)" }}>
                  Save patches in Sound Garden first, then return here to give this lane a voice.
                </div>
              )}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
