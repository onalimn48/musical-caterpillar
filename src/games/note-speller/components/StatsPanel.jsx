export default function StatsPanel({ stats, onClose, fontFamily, dark = false }) {
  const accuracy = stats.totalGuesses > 0 ? Math.round((stats.correctGuesses / stats.totalGuesses) * 100) : 0;
  const noteAccuracy = {};
  "ABCDEFG".split("").forEach(n => {
    const total = stats.noteAttempts?.[n] || 0;
    const correct = stats.noteCorrect?.[n] || 0;
    noteAccuracy[n] = total > 0 ? Math.round((correct / total) * 100) : null;
  });
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 1001, fontFamily,
    }}>
      <div style={{
        background: dark ? "linear-gradient(180deg,#111827,#1f2937)" : "white",
        borderRadius: 24, padding: "28px 32px", maxWidth: 400, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        border: dark ? "1px solid rgba(255,255,255,.08)" : "none",
      }}>
        <h2 style={{ color: dark ? "#c4b5fd" : "#5b21b6", textAlign: "center", margin: "0 0 18px", fontSize: 22 }}>📊 Your Stats</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Words Done", value: stats.wordsCompleted || 0 },
            { label: "Accuracy", value: `${accuracy}%` },
            { label: "Best Note Streak", value: `${stats.bestStreak || 0} 🔥` },
            { label: "Total XP", value: `${stats.xp || 0} ✨` },
            { label: "Butterflies", value: `🦋 ${stats.butterflies || 0}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: dark ? "rgba(255,255,255,.06)" : "#f5f3ff", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: dark ? "#e9d5ff" : "#5b21b6" }}>{value}</div>
              <div style={{ fontSize: 11, color: dark ? "#c4b5fd" : "#7c3aed", fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: dark ? "#e5e7eb" : "#374151", marginBottom: 8 }}>Note Accuracy</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {"ABCDEFG".split("").map(n => {
              const pct = noteAccuracy[n];
              const bg = pct === null ? (dark ? "rgba(255,255,255,.05)" : "#f3f4f6") : pct >= 80 ? "#dcfce7" : pct >= 50 ? "#fef9c3" : "#fef2f2";
              const color = pct === null ? "#d1d5db" : pct >= 80 ? "#16a34a" : pct >= 50 ? "#ca8a04" : "#dc2626";
              return (
                <div key={n} style={{ width: 40, textAlign: "center", background: bg, borderRadius: 8, padding: "6px 2px" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{n}</div>
                  <div style={{ fontSize: 10, color, fontWeight: 500 }}>{pct !== null ? `${pct}%` : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: "100%", padding: 10, borderRadius: 12, border: "none",
          background: dark ? "linear-gradient(135deg,#818cf8,#7c3aed)" : "linear-gradient(135deg,#5b21b6,#7c3aed)", color: "white",
          fontSize: 15, fontWeight: 600, fontFamily, cursor: "pointer",
        }}>Close</button>
      </div>
    </div>
  );
}
