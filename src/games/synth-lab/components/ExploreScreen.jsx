import CaterpillarAvatar from "../../shared/caterpillar/CaterpillarAvatar.jsx";
import MissionCard from "../../shared/components/MissionCard.jsx";
import ToolDrawer from "../../shared/components/ToolDrawer.jsx";
import GameContainer from "../../shared/layout/GameContainer.jsx";
import GameLayout from "../../shared/layout/GameLayout.jsx";
import { useState } from "react";

function ControlBlock({ label, valueLabel, children }) {
  return (
    <div style={{
      borderRadius: 22,
      padding: 18,
      background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))",
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "0 14px 28px rgba(15,23,42,.18)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.3, textTransform: "uppercase", color: "rgba(255,255,255,.65)" }}>{label}</div>
        <div style={{ fontSize: 13, color: "#fde68a" }}>{valueLabel}</div>
      </div>
      {children}
    </div>
  );
}

function RangeScale({ leftLabel, rightLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8, fontSize: 12, color: "rgba(226,232,240,.62)" }}>
      <span>{leftLabel}</span>
      <span>{rightLabel}</span>
    </div>
  );
}

function RoleBadge({ roleTag }) {
  if (!roleTag) return null;

  const colorMap = {
    bass: { fg: "#fde68a", bg: "rgba(245,158,11,.14)", border: "rgba(245,158,11,.28)" },
    lead: { fg: "#f9a8d4", bg: "rgba(244,114,182,.14)", border: "rgba(244,114,182,.28)" },
    sparkle: { fg: "#67e8f9", bg: "rgba(103,232,249,.14)", border: "rgba(103,232,249,.28)" },
    pad: { fg: "#86efac", bg: "rgba(134,239,172,.14)", border: "rgba(134,239,172,.28)" },
    weird: { fg: "#c4b5fd", bg: "rgba(196,181,253,.14)", border: "rgba(196,181,253,.28)" },
  };
  const palette = colorMap[roleTag] || { fg: "#e2e8f0", bg: "rgba(255,255,255,.08)", border: "rgba(255,255,255,.14)" };

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "4px 8px",
      fontSize: 11,
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

const ROLE_OPTIONS = [
  { id: "", label: "No Tag" },
  { id: "bass", label: "Bass" },
  { id: "lead", label: "Lead" },
  { id: "sparkle", label: "Sparkle" },
  { id: "pad", label: "Pad" },
  { id: "weird", label: "Weird" },
];

export default function ExploreScreen({ state, derived, actions, onBack }) {
  const visibleControls = new Set(derived.lesson.visibleControls);
  const lessonSelected = Boolean(state.activeLessonId);
  const [lessonListOpen, setLessonListOpen] = useState(false);
  const [soundToolsOpen, setSoundToolsOpen] = useState(true);
  const [savedPatchesOpen, setSavedPatchesOpen] = useState(false);

  function renderLessonButtons() {
    return derived.lessons.map((lesson) => {
      const active = lesson.id === state.activeLessonId;
      const completed = state.completedLessonIds.includes(lesson.id);
      return (
        <button
          key={lesson.id}
          onClick={() => {
            actions.setLesson(lesson.id);
            setLessonListOpen(false);
          }}
          style={{
            textAlign: "left",
            borderRadius: 16,
            border: active ? "1px solid rgba(254,240,138,.5)" : "1px solid rgba(255,255,255,.08)",
            background: active ? "rgba(254,240,138,.16)" : "rgba(255,255,255,.06)",
            color: "white",
            padding: "12px 14px",
            cursor: "pointer",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 16, color: active ? "#fef08a" : "#f8fafc" }}>{lesson.title}</div>
            {completed ? <span style={{ fontSize: 11, color: "#86efac", textTransform: "uppercase", letterSpacing: 1 }}>Done</span> : null}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.74)" }}>{lesson.summary}</div>
        </button>
      );
    });
  }

  function renderSectionToggle(label, open, onToggle, meta) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.06)",
          color: "white",
          padding: "12px 14px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#f9a8d4" }}>
          {label}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {meta ? <span style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>{meta}</span> : null}
          <span style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>{open ? "Hide" : "Show"}</span>
        </div>
      </button>
    );
  }

  function handlePatchRename(event, patchId) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("patchName") || "");
    actions.renamePatch(patchId, nextName);
  }

  return (
    <GameLayout
      background="linear-gradient(180deg,#10203c 0%,#17526a 48%,#67b26f 100%)"
      fontFamily="'Fredoka', 'Trebuchet MS', sans-serif"
      padding="20px 16px 32px"
      styleContent={`
        * { box-sizing: border-box; }
        .synth-lab-range {
          width: 100%;
          accent-color: #fde68a;
        }
        @media (max-width: 860px) {
          .synth-lab-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}
    >
      <GameContainer maxWidth={1180} style={{ width: "100%", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 2.2, textTransform: "uppercase", color: "rgba(226,232,240,.72)", marginBottom: 6 }}>
              Sound Garden
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(28px, 5vw, 48px)", color: "#fef3c7" }}>Synth Lab</h1>
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

        <div className="synth-lab-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(320px,.9fr)", gap: 20, alignItems: "start" }}>
          <div style={{
            borderRadius: 30,
            padding: "22px 18px 26px",
            background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.07))",
            border: "1px solid rgba(255,255,255,.14)",
            boxShadow: "0 24px 44px rgba(15,23,42,.22)",
            overflow: "hidden",
          }}>
            <div style={{ marginBottom: 14, fontSize: 14, color: "rgba(255,255,255,.82)", lineHeight: 1.55 }}>
              {lessonSelected ? (
                <>
                  The current lesson is <span style={{ color: "#fef08a" }}>{derived.lesson.title}</span>. Press notes, then move the controls and listen for what changes.
                </>
              ) : (
                <>
                  You are in free play. Pick a garden mission on the right when you want to focus on one sound change at a time.
                </>
              )}
            </div>

            <CaterpillarAvatar
              oscType={state.patch.oscType}
              brightness={derived.brightness}
              tailGlow={derived.tailGlow}
              snap={derived.snap}
              wavePhase={state.wavePhase}
              waveSpeed={derived.waveSpeed}
              isSinging={state.singing}
              title="Interactive synth caterpillar"
            />

            <div style={{
              marginTop: 12,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(88px, 1fr))",
              gap: 10,
            }}>
              {derived.noteButtons.map((note) => (
                <button
                  key={note}
                  onClick={() => actions.previewNote(note)}
                  style={{
                    border: "none",
                    borderRadius: 18,
                    padding: "14px 12px",
                    background: note === state.lastNote
                      ? "linear-gradient(135deg,#fde68a,#f9a8d4)"
                      : "linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.1))",
                    color: note === state.lastNote ? "#1f2937" : "white",
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: note === state.lastNote ? "0 14px 26px rgba(250,204,21,.22)" : "none",
                  }}
                >
                  {note}
                </button>
              ))}
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                Preview Octave
              </span>
              <select
                value={state.octave}
                onChange={(event) => actions.setOctave(Number(event.target.value))}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,.14)",
                  background: "rgba(15,23,42,.24)",
                  color: "white",
                  padding: "8px 10px",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {derived.octaveOptions.map((octave) => (
                  <option key={`synth-lab-oct-${octave}`} value={octave}>
                    Octave {octave}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              marginTop: 14,
              borderRadius: 20,
              padding: "14px 16px",
              background: "rgba(15,23,42,.2)",
              border: "1px solid rgba(255,255,255,.1)",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <div style={{ fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: "rgba(255,255,255,.58)", marginBottom: 4 }}>
                  Patch Readout
                </div>
                <div style={{ fontSize: 16, color: "#fef08a" }}>
                  {derived.shapeLabel} voice, brightness {Math.round(derived.brightness * 100)}%, tail {Math.round(derived.tailGlow * 100)}%, snap {Math.round(derived.snap * 100)}%, air {Math.round(derived.air * 100)}%, wiggle {Math.round(derived.wiggle * 100)}%
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                      Patch Name
                    </span>
                    <input
                      type="text"
                      value={state.draftPatchName}
                      onChange={(event) => actions.setDraftPatchName(event.target.value)}
                      placeholder={derived.suggestedPatchName}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,.12)",
                        background: "rgba(15,23,42,.24)",
                        color: "white",
                        padding: "10px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    />
                  </label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(226,232,240,.62)" }}>
                      Patch Role
                    </span>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {ROLE_OPTIONS.map((role) => {
                        const active = state.draftRoleTag === role.id;
                        return (
                          <button
                            key={role.id || "none"}
                            type="button"
                            onClick={() => actions.setDraftRoleTag(role.id)}
                            style={{
                              borderRadius: 999,
                              border: active ? "1px solid rgba(254,240,138,.5)" : "1px solid rgba(255,255,255,.12)",
                              background: active ? "rgba(254,240,138,.16)" : "rgba(255,255,255,.06)",
                              color: active ? "#fef08a" : "white",
                              padding: "8px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {role.label}
                          </button>
                        );
                      })}
                    </div>
                  </label>
                </div>
              </div>
              <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                <button
                  onClick={actions.resetPatch}
                  style={{
                    border: "1px solid rgba(255,255,255,.16)",
                    background: "rgba(255,255,255,.08)",
                    color: "white",
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset Patch
                </button>
                <button
                  onClick={actions.saveCurrentPatch}
                  style={{
                    border: "1px solid rgba(254,240,138,.28)",
                    background: "rgba(254,240,138,.12)",
                    color: "#fef08a",
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save Patch
                </button>
              </div>
            </div>

            {state.lastSavedPatchName ? (
              <div style={{
                marginTop: 12,
                borderRadius: 16,
                padding: "12px 14px",
                background: "rgba(134,239,172,.12)",
                border: "1px solid rgba(134,239,172,.24)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "#dcfce7" }}>
                  Saved <span style={{ color: "#fef08a" }}>{state.lastSavedPatchName}</span>. It is now in More Sound Tools.
                </div>
                <button
                  onClick={actions.clearSavedPatchNotice}
                  style={{
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(255,255,255,.08)",
                    color: "white",
                    borderRadius: 12,
                    padding: "8px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            {lessonSelected ? (
              <MissionCard
                eyebrow="Garden Mission"
                title={derived.lesson.title}
                goal={derived.lesson.goal}
                prompt={derived.lesson.prompt}
                successText={derived.lesson.successText}
                accent="#86efac"
                actions={(
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>
                      Completed {derived.completedLessonCount}/{derived.lessons.length}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setLessonListOpen((current) => !current)}
                        style={{
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,.12)",
                          background: "rgba(255,255,255,.08)",
                          color: "white",
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {lessonListOpen ? "Hide Missions" : "Choose Mission"}
                      </button>
                      <button
                        onClick={actions.completeLesson}
                        style={{
                          borderRadius: 14,
                          border: derived.lessonIsComplete ? "1px solid rgba(134,239,172,.35)" : "1px solid rgba(254,240,138,.28)",
                          background: derived.lessonIsComplete ? "rgba(134,239,172,.14)" : "rgba(254,240,138,.12)",
                          color: derived.lessonIsComplete ? "#86efac" : "#fef08a",
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {derived.lessonIsComplete ? "Completed" : "Complete Mission"}
                      </button>
                    </div>
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
                    <span style={{ color: derived.lessonProgress.complete ? "#86efac" : "#fef08a" }}>{derived.lessonProgress.summary}</span>
                  </div>
                  {lessonListOpen ? renderLessonButtons() : null}
                </div>
              )}
            />
            ) : (
              <div style={{
                borderRadius: 24,
                padding: 20,
                background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.06))",
                border: "1px solid rgba(255,255,255,.12)",
                boxShadow: "0 18px 34px rgba(15,23,42,.18)",
                display: "grid",
                gap: 12,
              }}>
                <div style={{ fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase", color: "rgba(226,232,240,.7)" }}>
                  Garden Missions
                </div>
                <div style={{ fontSize: 24, color: "#fef3c7", fontWeight: 700 }}>
                  Free Play
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(226,232,240,.8)" }}>
                  You already finished at least one mission. Pick any mission below when you want guided play again.
                </div>
                <div style={{ fontSize: 12, color: "rgba(226,232,240,.72)" }}>
                  Completed {derived.completedLessonCount}/{derived.lessons.length}
                </div>
                <button
                  onClick={() => setLessonListOpen((current) => !current)}
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(255,255,255,.08)",
                    color: "white",
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {lessonListOpen ? "Hide Missions" : "Show Missions"}
                </button>
                {lessonListOpen ? renderLessonButtons() : null}
              </div>
            )}

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

            {visibleControls.has("oscType") ? (
              <ControlBlock label="Voice Shape" valueLabel={derived.shapeLabel}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Hear Shape
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                  {["sine", "triangle", "square", "sawtooth"].map((type) => {
                    const active = state.patch.oscType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => actions.updatePatch("oscType", type)}
                        style={{
                          borderRadius: 16,
                          padding: "12px 10px",
                          border: active ? "1px solid rgba(254,240,138,.65)" : "1px solid rgba(255,255,255,.12)",
                          background: active ? "rgba(254,240,138,.16)" : "rgba(255,255,255,.07)",
                          color: "white",
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: "pointer",
                          textTransform: "capitalize",
                        }}
                      >
                        {type === "sawtooth" ? "Saw" : type}
                      </button>
                    );
                  })}
                </div>
              </ControlBlock>
            ) : null}

            {visibleControls.has("cutoff") ? (
              <ControlBlock label="Brightness" valueLabel={`${Math.round(derived.brightness * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Opens the glow, warms the color, and lights the back petals.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="240"
                  max="4200"
                  step="10"
                  value={state.patch.cutoff}
                  onChange={(event) => actions.updatePatch("cutoff", Number(event.target.value))}
                />
                <RangeScale leftLabel="Dark" rightLabel="Bright" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("release") ? (
              <ControlBlock label="Tail Length" valueLabel={`${Math.round(derived.tailGlow * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Grows more body segments down the trail and stretches the waveform across the caterpillar.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0.08"
                  max="1.1"
                  step="0.01"
                  value={state.patch.release}
                  onChange={(event) => actions.updatePatch("release", Number(event.target.value))}
                />
                <RangeScale leftLabel="Short" rightLabel="Long" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("attack") ? (
              <ControlBlock label="Snap" valueLabel={`${Math.round(derived.snap * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Sharp attacks tighten the body and make the mouth burst crisp. Softer attacks spread the sound ring out.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0.01"
                  max="0.3"
                  step="0.01"
                  value={state.patch.attack}
                  onChange={(event) => actions.updatePatch("attack", Number(event.target.value))}
                />
                <RangeScale leftLabel="Sharp" rightLabel="Soft" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("resonance") ? (
              <ControlBlock label="Ring" valueLabel={`${Math.round(derived.resonance * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Adds a ringing edge around the note. Lower values stay plain. Higher values zing and whistle more.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0.6"
                  max="12"
                  step="0.1"
                  value={state.patch.resonance}
                  onChange={(event) => actions.updatePatch("resonance", Number(event.target.value))}
                />
                <RangeScale leftLabel="Plain" rightLabel="Ringy" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("noiseMix") ? (
              <ControlBlock label="Air" valueLabel={`${Math.round(derived.air * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Adds whispery wind around the note. Lower values stay clean. Higher values feel airy and dusty.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0"
                  max="0.55"
                  step="0.01"
                  value={state.patch.noiseMix}
                  onChange={(event) => actions.updatePatch("noiseMix", Number(event.target.value))}
                />
                <RangeScale leftLabel="Clean" rightLabel="Airy" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("lfoDepth") ? (
              <ControlBlock label="Wiggle" valueLabel={`${Math.round(derived.wiggle * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Adds motion to the sound. Lower values stay still. Higher values sway and wobble more.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={state.patch.lfoDepth}
                  onChange={(event) => actions.updatePatch("lfoDepth", Number(event.target.value))}
                />
                <RangeScale leftLabel="Still" rightLabel="Wiggly" />
              </ControlBlock>
            ) : null}

            {visibleControls.has("lfoRate") ? (
              <ControlBlock label="Wiggle Speed" valueLabel={`${Math.round(derived.wiggleRate * 100)}%`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    onClick={() => actions.previewNote(state.lastNote)}
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
                    Play Sound
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "rgba(226,232,240,.72)", lineHeight: 1.5, marginBottom: 10 }}>
                  Keeps the motion, but changes how quickly it moves. Lower values drift. Higher values shimmer.
                </div>
                <input
                  className="synth-lab-range"
                  type="range"
                  min="0.2"
                  max="8"
                  step="0.1"
                  value={state.patch.lfoRate}
                  onChange={(event) => actions.updatePatch("lfoRate", Number(event.target.value))}
                />
                <RangeScale leftLabel="Slow" rightLabel="Fast" />
              </ControlBlock>
            ) : null}

            <ToolDrawer
              title="More Sound Tools"
              hint="Open this when you want patch management and previously learned controls in one place."
              accent="#f9a8d4"
              open={state.drawerOpen}
              onToggle={actions.toggleDrawer}
            >
              <div style={{ display: "grid", gap: 16 }}>
                {renderSectionToggle("Sound Tools", soundToolsOpen, () => setSoundToolsOpen((current) => !current))}
                {soundToolsOpen ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    {!visibleControls.has("oscType") ? (
                      <ControlBlock label="Voice Shape" valueLabel={derived.shapeLabel}>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                          <button
                            onClick={() => actions.previewNote(state.lastNote)}
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
                            Hear Shape
                          </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                          {["sine", "triangle", "square", "sawtooth"].map((type) => {
                            const active = state.patch.oscType === type;
                            return (
                              <button
                                key={`drawer-${type}`}
                                onClick={() => actions.updatePatch("oscType", type)}
                                style={{
                                  borderRadius: 16,
                                  padding: "12px 10px",
                                  border: active ? "1px solid rgba(254,240,138,.65)" : "1px solid rgba(255,255,255,.12)",
                                  background: active ? "rgba(254,240,138,.16)" : "rgba(255,255,255,.07)",
                                  color: "white",
                                  fontSize: 15,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  textTransform: "capitalize",
                                }}
                              >
                                {type === "sawtooth" ? "Saw" : type}
                              </button>
                            );
                          })}
                        </div>
                      </ControlBlock>
                    ) : null}

                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      position: "sticky",
                      top: 12,
                      zIndex: 2,
                      paddingTop: 4,
                      paddingBottom: 4,
                      marginBottom: -4,
                    }}>
                      <button
                        onClick={() => actions.previewNote(state.lastNote)}
                        style={{
                          border: "1px solid rgba(255,255,255,.14)",
                          background: "rgba(15,23,42,.88)",
                          boxShadow: "0 10px 24px rgba(15,23,42,.28)",
                          backdropFilter: "blur(10px)",
                          color: "white",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Play Sound
                      </button>
                    </div>

                    {!visibleControls.has("cutoff") ? (
                      <ControlBlock label="Brightness" valueLabel={`${Math.round(derived.brightness * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="240"
                          max="4200"
                          step="10"
                          value={state.patch.cutoff}
                          onChange={(event) => actions.updatePatch("cutoff", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Dark" rightLabel="Bright" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("release") ? (
                      <ControlBlock label="Tail Length" valueLabel={`${Math.round(derived.tailGlow * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0.08"
                          max="1.1"
                          step="0.01"
                          value={state.patch.release}
                          onChange={(event) => actions.updatePatch("release", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Short" rightLabel="Long" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("attack") ? (
                      <ControlBlock label="Snap" valueLabel={`${Math.round(derived.snap * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0.01"
                          max="0.3"
                          step="0.01"
                          value={state.patch.attack}
                          onChange={(event) => actions.updatePatch("attack", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Sharp" rightLabel="Soft" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("resonance") ? (
                      <ControlBlock label="Ring" valueLabel={`${Math.round(derived.resonance * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0.6"
                          max="12"
                          step="0.1"
                          value={state.patch.resonance}
                          onChange={(event) => actions.updatePatch("resonance", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Plain" rightLabel="Ringy" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("noiseMix") ? (
                      <ControlBlock label="Air" valueLabel={`${Math.round(derived.air * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0"
                          max="0.55"
                          step="0.01"
                          value={state.patch.noiseMix}
                          onChange={(event) => actions.updatePatch("noiseMix", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Clean" rightLabel="Airy" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("lfoDepth") ? (
                      <ControlBlock label="Wiggle" valueLabel={`${Math.round(derived.wiggle * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={state.patch.lfoDepth}
                          onChange={(event) => actions.updatePatch("lfoDepth", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Still" rightLabel="Wiggly" />
                      </ControlBlock>
                    ) : null}

                    {!visibleControls.has("lfoRate") ? (
                      <ControlBlock label="Wiggle Speed" valueLabel={`${Math.round(derived.wiggleRate * 100)}%`}>
                        <input
                          className="synth-lab-range"
                          type="range"
                          min="0.2"
                          max="8"
                          step="0.1"
                          value={state.patch.lfoRate}
                          onChange={(event) => actions.updatePatch("lfoRate", Number(event.target.value))}
                        />
                        <RangeScale leftLabel="Slow" rightLabel="Fast" />
                      </ControlBlock>
                    ) : null}

                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      position: "sticky",
                      bottom: 12,
                      zIndex: 2,
                      paddingTop: 8,
                    }}>
                      <button
                        onClick={() => actions.previewNote(state.lastNote)}
                        style={{
                          border: "1px solid rgba(255,255,255,.14)",
                          background: "rgba(15,23,42,.92)",
                          boxShadow: "0 10px 24px rgba(15,23,42,.28)",
                          backdropFilter: "blur(10px)",
                          color: "white",
                          borderRadius: 999,
                          padding: "10px 14px",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Play Sound
                      </button>
                    </div>
                  </div>
                ) : null}

                {renderSectionToggle("Saved Garden Patches", savedPatchesOpen, () => setSavedPatchesOpen((current) => !current), `${derived.savedPatchCount}/8`)}
                {savedPatchesOpen ? (
                  <div style={{
                    borderRadius: 18,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.08)",
                  }}>
                    <div style={{ display: "grid", gap: 10 }}>
                      {state.savedPatches.length ? state.savedPatches.map((patchRecord) => (
                        <div
                          key={patchRecord.id}
                          style={{
                            borderRadius: 18,
                            padding: "14px 16px",
                            background: "rgba(255,255,255,.06)",
                            border: "1px solid rgba(255,255,255,.08)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <div style={{ fontSize: 16, color: "#fef08a" }}>{patchRecord.name}</div>
                              <RoleBadge roleTag={patchRecord.roleTag} />
                            </div>
                            <div style={{ fontSize: 12, color: "rgba(226,232,240,.58)" }}>{patchRecord.note}</div>
                          </div>
                          <form onSubmit={(event) => handlePatchRename(event, patchRecord.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                            <input
                              type="text"
                              name="patchName"
                              defaultValue={patchRecord.name}
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
                              onClick={() => actions.loadPatch(patchRecord)}
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
                              onClick={() => actions.previewSavedPatch(patchRecord)}
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
                              Hear
                            </button>
                            <button
                              onClick={() => actions.deletePatch(patchRecord.id)}
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
                          Save a patch here, then open Loop Trail and use it in the melody lane.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </ToolDrawer>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
