import { useRef } from "react";
import GameContainer from "../../shared/layout/GameContainer.jsx";
import GameLayout from "../../shared/layout/GameLayout.jsx";

function TrailHeader({ stepCount, currentStep, isPlaying }) {
  return (
    <div style={{ position: "relative", padding: "10px 0 4px" }}>
      <div style={{
        position: "absolute",
        left: "2%",
        right: "2%",
        top: 52,
        height: 12,
        borderRadius: 999,
        background: "linear-gradient(90deg, rgba(190,242,100,.32), rgba(103,232,249,.32))",
      }} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stepCount}, minmax(0,1fr))`, gap: 10, alignItems: "end" }}>
        {Array.from({ length: stepCount }).map((_, index) => {
          const active = index === currentStep;
          return (
            <div key={index} style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: active ? 54 : 40,
                height: active ? 54 : 40,
                borderRadius: "50%",
                background: active ? "linear-gradient(135deg,#fde68a,#f59e0b)" : "rgba(255,255,255,.18)",
                border: active ? "2px solid rgba(255,255,255,.7)" : "1px solid rgba(255,255,255,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: active ? 28 : 18,
                transform: active && isPlaying ? "translateY(-10px)" : "none",
                transition: "all 120ms ease-out",
                boxShadow: active ? "0 14px 30px rgba(245,158,11,.3)" : "none",
              }}>
                {active ? "🐛" : index % 2 === 0 ? "•" : "·"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ControlCard({ label, value, children }) {
  return (
    <div style={{
      borderRadius: 24,
      padding: 18,
      background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))",
      border: "1px solid rgba(255,255,255,.12)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,.62)" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#d9f99d" }}>{value}</div>
      </div>
      {children}
    </div>
  );
}

export default function BeatBuilderScreen({ state, derived, actions, onBack }) {
  const dragDropHandledRef = useRef(false);
  const draggedNoteRef = useRef(null);

  function handleProjectRename(event, projectId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("projectName") || "");
    actions.renameProject(projectId, nextName);
  }

  function handleNoteDragStart(event, laneId, noteName, sourceStepIndex = null) {
    dragDropHandledRef.current = false;
    draggedNoteRef.current = sourceStepIndex !== null ? { laneId, noteName, sourceStepIndex } : null;
    if (sourceStepIndex !== null) {
      actions.clearMelodyStep(laneId, sourceStepIndex);
    }
    event.dataTransfer.setData("application/json", JSON.stringify({ laneId, noteName, sourceStepIndex }));
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleMelodyDrop(event, laneId, stepIndex) {
    event.preventDefault();
    dragDropHandledRef.current = true;
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const { noteName, sourceStepIndex } = JSON.parse(raw);
      if (noteName === "__erase__") {
        actions.clearMelodyStep(laneId, stepIndex);
        draggedNoteRef.current = null;
        return;
      }
      if (noteName) {
        actions.setMelodyNote(laneId, stepIndex, noteName);
        draggedNoteRef.current = null;
      }
    } catch {
      // Ignore malformed drag payloads.
    }
  }

  function handlePlacedNoteDragEnd() {
    if (!dragDropHandledRef.current && draggedNoteRef.current) {
      draggedNoteRef.current = null;
    }
    dragDropHandledRef.current = false;
    draggedNoteRef.current = null;
  }

  return (
    <GameLayout
      background="linear-gradient(180deg,#081226 0%,#153e75 44%,#166534 100%)"
      fontFamily="'Fredoka', 'Trebuchet MS', sans-serif"
      padding="20px 16px 32px"
      styleContent={`
        * { box-sizing: border-box; }
        .loop-trail-range { width: 100%; accent-color: #bef264; }
        @media (max-width: 920px) {
          .loop-trail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}
    >
      <GameContainer maxWidth={1200} style={{ width: "100%", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2.2, textTransform: "uppercase", color: "rgba(226,232,240,.72)", marginBottom: 6 }}>
              Loop Trail
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(28px, 5vw, 48px)", color: "#d9f99d" }}>Caterpillar Sequencer</h1>
          </div>
          <button
            onClick={onBack}
            style={{
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(15,23,42,.24)",
              color: "#e2e8f0",
              borderRadius: 999,
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Menu
          </button>
        </div>

        <div className="loop-trail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(320px,.85fr)", gap: 20, alignItems: "start" }}>
          <div style={{
            borderRadius: 30,
            padding: "20px 18px 24px",
            background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.07))",
            border: "1px solid rgba(255,255,255,.14)",
            boxShadow: "0 24px 44px rgba(15,23,42,.22)",
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,.82)", lineHeight: 1.55, marginBottom: 12 }}>
              Build a loop by turning trail squares on and off. Step <span style={{ color: "#fde68a" }}>{derived.activeStepLabel}</span> is the current footfall.
            </div>

            <TrailHeader stepCount={state.stepCount} currentStep={state.currentStep} isPlaying={state.isPlaying} />

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {derived.lanes.map((lane) => (
                <div
                  key={lane.id}
                  style={{
                    borderRadius: 22,
                    padding: "14px 14px 16px",
                    background: "rgba(15,23,42,.18)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{lane.icon}</span>
                      <div>
                        <div style={{ fontSize: 18, color: lane.color }}>{lane.label}</div>
                        <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>
                          {lane.id === "kick" ? "Big step" : lane.id === "snare" ? "Turn marker" : "Sparkle pulse"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.previewLane(lane.id)}
                      style={{
                        border: "1px solid rgba(255,255,255,.14)",
                        background: "rgba(255,255,255,.08)",
                        color: "white",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Hear {lane.label}
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${state.stepCount}, minmax(0,1fr))`, gap: 10 }}>
                    {state.pattern[lane.id].map((active, stepIndex) => {
                      const isCurrentStep = stepIndex === state.currentStep;

                      return (
                        <button
                          key={`${lane.id}-${stepIndex}`}
                          onClick={() => actions.toggleStep(lane.id, stepIndex)}
                          style={{
                            height: 68,
                            borderRadius: 18,
                            border: active ? `2px solid ${lane.color}` : "1px solid rgba(255,255,255,.08)",
                            background: active
                              ? `linear-gradient(180deg, ${lane.color}, rgba(15,23,42,.38))`
                              : isCurrentStep
                                ? "rgba(255,255,255,.14)"
                                : "rgba(255,255,255,.06)",
                            color: active ? "#082f49" : "white",
                            fontSize: 24,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: active && isCurrentStep ? `0 0 0 3px rgba(255,255,255,.18), 0 12px 24px ${lane.color}33` : "none",
                            transition: "all 120ms ease-out",
                          }}
                        >
                          {active ? lane.icon : stepIndex + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {derived.synthLanes.map((lane) => (
                <div
                  key={lane.id}
                  style={{
                    borderRadius: 22,
                    padding: "14px 14px 16px",
                    background: "rgba(15,23,42,.18)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{lane.icon}</span>
                      <div>
                        <div style={{ fontSize: 18, color: lane.color }}>{lane.label} Lane</div>
                        <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>
                          {lane.selectedPatch ? lane.selectedPatch.name : "Choose a saved Sound Garden patch"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.previewPatch(lane.id)}
                      disabled={!lane.selectedPatch}
                      style={{
                        border: "1px solid rgba(255,255,255,.14)",
                        background: lane.selectedPatch ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.04)",
                        color: lane.selectedPatch ? "white" : "rgba(226,232,240,.42)",
                        borderRadius: 999,
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: lane.selectedPatch ? "pointer" : "default",
                      }}
                    >
                      Hear Lane
                    </button>
                  </div>
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                      Octave
                    </label>
                    <select
                      value={lane.octave}
                      onChange={(event) => actions.setLaneOctave(lane.id, Number(event.target.value))}
                      style={{
                        borderRadius: 12,
                        border: `1px solid ${lane.color}66`,
                        background: "rgba(15,23,42,.42)",
                        color: "white",
                        padding: "8px 10px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {derived.octaveOptions.map((octave) => (
                        <option key={`${lane.id}-oct-${octave}`} value={octave}>
                          Octave {octave}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                    {lane.melodyNotes.map((noteName) => (
                      <button
                        key={`${lane.id}-${noteName}`}
                        draggable={!!lane.selectedPatch}
                        onDragStart={(event) => handleNoteDragStart(event, lane.id, noteName)}
                        onClick={() => actions.previewMelodyNote(lane.id, noteName)}
                        style={{
                          borderRadius: 14,
                          border: `1px solid ${lane.color}55`,
                          background: lane.selectedPatch ? `${lane.color}22` : "rgba(255,255,255,.05)",
                          color: lane.selectedPatch ? "#f8fafc" : "rgba(226,232,240,.44)",
                          padding: "10px 8px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: lane.selectedPatch ? "grab" : "default",
                        }}
                      >
                        {noteName}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${state.stepCount}, minmax(0,1fr))`, gap: 10 }}>
                    {lane.steps.map((noteName, stepIndex) => {
                      const isCurrentStep = stepIndex === state.currentStep;
                      return (
                      <button
                        key={`${lane.id}-${stepIndex}`}
                        onClick={() => noteName ? actions.clearMelodyStep(lane.id, stepIndex) : null}
                        draggable={!!noteName}
                        onDragStart={noteName ? (event) => handleNoteDragStart(event, lane.id, noteName, stepIndex) : undefined}
                        onDragEnd={noteName ? () => handlePlacedNoteDragEnd() : undefined}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => handleMelodyDrop(event, lane.id, stepIndex)}
                        style={{
                            height: 68,
                            borderRadius: 18,
                            border: noteName ? `2px solid ${lane.color}` : `1px dashed ${lane.color}66`,
                            background: noteName
                              ? `linear-gradient(180deg, ${lane.color}, rgba(15,23,42,.38))`
                              : isCurrentStep
                                ? "rgba(255,255,255,.14)"
                                : "rgba(255,255,255,.06)",
                            color: noteName ? "#082f49" : "white",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: noteName ? "pointer" : "copy",
                            lineHeight: 1.2,
                          }}
                          title={noteName ? `Click to clear ${noteName}` : "Drop a note here"}
                        >
                          {noteName || "Drop"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {derived.synthLanes.map((lane) => (
              <ControlCard key={`selector-${lane.id}`} label={`${lane.label} Sound`} value={lane.selectedPatch ? lane.selectedPatch.name : "None"}>
                <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <label style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                    Octave
                  </label>
                  <select
                    value={lane.octave}
                    onChange={(event) => actions.setLaneOctave(lane.id, Number(event.target.value))}
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${lane.color}66`,
                      background: "rgba(15,23,42,.42)",
                      color: "white",
                      padding: "8px 10px",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {derived.octaveOptions.map((octave) => (
                      <option key={`selector-${lane.id}-${octave}`} value={octave}>
                        Octave {octave}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {state.savedPatches.length ? state.savedPatches.map((patch) => (
                    <button
                      key={`${lane.id}-${patch.id}`}
                      onClick={() => actions.selectPatch(lane.id, patch.id)}
                      style={{
                        borderRadius: 16,
                        border: lane.patchId === patch.id ? `1px solid ${lane.color}` : "1px solid rgba(255,255,255,.12)",
                        background: lane.patchId === patch.id ? `${lane.color}22` : "rgba(255,255,255,.07)",
                        color: "white",
                        fontSize: 15,
                        fontWeight: 700,
                        padding: "12px 14px",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {patch.name}
                    </button>
                  )) : (
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(226,232,240,.66)" }}>
                      Save patches in Sound Garden first, then return here to give each lane its own sound.
                    </div>
                  )}
                </div>
              </ControlCard>
            ))}
            <ControlCard label="Transport" value={state.isPlaying ? "Playing" : "Stopped"}>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={actions.togglePlayback}
                  style={{
                    flex: 1,
                    border: "none",
                    borderRadius: 16,
                    padding: "14px 14px",
                    background: state.isPlaying ? "linear-gradient(135deg,#fda4af,#fb7185)" : "linear-gradient(135deg,#bef264,#67e8f9)",
                    color: "#082f49",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {state.isPlaying ? "Stop Loop" : "Play Loop"}
                </button>
                <button
                  onClick={actions.clearPattern}
                  style={{
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(255,255,255,.08)",
                    color: "white",
                    borderRadius: 16,
                    padding: "14px 14px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
              </div>
            </ControlCard>

            <ControlCard label="Studio Projects" value={`${derived.savedProjectCount} saved`}>
              <div style={{ display: "grid", gap: 10 }}>
                <button
                  onClick={actions.saveCurrentProject}
                  style={{
                    border: "none",
                    borderRadius: 16,
                    padding: "14px 14px",
                    background: "linear-gradient(135deg,#f9a8d4,#67e8f9)",
                    color: "#082f49",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Current Project
                </button>
                {state.savedProjects.length ? state.savedProjects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      borderRadius: 16,
                      padding: "12px 14px",
                      background: "rgba(255,255,255,.06)",
                      border: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{project.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(226,232,240,.56)" }}>{project.tempo} BPM</div>
                    </div>
                    <form onSubmit={(event) => handleProjectRename(event, project.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <input
                        type="text"
                        name="projectName"
                        defaultValue={project.name}
                        style={{
                          flex: "1 1 160px",
                          minWidth: 0,
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,.12)",
                          background: "rgba(15,23,42,.24)",
                          color: "white",
                          padding: "8px 10px",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,.12)",
                          background: "rgba(255,255,255,.08)",
                          color: "white",
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Rename
                      </button>
                    </form>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => actions.loadProject(project)}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,.12)",
                          background: "rgba(255,255,255,.08)",
                          color: "white",
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => actions.removeProject(project.id)}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(251,113,133,.24)",
                          background: "rgba(251,113,133,.1)",
                          color: "#fecdd3",
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )) : (
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(226,232,240,.66)" }}>
                    Save a full Loop Trail project to keep your drums, lane sounds, octaves, and placed notes together.
                  </div>
                )}
              </div>
            </ControlCard>

            <ControlCard label="Tempo" value={`${state.tempo} BPM`}>
              <input
                className="loop-trail-range"
                type="range"
                min="72"
                max="148"
                step="1"
                value={state.tempo}
                onChange={(event) => actions.setTempo(Number(event.target.value))}
              />
            </ControlCard>

            <ControlCard label="Preset Paths" value={state.activePresetId === "custom" ? "Custom" : state.activePresetId}>
              <div style={{ display: "grid", gap: 10 }}>
                {derived.presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => actions.loadPreset(preset.id)}
                    style={{
                      borderRadius: 16,
                      border: state.activePresetId === preset.id ? "1px solid rgba(217,249,157,.55)" : "1px solid rgba(255,255,255,.12)",
                      background: state.activePresetId === preset.id ? "rgba(217,249,157,.16)" : "rgba(255,255,255,.07)",
                      color: "white",
                      fontSize: 15,
                      fontWeight: 700,
                      padding: "12px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </ControlCard>

            <div style={{
              borderRadius: 24,
              padding: 18,
              background: "linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12))",
              border: "1px solid rgba(255,255,255,.12)",
            }}>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#67e8f9", marginBottom: 10 }}>
                Next Layer
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(226,232,240,.78)" }}>
                This MVP uses three rhythm lanes. The next expansion is to import sounds from Synth Lab and add a melody trail above the beat grid.
              </div>
            </div>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
