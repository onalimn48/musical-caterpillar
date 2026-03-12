import GameLayout from "../../shared/layout/GameLayout.jsx";
import GameContainer from "../../shared/layout/GameContainer.jsx";
import CaterpillarAvatar from "../../shared/caterpillar/CaterpillarAvatar.jsx";
import { SYNTH_LESSONS } from "../state/lessonDefinitions.js";

export default function MenuScreen({ onStart }) {
  return (
    <GameLayout
      background="linear-gradient(180deg,#0f172a 0%,#17325c 42%,#2e7d66 100%)"
      fontFamily="'Fredoka', 'Trebuchet MS', sans-serif"
      padding="24px 18px 40px"
      styleContent={`
        @keyframes synthLabFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}
    >
      <GameContainer maxWidth={980} style={{ width: "100%" }}>
        <div style={{ textAlign: "center", color: "white", marginBottom: 26 }}>
          <div style={{ letterSpacing: 2.2, textTransform: "uppercase", fontSize: 12, color: "rgba(226,232,240,.72)", marginBottom: 10 }}>
            Musical Caterpillar
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(38px, 8vw, 64px)", lineHeight: 0.95, color: "#fef3c7" }}>
            Sound Garden
          </h1>
          <p style={{ maxWidth: 640, margin: "16px auto 0", fontSize: 17, lineHeight: 1.65, color: "rgba(226,232,240,.84)" }}>
            Grow one sound at a time. Change the caterpillar's voice, then hear how shape, brightness, and tail length transform the garden.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.1fr) minmax(280px,.9fr)",
          gap: 26,
          alignItems: "center",
        }}>
          <div style={{
            borderRadius: 28,
            padding: "28px 18px 18px",
            background: "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06))",
            border: "1px solid rgba(255,255,255,.14)",
            boxShadow: "0 22px 50px rgba(15,23,42,.26)",
            animation: "synthLabFloat 3.4s ease-in-out infinite",
          }}>
            <CaterpillarAvatar oscType="triangle" brightness={0.55} tailGlow={0.35} snap={0.58} wavePhase={0.16} waveSpeed={1.1} isSinging={false} title="Musical Caterpillar in the Sound Garden" />
          </div>

          <div style={{
            borderRadius: 28,
            padding: 24,
            background: "linear-gradient(180deg, rgba(15,23,42,.34), rgba(15,23,42,.2))",
            border: "1px solid rgba(255,255,255,.12)",
            color: "white",
          }}>
            <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#86efac", marginBottom: 8 }}>
              First Stops
            </div>
            <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
              {SYNTH_LESSONS.map((lesson) => (
                <div key={lesson.id} style={{
                  padding: "14px 16px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,.08)",
                  border: "1px solid rgba(255,255,255,.1)",
                }}>
                  <div style={{ fontSize: 18, color: "#fef08a", marginBottom: 4 }}>{lesson.title}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(226,232,240,.8)" }}>{lesson.summary}</div>
                </div>
              ))}
            </div>
            <button
              onClick={onStart}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 18,
                padding: "16px 18px",
                background: "linear-gradient(135deg,#fde68a,#fb7185)",
                color: "#1f2937",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 18px 36px rgba(251,113,133,.28)",
              }}
            >
              Wake the Garden
            </button>
            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: "rgba(226,232,240,.58)" }}>
              Audio starts only after you tap, which keeps browsers and school devices happy.
            </div>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
