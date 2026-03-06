import { STAGE1_WORDS, STAGE2_WORDS, STAGE3_WORDS } from "./words.js";

export const STAGES = [
  { id: 1, name: "On the Staff", desc: "Notes between the lines", words: STAGE1_WORDS, color: "#22c55e", threshold: 0, pts: 2 },
  { id: 2, name: "Longer Words", desc: "Some letters filled in", words: STAGE2_WORDS, color: "#3b82f6", threshold: 20, pts: 3 },
  { id: 3, name: "Off the Staff!", desc: "Ledger lines above & below", words: STAGE3_WORDS, color: "#f59e0b", threshold: 50, pts: 5 },
];
