import { useState, useEffect, useCallback, useRef, useReducer } from "react";

import { clearAllProgressStorage, loadGameState, saveGameValue } from "./storage.js";
import { INITIAL_CLASSIC_STATE } from "./initialState.js";
import { classicReducer } from "./reducer.js";
import {
  noteToMidi,
  midiToChromatic,
  genIntervalQ,
  genClassicQ,
  genChordQ,
  genChordEarQ,
  calcScore,
  dropStreak,
  isEnharmonicMatch,
  getCorrectNoteHighlights,
  countCompletedItems,
  shouldUnlockClassicLevel,
  getWeakIntervals,
} from "./gameLogic.js";
import { INTERVAL_DB, TRAINING_LEVELS, CLASSIC_LEVELS, STREAK_MILESTONES } from "../data/intervals.js";
import { CHORD_EAR_LEVELS } from "../data/chords.js";
import { ACHIEVEMENTS } from "../data/achievements.js";
import { IE_LEVELS } from "../data/journey.js";
import {
  playNote,
  playTwoNotes,
  playTogether,
  playSepThenTogether,
  playSongSnippet,
  playChord,
  playChordArp,
  playChordArpThenTogether,
  playChordSequence,
  playBuzz,
  playChime,
} from "../hooks/audio.js";
import { useMidiInput } from "../hooks/midi.js";

export function useChordSnowmanState() {
  const lastIntervalQKeyRef = useRef(null);
  const lastClassicIvRef = useRef(-1);
  const lastChordEarTypeRef = useRef(-1);
  const [mode, setMode] = useState(null);

  const [tLevel, setTLevel] = useState(0);
  const [tPhase, setTPhase] = useState("explain");
  const [tQ, setTQ] = useState(null);
  const [tHL, setTHL] = useState(null);
  const [tShow, setTShow] = useState(false);
  const [tSong, setTSong] = useState(null);
  const [tScore, setTScore] = useState(0);
  const [tStreak, setTStreak] = useState(0);
  const [tCorrectInLevel, setTCorrectInLevel] = useState(0);
  const [tMissesInLevel, setTMissesInLevel] = useState(0);
  const [tBtnHL, setTBtnHL] = useState({});
  const [tLevelStats, setTLevelStats] = useState({});
  const [tWrongCount, setTWrongCount] = useState(0);
  const [tShowClue, setTShowClue] = useState(false);
  const NEEDED_PER_LEVEL = 5;

  const [classicState, dispatchClassic] = useReducer(classicReducer, INITIAL_CLASSIC_STATE);
  const CLASSIC_NEEDED = 8;
  const {
    level: cLevel,
    question: cQ,
    highlight: cHL,
    showAnswer: cShow,
    songHint: cSong,
    score: cScore,
    streak: cStreak,
    total: cTotal,
    correct: cCorrect,
    buttonHighlights: cBtnHL,
    unlocked: cUnlocked,
    correctInLevel: cCorrectInLevel,
    levelUp: cLevelUp,
    wrongCount: cWrongCount,
    showClue: cShowClue,
  } = classicState;

  const [chords, setChords] = useState([]);
  const [curChord, setCurChord] = useState(null);
  const [chStep, setChStep] = useState(0);
  const [chHL, setChHL] = useState(null);
  const [chBtnHL, setChBtnHL] = useState({});
  const [chScore, setChScore] = useState(0);
  const [chThird, setChThird] = useState(null);
  const [chFifth, setChFifth] = useState(null);
  const [allDone, setAllDone] = useState(false);
  const [bouncing, setBouncing] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [chLocked, setChLocked] = useState(false);
  const [chRound, setChRound] = useState(0);

  const [ceLevel, setCeLevel] = useState(0);
  const [cePhase, setCePhase] = useState("select");
  const [ceQ, setCeQ] = useState(null);
  const [ceHL, setCeHL] = useState(null);
  const [ceCorrect, setCeCorrect] = useState(0);
  const [ceLives, setCeLives] = useState(5);
  const [ceScore, setCeScore] = useState(0);
  const [ceMelt, setCeMelt] = useState(0);
  const [ceSnowmenLost, setCeSnowmenLost] = useState(0);
  const [ceLevelStats, setCeLevelStats] = useState({});

  const [ieLevel, setIeLevel] = useState(0);
  const [iePhase, setIePhase] = useState("select");
  const [ieQ, setIeQ] = useState(null);
  const [ieHL, setIeHL] = useState(null);
  const [ieCorrect, setIeCorrect] = useState(0);
  const [ieHP, setIeHP] = useState(3);
  const [ieScore, setIeScore] = useState(0);
  const [ieLevelStats, setIeLevelStats] = useState({});
  const [ieShowRef, setIeShowRef] = useState(false);

  const [wpPhase, setWpPhase] = useState("menu");
  const [wpIvs, setWpIvs] = useState([]);
  const [wpQ, setWpQ] = useState(null);
  const [wpHL, setWpHL] = useState(null);
  const [wpCorrect, setWpCorrect] = useState(0);
  const [wpTotal, setWpTotal] = useState(0);
  const [wpRound, setWpRound] = useState(0);

  const [showMilestone, setShowMilestone] = useState(null);
  const [catShiver, setCatShiver] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [seenIntro, setSeenIntro] = useState(false);

  const [unlockedAch, setUnlockedAch] = useState({});
  const [showAchPopup, setShowAchPopup] = useState(false);
  const [achToast, setAchToast] = useState(null);
  const achToastTimer = useRef(null);

  const [intervalStats, setIntervalStats] = useState({});
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, started: Date.now() });
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const loaded = await loadGameState();
      if (loaded.tLevelStats) setTLevelStats(loaded.tLevelStats);
      if (loaded.intervalStats) setIntervalStats(loaded.intervalStats);
      if (loaded.sessionStats) setSessionStats({ ...loaded.sessionStats, started: Date.now() });
      if (loaded.cUnlocked) dispatchClassic({ type: "CLASSIC_SET_UNLOCKED", unlocked: loaded.cUnlocked });
      if (loaded.ceLevelStats) setCeLevelStats(loaded.ceLevelStats);
      if (loaded.ieLevelStats) setIeLevelStats(loaded.ieLevelStats);
      if (loaded.seenIntro) setSeenIntro(true);
      if (loaded.achievements) setUnlockedAch(loaded.achievements);
      setStorageLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("tLevelStats", tLevelStats);
  }, [tLevelStats, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("intervalStats", intervalStats);
  }, [intervalStats, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("sessionStats", sessionStats);
  }, [sessionStats, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("cUnlocked", cUnlocked);
  }, [cUnlocked, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("ceLevelStats", ceLevelStats);
  }, [ceLevelStats, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("ieLevelStats", ieLevelStats);
  }, [ieLevelStats, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    saveGameValue("achievements", unlockedAch);
  }, [unlockedAch, storageLoaded]);

  const grantAch = useCallback((id) => {
    setUnlockedAch((prev) => {
      if (prev[id]) return prev;
      const ach = ACHIEVEMENTS.find((item) => item.id === id);
      if (!ach) return prev;
      setAchToast(ach);
      if (achToastTimer.current) clearTimeout(achToastTimer.current);
      achToastTimer.current = setTimeout(() => setAchToast(null), 3000);
      return { ...prev, [id]: Date.now() };
    });
  }, []);

  const recordAnswer = useCallback((intervalIdx, isCorrect) => {
    setIntervalStats((prev) => {
      const cur = prev[intervalIdx] || { correct: 0, wrong: 0 };
      const next = {
        ...prev,
        [intervalIdx]: {
          correct: cur.correct + (isCorrect ? 1 : 0),
          wrong: cur.wrong + (isCorrect ? 0 : 1),
        },
      };
      if (isCorrect) {
        const allHit = INTERVAL_DB.every((_, i) => (next[i]?.correct || 0) >= 1);
        if (allHit) grantAch("all_intervals");
      }
      return next;
    });
    setSessionStats((prev) => {
      const next = {
        correct: prev.correct + (isCorrect ? 1 : 0),
        wrong: prev.wrong + (isCorrect ? 0 : 1),
        started: prev.started,
      };
      const total = next.correct + next.wrong;
      if (isCorrect && next.correct === 1) grantAch("first_correct");
      if (total >= 50) grantAch("total_50");
      if (total >= 200) grantAch("total_200");
      return next;
    });
  }, [grantAch]);

  const timer = useRef(null);
  const milestoneTimer = useRef(null);
  const previewTimer = useRef(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
    if (previewTimer.current) clearTimeout(previewTimer.current);
  }, []);

  const checkMilestone = useCallback((newStreak) => {
    if (newStreak >= 5) grantAch("streak_5");
    if (newStreak >= 10) grantAch("streak_10");
    const hit = STREAK_MILESTONES.find((m) => m.at === newStreak);
    if (hit) {
      setShowMilestone(hit);
      if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
      milestoneTimer.current = setTimeout(() => setShowMilestone(null), 1800);
    }
  }, [grantAch]);

  const triggerShiver = useCallback(() => {
    setCatShiver(true);
    setTimeout(() => setCatShiver(false), 400);
  }, []);

  const playIntervalHalfStepPreview = useCallback((halfSteps) => {
    playNote("C", 4, 0.5, 0);
    const target = midiToChromatic(noteToMidi("C", 4) + halfSteps);
    playNote(target.name, target.octave, 0.5, 0.45);
  }, []);

  const playIntervalSong = useCallback((intervalIdx, dir) => {
    playSongSnippet(intervalIdx, dir);
  }, []);

  const playIntervalPairReplay = useCallback((startName, startOct, targetName, targetOct) => {
    playSepThenTogether(startName, startOct, targetName, targetOct);
  }, []);

  const playIntervalPairSeparate = useCallback((startName, startOct, targetName, targetOct) => {
    playTwoNotes(startName, startOct, targetName, targetOct);
  }, []);

  const playIntervalPairTogether = useCallback((startName, startOct, targetName, targetOct) => {
    playTogether(startName, startOct, targetName, targetOct);
  }, []);

  const normalizeChordNotes = useCallback(
    (notes) => notes.map((note) => (Array.isArray(note) ? note : [note.name, note.octave])),
    [],
  );

  const playChordNotesBoth = useCallback((notes) => {
    playChordArpThenTogether(normalizeChordNotes(notes));
  }, [normalizeChordNotes]);

  const playChordNotesSeparate = useCallback((notes) => {
    playChordArp(normalizeChordNotes(notes));
  }, [normalizeChordNotes]);

  const playChordNotesTogether = useCallback((notes) => {
    playChord(normalizeChordNotes(notes), 0.05);
  }, [normalizeChordNotes]);

  const showClassicClue = useCallback(() => {
    dispatchClassic({ type: "CLASSIC_SHOW_CLUE", show: true });
  }, []);

  const resetAllProgress = useCallback(() => {
    if (!confirm("Reset all progress? This clears training stars, interval stats, and unlocked levels.")) return;
    setTLevelStats({});
    setIntervalStats({});
    setSessionStats({ correct: 0, wrong: 0, started: Date.now() });
    dispatchClassic({ type: "CLASSIC_SET_UNLOCKED", unlocked: 1 });
    setCeLevelStats({});
    setIeLevelStats({});
    setSeenIntro(false);
    setUnlockedAch({});
    clearAllProgressStorage();
    setShowStats(false);
  }, []);

  const buildIntervalQuestion = useCallback((intervalIdx, direction, accidentals = false) => {
    const { question, questionKey } = genIntervalQ(
      intervalIdx,
      direction,
      accidentals,
      lastIntervalQKeyRef.current,
    );
    lastIntervalQKeyRef.current = questionKey;
    return question;
  }, []);

  const buildClassicQuestion = useCallback((level) => {
    const { question, questionKey, intervalIdx } = genClassicQ(
      level,
      lastClassicIvRef.current,
      lastIntervalQKeyRef.current,
    );
    lastClassicIvRef.current = intervalIdx;
    lastIntervalQKeyRef.current = questionKey;
    return question;
  }, []);

  const buildChordEarQuestion = useCallback((level) => {
    const { question, typeIdx } = genChordEarQ(level, lastChordEarTypeRef.current);
    lastChordEarTypeRef.current = typeIdx;
    return question;
  }, []);

  const tGenQ = useCallback((lvl) => {
    const lv = TRAINING_LEVELS[lvl];
    setTQ(buildIntervalQuestion(lv.intervalIdx, lv.direction, false));
    setTHL(null);
    setTShow(false);
    setTSong(null);
    setTBtnHL({});
    setTWrongCount(0);
    setTShowClue(false);
  }, [buildIntervalQuestion]);

  const startTraining = useCallback(() => {
    if (!seenIntro) {
      setShowIntro("training");
      return;
    }
    setMode("training");
    setTPhase("select");
    setTScore(0);
    setTStreak(0);
    setTCorrectInLevel(0);
  }, [seenIntro]);

  const tSelectLevel = useCallback((lvl) => {
    setTLevel(lvl);
    setTPhase("explain");
    setTCorrectInLevel(0);
  }, []);

  const tStartPractice = useCallback(() => {
    setTPhase("practice");
    setTCorrectInLevel(0);
    setTMissesInLevel(0);
    tGenQ(tLevel);
  }, [tGenQ, tLevel]);

  const tPick = useCallback((note) => {
    if (!tQ || tHL === "correct") return;
    const ivIdx = INTERVAL_DB.indexOf(tQ.interval);
    if (note === tQ.targetName) {
      recordAnswer(ivIdx, true);
      const newStreak = tStreak + 1;
      setTHL("correct");
      setTShow(true);
      setTBtnHL({ [note]: "correct" });
      setTScore((s) => s + calcScore(newStreak));
      setTStreak(newStreak);
      checkMilestone(newStreak);
      setTSong(`${tQ.interval.emoji} ${tQ.dir === "up" ? tQ.interval.songUp : tQ.interval.songDown}`);
      playSepThenTogether(tQ.startName, tQ.startOct, tQ.targetName, tQ.targetOct);
      const nextCorrect = tCorrectInLevel + 1;
      setTCorrectInLevel(nextCorrect);
      timer.current = setTimeout(() => {
        if (nextCorrect >= NEEDED_PER_LEVEL) {
          setTLevelStats((prev) => {
            const next = {
              ...prev,
              [tLevel]: {
                score: tScore + calcScore(newStreak),
                perfect: tMissesInLevel === 0,
              },
            };
            if (countCompletedItems(next) >= TRAINING_LEVELS.length) grantAch("train_complete");
            return next;
          });
          setTPhase("levelUp");
        } else {
          tGenQ(tLevel);
        }
      }, 2000);
    } else {
      recordAnswer(ivIdx, false);
      setTHL("wrong");
      setTBtnHL({ [note]: "wrong" });
      setTStreak((s) => dropStreak(s));
      playBuzz();
      setTMissesInLevel((m) => m + 1);
      setTWrongCount((w) => w + 1);
      triggerShiver();
      timer.current = setTimeout(() => {
        setTHL(null);
        setTBtnHL({});
      }, 500);
    }
  }, [tQ, tHL, tStreak, tCorrectInLevel, tLevel, tScore, tMissesInLevel, checkMilestone, countCompletedItems, grantAch, recordAnswer, tGenQ, triggerShiver]);

  useEffect(() => {
    if (mode !== "training" || tPhase !== "practice") return;
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if ("ABCDEFG".includes(key)) tPick(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, tPhase, tPick]);

  const startClassic = useCallback(() => {
    setMode("classic");
    dispatchClassic({ type: "START_CLASSIC", question: buildClassicQuestion(0) });
  }, [buildClassicQuestion]);

  const cSwitchLevel = useCallback((lvl) => {
    if (lvl < cUnlocked) {
      dispatchClassic({ type: "CLASSIC_SWITCH_LEVEL", level: lvl, question: buildClassicQuestion(lvl) });
    }
  }, [buildClassicQuestion, cUnlocked]);

  const cPick = useCallback((note) => {
    if (!cQ || cHL === "correct") return;
    const ivIdx = INTERVAL_DB.indexOf(cQ.interval);
    const target = cQ.targetName;
    const isMatch = isEnharmonicMatch(note, target);

    if (isMatch) {
      recordAnswer(ivIdx, true);
      const newStreak = cStreak + 1;
      dispatchClassic({
        type: "CLASSIC_CORRECT",
        buttonHighlights: getCorrectNoteHighlights(note, target),
        scoreGain: calcScore(newStreak),
        streak: newStreak,
        songHint: `${cQ.interval.emoji} ${cQ.dir === "up" ? cQ.interval.songUp : cQ.interval.songDown}`,
      });
      checkMilestone(newStreak);
      playSepThenTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct);
      const nextC = cCorrectInLevel + 1;
      timer.current = setTimeout(() => {
        if (shouldUnlockClassicLevel(nextC, cLevel, cUnlocked, CLASSIC_NEEDED, CLASSIC_LEVELS.length)) {
          dispatchClassic({
            type: "CLASSIC_LEVEL_UP",
            levelUp: { from: cLevel, to: cLevel + 1 },
            unlocked: Math.max(cUnlocked, cLevel + 2),
          });
        } else {
          dispatchClassic({
            type: "CLASSIC_NEXT_QUESTION",
            question: buildClassicQuestion(cLevel),
            resetCorrectInLevel: nextC >= CLASSIC_NEEDED,
          });
        }
      }, 2200);
    } else {
      recordAnswer(ivIdx, false);
      dispatchClassic({
        type: "CLASSIC_WRONG",
        buttonHighlights: { [note]: "wrong" },
        nextStreak: dropStreak(cStreak),
      });
      playBuzz();
      triggerShiver();
      timer.current = setTimeout(() => dispatchClassic({ type: "CLASSIC_CLEAR_FEEDBACK" }), 500);
    }
  }, [buildClassicQuestion, cQ, cHL, cStreak, cCorrectInLevel, cLevel, cUnlocked, checkMilestone, recordAnswer, triggerShiver]);

  const cPickInterval = useCallback((ivIdx) => {
    if (!cQ || cHL === "correct") return;
    const correctIvIdx = INTERVAL_DB.indexOf(cQ.interval);
    if (ivIdx === correctIvIdx) {
      recordAnswer(correctIvIdx, true);
      const newStreak = cStreak + 1;
      dispatchClassic({
        type: "CLASSIC_CORRECT",
        buttonHighlights: {},
        scoreGain: calcScore(newStreak),
        streak: newStreak,
        songHint: `${cQ.interval.emoji} ${cQ.dir === "up" ? cQ.interval.songUp : cQ.interval.songDown}`,
      });
      checkMilestone(newStreak);
      playSepThenTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct);
      const nextC = cCorrectInLevel + 1;
      timer.current = setTimeout(() => {
        if (shouldUnlockClassicLevel(nextC, cLevel, cUnlocked, CLASSIC_NEEDED, CLASSIC_LEVELS.length)) {
          dispatchClassic({
            type: "CLASSIC_LEVEL_UP",
            levelUp: { from: cLevel, to: cLevel + 1 },
            unlocked: Math.max(cUnlocked, cLevel + 2),
          });
        } else {
          dispatchClassic({
            type: "CLASSIC_NEXT_QUESTION",
            question: buildClassicQuestion(cLevel),
            resetCorrectInLevel: nextC >= CLASSIC_NEEDED,
          });
        }
      }, 2200);
    } else {
      recordAnswer(correctIvIdx, false);
      dispatchClassic({
        type: "CLASSIC_WRONG",
        buttonHighlights: {},
        nextStreak: dropStreak(cStreak),
      });
      playBuzz();
      triggerShiver();
      timer.current = setTimeout(() => dispatchClassic({ type: "CLASSIC_CLEAR_FEEDBACK" }), 500);
    }
  }, [buildClassicQuestion, cQ, cHL, cStreak, cCorrectInLevel, cLevel, cUnlocked, checkMilestone, recordAnswer, triggerShiver]);

  const ackClassicLevelUp = useCallback(() => {
    if (!cLevelUp) return;
    dispatchClassic({ type: "CLASSIC_ACK_LEVEL_UP", level: cLevelUp.to, question: buildClassicQuestion(cLevelUp.to) });
  }, [buildClassicQuestion, cLevelUp]);

  useEffect(() => {
    if (mode !== "classic") return;
    const lv = CLASSIC_LEVELS[cLevel];
    if (lv.earOnly) return;
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if ("ABCDEFG".includes(key)) cPick(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, cLevel, cPick]);

  useEffect(() => {
    if (mode !== "classic") return;
    const lv = CLASSIC_LEVELS[cLevel];
    if (!lv.earOnly || !cQ || cShow) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      playSepThenTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct);
    }, 300);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = null;
    };
  }, [mode, cLevel, cQ, cShow]);

  const chGenQ = useCallback(() => {
    setCurChord(genChordQ());
    setChStep(0);
    setChHL(null);
    setChBtnHL({});
    setChThird(null);
    setChFifth(null);
    setChLocked(false);
  }, []);

  const startChord = useCallback(() => {
    setMode("chord");
    setChords([]);
    setChScore(0);
    setAllDone(false);
    setBouncing(false);
    setShowConf(false);
    setChLocked(false);
    const q = genChordQ();
    setCurChord(q);
    setChStep(0);
    setChHL(null);
    setChBtnHL({});
    setChThird(null);
    setChFifth(null);
  }, []);

  const ceGenQ = useCallback((lvl) => {
    setCeQ(buildChordEarQuestion(lvl));
    setCeHL(null);
  }, [buildChordEarQuestion]);

  useEffect(() => {
    if (mode !== "chordEar" || cePhase !== "practice" || !ceQ) return;
    playChordArpThenTogether(ceQ.notes.map((note) => [note.name, note.octave]));
  }, [mode, cePhase, ceQ, ceCorrect, ceMelt]);

  const startChordEar = useCallback(() => {
    if (!seenIntro) {
      setShowIntro("chordEar");
      return;
    }
    setMode("chordEar");
    setCePhase("select");
    setCeScore(0);
  }, [seenIntro]);

  const ceSelectLevel = useCallback((lvl) => {
    setCeLevel(lvl);
    setCePhase("explain");
  }, []);

  const ceStartPractice = useCallback(() => {
    const lv = CHORD_EAR_LEVELS[ceLevel];
    setCePhase("practice");
    setCeCorrect(0);
    setCeMelt(0);
    setCeSnowmenLost(0);
    setCeLives(lv.lives);
    ceGenQ(ceLevel);
  }, [ceGenQ, ceLevel]);

  const cePick = useCallback((typeIdx) => {
    if (!ceQ || ceHL) return;
    const lv = CHORD_EAR_LEVELS[ceLevel];
    if (typeIdx === ceQ.typeIdx) {
      setCeHL("correct");
      setCeScore((s) => s + 15);
      const nextC = ceCorrect + 1;
      setCeCorrect(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= lv.needed) {
          setCeLevelStats((prev) => ({ ...prev, [ceLevel]: { score: ceScore + 15, snowmenLost: ceSnowmenLost } }));
          grantAch("chord_ear_clear");
          if (ceLevel + 1 >= CHORD_EAR_LEVELS.length) setCePhase("done");
          else setCePhase("levelUp");
        } else {
          ceGenQ(ceLevel);
        }
      }, 3000);
    } else {
      setCeHL("wrong");
      playBuzz();
      const newMelt = ceMelt + 1;
      setCeMelt(newMelt);
      if (newMelt >= 3) {
        const newLives = ceLives - 1;
        setCeLives(newLives);
        setCeSnowmenLost((s) => s + 1);
        timer.current = setTimeout(() => {
          if (newLives <= 0) setCePhase("gameover");
          else {
            setCeMelt(0);
            setCeHL(null);
          }
        }, 1200);
      } else {
        timer.current = setTimeout(() => setCeHL(null), 800);
      }
    }
  }, [ceQ, ceHL, ceLevel, ceCorrect, ceScore, ceMelt, ceLives, ceSnowmenLost, ceGenQ, grantAch]);

  const advanceChordEarLevel = useCallback(() => {
    setCeLevel((lvl) => lvl + 1);
    setCePhase("explain");
  }, []);

  const _lastIeIvRef = useRef(-1);
  const ieGenQ = useCallback((lvl) => {
    const lv = IE_LEVELS[lvl];
    let ivIdx;
    let tries = 0;
    do {
      ivIdx = lv.ivs[Math.floor(Math.random() * lv.ivs.length)];
      tries++;
    } while (ivIdx === _lastIeIvRef.current && lv.ivs.length > 1 && tries < 20);
    _lastIeIvRef.current = ivIdx;
    const q = buildIntervalQuestion(ivIdx, Math.random() < 0.5 ? "up" : "down", true);
    setIeQ(q);
    setIeHL(null);
  }, [buildIntervalQuestion]);

  useEffect(() => {
    if (mode !== "intervalEar" || iePhase !== "practice" || !ieQ) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      playSepThenTogether(ieQ.startName, ieQ.startOct, ieQ.targetName, ieQ.targetOct);
    }, 300);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = null;
    };
  }, [mode, iePhase, ieQ, ieCorrect, ieHP]);

  const startIntervalEar = useCallback(() => {
    if (!seenIntro) {
      setShowIntro("intervalEar");
      return;
    }
    if (!ieLevelStats._seenJourneyIntro) {
      setMode("intervalEar");
      setIePhase("journeyIntro");
      setIeScore(0);
    } else {
      setMode("intervalEar");
      setIePhase("select");
      setIeScore(0);
    }
  }, [ieLevelStats, seenIntro]);

  const ieFinishJourneyIntro = useCallback(() => {
    setIeLevelStats((prev) => ({ ...prev, _seenJourneyIntro: true }));
    const lv = IE_LEVELS[0];
    setIeLevel(0);
    setIePhase("practice");
    setIeCorrect(0);
    setIeHP(lv.hp);
    setIeScore(0);
    ieGenQ(0);
  }, [ieGenQ]);

  const ieSelectLevel = useCallback((lvl) => {
    setIeLevel(lvl);
    setIePhase("explain");
  }, []);

  const ieStartPractice = useCallback(() => {
    const lv = IE_LEVELS[ieLevel];
    setIePhase("practice");
    setIeCorrect(0);
    setIeHP(lv.hp);
    setIeScore(0);
    ieGenQ(ieLevel);
  }, [ieGenQ, ieLevel]);

  const iePick = useCallback((ivIdx) => {
    if (!ieQ || ieHL) return;
    const lv = IE_LEVELS[ieLevel];
    const correctIdx = INTERVAL_DB.indexOf(ieQ.interval);
    if (ivIdx === correctIdx) {
      setIeHL("correct");
      setIeScore((s) => s + 15);
      recordAnswer(correctIdx, true);
      const nextC = ieCorrect + 1;
      setIeCorrect(nextC);
      timer.current = setTimeout(() => {
        if (nextC >= lv.needed) {
          setIeLevelStats((prev) => {
            const next = { ...prev, [ieLevel]: { score: ieScore + 15, hpLeft: ieHP } };
            const cleared = countCompletedItems(next, ["_seenJourneyIntro"]);
            if (cleared >= 3) grantAch("journey_3");
            if (cleared >= IE_LEVELS.length) grantAch("journey_all");
            return next;
          });
          if (ieHP === lv.hp) grantAch("perfect_level");
          if (ieLevel + 1 >= IE_LEVELS.length) setIePhase("done");
          else setIePhase("levelUp");
        } else {
          ieGenQ(ieLevel);
        }
      }, 2200);
    } else {
      setIeHL("wrong");
      recordAnswer(correctIdx, false);
      playBuzz();
      const newHP = ieHP - 1;
      setIeHP(newHP);
      timer.current = setTimeout(() => {
        if (newHP <= 0) setIePhase("gameover");
        else setIeHL(null);
      }, 1000);
    }
  }, [ieQ, ieHL, ieLevel, ieCorrect, ieScore, ieHP, ieGenQ, recordAnswer, grantAch]);

  const chPick = useCallback((note) => {
    if (!curChord || chLocked) return;
    if (chStep === 0) {
      if (note === curChord.third.name) {
        setChHL("correct");
        setChBtnHL({ [note]: "correct" });
        setChThird(note);
        setChScore((s) => s + 10);
        setChLocked(true);
        playNote(curChord.third.name, curChord.third.octave, 0.5);
        timer.current = setTimeout(() => {
          setChStep(1);
          setChHL(null);
          setChBtnHL({});
          setChLocked(false);
        }, 700);
      } else {
        setChHL("wrong");
        setChBtnHL({ [note]: "wrong" });
        playBuzz();
        timer.current = setTimeout(() => {
          setChHL(null);
          setChBtnHL({});
        }, 500);
      }
    } else if (note === curChord.fifth.name) {
      setChHL("correct");
      setChBtnHL({ [note]: "correct" });
      setChFifth(note);
      setChScore((s) => s + 10);
      setChLocked(true);
      playChord([
        [curChord.root, curChord.rootOct],
        [curChord.third.name, curChord.third.octave],
        [curChord.fifth.name, curChord.fifth.octave],
      ]);
      timer.current = setTimeout(() => {
        const newChords = [...chords, {
          root: curChord.root,
          third: curChord.third.name,
          fifth: curChord.fifth.name,
          name: curChord.displayName,
          notes: [
            [curChord.root, curChord.rootOct],
            [curChord.third.name, curChord.third.octave],
            [curChord.fifth.name, curChord.fifth.octave],
          ],
        }];
        setChords(newChords);
        setChRound((r) => {
          const next = r + 1;
          if (next >= 3) grantAch("chords_3");
          if (next >= 10) grantAch("chords_10");
          return next;
        });
        if (newChords.length >= 4) {
          setAllDone(true);
          setBouncing(true);
          setShowConf(true);
          playChordSequence(newChords.map((c) => c.notes), () => setTimeout(() => setShowConf(false), 2000));
          setChLocked(true);
        } else {
          chGenQ();
        }
      }, 1100);
    } else {
      setChHL("wrong");
      setChBtnHL({ [note]: "wrong" });
      playBuzz();
      timer.current = setTimeout(() => {
        setChHL(null);
        setChBtnHL({});
      }, 500);
    }
  }, [curChord, chLocked, chStep, chords, chGenQ, grantAch]);

  const resetChordBuild = useCallback(() => {
    setChords([]);
    setAllDone(false);
    setBouncing(false);
    setShowConf(false);
    setChLocked(false);
    const q = genChordQ();
    setCurChord(q);
    setChStep(0);
    setChHL(null);
    setChBtnHL({});
    setChThird(null);
    setChFifth(null);
  }, []);

  const replayChordBuildSequence = useCallback(() => {
    playChordSequence(chords.map((c) => c.notes));
    setBouncing(true);
    setTimeout(() => setBouncing(false), chords.length * 1200 + 1000);
  }, [chords]);

  useEffect(() => {
    if (mode !== "chord") return;
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if ("ABCDEFG".includes(key)) chPick(key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, chPick]);

  const { midiStatus } = useMidiInput({
    mode,
    tPhase,
    onTrainingPick: tPick,
    onClassicPick: cPick,
    onChordPick: chPick,
  });

  const _lastWpIvRef = useRef(-1);
  const wpGenQ = useCallback((ivs) => {
    let ivIdx;
    let tries = 0;
    do {
      ivIdx = ivs[Math.floor(Math.random() * ivs.length)];
      tries++;
    } while (ivIdx === _lastWpIvRef.current && ivs.length > 1 && tries < 20);
    _lastWpIvRef.current = ivIdx;
    const q = buildIntervalQuestion(ivIdx, Math.random() < 0.5 ? "up" : "down", true);
    setWpQ(q);
    setWpHL(null);
    setWpRound((r) => r + 1);
  }, [buildIntervalQuestion]);

  useEffect(() => {
    if (mode !== "weakSpots" || wpPhase !== "practice" || !wpQ) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      playSepThenTogether(wpQ.startName, wpQ.startOct, wpQ.targetName, wpQ.targetOct);
    }, 300);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = null;
    };
  }, [mode, wpPhase, wpQ, wpRound]);

  const startWeakPractice = useCallback(() => {
    const weak = getWeakIntervals(intervalStats);
    if (weak.length < 2) {
      setMode("weakSpots");
      setWpPhase("menu");
      setWpIvs([]);
      return;
    }
    setMode("weakSpots");
    setWpPhase("menu");
    setWpIvs(weak);
  }, [intervalStats]);

  const wpBegin = useCallback(() => {
    setWpPhase("practice");
    setWpCorrect(0);
    setWpTotal(0);
    wpGenQ(wpIvs);
  }, [wpGenQ, wpIvs]);

  const wpPick = useCallback((ivIdx) => {
    if (!wpQ || wpHL) return;
    const correctIdx = INTERVAL_DB.indexOf(wpQ.interval);
    const newTotal = wpTotal + 1;
    setWpTotal(newTotal);
    if (ivIdx === correctIdx) {
      setWpHL("correct");
      recordAnswer(correctIdx, true);
      const newC = wpCorrect + 1;
      setWpCorrect(newC);
      playChime();
      timer.current = setTimeout(() => {
        if (newTotal >= 10) {
          if (Math.round((newC / newTotal) * 100) >= 80) grantAch("weak_80");
          setWpPhase("done");
        } else {
          wpGenQ(wpIvs);
        }
      }, 1800);
    } else {
      setWpHL("wrong");
      recordAnswer(correctIdx, false);
      playBuzz();
      timer.current = setTimeout(() => {
        if (newTotal >= 10) {
          if (Math.round((wpCorrect / newTotal) * 100) >= 80) grantAch("weak_80");
          setWpPhase("done");
        } else {
          wpGenQ(wpIvs);
        }
      }, 2200);
    }
  }, [wpQ, wpHL, wpTotal, wpCorrect, wpIvs, wpGenQ, recordAnswer, grantAch]);

  const goMenu = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMode(null);
  }, []);

  const dismissIntro = useCallback(() => {
    const target = showIntro;
    setSeenIntro(true);
    setShowIntro(false);
    saveGameValue("seenIntro", "1");
    if (target === "training") {
      setMode("training");
      setTPhase("select");
      setTScore(0);
      setTStreak(0);
      setTCorrectInLevel(0);
    } else if (target === "chordEar") {
      setMode("chordEar");
      setCePhase("select");
      setCeScore(0);
    } else if (target === "intervalEar") {
      setMode("intervalEar");
      setIePhase("select");
      setIeScore(0);
    }
  }, [showIntro]);

  const state = {
    phase: mode || "menu",
    mode,
    tLevel,
    tPhase,
    tQ,
    tHL,
    tShow,
    tSong,
    tScore,
    tStreak,
    tCorrectInLevel,
    tMissesInLevel,
    tBtnHL,
    tLevelStats,
    tWrongCount,
    tShowClue,
    NEEDED_PER_LEVEL,
    cLevel,
    cQ,
    cHL,
    cShow,
    cSong,
    cScore,
    cStreak,
    cTotal,
    cCorrect,
    cBtnHL,
    cUnlocked,
    cCorrectInLevel,
    cLevelUp,
    cWrongCount,
    cShowClue,
    CLASSIC_NEEDED,
    chords,
    curChord,
    chStep,
    chHL,
    chBtnHL,
    chScore,
    chThird,
    chFifth,
    allDone,
    bouncing,
    showConf,
    chLocked,
    chRound,
    ceLevel,
    cePhase,
    ceQ,
    ceHL,
    ceCorrect,
    ceLives,
    ceScore,
    ceMelt,
    ceSnowmenLost,
    ceLevelStats,
    ieLevel,
    iePhase,
    ieQ,
    ieHL,
    ieCorrect,
    ieHP,
    ieScore,
    ieLevelStats,
    ieShowRef,
    wpPhase,
    wpIvs,
    wpQ,
    wpHL,
    wpCorrect,
    wpTotal,
    wpRound,
    showMilestone,
    catShiver,
    showStats,
    showIntro,
    seenIntro,
    unlockedAch,
    showAchPopup,
    achToast,
    intervalStats,
    sessionStats,
    midiStatus,
  };

  const actions = {
    setTLevel,
    setTPhase,
    setTCorrectInLevel,
    setTLevelStats,
    setTShowClue,
    dispatchClassic,
    setCeLevel,
    setCePhase,
    setCeLevelStats,
    setIePhase,
    setIeLevelStats,
    setIeShowRef,
    setShowStats,
    setSeenIntro,
    setUnlockedAch,
    setShowAchPopup,
    setIntervalStats,
    setSessionStats,
    playIntervalHalfStepPreview,
    playIntervalSong,
    playIntervalPairReplay,
    playIntervalPairSeparate,
    playIntervalPairTogether,
    playChordNotesBoth,
    playChordNotesSeparate,
    playChordNotesTogether,
    showClassicClue,
    resetAllProgress,
    startTraining,
    tSelectLevel,
    tStartPractice,
    tPick,
    startClassic,
    cSwitchLevel,
    cPick,
    cPickInterval,
    ackClassicLevelUp,
    startChord,
    chPick,
    resetChordBuild,
    replayChordBuildSequence,
    startChordEar,
    ceSelectLevel,
    ceStartPractice,
    cePick,
    advanceChordEarLevel,
    startIntervalEar,
    ieFinishJourneyIntro,
    ieSelectLevel,
    ieStartPractice,
    iePick,
    startWeakPractice,
    wpBegin,
    wpPick,
    goMenu,
    dismissIntro,
  };

  return { state, actions };
}
