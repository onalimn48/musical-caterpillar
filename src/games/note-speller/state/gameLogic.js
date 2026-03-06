import { ALL_WORDS, MUSIC_NOTES, SCRAMBLE_WORDS } from "../data/words.js";
import { XP_CURVE_SEGMENTS } from "../data/xp.js";

// Fisher-Yates shuffle
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickScrambleWord(usedList) {
  const pool = SCRAMBLE_WORDS.filter((w) => !usedList.includes(w.w));
  const source = pool.length ? pool : SCRAMBLE_WORDS;
  return source[Math.floor(Math.random() * source.length)];
}

export function makeScramble(word) {
  const letters = word.w.split("");
  let shuffled = shuffleArray(letters);
  let attempts = 0;
  while (shuffled.join("") === letters.join("") && attempts < 20) {
    shuffled = shuffleArray(letters);
    attempts++;
  }
  return shuffled;
}

export function analyzeWeakNotes(stats) {
  const notes = "ABCDEFG".split("");
  const noteAccuracy = notes.map((n) => {
    const attempts = (stats.noteAttempts || {})[n] || 0;
    const correct = (stats.noteCorrect || {})[n] || 0;
    const accuracy = attempts > 0 ? correct / attempts : -1;
    return { note: n, attempts, correct, accuracy };
  });
  const tried = noteAccuracy.filter((n) => n.accuracy >= 0).sort((a, b) => a.accuracy - b.accuracy);
  const untried = noteAccuracy.filter((n) => n.accuracy < 0);
  return [...tried, ...untried];
}

export function getWeakNotesList(stats) {
  const analysis = analyzeWeakNotes(stats);
  const weak = analysis.filter((n) => n.accuracy < 0.8 || n.attempts < 5);
  return weak.length > 0 ? weak.slice(0, 4).map((n) => n.note) : analysis.slice(0, 3).map((n) => n.note);
}

export function pickWeakWord(weakNotes, usedList) {
  const scored = ALL_WORDS.map((word) => {
    const notes = word.w.split("").filter((ch) => MUSIC_NOTES.has(ch));
    const weakCount = notes.filter((n) => weakNotes.includes(n)).length;
    return { word, weakCount, ratio: weakCount / Math.max(notes.length, 1) };
  });
  const good = scored.filter((s) => s.weakCount > 0 && !usedList.includes(s.word.w));
  const pool = good.length > 0 ? good : scored.filter((s) => !usedList.includes(s.word.w));
  pool.sort((a, b) => b.ratio - a.ratio);
  const top = pool.slice(0, Math.max(5, Math.floor(pool.length / 3)));
  return (top.length > 0 ? top : pool)[Math.floor(Math.random() * Math.max(top.length, 1))]?.word || ALL_WORDS[0];
}

export function isButterflyTriggerTotal(totalCorrect) {
  const normalizedTotal = Math.max(0, totalCorrect ?? 0);
  if (normalizedTotal === 10 || normalizedTotal === 30 || normalizedTotal === 50 || normalizedTotal === 70) {
    return true;
  }
  return normalizedTotal > 70 && (normalizedTotal - 70) % 25 === 0;
}

export function getNextButterflyTrigger(totalCorrect) {
  const normalizedTotal = Math.max(0, totalCorrect ?? 0);
  if (normalizedTotal < 10) return 10;
  if (normalizedTotal < 70) {
    return 10 + 20 * (Math.floor((normalizedTotal - 10) / 20) + 1);
  }
  return 70 + 25 * (Math.floor((normalizedTotal - 70) / 25) + 1);
}

export function getButterflyProgress(totalCorrect) {
  const normalizedTotal = Math.max(0, totalCorrect ?? 0);
  const shouldTrigger = isButterflyTriggerTotal(normalizedTotal);
  const nextTarget = shouldTrigger
    ? getNextButterflyTrigger(normalizedTotal + 1)
    : getNextButterflyTrigger(normalizedTotal);
  return {
    totalCorrect: normalizedTotal,
    shouldTrigger,
    nextTarget,
    remaining: nextTarget - normalizedTotal,
  };
}

export function didReachButterflyTrigger(prevTotalCorrect, nextTotalCorrect) {
  return !isButterflyTriggerTotal(prevTotalCorrect) && isButterflyTriggerTotal(nextTotalCorrect);
}

export function getButterflyDisplayRemaining(state) {
  const totalCorrect = Math.max(0, state?.butterflyCorrectCount ?? 0);
  const remainingToThreshold = getButterflyProgress(totalCorrect).remaining;
  const remainingSlotsInWord = state?.word && state?.slots
    ? Math.max(0, state.slots.length - state.slotIndex)
    : remainingToThreshold;

  if (state?.butterflyPending) return Math.max(1, remainingSlotsInWord);
  if (remainingToThreshold <= remainingSlotsInWord) return Math.max(1, remainingSlotsInWord);
  return remainingToThreshold;
}

export function xpForLevel(lvl) {
  if (lvl <= 1) return 0;
  const segment = XP_CURVE_SEGMENTS.find((item) => lvl <= item.maxLevel) || XP_CURVE_SEGMENTS[XP_CURVE_SEGMENTS.length - 1];
  return segment.baseXp + segment.step * (lvl - segment.startLevel);
}

export function calcXpAward(wordCompleted, currentStreak, isButterflyNow, milestone) {
  let xp = 0;
  if (wordCompleted) xp += 10;
  if (currentStreak > 5) xp += 2;
  if (isButterflyNow) xp += 30;
  if (milestone) {
    if (milestone.tier === "fire") xp += 75;
    else if (milestone.tier === "star") xp += 150;
    else if (milestone.tier === "legendary") xp += 300;
    else if (milestone.tier === "diamond") xp += 200;
  }
  return xp;
}

export function getPlayerLevel(xp) {
  for (let lvl = 100; lvl >= 1; lvl--) {
    if (xp >= xpForLevel(lvl)) return lvl;
  }
  return 1;
}

export function pickWord(words, usedList) {
  const pool = words.filter((w) => !usedList.includes(w.w));
  const source = pool.length ? pool : words;
  return source[Math.floor(Math.random() * source.length)];
}

export function getSlots(word) {
  const si = [];
  word.w.split("").forEach((ch, i) => {
    if (MUSIC_NOTES.has(ch)) si.push(i);
  });
  return si;
}

export function getStreakMilestone(streak) {
  if (streak === 10) return { tier: "shimmer", streak, emoji: "✨", title: "SHIMMER!", color: "#d9d98a" };
  if (streak === 25) return { tier: "fire", streak, emoji: "🔥", title: "ON FIRE!", color: "#f97316" };
  if (streak === 50) return { tier: "star", streak, emoji: "⭐", title: "SUPERSTAR!", color: "#eab308" };
  if (streak === 100) return { tier: "legendary", streak, emoji: "🌈", title: "LEGENDARY!", color: "#a855f7" };
  if (streak === 150) return { tier: "diamond", streak, emoji: "💎", title: "DIAMOND!", color: "#06b6d4" };
  if (streak === 200) return { tier: "rainbow", streak, emoji: "🌈", title: "RAINBOW!", color: "#ec4899" };
  if (streak === 300) return { tier: "cosmic", streak, emoji: "🌌", title: "COSMIC!", color: "#7c3aed" };
  if (streak === 400) return { tier: "ultra", streak, emoji: "⚡", title: "ULTRA!", color: "#0ea5e9" };
  if (streak === 500) return { tier: "mythic", streak, emoji: "👑", title: "MYTHIC!", color: "#f59e0b" };
  return null;
}
