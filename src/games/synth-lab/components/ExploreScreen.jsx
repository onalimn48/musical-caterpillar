import CaterpillarAvatar from "../../shared/caterpillar/CaterpillarAvatar.jsx";
import GameContainer from "../../shared/layout/GameContainer.jsx";
import GameLayout from "../../shared/layout/GameLayout.jsx";
import { LESSON_CARDS } from "../state/initialState.js";

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

export default function ExploreScreen({ state, derived, actions, onBack }) {
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
              The current lesson is <span style={{ color: "#fef08a" }}>{derived.lesson.title}</span>. Press notes, then move the controls and listen for what changes.
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
              <div>
                <div style={{ fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: "rgba(255,255,255,.58)", marginBottom: 4 }}>
                  Patch Readout
                </div>
                <div style={{ fontSize: 16, color: "#fef08a" }}>
                  {derived.shapeLabel} voice, brightness {Math.round(derived.brightness * 100)}%, tail {Math.round(derived.tailGlow * 100)}%, snap {Math.round(derived.snap * 100)}%
                </div>
              </div>
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

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{
              borderRadius: 26,
              padding: 18,
              background: "linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12))",
              border: "1px solid rgba(255,255,255,.12)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, alignItems: "center" }}>
                <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#f9a8d4" }}>
                  Saved Garden Patches
                </div>
                <div style={{ fontSize: 12, color: "rgba(226,232,240,.62)" }}>{derived.savedPatchCount}/8</div>
              </div>
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
                      <div style={{ fontSize: 16, color: "#fef08a" }}>{patchRecord.name}</div>
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
            <div style={{
              borderRadius: 26,
              padding: 18,
              background: "linear-gradient(180deg, rgba(15,23,42,.28), rgba(15,23,42,.12))",
              border: "1px solid rgba(255,255,255,.12)",
            }}>
              <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#86efac", marginBottom: 10 }}>
                Garden Lessons
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {LESSON_CARDS.map((lesson) => {
                  const active = lesson.id === state.activeLessonId;
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => actions.setLesson(lesson.id)}
                      style={{
                        textAlign: "left",
                        borderRadius: 18,
                        border: active ? "1px solid rgba(254,240,138,.5)" : "1px solid rgba(255,255,255,.08)",
                        background: active ? "rgba(254,240,138,.16)" : "rgba(255,255,255,.06)",
                        color: "white",
                        padding: "14px 16px",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 17, color: active ? "#fef08a" : "#f8fafc", marginBottom: 4 }}>{lesson.title}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(226,232,240,.74)" }}>{lesson.summary}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <ControlBlock label="Voice Shape" valueLabel={derived.shapeLabel}>
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

            <ControlBlock label="Brightness" valueLabel={`${Math.round(derived.brightness * 100)}%`}>
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
            </ControlBlock>

            <ControlBlock label="Tail Length" valueLabel={`${Math.round(derived.tailGlow * 100)}%`}>
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
            </ControlBlock>

            <ControlBlock label="Snap" valueLabel={`${Math.round(derived.snap * 100)}%`}>
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
            </ControlBlock>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
