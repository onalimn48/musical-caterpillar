import { useRef } from "react";
import MissionCard from "../../shared/components/MissionCard.jsx";
import GameContainer from "../../shared/layout/GameContainer.jsx";
import GameLayout from "../../shared/layout/GameLayout.jsx";
import LaneInspector from "./LaneInspector.jsx";
import StepBadgeMenu from "./StepBadgeMenu.jsx";

function TrailHeader({ stepCount, currentStep, isPlaying }) {
  return (
    <div style={{ position: "relative", padding: "10px 14px 4px" }}>
      <div style={{
        position: "absolute",
        left: 34,
        right: 34,
        top: 46,
        height: 12,
        borderRadius: 999,
        background: "linear-gradient(90deg, rgba(190,242,100,.32), rgba(103,232,249,.32))",
      }} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${stepCount}, minmax(0,1fr))`, gap: 10, alignItems: "end" }}>
        {Array.from({ length: stepCount }).map((_, index) => {
          const active = index === currentStep;
          return (
            <div key={index} style={{ display: "flex", justifyContent: "center", height: 54 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: active ? "linear-gradient(135deg,#fde68a,#f59e0b)" : "rgba(255,255,255,.18)",
                border: active ? "2px solid rgba(255,255,255,.7)" : "1px solid rgba(255,255,255,.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: active ? 26 : 18,
                transform: active
                  ? `translateY(${isPlaying ? "-8px" : "-4px"}) scale(${isPlaying ? 1.18 : 1.1})`
                  : "translateY(0) scale(1)",
                transition: "transform 45ms linear, background-color 45ms linear, box-shadow 45ms linear, border-color 45ms linear",
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

  function handleNoteDragStart(event, laneId, stepData, sourceStepIndex = null) {
    dragDropHandledRef.current = false;
    draggedNoteRef.current = sourceStepIndex !== null ? { laneId, stepData, sourceStepIndex } : null;
    if (sourceStepIndex !== null) {
      actions.clearMelodyStep(laneId, sourceStepIndex);
    }
    event.dataTransfer.setData("application/json", JSON.stringify({ laneId, stepData, sourceStepIndex }));
    event.dataTransfer.effectAllowed = "copy";
  }

  function handleMelodyDrop(event, laneId, stepIndex) {
    event.preventDefault();
    dragDropHandledRef.current = true;
    const raw = event.dataTransfer.getData("application/json");
    if (!raw) return;
    try {
      const { stepData } = JSON.parse(raw);
      if (stepData?.noteName === "__erase__") {
        actions.clearMelodyStep(laneId, stepIndex);
        draggedNoteRef.current = null;
        return;
      }
      if (stepData?.noteName) {
        actions.setMelodyStep(laneId, stepIndex, stepData);
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

        <div className="loop-trail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.24fr) minmax(280px,.76fr)", gap: 20, alignItems: "start" }}>
          <div style={{
            borderRadius: 30,
            padding: "20px 18px 24px",
            background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.07))",
            border: "1px solid rgba(255,255,255,.14)",
            boxShadow: "0 24px 44px rgba(15,23,42,.22)",
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,.82)", lineHeight: 1.55, marginBottom: 12 }}>
              Build a loop by turning trail squares on and off. {derived.activeSectionLabel} section, step <span style={{ color: "#fde68a" }}>{derived.activeStepLabel}</span> is the current footfall.
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: 10,
              marginBottom: 14,
            }}>
              {derived.arrangementSections.map((section) => (
                <div
                  key={`top-${section.label}`}
                  style={{
                    borderRadius: 18,
                    padding: "12px 12px",
                    background: section.active
                      ? "linear-gradient(135deg, rgba(103,232,249,.24), rgba(190,242,100,.18))"
                      : "rgba(15,23,42,.22)",
                    border: section.active ? "1px solid rgba(103,232,249,.5)" : "1px solid rgba(255,255,255,.08)",
                    boxShadow: section.active ? "0 12px 26px rgba(103,232,249,.18)" : "none",
                  }}
                >
                  <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: section.active ? "#67e8f9" : "rgba(226,232,240,.56)", marginBottom: 4 }}>
                    {section.label}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>
                      Loop {section.variantId}
                    </div>
                    {section.active ? (
                      <span style={{ fontSize: 11, color: "#d9f99d", textTransform: "uppercase", letterSpacing: 1 }}>
                        Playing
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {derived.variantOptions.map((variantId) => (
                <button
                  key={variantId}
                  onClick={() => actions.selectVariant(variantId)}
                  style={{
                    borderRadius: 999,
                    border: state.activeVariantId === variantId ? "1px solid rgba(217,249,157,.6)" : "1px solid rgba(255,255,255,.12)",
                    background: state.activeVariantId === variantId ? "rgba(217,249,157,.18)" : "rgba(255,255,255,.06)",
                    color: state.activeVariantId === variantId ? "#d9f99d" : "white",
                    padding: "9px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Edit Loop {variantId}
                </button>
              ))}
            </div>

            <TrailHeader stepCount={state.stepCount} currentStep={state.currentStep} isPlaying={state.isPlaying} />

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {derived.drumLanes.map((lane) => (
                <div
                  key={lane.id}
                  onClick={() => actions.selectLane(lane.id)}
                  style={{
                    borderRadius: 22,
                    padding: "14px 14px 16px",
                    background: state.selectedLaneId === lane.id ? "rgba(217,249,157,.12)" : "rgba(15,23,42,.18)",
                    border: state.selectedLaneId === lane.id ? `1px solid ${lane.color}` : "1px solid rgba(255,255,255,.08)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, paddingRight: 0 }}>
                      <span style={{ fontSize: 24 }}>{lane.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 18, color: lane.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lane.label}</div>
                        <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>
                          {lane.id === "kick" ? "Big step" : lane.id === "snare" ? "Turn marker" : "Sparkle pulse"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ borderRadius: 999, padding: "4px 8px", background: "rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.78)" }}>
                        {lane.shapeLabel}
                      </span>
                      <span style={{ borderRadius: 999, padding: "4px 8px", background: "rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.78)" }}>
                        Bright {Math.round(lane.brightness * 100)}%
                      </span>
                      <span style={{ borderRadius: 999, padding: "4px 8px", background: "rgba(255,255,255,.08)", fontSize: 11, color: "rgba(255,255,255,.78)" }}>
                        Tail {Math.round(lane.tailGlow * 100)}%
                      </span>
                    </div>
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
                            transition: "background-color 45ms linear, box-shadow 45ms linear, border-color 45ms linear",
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
                  onClick={() => actions.selectLane(lane.id)}
                  style={{
                    borderRadius: 22,
                    padding: "14px 14px 16px",
                    background: state.selectedLaneId === lane.id ? `${lane.color}18` : "rgba(15,23,42,.18)",
                    border: state.selectedLaneId === lane.id ? `1px solid ${lane.color}` : "1px solid rgba(255,255,255,.08)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 24 }}>{lane.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 18, color: lane.color }}>{lane.label} Lane</div>
                        <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>
                          {lane.selectedPatch ? lane.selectedPatch.name : "Choose a saved Sound Garden patch"}
                        </div>
                      </div>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                        Octave
                      </span>
                      <select
                        value={lane.octave}
                        onClick={(event) => event.stopPropagation()}
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
                          <option key={`${lane.id}-inline-oct-${octave}`} value={octave}>
                            Octave {octave}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginLeft: "auto" }}>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          actions.previewPatch(lane.id);
                        }}
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
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          actions.selectLane(lane.id);
                        }}
                        style={{
                          border: `1px solid ${lane.color}66`,
                          background: state.selectedLaneId === lane.id ? `${lane.color}22` : "rgba(255,255,255,.06)",
                          color: "white",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {state.selectedLaneId === lane.id ? "Editing Lane" : "Edit Lane"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
                    {lane.melodyNotes.map((noteName) => (
                      <button
                        key={`${lane.id}-${noteName}`}
                        draggable={!!lane.selectedPatch}
                        onDragStart={(event) => handleNoteDragStart(event, lane.id, { noteName, gate: "medium", accent: false })}
                        onClick={(event) => {
                          event.stopPropagation();
                          actions.previewMelodyNote(lane.id, noteName);
                        }}
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
                    {lane.steps.map((step, stepIndex) => {
                      const isCurrentStep = stepIndex === state.currentStep;
                      const noteName = step?.noteName || null;
                      return (
                        <div
                          key={`${lane.id}-${stepIndex}`}
                          draggable={!!noteName}
                          onDragStart={noteName ? (event) => handleNoteDragStart(event, lane.id, step, stepIndex) : undefined}
                          onDragEnd={noteName ? () => handlePlacedNoteDragEnd() : undefined}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleMelodyDrop(event, lane.id, stepIndex)}
                          style={{
                            minHeight: 82,
                            borderRadius: 18,
                            border: noteName ? `2px solid ${lane.color}` : `1px dashed ${lane.color}66`,
                            background: noteName
                              ? `linear-gradient(180deg, ${lane.color}, rgba(15,23,42,.3))`
                              : isCurrentStep
                                ? "rgba(255,255,255,.14)"
                                : "rgba(255,255,255,.06)",
                            color: noteName ? "#082f49" : "white",
                            lineHeight: 1.2,
                            padding: "8px 6px",
                            boxShadow: noteName
                              ? isCurrentStep
                                ? `0 0 0 3px rgba(255,255,255,.18), 0 12px 24px ${lane.color}33`
                                : `0 10px 22px ${lane.color}22`
                              : "none",
                            transition: "background-color 45ms linear, box-shadow 45ms linear, border-color 45ms linear",
                          }}
                          title={noteName ? `Click to clear ${noteName}` : "Drop a note here"}
                        >
                          <button
                            onClick={() => noteName ? actions.clearMelodyStep(lane.id, stepIndex) : null}
                            style={{
                              width: "100%",
                              minHeight: noteName ? 30 : 64,
                              border: "none",
                              background: "transparent",
                              color: noteName ? "#082f49" : "white",
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: noteName ? "pointer" : "copy",
                            }}
                          >
                            {noteName || "Drop"}
                          </button>
                          {noteName ? (
                            <StepBadgeMenu
                              laneColor={lane.color}
                              step={step}
                              onToggleAccent={() => actions.toggleMelodyAccent(lane.id, stepIndex)}
                              onCycleGate={() => actions.cycleMelodyGate(lane.id, stepIndex)}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <MissionCard
              eyebrow="Trail Mission"
              title={derived.lesson.title}
              goal={derived.lesson.goal}
              prompt={derived.lesson.prompt}
              successText={derived.lesson.successText}
              accent="#67e8f9"
              actions={(
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>
                      Completed {derived.completedLessonCount}/{derived.lessons.length}
                    </div>
                    <button
                      onClick={actions.completeLesson}
                      style={{
                        borderRadius: 14,
                        border: derived.lessonIsComplete ? "1px solid rgba(134,239,172,.35)" : "1px solid rgba(103,232,249,.28)",
                        background: derived.lessonIsComplete ? "rgba(134,239,172,.14)" : "rgba(103,232,249,.12)",
                        color: derived.lessonIsComplete ? "#86efac" : "#67e8f9",
                        padding: "8px 12px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {derived.lessonIsComplete ? "Completed" : "Complete Mission"}
                    </button>
                  </div>
                  <div style={{
                    borderRadius: 14,
                    padding: "10px 12px",
                    background: derived.lessonProgress.complete ? "rgba(134,239,172,.12)" : "rgba(255,255,255,.06)",
                    border: derived.lessonProgress.complete ? "1px solid rgba(134,239,172,.22)" : "1px solid rgba(255,255,255,.08)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: derived.lessonProgress.complete ? "#dcfce7" : "rgba(226,232,240,.78)",
                  }}>
                    {derived.lessonProgress.complete ? "Ready to complete: " : "Success check: "}
                    <span style={{ color: derived.lessonProgress.complete ? "#86efac" : "#67e8f9" }}>{derived.lessonProgress.summary}</span>
                  </div>
                  {derived.lessons.map((lesson) => {
                    const active = lesson.id === state.activeLessonId;
                    const completed = state.completedLessonIds.includes(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => actions.setLesson(lesson.id)}
                        style={{
                          textAlign: "left",
                          borderRadius: 16,
                          border: active ? "1px solid rgba(103,232,249,.48)" : "1px solid rgba(255,255,255,.08)",
                          background: active ? "rgba(103,232,249,.14)" : "rgba(255,255,255,.06)",
                          color: "white",
                          padding: "12px 14px",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 4 }}>
                          <div style={{ fontSize: 16, color: active ? "#67e8f9" : "#f8fafc" }}>{lesson.title}</div>
                          {completed ? <span style={{ fontSize: 11, color: "#86efac", textTransform: "uppercase", letterSpacing: 1 }}>Done</span> : null}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.74)" }}>{lesson.summary}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            />

            {state.lessonToast ? (
              <div style={{
                borderRadius: 16,
                padding: "12px 14px",
                background: "rgba(134,239,172,.12)",
                border: "1px solid rgba(134,239,172,.24)",
                color: "#dcfce7",
                fontSize: 14,
                lineHeight: 1.5,
              }}>
                {state.lessonToast}
              </div>
            ) : null}

            <ControlCard
              label="Lane Inspector"
              value={derived.selectedLane ? derived.selectedLane.label : "None"}
            >
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.72)", marginBottom: 12 }}>
                Select a drum or melody lane from the grid to edit its tools here. Melody lanes show octave and patch choice.
              </div>
              <LaneInspector
                lane={derived.selectedLane}
                actions={actions}
                octaveOptions={derived.octaveOptions}
                savedPatches={state.savedPatches}
              />
            </ControlCard>

            <ControlCard label="Song Builder" value={derived.playbackModeLabel}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.72)" }}>
                  Build two loop versions, then choose which one plays in the start, middle, and end of the tiny song path.
                </div>
                <div style={{
                  borderRadius: 18,
                  padding: "12px 14px",
                  background: "rgba(15,23,42,.2)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}>
                  <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.56)", marginBottom: 8 }}>
                    Song Story
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
                    {derived.arrangementSections.map((section) => (
                      <div
                        key={`story-${section.label}`}
                        style={{
                          borderRadius: 14,
                          padding: "10px 10px",
                          background: section.active ? "rgba(103,232,249,.14)" : "rgba(255,255,255,.05)",
                          border: section.active ? "1px solid rgba(103,232,249,.4)" : "1px solid rgba(255,255,255,.08)",
                        }}
                      >
                        <div style={{ fontSize: 12, color: section.active ? "#67e8f9" : "rgba(226,232,240,.62)", marginBottom: 4 }}>
                          {section.label}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: section.variantId === "A" ? "#d9f99d" : "#f9a8d4" }}>
                          Loop {section.variantId}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 8,
                  padding: 8,
                  borderRadius: 18,
                  background: "rgba(15,23,42,.2)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}>
                  <button
                    onClick={() => actions.setPlaybackMode("variant", "A")}
                    style={{
                      borderRadius: 14,
                      border: state.playbackMode === "variant" && state.playbackVariantId === "A" ? "1px solid rgba(217,249,157,.6)" : "1px solid rgba(255,255,255,.12)",
                      background: state.playbackMode === "variant" && state.playbackVariantId === "A" ? "rgba(217,249,157,.18)" : "rgba(255,255,255,.06)",
                      color: state.playbackMode === "variant" && state.playbackVariantId === "A" ? "#d9f99d" : "white",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Hear Loop A
                  </button>
                  <button
                    onClick={() => actions.setPlaybackMode("variant", "B")}
                    style={{
                      borderRadius: 14,
                      border: state.playbackMode === "variant" && state.playbackVariantId === "B" ? "1px solid rgba(249,168,212,.6)" : "1px solid rgba(255,255,255,.12)",
                      background: state.playbackMode === "variant" && state.playbackVariantId === "B" ? "rgba(249,168,212,.18)" : "rgba(255,255,255,.06)",
                      color: state.playbackMode === "variant" && state.playbackVariantId === "B" ? "#f9a8d4" : "white",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Hear Loop B
                  </button>
                  <button
                    onClick={() => actions.setPlaybackMode("arrangement")}
                    style={{
                      borderRadius: 14,
                      border: state.playbackMode === "arrangement" ? "1px solid rgba(103,232,249,.6)" : "1px solid rgba(255,255,255,.12)",
                      background: state.playbackMode === "arrangement" ? "rgba(103,232,249,.18)" : "rgba(255,255,255,.06)",
                      color: state.playbackMode === "arrangement" ? "#67e8f9" : "white",
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Hear Full Song
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => actions.copyVariant("A", "B")}
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
                    Copy A Into B
                  </button>
                  <button
                    onClick={() => actions.copyVariant("B", "A")}
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
                    Copy B Into A
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)", lineHeight: 1.5 }}>
                    Song order. Click each part to switch between Loop A and Loop B.
                  </div>
                  {derived.arrangementSections.map((section) => (
                    <button
                      key={section.label}
                      onClick={() => actions.cycleArrangementSection(section.index)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        borderRadius: 16,
                        border: section.active ? "1px solid rgba(103,232,249,.48)" : "1px solid rgba(255,255,255,.1)",
                        background: section.active ? "rgba(103,232,249,.14)" : "rgba(255,255,255,.06)",
                        color: "white",
                        padding: "12px 14px",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{section.label}</span>
                        <span style={{ fontSize: 11, color: "rgba(226,232,240,.62)" }}>Click to switch</span>
                      </span>
                      <span style={{
                        borderRadius: 999,
                        padding: "4px 9px",
                        background: "rgba(15,23,42,.26)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: section.variantId === "A" ? "#d9f99d" : "#f9a8d4",
                      }}>
                        Loop {section.variantId}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </ControlCard>

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
                Studio Flow
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(226,232,240,.78)" }}>
                Build your groove on the grid, select a lane in the inspector, then shape its sound or patch before returning to the trail.
              </div>
            </div>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
