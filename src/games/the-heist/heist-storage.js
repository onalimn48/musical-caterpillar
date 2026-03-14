export const ENDLESS_LEADERBOARD_KEY = "the-heist-endless-leaderboard-v1";
export const HIGHEST_UNLOCKED_LEVEL_KEY = "the-heist-highest-unlocked-level-v1";
export const TREASURE_ROOM_KEY = "the-heist-treasure-room-v1";
export const LEVEL_TEMPO_OVERRIDES_KEY = "the-heist-level-tempo-overrides-v1";
export const BACKGROUND_MODE_KEY = "the-heist-background-mode-v1";

function safeGetItem(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadHighestUnlockedLevel(clampCampaignLevel) {
  const stored = Number(safeGetItem(HIGHEST_UNLOCKED_LEVEL_KEY, "1"));
  return clampCampaignLevel(Number.isFinite(stored) ? stored : 1);
}

export function saveHighestUnlockedLevel(level) {
  try {
    window.localStorage.setItem(HIGHEST_UNLOCKED_LEVEL_KEY, String(level));
  } catch {
    // Ignore storage failures and keep the campaign playable.
  }
}

export function loadTreasureRoomRecords() {
  try {
    const stored = JSON.parse(safeGetItem(TREASURE_ROOM_KEY, "{}"));
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

export function saveTreasureRoomRecords(records) {
  try {
    window.localStorage.setItem(TREASURE_ROOM_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage failures and keep prize collection in-memory for the session.
  }
}

export function loadLevelTempoOverrides() {
  try {
    const stored = JSON.parse(safeGetItem(LEVEL_TEMPO_OVERRIDES_KEY, "{}"));
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
    return Object.fromEntries(
      Object.entries(stored)
        .map(([level, pct]) => [Number(level), Math.max(50, Math.min(120, Number(pct) || 100))])
        .filter(([level]) => Number.isFinite(level))
    );
  } catch {
    return {};
  }
}

export function saveLevelTempoOverrides(overrides) {
  try {
    window.localStorage.setItem(LEVEL_TEMPO_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Ignore storage failures and keep overrides in-memory for the session.
  }
}

export function loadEndlessLeaderboard() {
  try {
    const stored = JSON.parse(safeGetItem(ENDLESS_LEADERBOARD_KEY, "[]"));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function saveEndlessLeaderboard(board) {
  try {
    window.localStorage.setItem(ENDLESS_LEADERBOARD_KEY, JSON.stringify(board));
  } catch {
    // Ignore localStorage failures and keep the current run playable.
  }
}

export function loadBackgroundMode() {
  const stored = safeGetItem(BACKGROUND_MODE_KEY, "2d");
  return stored === "3d" ? "3d" : "2d";
}

export function saveBackgroundMode(mode) {
  try {
    window.localStorage.setItem(BACKGROUND_MODE_KEY, mode === "3d" ? "3d" : "2d");
  } catch {
    // Ignore storage failures and keep the current session playable.
  }
}
