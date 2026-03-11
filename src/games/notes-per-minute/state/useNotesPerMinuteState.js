import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NPM_BENCHMARK_QUALIFICATION_ACCURACY,
  NPM_FLUENCY_FORMULA_VERSION,
  NPM_GAME_ID,
  NOTE_NAMES,
  QUEUE_SIZE,
} from "../data/constants.js";
import {
  buildPracticeConfig,
  DEFAULT_PRACTICE_SETTINGS,
  getBenchmarkPresetById,
  NPM_BENCHMARK_PRESETS,
  validateRunConfig,
} from "../data/benchmarks.js";
import { midiToNoteName } from "../data/midi.js";
import { playNote } from "../data/music.js";
import { buildNoteGroups } from "../data/noteGroups.js";
import { buildPositionPool, generateNote } from "../data/staff.js";
import { useMidiSetup } from "../hooks/useMidiSetup.js";
import { buildRunSummary, buildTeacherSnapshot } from "../../shared/fluency/sessionPayloads.js";
import { buildBenchmarkDashboard, loadBenchmarkSessions, persistBenchmarkSession } from "./storage.js";

function normalizeMidiAnswer(name) {
  const match = /^([A-G])([#b]?)(-?\d+)$/.exec(name);
  if (!match) return name;
  const [, letter, accidental, octave] = match;
  const enharmonicMap = {
    Db: `C#${octave}`,
    Eb: `D#${octave}`,
    Gb: `F#${octave}`,
    Ab: `G#${octave}`,
    Bb: `A#${octave}`,
  };
  return enharmonicMap[`${letter}${accidental}`] || `${letter}${accidental}${octave}`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `npm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createAttemptsPayload(results) {
  return results.map((attempt) => ({
    correct: attempt.correct,
    note: attempt.note,
    answered: attempt.answered,
    fullName: attempt.fullName,
    time: attempt.time,
    index: attempt.index,
    position: attempt.position,
    clef: attempt.clef,
    noteGroups: attempt.noteGroups,
  }));
}

function createQueuedNotes(runConfig, count = QUEUE_SIZE + 5) {
  const positionPool = buildPositionPool(runConfig.notePool);
  return Array.from({ length: count }, () => (
    generateNote(runConfig.clef, {
      includeAccidentals: runConfig.includeAccidentals,
      positionPool,
      allowLedgerLines: runConfig.allowLedgerLines,
    })
  ));
}

function createSessionPayload({ runConfig, results, startedAt }) {
  const summary = buildRunSummary({
    results,
    runConfig,
    formulaVersion: runConfig.scoringFormulaVersion || NPM_FLUENCY_FORMULA_VERSION,
    qualificationAccuracy: runConfig.qualificationAccuracy || NPM_BENCHMARK_QUALIFICATION_ACCURACY,
  });
  const isBenchmark = runConfig.runType === "benchmark";
  const qualifiedBenchmark = isBenchmark && summary.qualified;
  const status = isBenchmark
    ? (qualifiedBenchmark ? "official-benchmark" : "below-threshold-benchmark")
    : "practice";

  return {
    id: createSessionId(),
    gameId: NPM_GAME_ID,
    runType: runConfig.runType,
    benchmarkId: isBenchmark ? runConfig.id : null,
    presetId: isBenchmark ? runConfig.id : null,
    status,
    officialBenchmark: qualifiedBenchmark,
    qualifiedBenchmark,
    startedAt,
    completedAt: Date.now(),
    config: {
      clef: runConfig.clef,
      notePool: runConfig.notePool,
      accidentalPolicy: runConfig.includeAccidentals ? "enabled" : "naturals-only",
      ledgerLinePolicy: runConfig.allowLedgerLines ? "included" : "excluded",
      durationSeconds: runConfig.durationSeconds,
      inputMode: runConfig.inputMode,
      scoringFormulaVersion: runConfig.scoringFormulaVersion || NPM_FLUENCY_FORMULA_VERSION,
      qualificationAccuracy: runConfig.qualificationAccuracy || NPM_BENCHMARK_QUALIFICATION_ACCURACY,
    },
    summary,
    attempts: createAttemptsPayload(results),
  };
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    tagName === "INPUT"
    || tagName === "TEXTAREA"
    || tagName === "SELECT"
    || target.isContentEditable
  );
}

export function useNotesPerMinuteState() {
  const [screen, setScreen] = useState("menu");
  const [menuSection, setMenuSection] = useState("benchmarks");
  const [menuMessage, setMenuMessage] = useState(null);
  const [practiceSettings, setPracticeSettings] = useState(DEFAULT_PRACTICE_SETTINGS);
  const [activeRun, setActiveRun] = useState(null);
  const [notes, setNotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_PRACTICE_SETTINGS.durationSeconds);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [hasRunStarted, setHasRunStarted] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState(null);
  const [lastAnswerTime, setLastAnswerTime] = useState(null);
  const [completedSession, setCompletedSession] = useState(null);
  const [benchmarkDashboard, setBenchmarkDashboard] = useState(() => buildBenchmarkDashboard([]));
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const timerRef = useRef(null);
  const feedbackTimeoutRef = useRef(null);
  const gameActiveRef = useRef(false);
  const finishRunRef = useRef(false);
  const screenRef = useRef(screen);
  const activeRunRef = useRef(activeRun);
  const notesRef = useRef(notes);
  const currentIndexRef = useRef(currentIndex);
  const resultsRef = useRef(results);
  const lastAnswerTimeRef = useRef(lastAnswerTime);
  const runStartedAtRef = useRef(runStartedAt);

  const { midiDevice, midiStatus } = useMidiSetup();

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    activeRunRef.current = activeRun;
  }, [activeRun]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    lastAnswerTimeRef.current = lastAnswerTime;
  }, [lastAnswerTime]);

  useEffect(() => {
    runStartedAtRef.current = runStartedAt;
  }, [runStartedAt]);

  useEffect(() => {
    let mounted = true;
    loadBenchmarkSessions().then((sessions) => {
      if (!mounted) return;
      setBenchmarkDashboard(buildBenchmarkDashboard(sessions));
      setHistoryLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const practiceConfig = useMemo(
    () => buildPracticeConfig(practiceSettings),
    [practiceSettings],
  );

  const benchmarkCards = useMemo(
    () => NPM_BENCHMARK_PRESETS.map((preset) => ({
      preset,
      history: benchmarkDashboard.historyByPreset[preset.id] || null,
    })),
    [benchmarkDashboard.historyByPreset],
  );

  const clearTransientEffects = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    gameActiveRef.current = false;
  }, []);

  const resetToMenu = useCallback(() => {
    clearTransientEffects();
    finishRunRef.current = false;
    setActiveRun(null);
    setNotes([]);
    setCurrentIndex(0);
    setResults([]);
    setFeedback(null);
    setHasRunStarted(false);
    setRunStartedAt(null);
    setLastAnswerTime(null);
    setCompletedSession(null);
    setTimeLeft(practiceConfig.durationSeconds);
    activeRunRef.current = null;
    notesRef.current = [];
    currentIndexRef.current = 0;
    resultsRef.current = [];
    lastAnswerTimeRef.current = null;
    runStartedAtRef.current = null;
    setScreen("menu");
  }, [clearTransientEffects, practiceConfig.durationSeconds]);

  const startRun = useCallback((runConfig) => {
    const validation = validateRunConfig(runConfig);
    if (!validation.valid) {
      setMenuMessage({
        tone: "error",
        text: `Could not start run: ${validation.reason}`,
      });
      setScreen("menu");
      return false;
    }

    clearTransientEffects();
    const queuedNotes = createQueuedNotes(runConfig);

    setMenuMessage(null);
    setCompletedSession(null);
    setActiveRun(runConfig);
    setNotes(queuedNotes);
    setCurrentIndex(0);
    setResults([]);
    setTimeLeft(runConfig.durationSeconds);
    setFeedback(null);
    setHasRunStarted(false);
    setRunStartedAt(null);
    setLastAnswerTime(null);
    activeRunRef.current = runConfig;
    notesRef.current = queuedNotes;
    currentIndexRef.current = 0;
    resultsRef.current = [];
    lastAnswerTimeRef.current = null;
    runStartedAtRef.current = null;
    setScreen("playing");
    gameActiveRef.current = false;
    finishRunRef.current = false;
    return true;
  }, [clearTransientEffects]);

  const beginRun = useCallback(() => {
    if (!activeRunRef.current || hasRunStarted) return false;
    const startedAt = Date.now();
    setHasRunStarted(true);
    setRunStartedAt(startedAt);
    setLastAnswerTime(startedAt);
    runStartedAtRef.current = startedAt;
    lastAnswerTimeRef.current = startedAt;
    gameActiveRef.current = true;
    return true;
  }, [hasRunStarted]);

  const startBenchmark = useCallback((presetId) => {
    const preset = getBenchmarkPresetById(presetId);
    if (!preset) {
      setMenuMessage({
        tone: "error",
        text: `Benchmark preset "${presetId}" was not found.`,
      });
      return false;
    }
    return startRun(preset);
  }, [startRun]);

  const startPractice = useCallback(() => {
    return startRun(practiceConfig);
  }, [practiceConfig, startRun]);

  const finishRun = useCallback(async (finalResults) => {
    if (finishRunRef.current) return;
    finishRunRef.current = true;
    clearTransientEffects();

    const runConfig = activeRunRef.current;
    const startedAt = runStartedAtRef.current;
    if (!runConfig || !startedAt) {
      setScreen("results");
      return;
    }

    let sessionPayload = createSessionPayload({
      runConfig,
      results: finalResults,
      startedAt,
    });

    if (runConfig.runType === "benchmark") {
      const persistedSessions = await persistBenchmarkSession(sessionPayload);
      const nextDashboard = buildBenchmarkDashboard(persistedSessions);
      const reportingSnapshot = buildTeacherSnapshot(persistedSessions);
      sessionPayload = {
        ...sessionPayload,
        reportingSnapshot,
      };
      setBenchmarkDashboard(nextDashboard);
    } else {
      sessionPayload = {
        ...sessionPayload,
        reportingSnapshot: benchmarkDashboard.teacherSnapshot,
      };
    }

    setCompletedSession(sessionPayload);
    setScreen("results");
  }, [benchmarkDashboard, clearTransientEffects]);

  useEffect(() => {
    if (screen !== "playing" || !activeRun || !hasRunStarted || !runStartedAt) return undefined;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - runStartedAt) / 1000;
      const remaining = Math.max(0, activeRun.durationSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        finishRun(resultsRef.current);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeRun, finishRun, hasRunStarted, runStartedAt, screen]);

  const handleAnswer = useCallback((input, fromMidi = false) => {
    if (!gameActiveRef.current || screenRef.current !== "playing") return;

    const runConfig = activeRunRef.current;
    const currentNote = notesRef.current[currentIndexRef.current];
    if (!runConfig || !currentNote) return;

    const now = Date.now();
    let correct;
    let displayAnswer;

    if (fromMidi) {
      correct = normalizeMidiAnswer(currentNote.fullName) === normalizeMidiAnswer(input);
      displayAnswer = input;
    } else {
      correct = currentNote.name === input.toUpperCase();
      displayAnswer = input.toUpperCase();
    }

    const previousAnswerAt = lastAnswerTimeRef.current || runStartedAtRef.current || now;
    const responseTime = Math.max(0, (now - previousAnswerAt) / 1000);
    const nextAttempt = {
      correct,
      time: responseTime,
      note: currentNote.name,
      answered: displayAnswer,
      fullName: currentNote.fullName,
      index: resultsRef.current.length,
      position: currentNote.position,
      clef: runConfig.clef,
      noteGroups: buildNoteGroups({
        noteName: currentNote.name,
        fullName: currentNote.fullName,
        position: currentNote.position,
        clef: runConfig.clef,
      }),
    };
    const nextResults = [...resultsRef.current, nextAttempt];

    setResults(nextResults);
    resultsRef.current = nextResults;
    setFeedback({ type: correct ? "correct" : "wrong", note: currentNote.name, answered: displayAnswer });
    playNote(currentNote.fullName, correct ? 0.35 : 0.25);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 400);

    setLastAnswerTime(now);
    lastAnswerTimeRef.current = now;

    const nextIndex = currentIndexRef.current + 1;
    setCurrentIndex(nextIndex);
    currentIndexRef.current = nextIndex;

    const replenishedNotes = [
      ...notesRef.current,
      ...createQueuedNotes(runConfig, 3),
    ];
    setNotes(replenishedNotes);
    notesRef.current = replenishedNotes;
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (isTypingTarget(event.target)) return;
      if (activeRunRef.current?.inputMode !== "keyboard") return;
      if (screenRef.current === "playing" && !gameActiveRef.current) {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)) return;
        event.preventDefault();
        beginRun();
        return;
      }
      if (screenRef.current !== "playing") return;
      const key = event.key.toUpperCase();
      if (NOTE_NAMES.includes(key)) {
        event.preventDefault();
        handleAnswer(key, false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [beginRun, handleAnswer]);

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  useEffect(() => {
    if (!midiDevice || activeRun?.inputMode !== "midi") return undefined;

    const onMessage = (event) => {
      const [status, noteNum, velocity] = event.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        if (screenRef.current === "playing" && !gameActiveRef.current) {
          beginRun();
          return;
        }
        const parsed = midiToNoteName(noteNum);
        handleAnswerRef.current(parsed.fullName, true);
      }
    };

    midiDevice.onmidimessage = onMessage;
    return () => {
      midiDevice.onmidimessage = null;
    };
  }, [activeRun?.inputMode, beginRun, midiDevice]);

  const updatePracticeSetting = useCallback((field, value) => {
    setPracticeSettings((current) => {
      const next = {
        ...current,
        [field]: value,
      };
      if (field === "inputMode" && value !== "midi") {
        next.includeAccidentals = false;
      }
      return next;
    });
    setMenuMessage(null);
  }, []);

  const selectMenuSection = useCallback((section) => {
    setMenuMessage(null);
    setMenuSection(section);
  }, []);

  return {
    screen,
    menuSection,
    setMenuSection: selectMenuSection,
    menuMessage,
    practiceSettings,
    updatePracticeSetting,
    benchmarkCards,
    historyLoaded,
    activeRun,
    hasRunStarted,
    notes,
    currentIndex,
    timeLeft,
    results,
    feedback,
    completedSession,
    midiDevice,
    midiStatus,
    handleAnswer,
    beginRun,
    startBenchmark,
    startPractice,
    resetToMenu,
  };
}
