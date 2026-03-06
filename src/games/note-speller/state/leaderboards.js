let leaderboardData = [];
let streakLBData = [];

export function addLBScore(ini, sc, clef) {
  leaderboardData.push({ initials: ini, score: sc, clef, date: Date.now() });
  leaderboardData.sort((a, b) => b.score - a.score);
  if (leaderboardData.length > 20) leaderboardData = leaderboardData.slice(0, 20);
}

export function getLB() { return [...leaderboardData]; }

export async function loadLB() {
  try {
    const r = await window.storage.get("notenamer-lb");
    if (r?.value) leaderboardData = JSON.parse(r.value);
  } catch (e) {}
}

export async function saveLB() {
  try {
    await window.storage.set("notenamer-lb", JSON.stringify(leaderboardData), true);
  } catch (e) {}
}

export async function loadStats() {
  try {
    const r = await window.storage.get("notenamer-stats");
    if (r?.value) return JSON.parse(r.value);
  } catch (e) {}
  return null;
}

export async function saveStats(s) {
  try {
    await window.storage.set("notenamer-stats", JSON.stringify(s));
  } catch (e) {}
}

export async function loadPowerups() {
  try {
    const r = await window.storage.get("notenamer-pu");
    if (r?.value) return JSON.parse(r.value);
  } catch (e) {}
  return null;
}

export async function savePowerups(p) {
  try {
    await window.storage.set("notenamer-pu", JSON.stringify(p));
  } catch (e) {}
}

export async function loadProgress() {
  try {
    const r = await window.storage.get("notenamer-progress");
    if (r?.value) return JSON.parse(r.value);
  } catch (e) {}
  return null;
}

export async function saveProgress(p) {
  try {
    await window.storage.set("notenamer-progress", JSON.stringify(p));
  } catch (e) {}
}

export function addStreakScore(ini, streak, clef) {
  streakLBData.push({ initials: ini, streak, clef, date: Date.now() });
  streakLBData.sort((a, b) => b.streak - a.streak);
  if (streakLBData.length > 20) streakLBData = streakLBData.slice(0, 20);
}

export function getStreakLB() { return [...streakLBData]; }

export async function loadStreakLB() {
  try {
    const r = await window.storage.get("notenamer-streaks");
    if (r?.value) streakLBData = JSON.parse(r.value);
  } catch (e) {}
}

export async function saveStreakLB() {
  try {
    await window.storage.set("notenamer-streaks", JSON.stringify(streakLBData), true);
  } catch (e) {}
}
