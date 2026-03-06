import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACCIDENTAL_DISPLAY_NAMES, CHROMATIC_NOTE_NAMES, GAME_DURATION, NOTE_NAMES, NOTE_SPACING, QUEUE_SIZE } from "../data/constants.js";
import { midiToNoteName } from "../data/midi.js";
import { playNote } from "../data/music.js";
import { generateNote } from "../data/staff.js";
import { useMidiSetup } from "../hooks/useMidiSetup.js";

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

export function useNotesPerMinuteState() {
  const [screen, setScreen] = useState("menu");
  const [clef, setClef] = useState("Treble");
  const [notes, setNotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [results, setResults] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [lastAnswerTime, setLastAnswerTime] = useState(null);
  const [animOffset, setAnimOffset] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [inputMode, setInputMode] = useState("keyboard");

  const animRef = useRef(null);
  const timerRef = useRef(null);
  const gameActiveRef = useRef(false);
  const feedbackTimeoutRef = useRef(null);

  const { midiAccess, midiDevice, midiStatus } = useMidiSetup();
  const shouldIncludeAccidentals = inputMode === "midi";

  const initGame = useCallback((selectedClef) => {
    const c = selectedClef || clef;
    const q = [];
    for (let i = 0; i < QUEUE_SIZE + 5; i++) {
      q.push(generateNote(c, { includeAccidentals: shouldIncludeAccidentals }));
    }

    setNotes(q);
    setCurrentIndex(0);
    setResults([]);
    setTimeLeft(GAME_DURATION);
    setStartTime(null);
    setLastAnswerTime(null);
    setAnimOffset(0);
    setFeedback(null);
    setScreen("playing");
    gameActiveRef.current = true;
  }, [clef, shouldIncludeAccidentals]);

  const exitToMenu = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    gameActiveRef.current = false;
    setFeedback(null);
    setStartTime(null);
    setLastAnswerTime(null);
    setTimeLeft(GAME_DURATION);
    setScreen("menu");
  }, []);

  useEffect(() => {
    if (screen === "playing" && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = Math.max(0, GAME_DURATION - elapsed);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          gameActiveRef.current = false;
          setScreen("results");
        }
      }, 50);
      return () => clearInterval(timerRef.current);
    }
  }, [screen, startTime]);

  useEffect(() => {
    if (screen === "playing") {
      const animate = () => {
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [screen]);

  const handleAnswer = useCallback((input, fromMidi = false) => {
    if (!gameActiveRef.current || screen !== "playing") return;

    const now = Date.now();
    if (!startTime) {
      setStartTime(now);
      setLastAnswerTime(now);
    }

    const currentNote = notes[currentIndex];
    if (!currentNote) return;

    let correct;
    let displayAnswer;
    if (fromMidi) {
      correct = normalizeMidiAnswer(currentNote.fullName) === normalizeMidiAnswer(input);
      displayAnswer = input;
    } else {
      correct = currentNote.name === input.toUpperCase();
      displayAnswer = input.toUpperCase();
    }

    const responseTime = lastAnswerTime ? (now - (startTime ? lastAnswerTime : now)) / 1000 : 0;

    setResults((prev) => [...prev, {
      correct,
      time: responseTime,
      note: currentNote.name,
      answered: displayAnswer,
      fullName: currentNote.fullName,
      index: prev.length,
    }]);

    setFeedback({ type: correct ? "correct" : "wrong", note: currentNote.name, answered: displayAnswer });
    playNote(currentNote.fullName, correct ? 0.35 : 0.25);

    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 400);

    setLastAnswerTime(now);
    setCurrentIndex((prev) => prev + 1);
    setAnimOffset((prev) => prev + NOTE_SPACING);

    setNotes((prev) => {
      const newNotes = [...prev];
      for (let i = 0; i < 3; i++) {
        newNotes.push(generateNote(clef, { includeAccidentals: shouldIncludeAccidentals }));
      }
      return newNotes;
    });
  }, [screen, startTime, lastAnswerTime, notes, currentIndex, clef, shouldIncludeAccidentals]);

  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toUpperCase();
      if (NOTE_NAMES.includes(key)) {
        e.preventDefault();
        handleAnswer(key, false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAnswer]);

  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  useEffect(() => {
    if (!midiDevice || inputMode !== "midi") return;

    const onMessage = (e) => {
      const [status, noteNum, velocity] = e.data;
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const parsed = midiToNoteName(noteNum);
        handleAnswerRef.current(parsed.fullName, true);
      }
    };

    midiDevice.onmidimessage = onMessage;
    return () => { midiDevice.onmidimessage = null; };
  }, [midiDevice, inputMode]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const correct = results.filter((r) => r.correct);
    const wrong = results.filter((r) => !r.correct);
    const totalTime = results.reduce((s, r) => s + r.time, 0);
    const avgTime = totalTime / results.length;
    const accuracy = (correct.length / results.length) * 100;
    const npm = totalTime > 0 ? (correct.length / totalTime) * 60 : 0;

    const noteStats = {};
    [...NOTE_NAMES, ...CHROMATIC_NOTE_NAMES.filter((name) => name.includes("#")), ...ACCIDENTAL_DISPLAY_NAMES.filter((name) => name.includes("b"))].forEach((n) => {
      noteStats[n] = { correct: 0, total: 0 };
    });
    results.forEach((r) => {
      if (!noteStats[r.note]) noteStats[r.note] = { correct: 0, total: 0 };
      noteStats[r.note].total++;
      if (r.correct) noteStats[r.note].correct++;
    });

    const rolling = [];
    for (let i = 0; i < results.length; i += 5) {
      const chunk = results.slice(i, i + 5);
      const acc = chunk.filter((r) => r.correct).length / chunk.length;
      rolling.push({
        group: Math.floor(i / 5) + 1,
        accuracy: acc * 100,
        avgTime: chunk.reduce((s, r) => s + r.time, 0) / chunk.length,
      });
    }

    return { correct: correct.length, wrong: wrong.length, total: results.length, avgTime, accuracy, npm, noteStats, rolling };
  }, [results]);

  return {
    screen,
    setScreen,
    clef,
    setClef,
    notes,
    currentIndex,
    timeLeft,
    results,
    startTime,
    animOffset,
    feedback,
    midiAccess,
    midiDevice,
    midiStatus,
    inputMode,
    setInputMode,
    initGame,
    exitToMenu,
    handleAnswer,
    stats,
  };
}
