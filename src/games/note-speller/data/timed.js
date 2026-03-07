export const TIMED_LEVELS = [
  { id: 1, seconds: 10, target: 5, stageIndex: 0, title: "Level 1", color: "#22c55e" },
  { id: 2, seconds: 7, target: 5, stageIndex: 1, title: "Level 2", color: "#3b82f6" },
  { id: 3, seconds: 5, target: 5, stageIndex: 2, title: "Level 3", color: "#f59e0b" },
];

export const TIMED_SPECIAL_MODES = [
  { id: "diamond", label: "Diamond", seconds: 4, unlockGoal: 10, color: "#60a5fa", icon: "💎", perNote: false },
  { id: "legendary", label: "Legendary", seconds: 3, unlockGoal: 20, color: "#c084fc", icon: "👑", perNote: false },
];

export const TIMED_SPECIAL_MODE_MAP = Object.fromEntries(
  TIMED_SPECIAL_MODES.map((mode) => [mode.id, mode]),
);
