import GameContainer from "../../shared/layout/GameContainer.jsx";
import GameLayout from "../../shared/layout/GameLayout.jsx";

export default function MenuScreen({ onStart }) {
  return (
    <GameLayout
      background="linear-gradient(180deg,#09122c 0%,#12345a 36%,#14532d 100%)"
      fontFamily="'Fredoka', 'Trebuchet MS', sans-serif"
      padding="24px 18px 38px"
    >
      <GameContainer maxWidth={980} style={{ width: "100%", color: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: 2.2, textTransform: "uppercase", color: "rgba(226,232,240,.72)", marginBottom: 10 }}>
            Musical Caterpillar
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(38px, 8vw, 64px)", lineHeight: 0.95, color: "#d9f99d" }}>
            Loop Trail
          </h1>
          <p style={{ maxWidth: 680, margin: "16px auto 0", fontSize: 17, lineHeight: 1.65, color: "rgba(226,232,240,.84)" }}>
            Build an eight-step path so the caterpillar can march through the garden. Start with kick, snare, and hats, then shape grooves one square at a time.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,.88fr)", gap: 24, alignItems: "center" }}>
          <div style={{
            borderRadius: 28,
            padding: "28px 22px",
            background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.05))",
            border: "1px solid rgba(255,255,255,.12)",
            boxShadow: "0 22px 44px rgba(15,23,42,.24)",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, minmax(0,1fr))", gap: 10, marginBottom: 18 }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    height: 72,
                    borderRadius: 18,
                    background: index % 2 === 0 ? "rgba(217,249,157,.22)" : "rgba(103,232,249,.18)",
                    border: "1px solid rgba(255,255,255,.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  {index === 2 || index === 6 ? "🍄" : index % 2 === 0 ? "🌿" : "✨"}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 18, color: "#fef08a", marginBottom: 8 }}>How it plays</div>
            <div style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(226,232,240,.8)" }}>
              Each square is a step. When the playhead reaches a glowing square, that sound plays. Fill the trail with patterns and the caterpillar keeps moving.
            </div>
          </div>

          <div style={{
            borderRadius: 28,
            padding: 24,
            background: "linear-gradient(180deg, rgba(15,23,42,.34), rgba(15,23,42,.18))",
            border: "1px solid rgba(255,255,255,.12)",
          }}>
            <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#67e8f9", marginBottom: 10 }}>
              First Loop Tools
            </div>
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {[
                "Kick for the big footsteps",
                "Snare for the turn in the trail",
                "Hat for sparkle and steady motion",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: 18,
                    padding: "14px 16px",
                    background: "rgba(255,255,255,.07)",
                    border: "1px solid rgba(255,255,255,.08)",
                    fontSize: 15,
                    color: "rgba(226,232,240,.84)",
                  }}
                >
                  {item}
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
                background: "linear-gradient(135deg,#bef264,#67e8f9)",
                color: "#082f49",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 18px 36px rgba(103,232,249,.24)",
              }}
            >
              Start the Trail
            </button>
            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: "rgba(226,232,240,.58)" }}>
              Audio starts after your tap so the sequencer can run reliably in the browser.
            </div>
          </div>
        </div>
      </GameContainer>
    </GameLayout>
  );
}
