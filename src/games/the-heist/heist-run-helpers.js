export function buildPrizeRecord(levelDef, prize, summary, collectedAt = Date.now()) {
  if (!prize) return null;
  return {
    level: levelDef.level,
    title: levelDef.title,
    stageKey: levelDef.stageKey,
    prizeName: prize.name,
    summary,
    collectedAt,
  };
}

export function summarizeTimingStats(stats) {
  if (!stats.total) return null;
  return {
    ...stats,
    accuracyPct: Math.round((stats.accurate / stats.total) * 100),
  };
}

export function buildDefaultTimingSummary() {
  return {
    total: 0,
    accurate: 0,
    early: 0,
    late: 0,
    accuracyPct: 0,
  };
}

export function buildAccuracyBannerDetail(summary) {
  if (!summary) return null;
  return `LAST ${summary.accuracyPct}% ACC · ${summary.accurate}/${summary.total} ON-TIME · E${summary.early} L${summary.late}`;
}

export function buildLevelBannerDetail(levelDef, previousSummary, adjustedBpm) {
  return buildAccuracyBannerDetail(previousSummary)
    || `${levelDef.environment} · ${levelDef.coaching} · ${adjustedBpm} BPM`;
}

export function buildEndlessBannerDetail(previousSummary) {
  return buildAccuracyBannerDetail(previousSummary)
    || "Procedural patterns · BPM rises every 30 seconds";
}

export function weightedPick(items, fallback = items[0]) {
  if (!items.length) return fallback;
  const total = items.reduce((sum, item) => sum + Math.max(1, item.endlessWeight || 1), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(1, item.endlessWeight || 1);
    if (roll <= 0) return item;
  }
  return items[items.length - 1] || fallback;
}

export function createEndlessPhrase({
  now,
  previousName = null,
  endlessStartedAt,
  endlessPhraseCount,
  endlessBpmStepMs,
  blueprints,
  makePhrase,
}) {
  const elapsed = Math.max(0, now - endlessStartedAt);
  const difficultyTier = 6 + Math.floor(elapsed / endlessBpmStepMs);
  const eligible = blueprints.filter(blueprint => blueprint.difficulty <= difficultyTier + 1);
  const blueprint = weightedPick(eligible, blueprints[0]);
  const templatePool = blueprint.templateKey
    ? [blueprint.templateKey]
    : ["JUMP", "DUCK", "SLIDE", "WINDMILL", "HEADSPIN", "TUCK"].filter(name => name !== previousName);
  const templateKey = templatePool[Math.floor(Math.random() * templatePool.length)] || "JUMP";
  return makePhrase(
    `endless-${blueprint.id}-${endlessPhraseCount}-${Math.round(now)}`,
    templateKey,
    blueprint.rhythmEvents,
    {
      boxCue: blueprint.boxCue || null,
      difficulty: blueprint.difficulty,
      levelHint: blueprint.levelHint,
      endlessWeight: blueprint.endlessWeight,
      spanBeats: blueprint.spanBeats,
    }
  );
}

export function buildEndlessLeaderboardEntry({ value, score, bpm, meters, at = Date.now() }) {
  return { value, score, bpm, meters, at };
}

export function rankEndlessLeaderboard(entries) {
  return [...entries]
    .sort((left, right) => right.value - left.value || right.score - left.score || right.meters - left.meters)
    .slice(0, 5);
}
