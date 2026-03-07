import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { POWERUPS } from "../data/powerups.js";
import { SONGS } from "../data/songs.js";
import { STAGES } from "../data/stages.js";
import { STORY_CHAPTERS } from "../data/story.js";
import { TIMED_LEVELS, TIMED_SPECIAL_MODES, TIMED_SPECIAL_MODE_MAP } from "../data/timed.js";
import { ARCADE_WORDS, MUSIC_NOTES } from "../data/words.js";
import { getFrequency, playNoteSound, playPowerupSound, playSongMelody, playSuccessChime } from "../hooks/audio.js";
import {
  getButterflyDisplayRemaining,
} from "./gameLogic.js";
import {
  addLBScore,
  addStreakScore,
  getLB,
  getStreakLB,
  loadLB,
  loadPowerups,
  loadProgress,
  loadStats,
  loadStreakLB,
  savePowerups,
  saveProgress,
  saveLB,
  saveStats,
  saveStreakLB,
} from "./leaderboards.js";
import { INITIAL_STATE } from "./initialState.js";
import { createNoteSpellerReducer } from "./reducer.js";

export function useNoteSpellerState() {
  const reducer = useMemo(
    () => createNoteSpellerReducer({ STAGES, POWERUPS, ARCADE_WORDS, STORY_CHAPTERS, SONGS }),
    [],
  );
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderboard, setLeaderboard] = useState([]);
  const [streakLB, setStreakLB] = useState([]);
  const [speakWords, setSpeakWords] = useState(false);
  const [showStaffHint, setShowStaffHint] = useState(false);
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected");
  const [butterflyToken, setButterflyToken] = useState(0);
  const [playingSong, setPlayingSong] = useState(false);
  const [selectedClef, setSelectedClef] = useState(INITIAL_STATE.clef || "treble");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("note-speller-dark-mode") === "true";
    } catch {
      return false;
    }
  });

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const dispatchRef = useRef(dispatch);
  const stateRef = useRef(state);
  const prevStatsRef = useRef(state.stats);
  const prevPURef = useRef(state.powerups);
  const prevProgressRef = useRef({
    unlockedStages: state.unlockedStages,
    stageIndex: state.stageIndex,
    score: state.score,
    timedClefProgress: state.timedClefProgress,
  });
  const prevHLRef = useRef({});
  const prevScrambleHLRef = useRef({});
  const songScrollRef = useRef(null);
  const noteRefs = useRef({});
  const prevStreakLBRef = useRef(false);
  const MIDI_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  dispatchRef.current = dispatch;
  stateRef.current = state;

  const activeClef = state.phase === "menu" ? selectedClef : (state.clef || selectedClef);
  const currentTimedClefProgress = state.timedClefProgress?.[activeClef] || { level3Clears: 0, diamondUnlocked: false, legendaryUnlocked: false };
  const timedTimerCycle = state.phase === "timed" && TIMED_SPECIAL_MODE_MAP[state.timedMode]?.perNote
    ? state.slotIndex
    : state.word?.w;

  const butterflyDisplayRemaining = getButterflyDisplayRemaining({ ...state, clef: activeClef });
  const fullArcadeUnlocked = state.unlockedStages.includes(2);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleUsePowerup = useCallback((id) => {
    if (id === "reveal") {
      dispatch({ type: "USE_REVEAL" });
      playPowerupSound();
    } else if (id === "double") {
      dispatch({ type: "USE_DOUBLE" });
      playPowerupSound();
    } else if (id === "shield") {
      dispatch({ type: "USE_SHIELD" });
      playPowerupSound();
    }
  }, [dispatch]);

  const handleBuyPowerup = useCallback((id) => {
    dispatch({ type: "BUY_POWERUP", id });
    playPowerupSound();
  }, [dispatch]);

  const addLeaderboardScore = useCallback((initials, score, clef) => {
    addLBScore(initials, score, clef);
  }, []);

  const saveLeaderboard = useCallback(() => {
    saveLB();
  }, []);

  const getLeaderboard = useCallback(() => {
    return getLB();
  }, []);

  const addStreakLeaderboardScore = useCallback((initials, streak, clef) => {
    addStreakScore(initials, streak, clef);
  }, []);

  const saveStreakLeaderboard = useCallback(() => {
    saveStreakLB();
  }, []);

  const getStreakLeaderboard = useCallback(() => {
    return getStreakLB();
  }, []);

  function speakWord(word) {
    if (!speakWords || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.85;
    u.pitch = 1.1;
    u.volume = 0.4;
    window.speechSynthesis.speak(u);
  }

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }
    navigator.requestMIDIAccess().then((access) => {
      const update = () => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          setMidiDevice(inputs[0]);
          setMidiStatus("connected");
        } else {
          setMidiDevice(null);
          setMidiStatus("disconnected");
        }
      };
      update();
      access.onstatechange = update;
    }).catch(() => setMidiStatus("unsupported"));
  }, []);

  useEffect(() => {
    if (state.isButterfly) {
      setButterflyToken((t) => t + 1);
    }
  }, [state.isButterfly]);

  useEffect(() => {
    if (state.clef && state.clef !== selectedClef) {
      setSelectedClef(state.clef);
    }
  }, [selectedClef, state.clef]);

  useEffect(() => {
    if (!midiDevice) return;
    const onMsg = (e) => {
      const [status, noteNum, velocity] = e.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const name = MIDI_NOTE_NAMES[noteNum % 12];
        if (name.includes("#")) return;
        const s = stateRef.current;
        if (s.phase === "game" && !s.isDone) dispatchRef.current({ type: "PICK", note: name });
        else if (s.phase === "arcade" && !s.arcadeOver && !s.arcadeWordDone) dispatchRef.current({ type: "ARCADE_PICK", note: name });
        else if (s.phase === "timed" && !s.timedOver && !s.timedWordDone) dispatchRef.current({ type: "TIMED_PICK", note: name });
        else if (s.phase === "story" && !s.storyWordDone) dispatchRef.current({ type: "STORY_PICK", note: name });
        else if (s.phase === "song" && !s.songDone) dispatchRef.current({ type: "SONG_PICK", note: name });
        else if (s.phase === "weak" && !s.isDone) dispatchRef.current({ type: "WEAK_PICK", note: name });
        else if (s.phase === "scramble" && !s.scrambleDone) dispatchRef.current({ type: "SCRAMBLE_PICK", note: name });
      }
    };
    midiDevice.onmidimessage = onMsg;
    return () => {
      midiDevice.onmidimessage = null;
    };
  }, [midiDevice]);

  useEffect(() => {
    loadLB().then(() => setLeaderboard(getLB()));
    loadStreakLB().then(() => setStreakLB(getStreakLB()));
    loadStats().then((saved) => { if (saved) dispatch({ type: "LOAD_STATS", stats: saved }); });
    loadPowerups().then((saved) => {
      if (saved) dispatch({ type: "LOAD_POWERUPS", powerups: saved });
    });
    loadProgress().then((saved) => {
      if (saved) {
        dispatch({
          type: "LOAD_PROGRESS",
          unlockedStages: saved.unlockedStages,
          stageIndex: saved.stageIndex,
          score: saved.score,
          timedClefProgress: saved.timedClefProgress,
          timedDiamondProgress: saved.timedDiamondProgress,
          diamondUnlocked: saved.diamondUnlocked,
          legendaryUnlocked: saved.legendaryUnlocked,
        });
      }
    });
  }, [dispatch]);

  useEffect(() => {
    if (state.stats !== prevStatsRef.current) {
      prevStatsRef.current = state.stats;
      saveStats(state.stats);
    }
  }, [state.stats]);

  useEffect(() => {
    if (state.powerups !== prevPURef.current) {
      prevPURef.current = state.powerups;
      savePowerups(state.powerups);
    }
  }, [state.powerups]);

  useEffect(() => {
    const prev = prevProgressRef.current;
    if (
      state.unlockedStages !== prev.unlockedStages ||
      state.stageIndex !== prev.stageIndex ||
      state.score !== prev.score ||
      state.timedClefProgress !== prev.timedClefProgress
    ) {
      prevProgressRef.current = {
        unlockedStages: state.unlockedStages,
        stageIndex: state.stageIndex,
        score: state.score,
        timedClefProgress: state.timedClefProgress,
      };
      saveProgress({
        unlockedStages: state.unlockedStages,
        stageIndex: state.stageIndex,
        score: state.score,
        timedClefProgress: state.timedClefProgress,
      });
    }
  }, [state.unlockedStages, state.stageIndex, state.score, state.timedClefProgress]);

  useEffect(() => {
    if ((state.isDone || state.storyWordDone) && state.word) speakWord(state.word.w);
  }, [state.isDone, state.storyWordDone, state.word, speakWords]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("note-speller-dark-mode", darkMode ? "true" : "false");
    } catch {
      // Ignore storage failures; the toggle should still work for the current session.
    }
  }, [darkMode]);

  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (!"ABCDEFG".includes(key)) return;
      if (state.phase === "game" && !state.isDone) dispatch({ type: "PICK", note: key });
      else if (state.phase === "arcade" && !state.arcadeOver && !state.arcadeWordDone) dispatch({ type: "ARCADE_PICK", note: key });
      else if (state.phase === "timed" && !state.timedOver && !state.timedWordDone) dispatch({ type: "TIMED_PICK", note: key });
      else if (state.phase === "story" && !state.storyWordDone) dispatch({ type: "STORY_PICK", note: key });
      else if (state.phase === "song" && !state.songDone) dispatch({ type: "SONG_PICK", note: key });
      else if (state.phase === "weak" && !state.isDone) dispatch({ type: "WEAK_PICK", note: key });
      else if (state.phase === "scramble" && !state.scrambleDone) dispatch({ type: "SCRAMBLE_PICK", note: key });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch, state.phase, state.isDone, state.arcadeOver, state.arcadeWordDone, state.timedOver, state.timedWordDone, state.storyWordDone, state.songDone, state.scrambleDone]);

  useEffect(() => {
    if (state.phase !== "arcade" || state.arcadeOver) return;
    clearTimer();
    setTimeLeft(60);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 60 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        dispatch({ type: "ARCADE_END" });
      }
    }, 50);
    return clearTimer;
  }, [clearTimer, dispatch, state.phase, state.arcadeOver]);

  useEffect(() => {
    if (state.phase !== "timed" || state.timedOver || state.timedWordDone) return;
    clearTimer();
    const level = TIMED_LEVELS[state.timedLevel] || TIMED_LEVELS[0];
    const specialMode = TIMED_SPECIAL_MODE_MAP[state.timedMode] || null;
    const duration = specialMode ? specialMode.seconds : level.seconds;
    setTimeLeft(duration);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        dispatch({ type: "TIMED_END" });
      }
    }, 50);
    return clearTimer;
  }, [clearTimer, dispatch, state.phase, state.timedOver, state.timedWordDone, state.timedLevel, state.timedMode, timedTimerCycle]);

  useEffect(() => {
    const actionType = state.phase === "arcade"
      ? "ARCADE_CLEAR"
      : state.phase === "timed"
        ? "TIMED_CLEAR"
      : state.phase === "story"
        ? "STORY_CLEAR"
        : state.phase === "song"
          ? "SONG_CLEAR"
          : state.phase === "weak"
            ? "WEAK_CLEAR"
            : "CLEAR_WRONG";
    const wrongEntry = Object.entries(state.highlights).find(([, v]) => v === "wrong");
    if (!wrongEntry) return;
    const t = setTimeout(() => dispatch({ type: actionType, index: Number(wrongEntry[0]) }), state.phase === "arcade" || state.phase === "timed" ? 300 : 500);
    return () => clearTimeout(t);
  }, [dispatch, state.highlights, state.phase]);

  useEffect(() => {
    if (state.phase !== "scramble" || !state.scrambleHL) return;
    const wrongEntry = Object.entries(state.scrambleHL).find(([, v]) => v === "wrong");
    if (!wrongEntry) return;
    const t = setTimeout(() => dispatch({ type: "SCRAMBLE_CLEAR", index: Number(wrongEntry[0]) }), 500);
    return () => clearTimeout(t);
  }, [dispatch, state.scrambleHL, state.phase]);

  useEffect(() => {
    const revealEntry = Object.entries(state.highlights).find(([, v]) => v === "reveal");
    if (!revealEntry) return;
    if (state.phase === "story") {
      const t = setTimeout(() => dispatch({ type: "STORY_ADVANCE_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    if (state.phase === "weak") {
      const t = setTimeout(() => dispatch({ type: "WEAK_ADVANCE_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    if (state.phase === "game" && state.slotWrongCount >= 3) {
      const t = setTimeout(() => dispatch({ type: "ADVANCE_AFTER_REVEAL" }), 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => dispatch({ type: "ADVANCE_AFTER_REVEAL" }), 1500);
    return () => clearTimeout(t);
  }, [dispatch, state.highlights, state.phase, state.slotWrongCount]);

  useEffect(() => {
    if (!state.arcadeWordDone) return;
    const t = setTimeout(() => dispatch({ type: "ARCADE_ADVANCE" }), 500);
    return () => clearTimeout(t);
  }, [dispatch, state.arcadeWordDone]);

  useEffect(() => {
    if (state.phase !== "timed" || !state.timedWordDone || state.timedOver) return;
    if (state.timedUnlockedMode) return;
    if (state.timedBadgeUnlockedClef) return;
    const t = setTimeout(() => dispatch({ type: "TIMED_ADVANCE" }), 450);
    return () => clearTimeout(t);
  }, [dispatch, state.phase, state.timedWordDone, state.timedOver, state.timedUnlockedMode, state.timedBadgeUnlockedClef]);

  useEffect(() => {
    if (state.phase !== "weak" || !state.isDone) return;
    const t = setTimeout(() => dispatch({ type: "WEAK_NEXT" }), 1800);
    return () => clearTimeout(t);
  }, [dispatch, state.phase, state.isDone]);

  useEffect(() => {
    const prev = prevHLRef.current;
    let extended = false;
    const isSongMode = state.phase === "song";
    if (state.phase === "game") extended = STAGES[state.stageIndex]?.id === 3;
    else if (state.phase === "arcade") extended = state.word && state.word.w.length >= 5;
    else if (state.phase === "timed") extended = state.timedMode !== "normal" || TIMED_LEVELS[state.timedLevel]?.stageIndex === 2;

    Object.entries(state.highlights).forEach(([idx, val]) => {
      if (prev[idx] !== val) {
        if (val === "correct" || val === "reveal") {
          const slotWordIdx = isSongMode ? Number(idx) : state.slots[Number(idx)];
          const note = isSongMode
            ? (state.songNotes && state.songNotes[slotWordIdx])
            : state.word?.w[slotWordIdx];
          if (note && MUSIC_NOTES.has(note.charAt(0))) {
            const freq = getFrequency(note, state.clef || "treble", extended, isSongMode);
            playNoteSound(freq, "correct");
          }
        } else if (val === "wrong") {
          playNoteSound(120, "wrong");
        }
      }
    });
    prevHLRef.current = { ...state.highlights };

    if (state.phase === "scramble" && state.scrambleHL) {
      const prevS = prevScrambleHLRef.current;
      Object.entries(state.scrambleHL).forEach(([idx, val]) => {
        if (prevS[idx] !== val) {
          if (val === "correct" || val === "reveal") {
            const note = state.scrambleWord?.w[Number(idx)];
            if (note && MUSIC_NOTES.has(note)) {
              const freq = getFrequency(note, state.clef || "treble", false, false);
              playNoteSound(freq, "correct");
            }
          } else if (val === "wrong") {
            playNoteSound(120, "wrong");
          }
        }
      });
      prevScrambleHLRef.current = { ...state.scrambleHL };
    }
  }, [STAGES, state.highlights, state.scrambleHL, state.slots, state.word, state.clef, state.stageIndex, state.phase, state.songNotes, state.scrambleWord]);

  useEffect(() => {
    if (state.phase !== "game" || !state.isDone) return;
    if (state.streakMilestone || state.isButterfly) {
      playSuccessChime();
      const delay = state.streakMilestone
        ? (
          state.streakMilestone.tier === "mythic" ? 4200
            : state.streakMilestone.tier === "ultra" || state.streakMilestone.tier === "cosmic" || state.streakMilestone.tier === "rainbow" || state.streakMilestone.tier === "legendary" ? 3800
              : state.streakMilestone.tier === "diamond" ? 3200
                : 3000
        )
        : 2800;
      const t = setTimeout(() => {
        dispatch({ type: "RESET_BFLY" });
        if (state.streak >= 20 && state.streak % 10 === 0) {
          dispatch({ type: "STREAK_LB_ENTER", streak: state.streak });
        } else {
          for (let i = 0; i < STAGES.length; i++) {
            if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
              dispatch({ type: "UNLOCK", index: i });
              return;
            }
          }
          dispatch({ type: "TRANSITION" });
          setTimeout(() => dispatch({ type: "NEXT" }), 300);
        }
      }, delay);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      for (let i = 0; i < STAGES.length; i++) {
        if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
          dispatch({ type: "UNLOCK", index: i });
          return;
        }
      }
      dispatch({ type: "TRANSITION" });
      setTimeout(() => dispatch({ type: "NEXT" }), 300);
    }, 1400);
    return () => clearTimeout(t);
  }, [STAGES, dispatch, state.phase, state.isDone, state.isButterfly, state.streakMilestone, state.score, state.unlockedStages, state.streak]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (state.phase !== "song") return;
    const container = songScrollRef.current;
    const currentEl = noteRefs.current[state.songNoteIndex];
    if (!container || !currentEl) return;
    const containerRect = container.getBoundingClientRect();
    const noteRect = currentEl.getBoundingClientRect();
    const noteCenter = noteRect.left + noteRect.width / 2 - containerRect.left + container.scrollLeft;
    const targetScroll = noteCenter - containerRect.width / 2;
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, [state.songNoteIndex, state.phase]);

  useEffect(() => {
    if (songScrollRef.current) songScrollRef.current.scrollLeft = 0;
    noteRefs.current = {};
  }, [state.songIndex]);

  useEffect(() => {
    const wasInLB = prevStreakLBRef.current;
    const inLB = state.streakLBEntering || state.showStreakLB;
    prevStreakLBRef.current = inLB;
    if (!wasInLB || inLB) return;
    if (state.phase !== "game" || !state.isDone) return;
    for (let i = 0; i < STAGES.length; i++) {
      if (!state.unlockedStages.includes(i) && state.score >= STAGES[i].threshold) {
        dispatch({ type: "UNLOCK", index: i });
        return;
      }
    }
    dispatch({ type: "TRANSITION" });
    setTimeout(() => dispatch({ type: "NEXT" }), 300);
  }, [STAGES, dispatch, state.streakLBEntering, state.showStreakLB, state.phase, state.isDone, state.score, state.unlockedStages]);

  return {
    state: { ...state, clef: activeClef },
    dispatch,
    actions: {
      clearTimer,
      addLeaderboardScore,
      addStreakLeaderboardScore,
      getLeaderboard,
      getStreakLeaderboard,
      handleBuyPowerup,
      handleUsePowerup,
      playSongMelody,
      saveLeaderboard,
      saveStreakLeaderboard,
      setLeaderboard,
      setClef: setSelectedClef,
      setDarkMode,
      setPlayingSong,
      setShowStaffHint,
      setSpeakWords,
      setStreakLB,
      setTimeLeft,
    },
    derived: {
      butterflyDisplayRemaining,
      butterflyToken,
      fullArcadeUnlocked,
      darkMode,
      timedSpecialModes: TIMED_SPECIAL_MODES,
      leaderboard,
      midiDevice,
      midiStatus,
      noteRefs,
      playingSong,
      showStaffHint,
      songScrollRef,
      speakWords,
      streakLB,
      timeLeft,
      currentTimedClefProgress,
      timedLevelConfig: TIMED_LEVELS[state.timedLevel] || TIMED_LEVELS[0],
    },
  };
}
