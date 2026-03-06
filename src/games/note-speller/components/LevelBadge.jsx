import { LEVEL_TITLES, XP_CURVE_SEGMENTS } from "../data/xp.js";
import SharedLevelBadge from "../../shared/components/LevelBadge.jsx";

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

export default function LevelBadge({ stats, style }) {
  const xpInfo = getXpProgress(stats.xp || 0);
  const level = xpInfo.level;
  const titleInfo = getLevelTitle(level);
  const progress = xpInfo.pct;

  return (
    <SharedLevelBadge
      icon={titleInfo.emoji}
      title={`Lv.${level}`}
      subtitle={titleInfo.title}
      progress={progress}
      progressLabel={`${xpInfo.current}/${xpInfo.needed}`}
      accent={titleInfo.color}
      style={{ fontFamily: "'Fredoka',sans-serif", ...style }}
    />
  );
}
