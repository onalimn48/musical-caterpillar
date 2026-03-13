import { useCallback, useEffect, useRef, useState } from "react";
import {
  restartEndlessWithCountInFlow,
  consumeCountInPlannedPhraseFlow,
  clearCountInState,
  disposeCountInState,
  startRunFlow,
  getCountInNotesForRender,
  getCountInPreviewNotesForRender,
  startCountInAnimationLoop,
  beginCountInFlow,
} from "./heist-count-in.js";
import {
  buildDefaultTimingSummary,
  buildEndlessBannerDetail,
  buildEndlessLeaderboardEntry,
  buildLevelBannerDetail,
  buildPrizeRecord,
  createEndlessPhrase,
  rankEndlessLeaderboard,
  summarizeTimingStats,
} from "./heist-run-helpers.js";
import {
  loadEndlessLeaderboard,
  loadHighestUnlockedLevel,
  loadLevelTempoOverrides,
  loadTreasureRoomRecords,
  saveEndlessLeaderboard,
  saveHighestUnlockedLevel,
  saveLevelTempoOverrides,
  saveTreasureRoomRecords,
} from "./heist-storage.js";

const ACTIVE_NOTE_RENDER_SYNC_MS = 50;
const ACTIVE_OBSTACLE_RENDER_SYNC_MS = 50;
const ACTIVE_METER_SYNC_MS = 140;

export function useHeistRunState({
  DEFAULT_TIME_SIGNATURE,
  LEVELS,
  PHRASE_BY_ID,
  LEVEL_THEME_PRESETS,
  PRIZE_BY_LEVEL,
  ENDLESS_BLUEPRINTS,
  makePhrase,
  clampCampaignLevel,
  getCampaignLevelDef,
  getLevelTeachingIntro,
  DEV_MODE,
  FORCE_FULL_UNLOCK,
  MAX_LIVES,
  MISS_LIMIT,
  RHYTHM_WINDOW_RATIO,
  COUNT_IN_LEAD_BEATS,
  ENDLESS_BASE_BPM,
  ENDLESS_BPM_STEP_MS,
  ENDLESS_BPM_STEP,
  BURGLAR_X,
  RHYTHM_HIT_X,
  RHYTHM_SPAWN_X,
  SPEED,
  GATED_MOVE_POSES,
  poseClears,
  buildObstacle,
  buildRhythmNotes,
  primeLaneNotes,
  bpmToBeatMs,
  beatMsToTravelMs,
  beatMsToAccurateWindowMs,
  beatMsToPxPerBeat,
  getTimeSignatureLabel,
  getBeatsPerBar,
  tapSound,
  wrongTapSound,
  hitSound,
  hat,
  kick,
  snare,
  resetMuseumScene,
  resetIds,
}) {
  const initialUnlockedLevelRef = useRef(loadHighestUnlockedLevel(clampCampaignLevel));
  const initialTreasureRoomRef = useRef(loadTreasureRoomRecords());
  const initialLevelTempoOverridesRef = useRef(loadLevelTempoOverrides());

  const [rhythmRender, setRhythmRender] = useState([]);
  const [laserObsRender, setLaserObsRender] = useState([]);
  const [guardObsRender, setGuardObsRender] = useState([]);
  const [metersCovered, setMetersCovered] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);
  const [countInRender, setCountInRender] = useState([]);
  const [countInPreviewRender, setCountInPreviewRender] = useState([]);
  const [beatFlash, setBeatFlash] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);
  const [beatIdx, setBeatIdx] = useState(0);
  const [moveLabel, setMoveLabel] = useState(null);
  const [moveCol, setMoveCol] = useState("#ff3366");
  const [missFlash, setMissFlash] = useState(false);
  const [tooEarlyFlash, setTooEarlyFlash] = useState(false);
  const [spottedFlash, setSpottedFlash] = useState(false);
  const [guardClearFlash, setGuardClearFlash] = useState(false);
  const [tapGood, setTapGood] = useState(false);
  const [nextLabel, setNextLabel] = useState(null);
  const [rhythmMisses, setRhythmMisses] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0].level);
  const [stageTitle, setStageTitle] = useState(LEVELS[0].title);
  const [stageAccent, setStageAccent] = useState(LEVEL_THEME_PRESETS[LEVELS[0].stageKey].accent);
  const [phaseText, setPhaseText] = useState(`PHRASE 0/${LEVELS[0].phraseIds.length}`);
  const [coaching, setCoaching] = useState(LEVELS[0].coaching);
  const [currentBpm, setCurrentBpm] = useState(LEVELS[0].bpm);
  const [endlessMode, setEndlessMode] = useState(false);
  const [endlessStealValue, setEndlessStealValue] = useState(0);
  const [levelBanner, setLevelBanner] = useState(null);
  const [endlessLeaderboard, setEndlessLeaderboard] = useState([]);
  const [highestUnlockedLevel, setHighestUnlockedLevel] = useState(initialUnlockedLevelRef.current);
  const [selectedStartLevel, setSelectedStartLevel] = useState(initialUnlockedLevelRef.current);
  const [selectedMenuMode, setSelectedMenuMode] = useState("campaign");
  const [levelTempoOverrides, setLevelTempoOverrides] = useState(initialLevelTempoOverridesRef.current);
  const [treasureRoomRecords, setTreasureRoomRecords] = useState(initialTreasureRoomRef.current);
  const [levelClearPhase, setLevelClearPhase] = useState("summary");
  const [levelCompleteOverlay, setLevelCompleteOverlay] = useState(null);
  const [teachingOverlay, setTeachingOverlay] = useState(null);
  const [endlessUnlockNoticeOpen, setEndlessUnlockNoticeOpen] = useState(false);

  const wxRef = useRef(0);
  const metersRef = useRef(0);
  const notesRef = useRef([]);
  const obsRef = useRef([]);
  const livesRef = useRef(MAX_LIVES);
  const gameOverRef = useRef(false);
  const startedRef = useRef(false);
  const animRef = useRef(null);
  const ltRef = useRef(null);
  const burglarActorRef = useRef(null);
  const beatNumRef = useRef(0);
  const beatTimeRef = useRef(0);
  const nextBeatAtRef = useRef(0);
  const missRowRef = useRef(0);
  const countInActiveRef = useRef(false);
  const countInTimersRef = useRef([]);
  const countInFrameRef = useRef(null);
  const countInStartRef = useRef(0);
  const countInGameStartRef = useRef(0);
  const countInPreviewRef = useRef([]);
  const countInPlannedPhraseRef = useRef(null);
  const countInPlannedNextPhraseRef = useRef(null);
  const countInCommittedNotesRef = useRef([]);
  const countInTotalBeatsRef = useRef(4);
  const currentSequenceStartBeatRef = useRef(0);
  const laneOriginRef = useRef(0);
  const laserWorldRef = useRef(null);
  const guardWorldRef = useRef(null);
  const rhythmMotionRef = useRef(null);
  const beatMsRef = useRef(bpmToBeatMs(LEVELS[0].bpm));
  const currentBpmRef = useRef(LEVELS[0].bpm);
  const currentLevelDefRef = useRef(LEVELS[0]);
  const campaignLevelRef = useRef(LEVELS[0].level);
  const levelPhraseQueueRef = useRef([]);
  const levelPhraseIndexRef = useRef(0);
  const endlessModeRef = useRef(false);
  const endlessStartedAtRef = useRef(0);
  const endlessPhraseCountRef = useRef(0);
  const endlessQueueRef = useRef([]);
  const levelBannerTimerRef = useRef(null);
  const moveLabelShowTimerRef = useRef(null);
  const moveLabelHideTimerRef = useRef(null);
  const leaderboardCommittedRef = useRef(false);
  const successfulHitTimesRef = useRef([]);
  const playerInputActiveRef = useRef(false);
  const activeInputSourcesRef = useRef(new Set());
  const levelTimingStatsRef = useRef({ total: 0, accurate: 0, early: 0, late: 0 });
  const highestUnlockedLevelRef = useRef(initialUnlockedLevelRef.current);
  const selectedStartLevelRef = useRef(initialUnlockedLevelRef.current);
  const selectedMenuModeRef = useRef("campaign");
  const levelTempoOverridesRef = useRef(initialLevelTempoOverridesRef.current);
  const treasureRoomRecordsRef = useRef(initialTreasureRoomRef.current);
  const levelClearPhaseTimerRef = useRef(null);
  const pendingLevelAdvanceRef = useRef(null);
  const levelCompleteOverlayRef = useRef(null);
  const teachingOverlayRef = useRef(null);
  const seenTeachingIntroIdsRef = useRef(new Set());
  const levelTransitionPausedRef = useRef(false);
  const curSeqRef = useRef(PHRASE_BY_ID[LEVELS[0].phraseIds[0]]);
  const seqBeatRef = useRef(0);
  const forcedRestFreezeRef = useRef(false);
  const curPoseRef = useRef("run_a");
  const prevPoseRef = useRef("run_a");
  const boxModeRef = useRef("idle");
  const lastRhythmRenderSyncAtRef = useRef(0);
  const lastObstacleRenderSyncAtRef = useRef(0);
  const lastMetersSyncAtRef = useRef(0);

  const currentBeatMs = () => beatMsRef.current;
  const currentTravelMs = () => beatMsToTravelMs(beatMsRef.current);
  const getLevelTempoPct = (levelDefOrLevel) => {
    const level = typeof levelDefOrLevel === "number" ? levelDefOrLevel : levelDefOrLevel?.level;
    return levelTempoOverridesRef.current[level] || 100;
  };
  const getAdjustedCampaignBpm = levelDef => Math.round(levelDef.bpm * (getLevelTempoPct(levelDef) / 100));
  const currentWindowMs = () => {
    const ratio = curSeqRef.current?.windowRatio ?? RHYTHM_WINDOW_RATIO;
    return Math.round(beatMsRef.current * ratio);
  };
  const currentAccurateWindowMs = () => beatMsToAccurateWindowMs(beatMsRef.current);
  const isInputHeld = () => activeInputSourcesRef.current.size > 0;

  function setSelectedStartLevelValue(level) {
    const levelCap = (DEV_MODE || FORCE_FULL_UNLOCK) ? LEVELS.length : highestUnlockedLevelRef.current;
    const nextLevel = Math.min(clampCampaignLevel(level), levelCap);
    selectedStartLevelRef.current = nextLevel;
    setSelectedStartLevel(nextLevel);
  }

  function setSelectedMenuModeValue(mode) {
    selectedMenuModeRef.current = mode;
    setSelectedMenuMode(mode);
  }

  function setLevelTempoOverrideValue(level, pct) {
    const nextPct = Math.max(50, Math.min(120, Math.round(pct)));
    const nextOverrides = {
      ...levelTempoOverridesRef.current,
      [level]: nextPct,
    };
    levelTempoOverridesRef.current = nextOverrides;
    setLevelTempoOverrides(nextOverrides);
    saveLevelTempoOverrides(nextOverrides);
  }

  function collectPrizeForLevel(levelDef, summary) {
    const prize = PRIZE_BY_LEVEL[levelDef.level];
    if (!prize) return null;
    const nextRecord = buildPrizeRecord(levelDef, prize, summary);
    const nextTreasureRoom = {
      ...treasureRoomRecordsRef.current,
      [levelDef.level]: nextRecord,
    };
    treasureRoomRecordsRef.current = nextTreasureRoom;
    setTreasureRoomRecords(nextTreasureRoom);
    saveTreasureRoomRecords(nextTreasureRoom);
    return nextRecord;
  }

  function unlockCampaignLevel(level) {
    const nextLevel = clampCampaignLevel(level);
    if (nextLevel <= highestUnlockedLevelRef.current) return;
    highestUnlockedLevelRef.current = nextLevel;
    setHighestUnlockedLevel(nextLevel);
    saveHighestUnlockedLevel(nextLevel);
  }

  function pruneSuccessfulHitTimes(cutoff = beatTimeRef.current - currentBeatMs() * 2.5) {
    successfulHitTimesRef.current = successfulHitTimesRef.current.filter(hitTime => hitTime >= cutoff);
  }

  function resetLevelTimingStats() {
    levelTimingStatsRef.current = { total: 0, accurate: 0, early: 0, late: 0 };
  }

  function judgeTiming(hitTime, actualTime) {
    const offsetMs = actualTime - hitTime;
    const accurateWindowMs = currentAccurateWindowMs();
    if (Math.abs(offsetMs) <= accurateWindowMs) return { kind: "on_time", offsetMs };
    return { kind: offsetMs < 0 ? "early" : "late", offsetMs };
  }

  function recordTimingJudgement(kind) {
    const stats = levelTimingStatsRef.current;
    stats.total += 1;
    if (kind === "on_time") stats.accurate += 1;
    else if (kind === "early") stats.early += 1;
    else stats.late += 1;
  }

  function summarizeLevelTiming() {
    return summarizeTimingStats(levelTimingStatsRef.current);
  }

  function setLevelCompleteState(nextState) {
    levelCompleteOverlayRef.current = nextState;
    setLevelCompleteOverlay(nextState);
  }

  function setTeachingOverlayState(nextState) {
    teachingOverlayRef.current = nextState;
    setTeachingOverlay(nextState);
  }

  function showLevelClearSummary() {
    clearTimeout(levelClearPhaseTimerRef.current);
    levelClearPhaseTimerRef.current = null;
    setLevelClearPhase("summary");
  }

  function registerSuccessfulHit(hitTime) {
    successfulHitTimesRef.current = [...successfulHitTimesRef.current, hitTime];
    pruneSuccessfulHitTimes(hitTime - currentBeatMs() * 2.5);
  }

  function hasMoveSupportForBeat(beatTime) {
    pruneSuccessfulHitTimes(beatTime - currentBeatMs() * 2.5);
    const lowerBound = beatTime - currentBeatMs() * 1.1;
    const upperBound = beatTime + currentWindowMs();
    return successfulHitTimesRef.current.some(hitTime => hitTime >= lowerBound && hitTime <= upperBound);
  }

  function clearLevelBanner() {
    clearTimeout(levelBannerTimerRef.current);
    levelBannerTimerRef.current = null;
    setLevelBanner(null);
  }

  function clearMoveLabelTimers() {
    clearTimeout(moveLabelShowTimerRef.current);
    clearTimeout(moveLabelHideTimerRef.current);
    moveLabelShowTimerRef.current = null;
    moveLabelHideTimerRef.current = null;
  }

  function resetBurglarPresentation() {
    forcedRestFreezeRef.current = false;
    boxModeRef.current = "idle";
    curPoseRef.current = "run_a";
    prevPoseRef.current = "run_a";
    burglarActorRef.current?.reset();
  }

  function showLevelBanner({ heading, title, detail, accent }) {
    clearTimeout(levelBannerTimerRef.current);
    setLevelBanner({ heading, title, detail, accent });
    levelBannerTimerRef.current = setTimeout(() => {
      setLevelBanner(null);
      levelBannerTimerRef.current = null;
    }, 2400);
  }

  function applyTempo(bpm) {
    currentBpmRef.current = bpm;
    beatMsRef.current = bpmToBeatMs(bpm);
    setCurrentBpm(bpm);
  }

  function clearFeedbackFlashState() {
    clearMoveLabelTimers();
    setHitFlash(false);
    setMissFlash(false);
    setTooEarlyFlash(false);
    setSpottedFlash(false);
    setGuardClearFlash(false);
    setMoveLabel(null);
    setNextLabel(null);
  }

  function restart() {
    clearCountIn();
    setTeachingOverlayState(null);
    resetMuseumScene();
    startSelectedMenuMode();
  }

  function returnToMenu({ showEndlessUnlockNotice = false } = {}) {
    clearCountIn();
    setTeachingOverlayState(null);
    resetMuseumScene();
    resetRunState(selectedStartLevelRef.current);
    setEndlessUnlockNoticeOpen(showEndlessUnlockNotice);
  }

  function restartEndlessWithCountIn(nextBpm) {
    restartEndlessWithCountInFlow({
      endlessModeRef,
      pendingLevelAdvanceRef,
      levelTransitionPausedRef,
      activeInputSourcesRef,
      successfulHitTimesRef,
      playerInputActiveRef,
      startedRef,
      nextBeatAtRef,
      ltRef,
      animRef,
      notesRef,
      obsRef,
      syncRhythmRenderState,
      syncObstacleRender,
      clearFeedbackFlashState,
      clearLevelBanner,
      resetBurglarPresentation,
      resetRhythmLaneMotion,
      applyTempo,
      setStarted,
      setBeatIdx,
      beginCountIn,
      selectedStartLevelRef,
    }, nextBpm);
  }

  function showTooEarlyRelease() {
    setTooEarlyFlash(true);
    setTimeout(() => setTooEarlyFlash(false), 700);
  }

  function queueLevelAdvance(nextLevelDef, previousSummary = null) {
    const completedLevelDef = currentLevelDefRef.current;
    if (!completedLevelDef) return;
    const summary = previousSummary || summarizeLevelTiming() || buildDefaultTimingSummary();
    const prizeRecord = collectPrizeForLevel(completedLevelDef, summary);
    const isCampaignFinale = completedLevelDef.level >= LEVELS.length && !nextLevelDef;
    pendingLevelAdvanceRef.current = nextLevelDef || null;
    levelTransitionPausedRef.current = true;
    activeInputSourcesRef.current.clear();
    startedRef.current = false;
    nextBeatAtRef.current = 0;
    ltRef.current = null;
    cancelAnimationFrame(animRef.current);
    animRef.current = null;
    notesRef.current = [];
    obsRef.current = [];
    syncRhythmRenderState([], { force: true });
    syncObstacleRender([], { force: true });
    clearLevelBanner();
    clearFeedbackFlashState();
    setStarted(false);
    setLevelCompleteState({
      completedLevel: completedLevelDef.level,
      completedTitle: completedLevelDef.title,
      summary,
      prize: PRIZE_BY_LEVEL[completedLevelDef.level] || null,
      prizeRecord,
      isCampaignFinale,
      nextLevel: nextLevelDef?.level || null,
      nextTitle: nextLevelDef?.title || null,
      nextLabel: nextLevelDef ? `LEVEL ${String(nextLevelDef.level).padStart(2, "0")}` : (isCampaignFinale ? "MENU" : "ENDLESS"),
    });
  }

  function previewLevelClearOverlay(levelDef = getCampaignLevelDef(selectedStartLevelRef.current)) {
    if (!levelDef) return;
    const nextLevelDef = getCampaignLevelDef(levelDef.level + 1) || null;
    pendingLevelAdvanceRef.current = null;
    levelTransitionPausedRef.current = true;
    activeInputSourcesRef.current.clear();
    clearCountIn();
    clearFeedbackFlashState();
    clearLevelBanner();
    setStarted(false);
    setGameOver(false);
    setLevelCompleteState({
      completedLevel: levelDef.level,
      completedTitle: levelDef.title,
      summary: {
        total: 18,
        accurate: 16,
        early: 1,
        late: 1,
        accuracyPct: 89,
      },
      prize: PRIZE_BY_LEVEL[levelDef.level] || null,
      prizeRecord: null,
      nextLevel: nextLevelDef?.level || null,
      nextTitle: nextLevelDef?.title || null,
      nextLabel: nextLevelDef ? `LEVEL ${String(nextLevelDef.level).padStart(2, "0")}` : "MENU",
    });
  }

  function continueToNextLevel() {
    const nextLevelDef = pendingLevelAdvanceRef.current;
    const shouldReturnToMenu = Boolean(levelCompleteOverlayRef.current?.isCampaignFinale && !nextLevelDef);
    pendingLevelAdvanceRef.current = null;
    setLevelCompleteState(null);
    if (!nextLevelDef) {
      if (shouldReturnToMenu) returnToMenu({ showEndlessUnlockNotice: true });
      return;
    }
    levelTransitionPausedRef.current = false;
    playerInputActiveRef.current = false;
    successfulHitTimesRef.current = [];
    activeInputSourcesRef.current.clear();
    clearFeedbackFlashState();
    resetBurglarPresentation();
    applyLevelState(nextLevelDef, { announce: true });
    const intro = getLevelTeachingIntro?.(nextLevelDef) || null;
    if (intro && !seenTeachingIntroIdsRef.current.has(intro.id)) {
      setTeachingOverlayState({ ...intro, startLevel: nextLevelDef.level });
      return;
    }
    beginCountIn(nextLevelDef.level);
  }

  function applyLevelState(levelDef, { announce = false, previousSummary = null } = {}) {
    const theme = LEVEL_THEME_PRESETS[levelDef.stageKey];
    const adjustedBpm = getAdjustedCampaignBpm(levelDef);
    currentLevelDefRef.current = levelDef;
    campaignLevelRef.current = levelDef.level;
    levelPhraseQueueRef.current = levelDef.phraseIds.slice();
    levelPhraseIndexRef.current = 0;
    endlessModeRef.current = false;
    endlessQueueRef.current = [];
    endlessPhraseCountRef.current = 0;
    applyTempo(adjustedBpm);
    setCurrentLevel(levelDef.level);
    setStageTitle(levelDef.title);
    setStageAccent(theme.accent);
    setPhaseText(`PHRASE 0/${levelDef.phraseIds.length}`);
    setCoaching(levelDef.coaching);
    setEndlessMode(false);
    unlockCampaignLevel(levelDef.level);
    resetLevelTimingStats();
    if (announce) {
      showLevelBanner({
        heading: `LEVEL ${String(levelDef.level).padStart(2, "0")}`,
        title: levelDef.title,
        detail: buildLevelBannerDetail(levelDef, previousSummary, adjustedBpm),
        accent: theme.accent,
      });
    }
  }

  function updateEndlessTempo(now = performance.now(), forceBanner = false) {
    if (!endlessModeRef.current) return false;
    const elapsed = Math.max(0, now - endlessStartedAtRef.current);
    const nextBpm = ENDLESS_BASE_BPM + Math.floor(elapsed / ENDLESS_BPM_STEP_MS) * ENDLESS_BPM_STEP;
    if (nextBpm === currentBpmRef.current) return false;
    if (startedRef.current && !countInActiveRef.current && !levelCompleteOverlayRef.current && !gameOverRef.current) {
      restartEndlessWithCountIn(nextBpm);
      return true;
    } else {
      applyTempo(nextBpm);
    }
    if (forceBanner) return false;
    showLevelBanner({
      heading: "ENDLESS",
      title: `BPM ${nextBpm}`,
      detail: "Tempo escalation · fresh count-in",
      accent: LEVEL_THEME_PRESETS.endless.accent,
    });
    return false;
  }

  function ensureEndlessQueue(now = performance.now()) {
    if (!endlessModeRef.current) return false;
    if (updateEndlessTempo(now)) return true;
    while (endlessQueueRef.current.length < 2) {
      const previousName = endlessQueueRef.current.length
        ? endlessQueueRef.current[endlessQueueRef.current.length - 1].name
        : curSeqRef.current?.name || null;
      endlessQueueRef.current.push(createEndlessPhrase({
        now,
        previousName,
        endlessStartedAt: endlessStartedAtRef.current,
        endlessPhraseCount: endlessPhraseCountRef.current,
        endlessBpmStepMs: ENDLESS_BPM_STEP_MS,
        blueprints: ENDLESS_BLUEPRINTS,
        makePhrase,
      }));
    }
    return false;
  }

  function enterEndlessMode(now = performance.now(), previousSummary = null) {
    const theme = LEVEL_THEME_PRESETS.endless;
    currentLevelDefRef.current = null;
    endlessModeRef.current = true;
    endlessStartedAtRef.current = now;
    endlessQueueRef.current = [];
    endlessPhraseCountRef.current = 0;
    resetLevelTimingStats();
    setEndlessMode(true);
    setStageTitle("Arcade / Endless");
    setStageAccent(theme.accent);
    setCoaching("Procedural full vocabulary");
    setPhaseText("ENDLESS PATTERN 0");
    applyTempo(ENDLESS_BASE_BPM);
    ensureEndlessQueue(now);
    showLevelBanner({
      heading: "ENDLESS",
      title: "ARCADE / ENDLESS",
      detail: buildEndlessBannerDetail(previousSummary),
      accent: theme.accent,
    });
  }

  function pullNextPhrase(now = performance.now()) {
    if (endlessModeRef.current) {
      if (ensureEndlessQueue(now)) return null;
      const nextPhrase = endlessQueueRef.current.shift() || createEndlessPhrase({
        now,
        previousName: curSeqRef.current?.name || null,
        endlessStartedAt: endlessStartedAtRef.current,
        endlessPhraseCount: endlessPhraseCountRef.current,
        endlessBpmStepMs: ENDLESS_BPM_STEP_MS,
        blueprints: ENDLESS_BLUEPRINTS,
        makePhrase,
      });
      endlessPhraseCountRef.current += 1;
      setPhaseText(`ENDLESS PATTERN ${endlessPhraseCountRef.current}`);
      return nextPhrase;
    }

    if (!levelPhraseQueueRef.current.length) {
      const previousSummary = summarizeLevelTiming();
      const nextLevel = LEVELS[campaignLevelRef.current];
      if (!nextLevel) {
        enterEndlessMode(now, previousSummary);
        return pullNextPhrase(now);
      }
      applyLevelState(nextLevel, { announce: true, previousSummary });
    }

    const nextId = levelPhraseQueueRef.current.shift();
    levelPhraseIndexRef.current += 1;
    setPhaseText(`PHRASE ${levelPhraseIndexRef.current}/${currentLevelDefRef.current.phraseIds.length}`);
    return PHRASE_BY_ID[nextId];
  }

  function consumeCountInPlannedPhrase(now = performance.now()) {
    return consumeCountInPlannedPhraseFlow({
      countInPlannedPhraseRef,
      countInPlannedNextPhraseRef,
      pullNextPhrase,
      endlessModeRef,
      ensureEndlessQueue,
      endlessQueueRef,
      endlessPhraseCountRef,
      setPhaseText,
      levelPhraseQueueRef,
      levelPhraseIndexRef,
      currentLevelDefRef,
    }, now);
  }

  function peekUpcomingPhrase(now = performance.now()) {
    if (endlessModeRef.current) {
      ensureEndlessQueue(now);
      return endlessQueueRef.current[0] || null;
    }
    const nextId = levelPhraseQueueRef.current[0];
    return nextId ? PHRASE_BY_ID[nextId] : null;
  }

  function transitionLabel() {
    if (endlessModeRef.current) return "PROCEDURAL";
    const nextLevel = LEVELS[campaignLevelRef.current];
    return nextLevel ? `LVL ${String(nextLevel.level).padStart(2, "0")}` : "ENDLESS";
  }

  function shouldDeferHotRenderSync(force, syncRef, thresholdMs, now) {
    if (force || (!startedRef.current && !countInActiveRef.current)) return false;
    if (!syncRef.current) {
      syncRef.current = now;
      return false;
    }
    if (now - syncRef.current < thresholdMs) return true;
    syncRef.current = now;
    return false;
  }

  function syncObstacleRender(nextObstacles = obsRef.current, { force = false, now = performance.now() } = {}) {
    if (shouldDeferHotRenderSync(force, lastObstacleRenderSyncAtRef, ACTIVE_OBSTACLE_RENDER_SYNC_MS, now)) {
      return;
    }
    const lasers = [];
    const guards = [];
    for (const obstacle of nextObstacles) {
      if (obstacle.isGuard) guards.push(obstacle);
      else lasers.push(obstacle);
    }
    setLaserObsRender(lasers);
    setGuardObsRender(guards);
  }

  function syncRhythmRenderState(nextNotes = notesRef.current, { force = false, now = performance.now() } = {}) {
    if (shouldDeferHotRenderSync(force, lastRhythmRenderSyncAtRef, ACTIVE_NOTE_RENDER_SYNC_MS, now)) {
      return;
    }
    setRhythmRender([...nextNotes]);
  }

  function syncMeters(now = performance.now(), { force = false } = {}) {
    const nextMeters = Math.floor(wxRef.current / 10);
    if (nextMeters === metersRef.current) return;
    if (shouldDeferHotRenderSync(force, lastMetersSyncAtRef, ACTIVE_METER_SYNC_MS, now)) {
      return;
    }
    metersRef.current = nextMeters;
    setMetersCovered(nextMeters);
  }

  function syncMovingLayers(ts = performance.now()) {
    const worldTransform = `translate(${-wxRef.current.toFixed(3)},0)`;
    if (laserWorldRef.current) laserWorldRef.current.setAttribute("transform", worldTransform);
    if (guardWorldRef.current) guardWorldRef.current.setAttribute("transform", worldTransform);
    const laneW = RHYTHM_SPAWN_X - RHYTHM_HIT_X;
    const laneOffset = laneOriginRef.current
      ? ((laneOriginRef.current - ts) / currentTravelMs()) * laneW
      : 0;
    if (rhythmMotionRef.current) rhythmMotionRef.current.setAttribute("transform", `translate(${laneOffset.toFixed(3)},0)`);
  }

  function resetRhythmLaneMotion() {
    if (rhythmMotionRef.current) {
      rhythmMotionRef.current.setAttribute("transform", "translate(0,0)");
    }
  }

  function goToPose(name) {
    prevPoseRef.current = curPoseRef.current;
    curPoseRef.current = name;
    burglarActorRef.current?.goToPose(name);
  }

  function setMissRow(value) {
    missRowRef.current = value;
    setRhythmMisses(value);
    if (value >= MISS_LIMIT && startedRef.current && !gameOverRef.current) {
      gameOverRef.current = true;
      goToPose("caught");
      setGameOver(true);
    }
  }

  function triggerBoxMode(mode, dur = currentBeatMs() * 0.44) {
    boxModeRef.current = mode;
    burglarActorRef.current?.triggerBoxMode(mode, dur);
  }

  function registerHoldSuccess(now, note, timingKind = "on_time") {
    note.holdStartedAt = now;
    note.hit = true;
    recordTimingJudgement(timingKind);
    setMissRow(Math.max(0, missRowRef.current - 1));
    syncRhythmRenderState(notesRef.current);
    tapSound(timingKind);
    setTapGood(true);
    setTimeout(() => setTapGood(false), 160);
  }

  function failHoldNote(note) {
    if (note.missed) return;
    note.missed = true;
    note.hit = false;
    setMissRow(Math.min(missRowRef.current + 1, MISS_LIMIT));
    wrongTapSound();
    syncRhythmRenderState(notesRef.current);
  }

  function maybeFlagEarlyRelease(now = performance.now()) {
    const earlyReleasedNote = notesRef.current.find(note =>
      note.kind === "hold" &&
      note.requiresPressHold &&
      note.holdStartedAt !== null &&
      !note.missed &&
      !note.earlyReleaseNotified &&
      now >= note.requiredHoldEndTime &&
      now < (note.accurateHoldEndTime ?? note.holdEndTime)
    );
    if (!earlyReleasedNote) return;
    earlyReleasedNote.earlyReleaseNotified = true;
    showTooEarlyRelease();
  }

  function scheduleObstacle(seq) {
    if (!seq.peakPose) return;
    const beatMs = currentBeatMs();
    const obsWorldX = wxRef.current + BURGLAR_X + beatMsToPxPerBeat(beatMs) * seq.obstacleAtBeat;
    const obs = buildObstacle(seq, obsWorldX, beatMs);
    if (obs) {
      if (endlessModeRef.current) {
        obs.clearValue = 120 + seq.difficulty * 35 + Math.max(0, currentBpmRef.current - ENDLESS_BASE_BPM) * 8;
      }
      obsRef.current = [...obsRef.current, obs];
      syncObstacleRender(obsRef.current);
    }
  }

  function scheduleRhythmForSequence(seq, startTime, startBeatOffset = currentSequenceStartBeatRef.current) {
    if (!seq.rhythmEvents || seq.rhythmEvents.length === 0) return;
    const beatMs = currentBeatMs();
    const travelMs = beatMsToTravelMs(beatMs);
    const laneOrigin = laneOriginRef.current || (startTime - travelMs);
    const nextNotes = primeLaneNotes(
      buildRhythmNotes(seq.rhythmEvents, startTime, beatMs, null, {
        instanceId: `${seq.id || seq.name}-${startTime}`,
        spanBeats: seq.spanBeats,
        absoluteStartBeat: startBeatOffset,
      }),
      laneOrigin,
      travelMs
    );
    notesRef.current = [...notesRef.current, ...nextNotes];
    syncRhythmRenderState(notesRef.current);
  }

  function beginSequence(seq, startTime, startBeatOffset = currentSequenceStartBeatRef.current, previewAlreadyScheduled = false) {
    currentSequenceStartBeatRef.current = startBeatOffset;
    curSeqRef.current = seq;
    seqBeatRef.current = 0;
    scheduleObstacle(seq);
    clearMoveLabelTimers();
    if (seq.label) {
      const cueAt = startTime + (seq.labelAtBeat ?? 0) * currentBeatMs();
      const showDelay = Math.max(0, cueAt - performance.now());
      moveLabelShowTimerRef.current = setTimeout(() => {
        setMoveLabel(seq.label);
        setMoveCol(seq.col);
        moveLabelHideTimerRef.current = setTimeout(() => {
          setMoveLabel(null);
          moveLabelHideTimerRef.current = null;
        }, currentBeatMs() * 0.9);
        moveLabelShowTimerRef.current = null;
      }, showDelay);
    }
    const preview = previewAlreadyScheduled ? countInPlannedNextPhraseRef.current : peekUpcomingPhrase(startTime);
    if (preview && !previewAlreadyScheduled) {
      scheduleRhythmForSequence(preview, startTime + seq.spanBeats * currentBeatMs(), startBeatOffset + seq.spanBeats);
    }
    setNextLabel(preview ? (preview.levelHint || preview.label || preview.name) : transitionLabel());
  }

  function updateBoxCue(seq, beat) {
    if (!seq.boxCue) {
      if (boxModeRef.current !== "idle") triggerBoxMode("idle");
      return;
    }
    const start = seq.boxCue.startBeat;
    const end = start + seq.boxCue.durationBeats;
    if (beat < start - 1) {
      if (boxModeRef.current !== "idle") triggerBoxMode("idle");
      return;
    }
    if (beat === start - 1) {
      triggerBoxMode("enter");
      return;
    }
    if (beat >= start && beat < end) {
      triggerBoxMode("hidden");
      return;
    }
    if (beat === end) {
      triggerBoxMode("exit", currentBeatMs() * 0.62);
      return;
    }
    if (boxModeRef.current !== "idle" && beat > end) {
      triggerBoxMode("idle");
    }
  }

  const onBeat = useCallback((beatNow = performance.now()) => {
    if (gameOverRef.current || levelTransitionPausedRef.current || !startedRef.current) return;

    if (!endlessModeRef.current && seqBeatRef.current >= curSeqRef.current.spanBeats && !levelPhraseQueueRef.current.length) {
      const nextLevel = LEVELS[campaignLevelRef.current];
      queueLevelAdvance(nextLevel || null, summarizeLevelTiming());
      return;
    }

    beatNumRef.current += 1;
    const now = beatNow;
    beatTimeRef.current = now;
    setBeatIdx(value => value + 1);

    const b4 = beatNumRef.current % 4;
    hat(b4 === 0 || b4 === 2);
    if (b4 === 0 || b4 === 2) kick(); else snare();
    setBeatFlash(true);
    setTimeout(() => setBeatFlash(false), 80);

    if (seqBeatRef.current >= curSeqRef.current.spanBeats) {
      const next = pullNextPhrase(now);
      if (!next) return;
      beginSequence(next, now, currentSequenceStartBeatRef.current + curSeqRef.current.spanBeats);
    }

    const seq = curSeqRef.current;
    const beat = seqBeatRef.current;
    updateBoxCue(seq, beat);

    const poseName = seq.poses[beat % seq.poses.length];
    let shownPoseName = missRowRef.current >= MISS_LIMIT ? "run_a" : poseName;
    if (GATED_MOVE_POSES.has(poseName) && !hasMoveSupportForBeat(now)) {
      shownPoseName = "whoops";
    }
    goToPose(shownPoseName);

    seqBeatRef.current = beat + 1;
  }, []);

  function clearCountIn(clearPlannedPhrases = true) {
    clearCountInState({
      countInFrameRef,
      countInActiveRef,
      countInTimersRef,
      countInStartRef,
      countInGameStartRef,
      countInPreviewRef,
      countInPlannedPhraseRef,
      countInPlannedNextPhraseRef,
      countInTotalBeatsRef,
      setCountingIn,
      setCountInBeat,
      setCountInRender,
      setCountInPreviewRender,
      resetRhythmLaneMotion,
    }, clearPlannedPhrases);
  }

  function disposeCountIn() {
    disposeCountInState({
      countInFrameRef,
      countInActiveRef,
      countInTimersRef,
      countInStartRef,
      countInGameStartRef,
      countInPreviewRef,
      countInPlannedPhraseRef,
      countInTotalBeatsRef,
      resetRhythmLaneMotion,
    });
  }

  function resetRunState(startLevel = selectedStartLevelRef.current) {
    const startLevelDef = getCampaignLevelDef(startLevel);
    resetIds();
    wxRef.current = 0;
    livesRef.current = MAX_LIVES;
    gameOverRef.current = false;
    metersRef.current = 0;
    laneOriginRef.current = 0;
    startedRef.current = false;
    beatNumRef.current = 0;
    beatTimeRef.current = 0;
    nextBeatAtRef.current = 0;
    currentSequenceStartBeatRef.current = 0;
    curSeqRef.current = PHRASE_BY_ID[startLevelDef.phraseIds[0]];
    seqBeatRef.current = 0;
    lastRhythmRenderSyncAtRef.current = 0;
    lastObstacleRenderSyncAtRef.current = 0;
    lastMetersSyncAtRef.current = 0;
    resetBurglarPresentation();
    notesRef.current = [];
    obsRef.current = [];
    leaderboardCommittedRef.current = false;
    successfulHitTimesRef.current = [];
    playerInputActiveRef.current = false;
    activeInputSourcesRef.current.clear();
    pendingLevelAdvanceRef.current = null;
    levelTransitionPausedRef.current = false;
    clearLevelBanner();
    applyLevelState(startLevelDef, { announce: false });
    setLevelCompleteState(null);
    setTeachingOverlayState(null);
    setMissRow(0);
    setLaserObsRender([]);
    setGuardObsRender([]);
    setRhythmRender([]);
    setMetersCovered(0);
    setLives(MAX_LIVES);
    setScore(0);
    setBeatIdx(0);
    setGameOver(false);
    setStarted(false);
    clearFeedbackFlashState();
    setTapGood(false);
    setEndlessStealValue(0);
    resetRhythmLaneMotion();
    syncMovingLayers();
  }

  function startSelectedMenuMode() {
    const startLevel = selectedStartLevelRef.current;
    resetRunState(startLevel);
    if (selectedMenuModeRef.current === "endless") {
      enterEndlessMode();
      beginCountIn();
      return;
    }
    const intro = getLevelTeachingIntro?.(getCampaignLevelDef(startLevel)) || null;
    if (intro && !seenTeachingIntroIdsRef.current.has(intro.id)) {
      setTeachingOverlayState({ ...intro, startLevel });
      return;
    }
    beginCountIn(startLevel);
  }

  function continueTeachingIntro() {
    const activeIntro = teachingOverlayRef.current;
    if (!activeIntro) return;
    seenTeachingIntroIdsRef.current.add(activeIntro.id);
    setTeachingOverlayState(null);
    beginCountIn(activeIntro.startLevel ?? selectedStartLevelRef.current);
  }

  function startRun(startNow = performance.now()) {
    startRunFlow({
      levelTransitionPausedRef,
      startedRef,
      laneOriginRef,
      currentTravelMs,
      consumeCountInPlannedPhrase,
      countInCommittedNotesRef,
      primeLaneNotes,
      notesRef,
      syncRhythmRenderState,
      beginSequence,
      scheduleRhythmForSequence,
      onBeat,
      nextBeatAtRef,
      currentBeatMs,
      setStarted,
    }, startNow);
  }

  function getCountInNotes(ts) {
    return getCountInNotesForRender({
      ts,
      countInStart: countInStartRef.current,
      countInTotalBeats: countInTotalBeatsRef.current,
      currentBeatMs,
      beatMsToTravelMs,
      rhythmHitX: RHYTHM_HIT_X,
      rhythmSpawnX: RHYTHM_SPAWN_X,
    });
  }

  function getCountInPreviewNotes(ts) {
    return getCountInPreviewNotesForRender({
      ts,
      countInPreview: countInPreviewRef.current,
      currentTravelMs,
      rhythmHitX: RHYTHM_HIT_X,
      rhythmSpawnX: RHYTHM_SPAWN_X,
    });
  }

  function startCountInAnimation() {
    startCountInAnimationLoop({
      countInFrameRef,
      countInActiveRef,
      setCountInRender,
      setCountInPreviewRender,
      getCountInNotes,
      getCountInPreviewNotes,
    });
  }

  function beginCountIn(startLevel = selectedStartLevelRef.current) {
    const createCountInEndlessPhrase = (now = performance.now(), previousName = null) => createEndlessPhrase({
      now,
      previousName,
      endlessStartedAt: endlessStartedAtRef.current,
      endlessPhraseCount: endlessPhraseCountRef.current,
      endlessBpmStepMs: ENDLESS_BPM_STEP_MS,
      blueprints: ENDLESS_BLUEPRINTS,
      makePhrase,
    });
    beginCountInFlow({
      startLevel,
      selectedStartLevelRef,
      getCampaignLevelDef,
      endlessModeRef,
      selectedMenuModeRef,
      endlessQueueRef,
      curSeqRef,
      createEndlessPhrase: createCountInEndlessPhrase,
      phraseById: PHRASE_BY_ID,
      currentBeatMs,
      getBeatsPerBar,
      defaultTimeSignature: DEFAULT_TIME_SIGNATURE,
      getTimeSignatureLabel,
      countInLeadBeatsConst: COUNT_IN_LEAD_BEATS,
      clearCountIn,
      clearFeedbackFlashState,
      resetBurglarPresentation,
      countInActiveRef,
      countInPlannedPhraseRef,
      countInPlannedNextPhraseRef,
      countInTotalBeatsRef,
      countInStartRef,
      countInGameStartRef,
      laneOriginRef,
      buildRhythmNotes,
      countInPreviewRef,
      setCountingIn,
      setCountInBeat,
      resetRhythmLaneMotion,
      setCountInRender,
      setCountInPreviewRender,
      countInFrameRef,
      startCountInAnimation,
      getCountInNotes,
      getCountInPreviewNotes,
      countInTimersRef,
      setBeatIdx,
      hat,
      kick,
      snare,
      setBeatFlash,
      countInCommittedNotesRef,
      startRun,
    });
  }

  useEffect(() => {
    if (!countingIn || !countInActiveRef.current || countInFrameRef.current) return;
    startCountInAnimation();
  }, [countingIn]);

  const handleInputPress = useCallback((sourceId = "tap") => {
    if (!startedRef.current && !countingIn && !levelCompleteOverlayRef.current && !gameOverRef.current) {
      if (teachingOverlayRef.current) {
        continueTeachingIntro();
        return;
      }
      startSelectedMenuMode();
      return;
    }
    if (countInActiveRef.current) return;
    if (levelCompleteOverlayRef.current) {
      if (levelClearPhase === "celebrate") {
        showLevelClearSummary();
        return;
      }
      continueToNextLevel();
      return;
    }
    if (gameOverRef.current) {
      restart();
      return;
    }
    if (activeInputSourcesRef.current.has(sourceId)) return;
    activeInputSourcesRef.current.add(sourceId);
    playerInputActiveRef.current = true;
    const now = performance.now();
    const holdNote = notesRef.current.find(note =>
      note.kind === "hold" &&
      note.requiresPressHold &&
      !note.missed &&
      note.holdStartedAt === null &&
      now >= note.pressWindowStart &&
      now <= note.pressWindowEnd
    ) || null;
    const targetNote = notesRef.current.find(note => note.kind !== "hold" && !note.hit && !note.missed) || null;
    const good = Boolean(targetNote && Math.abs(targetNote.hitTime - now) <= currentWindowMs());
    const inQuietHoldWindow = notesRef.current.some(note =>
      note.kind === "hold" &&
      !note.requiresPressHold &&
      now >= (note.quietStartTime ?? note.holdStartTime) &&
      now <= (note.quietEndTime ?? note.holdEndTime)
    );
    if (holdNote && !good) {
      const holdJudgement = judgeTiming(holdNote.holdStartTime, now);
      registerHoldSuccess(now, holdNote, holdJudgement.kind);
      return;
    }
    if (inQuietHoldWindow && !good) {
      wrongTapSound();
      setMissRow(Math.min(missRowRef.current + 1, MISS_LIMIT));
      return;
    }
    if (good) {
      targetNote.hit = true;
      registerSuccessfulHit(targetNote.hitTime);
      const timingJudgement = judgeTiming(targetNote.hitTime, now);
      recordTimingJudgement(timingJudgement.kind);
      setMissRow(Math.max(0, missRowRef.current - 1));
      syncRhythmRenderState(notesRef.current);
      tapSound(timingJudgement.kind);
    }
    if (!good) {
      setMissRow(Math.min(missRowRef.current + 1, MISS_LIMIT));
      wrongTapSound();
    }
    if (good) {
      setTapGood(true);
      setTimeout(() => setTapGood(false), 160);
    }
  }, [countingIn, levelClearPhase]);

  const handleInputRelease = useCallback((sourceId = "tap") => {
    activeInputSourcesRef.current.delete(sourceId);
    if (!isInputHeld()) {
      maybeFlagEarlyRelease(performance.now());
    }
  }, []);

  useEffect(() => {
    const onKeyDown = event => {
      if (["Space", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        if (event.repeat) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        handleInputPress(event.code);
      }
    };
    const onKeyUp = event => {
      if (["Space", "Enter", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
        handleInputRelease(event.code);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleInputPress, handleInputRelease]);

  useEffect(() => {
    const clearHeldInputs = () => {
      activeInputSourcesRef.current.clear();
    };
    window.addEventListener("blur", clearHeldInputs);
    return () => window.removeEventListener("blur", clearHeldInputs);
  }, []);

  useEffect(() => () => {
    clearTimeout(levelClearPhaseTimerRef.current);
    disposeCountIn();
    clearLevelBanner();
    burglarActorRef.current?.reset();
  }, []);

  useEffect(() => {
    clearTimeout(levelClearPhaseTimerRef.current);
    if (!levelCompleteOverlay) {
      setLevelClearPhase("summary");
      return;
    }
    setLevelClearPhase("celebrate");
    if (levelCompleteOverlay.isCampaignFinale) {
      levelClearPhaseTimerRef.current = null;
      return;
    }
    levelClearPhaseTimerRef.current = setTimeout(() => {
      setLevelClearPhase("summary");
      levelClearPhaseTimerRef.current = null;
    }, 2200);
  }, [levelCompleteOverlay]);

  useEffect(() => {
    setEndlessLeaderboard(loadEndlessLeaderboard());
  }, []);

  useEffect(() => {
    if (!gameOver || !endlessMode || leaderboardCommittedRef.current) return;
    leaderboardCommittedRef.current = true;
    const nextBoard = rankEndlessLeaderboard([
      ...endlessLeaderboard,
      buildEndlessLeaderboardEntry({
        value: endlessStealValue,
        score,
        bpm: currentBpmRef.current,
        meters: metersRef.current,
      }),
    ]);
    saveEndlessLeaderboard(nextBoard);
    setEndlessLeaderboard(nextBoard);
  }, [endlessLeaderboard, endlessMode, endlessStealValue, gameOver, score]);

  useEffect(() => {
    if (!started || gameOver) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
      return;
    }
    const tick = ts => {
      if (!startedRef.current || gameOverRef.current || levelTransitionPausedRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
        ltRef.current = null;
        return;
      }
      if (!ltRef.current) ltRef.current = ts;
      const dt = Math.min(ts - ltRef.current, 50);
      ltRef.current = ts;

      while (nextBeatAtRef.current && ts >= nextBeatAtRef.current) {
        onBeat(nextBeatAtRef.current);
        nextBeatAtRef.current += currentBeatMs();
      }

      const activeQuietHold = notesRef.current.some(note =>
        note.kind === "hold" &&
        !note.requiresPressHold &&
        ts >= (note.freezeStartTime ?? note.holdStartTime) &&
        ts <= (note.freezeEndTime ?? note.holdEndTime)
      );
      const activeHalfHold = notesRef.current.some(note =>
        note.kind === "hold" &&
        note.requiresPressHold &&
        note.holdStartedAt !== null &&
        !note.missed &&
        isInputHeld() &&
        ts >= (note.freezeStartTime ?? note.holdStartTime) &&
        ts <= (note.freezeEndTime ?? note.holdEndTime)
      );
      if (activeQuietHold) {
        if (curPoseRef.current !== "freeze") {
          forcedRestFreezeRef.current = true;
          goToPose("freeze");
        }
      } else if (activeHalfHold) {
        const heldPose = curSeqRef.current.peakPose || "freeze";
        if (curPoseRef.current !== heldPose) {
          goToPose(heldPose);
        }
      } else if (forcedRestFreezeRef.current && curPoseRef.current === "freeze" && curSeqRef.current.name !== "FREEZE") {
        forcedRestFreezeRef.current = false;
        goToPose("run_a");
      }

      let noteChanged = false;
      const noteKeep = [];
      const inputHeldNow = isInputHeld();
      for (const note of notesRef.current) {
        if (note.kind === "hold") {
          if (note.requiresPressHold && !note.missed && playerInputActiveRef.current) {
            if (note.holdStartedAt === null && inputHeldNow && ts >= note.pressWindowStart && ts <= note.pressWindowEnd) {
              const holdJudgement = judgeTiming(note.holdStartTime, ts);
              registerHoldSuccess(ts, note, holdJudgement.kind);
              noteChanged = true;
            }
            const missedStartWindow = note.holdStartedAt === null && ts > note.pressWindowEnd;
            const releasedTooEarly = note.holdStartedAt !== null && ts < note.requiredHoldEndTime && !inputHeldNow;
            if (missedStartWindow || releasedTooEarly) {
              failHoldNote(note);
            }
          } else if (!note.requiresPressHold && !note.missed && playerInputActiveRef.current) {
            const holdingThroughQuietWindow = inputHeldNow &&
              ts >= (note.quietStartTime ?? note.holdStartTime) &&
              ts <= (note.quietEndTime ?? note.holdEndTime);
            if (holdingThroughQuietWindow) {
              failHoldNote(note);
            }
          }
          if (ts > (note.quietEndTime ?? note.holdEndTime) + currentBeatMs() * 0.02) {
            noteChanged = true;
            continue;
          }
          noteKeep.push(note);
          continue;
        }
        if (!note.hit && !note.missed && ts > note.hitTime + currentWindowMs()) {
          if (playerInputActiveRef.current) {
            note.missed = true;
            setMissRow(Math.min(missRowRef.current + 1, MISS_LIMIT));
          }
          noteChanged = true;
        }
        if (ts > note.hitTime + Math.max(currentBeatMs() * 0.78, 260)) {
          noteChanged = true;
          continue;
        }
        noteKeep.push(note);
      }
      if (noteChanged || noteKeep.length !== notesRef.current.length) {
        notesRef.current = noteKeep;
        syncRhythmRenderState(noteKeep);
      }

      wxRef.current += SPEED * (dt / 16.67);
      syncMeters();
      syncMovingLayers(ts);

      let changed = false;
      const keep = [];
      for (const obs of obsRef.current) {
        const dist = (obs.x - wxRef.current) - BURGLAR_X;
        const prevDist = obs.lastDist;
        obs.lastDist = dist;
        if (dist < -180) {
          changed = true;
          continue;
        }
        keep.push(obs);
        const crossedHitLine = prevDist !== null ? prevDist > 0 && dist <= 0 : dist <= 0;
        if (!obs.resolved && crossedHitLine) {
          obs.resolved = true;
          changed = true;
          const effectivePose = playerInputActiveRef.current && missRowRef.current >= 2 ? "run_a" : curPoseRef.current;
          const clears = poseClears(effectivePose, obs.type);
          if (clears) {
            setScore(value => value + 25);
            if (endlessModeRef.current && obs.clearValue) {
              setEndlessStealValue(value => value + obs.clearValue);
            }
            if (obs.type === "guard_patrol") {
              setGuardClearFlash(true);
              setTimeout(() => setGuardClearFlash(false), 700);
            }
          } else {
            obs.hit = true;
            const nextLives = Math.max(0, livesRef.current - 1);
            livesRef.current = nextLives;
            setLives(nextLives);
            setHitFlash(true);
            hitSound();
            if (obs.type === "guard_patrol") {
              setSpottedFlash(true);
              setTimeout(() => {
                setHitFlash(false);
                setSpottedFlash(false);
              }, 700);
            } else {
              setMissFlash(true);
              setTimeout(() => {
                setHitFlash(false);
                setMissFlash(false);
              }, 700);
            }
            if (nextLives <= 0) {
              gameOverRef.current = true;
              goToPose("caught");
              setGameOver(true);
            }
          }
        }
      }
      if (changed) {
        obsRef.current = keep;
        syncObstacleRender(keep);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      ltRef.current = null;
    };
  }, [started, gameOver]);

  const effectiveHighestUnlockedLevel = (DEV_MODE || FORCE_FULL_UNLOCK) ? LEVELS.length : highestUnlockedLevel;

  return {
    rhythmRender,
    laserObsRender,
    guardObsRender,
    metersCovered,
    lives,
    score,
    gameOver,
    started,
    countingIn,
    countInBeat,
    countInRender,
    countInPreviewRender,
    beatFlash,
    hitFlash,
    beatIdx,
    moveLabel,
    moveCol,
    missFlash,
    tooEarlyFlash,
    spottedFlash,
    guardClearFlash,
    tapGood,
    nextLabel,
    rhythmMisses,
    currentLevel,
    stageTitle,
    stageAccent,
    phaseText,
    coaching,
    currentBpm,
    endlessMode,
    endlessStealValue,
    levelBanner,
    endlessLeaderboard,
    highestUnlockedLevel,
    selectedStartLevel,
    selectedMenuMode,
    levelTempoOverrides,
    treasureRoomRecords,
    levelClearPhase,
    levelCompleteOverlay,
    teachingOverlay,
    endlessUnlockNoticeOpen,
    wxRef,
    burglarActorRef,
    laserWorldRef,
    guardWorldRef,
    rhythmMotionRef,
    currentLevelDefRef,
    curSeqRef,
    currentBeatMs,
    getLevelTempoPct,
    getAdjustedCampaignBpm,
    setSelectedStartLevelValue,
    setSelectedMenuModeValue,
    setLevelTempoOverrideValue,
    startSelectedMenuMode,
    previewLevelClearOverlay,
    continueTeachingIntro,
    handleInputPress,
    handleInputRelease,
    restart,
    returnToMenu,
    setEndlessUnlockNoticeOpen,
    effectiveHighestUnlockedLevel,
  };
}
