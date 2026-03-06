import { LEVEL_TITLES, XP_CURVE_SEGMENTS } from "../data/xp.js";

function xpForLevel(lvl) {
  if (lvl <= 1) return 0;
  const segment = XP_CURVE_SEGMENTS.find((item) => lvl <= item.maxLevel) || XP_CURVE_SEGMENTS[XP_CURVE_SEGMENTS.length - 1];
  return segment.baseXp + segment.step * (lvl - segment.startLevel);
}

function getPlayerLevel(xp) {
  for (let lvl = 100; lvl >= 1; lvl--) {
    if (xp >= xpForLevel(lvl)) return lvl;
  }
  return 1;
}

function getXpProgress(xp) {
  const level = getPlayerLevel(xp);
  if (level >= 100) return { level: 100, current: 0, needed: 0, pct: 100 };
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const needed = nextLevelXp - currentLevelXp;
  const current = xp - currentLevelXp;
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

function getLevelTitle(level) {
  let current = LEVEL_TITLES[0];
  for (const t of LEVEL_TITLES) {
    if (level >= t.level) current = t;
  }
  return current;
}

function getNextTitle(level) {
  for (const t of LEVEL_TITLES) {
    if (t.level > level) return t;
  }
  return null;
}

export default function LevelBadgeDark({ stats, style }) {
  const xpInfo = getXpProgress(stats.xp || 0);
  const level = xpInfo.level;
  const titleInfo = getLevelTitle(level);
  const next = getNextTitle(level);
  const progress = xpInfo.pct;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(26,17,40,0.8)", backdropFilter: "blur(8px)",
      borderRadius: 10, padding: "4px 10px",
      border: `1.5px solid ${titleInfo.color}44`,
      fontSize: 11, fontFamily: "'Fredoka',sans-serif",
      ...style,
    }}>
      <span style={{ fontSize: 14 }}>{titleInfo.emoji}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: 700, color: titleInfo.color, fontSize: 11 }}>Lv.{level}</span>
          <span style={{ fontWeight: 600, color: "#d1d5db", fontSize: 10 }}>{titleInfo.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 60, height: 3, borderRadius: 2, background: "#2a1f3a", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2, background: titleInfo.color, width: `${progress}%`, transition: "width .3s ease" }} />
          </div>
          <span style={{ fontSize: 8, color: "#6b7280", fontWeight: 500 }}>{xpInfo.current}/{xpInfo.needed}</span>
        </div>
      </div>
    </div>
  );
}
