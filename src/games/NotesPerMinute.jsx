import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { axisBottom, axisLeft } from "d3-axis";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";

// ─── Note/Music Data ────────────────────────────────────────────────
const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];

// ─── Web Audio ──────────────────────────────────────────────────────
const _AudioCtx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
let _audioCtx = null;
function getAudioCtx() {
  if (!_AudioCtx) return null;
  if (!_audioCtx || _audioCtx.state === "closed") _audioCtx = new _AudioCtx();
  if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
  return _audioCtx;
}
const NOTE_FREQ = {
  C2:65.41,D2:73.42,E2:82.41,F2:87.31,G2:98.00,A2:110.0,B2:123.47,
  C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196.00,A3:220.0,B3:246.94,
  C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392.00,A4:440.0,B4:493.88,
  C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880.0,B5:987.77,
  C6:1046.5,D6:1174.7,E6:1318.5,F6:1396.9,G6:1568.0,A6:1760.0,B6:1975.5,
};

function buildLinePath(data, x, y) {
  return data.map((d, index) => `${index === 0 ? "M" : "L"}${x(d.group)},${y(d.accuracy)}`).join(" ");
}

function buildAreaPath(data, x, y, height) {
  if (!data.length) return "";
  const linePath = buildLinePath(data, x, y);
  const first = data[0];
  const last = data[data.length - 1];
  return `${linePath} L${x(last.group)},${height} L${x(first.group)},${height} Z`;
}
function playNote(name, duration = 0.45) {
  const ctx = getAudioCtx(); if (!ctx) return;
  const freq = NOTE_FREQ[name]; if (!freq) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle"; osc.frequency.value = freq;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.16, t + 0.02);
    gain.gain.setValueAtTime(0.16, t + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t); osc.stop(t + duration);
  } catch(e) {}
}

// ─────────────────────────────────────────────────────────────────────
const CLEF_RANGES = {
  Treble: { low: 0, high: 16, clefName: "Treble", clefSymbol: "𝄞" },
  Bass:   { low: -12, high: 4, clefName: "Bass", clefSymbol: "𝄢" },
  Alto:   { low: -6, high: 10, clefName: "Alto", clefSymbol: "𝄡" },
};

// Position 0 = Middle C (C4). Each step = one diatonic note.
function positionToNoteName(pos) {
  const idx = ((pos % 7) + 7) % 7;
  return NOTE_NAMES[idx];
}

function positionToFullName(pos) {
  const idx = ((pos % 7) + 7) % 7;
  const octave = Math.floor(pos / 7) + 4;
  return `${NOTE_NAMES[idx]}${octave}`;
}

function generateNote(clef) {
  const range = CLEF_RANGES[clef];
  const pos = Math.floor(Math.random() * (range.high - range.low + 1)) + range.low;
  return { position: pos, name: positionToNoteName(pos), fullName: positionToFullName(pos) };
}

// ─── Staff Rendering Helpers ────────────────────────────────────────
// Returns the Y pixel for a given diatonic position on the staff
// For treble clef: line positions (bottom to top) are E4(4), G4(6), B4(8), D5(10), F5(12)
// For bass clef: line positions are G2(-8), B2(-6), D3(-4), F3(-2), A3(0) — wait let me recalc
// Position 0 = C4. 
// Treble lines: E4=2, G4=4, B4=6, D5=8, F5=10
// Bass lines: G2=-12, B2=-10, D3=-8, F3=-6, A3=-4
// Alto lines: F3=-1, A3=1, C4=3... hmm let me just use a simpler mapping

function getStaffLines(clef) {
  switch (clef) {
    case "Treble": return [2, 4, 6, 8, 10]; // E4, G4, B4, D5, F5
    case "Bass":   return [-10, -8, -6, -4, -2]; // G2, B2, D3, F3, A3
    case "Alto":   return [-4, -2, 0, 2, 4]; // E3, G3, B3(actually), D4... 
    default: return [2, 4, 6, 8, 10];
  }
}

// Y coordinate: staff center is at y=150. Each half-step (diatonic position) = 8px
function posToY(pos, clef) {
  const lines = getStaffLines(clef);
  const middleLine = lines[2]; // middle line of staff
  const middleY = 150;
  return middleY - (pos - middleLine) * 8;
}

function needsLedgerLines(pos, clef) {
  const lines = getStaffLines(clef);
  const lowest = lines[0];
  const highest = lines[4];
  const ledgers = [];
  
  if (pos < lowest) {
    for (let p = lowest - 2; p >= pos; p -= 2) {
      ledgers.push(p);
    }
  }
  if (pos > highest) {
    for (let p = highest + 2; p <= pos; p += 2) {
      ledgers.push(p);
    }
  }
  return ledgers;
}

// ─── Constants ──────────────────────────────────────────────────────
const GAME_DURATION = 60;
const QUEUE_SIZE = 8;
const NOTE_SPACING = 90;
const STAFF_LEFT = 100;

// ─── MIDI Helpers ───────────────────────────────────────────────────
const MIDI_NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midiNum) {
  const name = MIDI_NOTE_NAMES[midiNum % 12];
  const octave = Math.floor(midiNum / 12) - 1;
  return { letter: name, fullName: `${name}${octave}`, isBlackKey: name.includes("#") };
}

// ─── Main Component ─────────────────────────────────────────────────
export default function NotesPerMinute() {
  const [screen, setScreen] = useState("menu"); // menu | playing | results
  const [clef, setClef] = useState("Treble");
  const [notes, setNotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [results, setResults] = useState([]); // { correct, time, note }
  const [startTime, setStartTime] = useState(null);
  const [lastAnswerTime, setLastAnswerTime] = useState(null);
  const [animOffset, setAnimOffset] = useState(0);
  const [feedback, setFeedback] = useState(null); // { type: 'correct'|'wrong', note }
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const gameActiveRef = useRef(false);
  const feedbackTimeoutRef = useRef(null);
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiDevice, setMidiDevice] = useState(null);
  const [midiStatus, setMidiStatus] = useState("disconnected"); // disconnected | connected | unsupported
  const [inputMode, setInputMode] = useState("keyboard"); // keyboard | midi

  // Generate initial queue
  const initGame = useCallback((selectedClef) => {
    const c = selectedClef || clef;
    const q = [];
    for (let i = 0; i < QUEUE_SIZE + 5; i++) q.push(generateNote(c));
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
  }, [clef]);

  // Timer
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

  // Animation loop for smooth scrolling
  useEffect(() => {
    if (screen === "playing") {
      let lastFrame = performance.now();
      const animate = (now) => {
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [screen]);

  // Handle answer — accepts either letter ("C") or full name ("C4")
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
      // Octave-specific matching for MIDI
      correct = currentNote.fullName === input;
      displayAnswer = input;
    } else {
      // Letter-only matching for keyboard/click
      correct = currentNote.name === input.toUpperCase();
      displayAnswer = input.toUpperCase();
    }

    const responseTime = lastAnswerTime ? (now - (startTime ? lastAnswerTime : now)) / 1000 : 0;

    setResults(prev => [...prev, {
      correct,
      time: responseTime,
      note: currentNote.name,
      answered: displayAnswer,
      fullName: currentNote.fullName,
      index: prev.length
    }]);

    setFeedback({ type: correct ? "correct" : "wrong", note: currentNote.name, answered: displayAnswer });
    // Play the note so students hear what they identified
    playNote(currentNote.fullName, correct ? 0.35 : 0.25);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 400);

    setLastAnswerTime(now);
    setCurrentIndex(prev => prev + 1);
    setAnimOffset(prev => prev + NOTE_SPACING);

    // Add more notes to the queue
    setNotes(prev => {
      const newNotes = [...prev];
      for (let i = 0; i < 3; i++) newNotes.push(generateNote(clef));
      return newNotes;
    });
  }, [screen, startTime, lastAnswerTime, notes, currentIndex, clef]);

  // Keyboard
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

  // ─── MIDI Setup ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiStatus("unsupported");
      return;
    }
    navigator.requestMIDIAccess().then(access => {
      setMidiAccess(access);

      const updateDevices = () => {
        const inputs = Array.from(access.inputs.values());
        if (inputs.length > 0) {
          setMidiDevice(inputs[0]);
          setMidiStatus("connected");
        } else {
          setMidiDevice(null);
          setMidiStatus("disconnected");
        }
      };

      updateDevices();
      access.onstatechange = updateDevices;
    }).catch(() => {
      setMidiStatus("unsupported");
    });
  }, []);

  // MIDI listener
  const handleAnswerRef = useRef(handleAnswer);
  handleAnswerRef.current = handleAnswer;

  useEffect(() => {
    if (!midiDevice || inputMode !== "midi") return;

    const onMessage = (e) => {
      const [status, noteNum, velocity] = e.data;
      // Note-on with velocity > 0
      if ((status & 0xf0) === 0x90 && velocity > 0) {
        const parsed = midiToNoteName(noteNum);
        // Ignore black keys — they're not in the game
        if (parsed.isBlackKey) return;
        handleAnswerRef.current(parsed.fullName, true);
      }
    };

    midiDevice.onmidimessage = onMessage;
    return () => { midiDevice.onmidimessage = null; };
  }, [midiDevice, inputMode]);

  // ─── Stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const correct = results.filter(r => r.correct);
    const wrong = results.filter(r => !r.correct);
    const totalTime = results.reduce((s, r) => s + r.time, 0);
    const avgTime = totalTime / results.length;
    const accuracy = (correct.length / results.length) * 100;
    const npm = totalTime > 0 ? (correct.length / totalTime) * 60 : 0;

    // Per-note accuracy
    const noteStats = {};
    NOTE_NAMES.forEach(n => { noteStats[n] = { correct: 0, total: 0 }; });
    results.forEach(r => {
      noteStats[r.note].total++;
      if (r.correct) noteStats[r.note].correct++;
    });

    // Rolling accuracy (groups of 5)
    const rolling = [];
    for (let i = 0; i < results.length; i += 5) {
      const chunk = results.slice(i, i + 5);
      const acc = chunk.filter(r => r.correct).length / chunk.length;
      rolling.push({ group: Math.floor(i / 5) + 1, accuracy: acc * 100, avgTime: chunk.reduce((s, r) => s + r.time, 0) / chunk.length });
    }

    return { correct: correct.length, wrong: wrong.length, total: results.length, avgTime, accuracy, npm, noteStats, rolling };
  }, [results]);

  // ─── Render ─────────────────────────────────────────────
  if (screen === "menu") return <MenuScreen clef={clef} setClef={setClef} onStart={initGame} midiStatus={midiStatus} inputMode={inputMode} setInputMode={setInputMode} midiDevice={midiDevice} />;
  if (screen === "results") return <ResultsScreen stats={stats} clef={clef} onRestart={() => setScreen("menu")} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-30%", left: "-10%", width: "60%", height: "60%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        width: "100%", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>NPM</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 300, letterSpacing: 2, textTransform: "uppercase" }}>
            {clef} Clef
          </span>
          {inputMode === "midi" && (
            <span style={{
              fontSize: 11, letterSpacing: 1, textTransform: "uppercase", fontWeight: 500,
              color: midiStatus === "connected" ? "#34d399" : "#f87171",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: midiStatus === "connected" ? "#34d399" : "#f87171",
                display: "inline-block",
                boxShadow: midiStatus === "connected" ? "0 0 6px #34d399" : "none",
              }} />
              MIDI {midiStatus === "connected" ? `· ${midiDevice?.name || "Device"}` : "· No device"}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <TimerDisplay timeLeft={timeLeft} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Score</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {results.filter(r => r.correct).length}
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>/{results.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Area */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        width: "100%", maxWidth: 900, padding: "20px 40px",
      }}>
        <StaffView
          notes={notes}
          currentIndex={currentIndex}
          clef={clef}
          animOffset={animOffset}
          feedback={feedback}
        />
      </div>

      {/* Feedback flash */}
      {feedback && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          fontSize: 64, fontWeight: 900, fontFamily: "'Playfair Display', serif",
          color: feedback.type === "correct" ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)",
          pointerEvents: "none",
          animation: "fadeUp 0.4s ease-out forwards",
        }}>
          {feedback.type === "correct" ? "✓" : "✗"}
        </div>
      )}

      {/* Input Buttons */}
      <div style={{
        padding: "24px 40px 40px",
        width: "100%", maxWidth: 700,
      }}>
        {!startTime && (
          <div style={{
            textAlign: "center", marginBottom: 16, fontSize: 14,
            color: "rgba(255,255,255,0.4)", letterSpacing: 1,
            animation: "pulse 2s ease-in-out infinite",
          }}>
            {inputMode === "midi"
              ? "Play a note on your MIDI keyboard to begin"
              : "Press a note key or click to begin"}
          </div>
        )}
        {inputMode !== "midi" && (
          <>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {NOTE_NAMES.map(n => (
                <button
                  key={n}
                  onClick={() => handleAnswer(n, false)}
                  style={{
                    width: 72, height: 72,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#e8e6e1",
                    fontSize: 24, fontWeight: 700,
                    fontFamily: "'Playfair Display', serif",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = "rgba(99,102,241,0.15)";
                    e.target.style.borderColor = "rgba(99,102,241,0.4)";
                    e.target.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = "rgba(255,255,255,0.04)";
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                    e.target.style.transform = "translateY(0)";
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{
              textAlign: "center", marginTop: 12, fontSize: 12,
              color: "rgba(255,255,255,0.25)", letterSpacing: 1,
            }}>
              or use keyboard keys C D E F G A B
            </div>
          </>
        )}
        {inputMode === "midi" && (
          <div style={{
            textAlign: "center", padding: "28px 0",
            background: "rgba(255,255,255,0.02)",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎹</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
              {midiStatus === "connected"
                ? <>Playing via <span style={{ color: "#a5b4fc" }}>{midiDevice?.name || "MIDI Device"}</span> · octave-specific matching</>
                : <span style={{ color: "#f87171" }}>No MIDI device detected — plug one in or switch to keyboard mode</span>
              }
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(1.2); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

// ─── Timer Display ──────────────────────────────────────────────────
function TimerDisplay({ timeLeft }) {
  const pct = timeLeft / GAME_DURATION;
  const color = pct > 0.5 ? "rgba(99,102,241,0.8)" : pct > 0.2 ? "rgba(251,191,36,0.8)" : "rgba(248,113,113,0.8)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx={20} cy={20} r={17} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
        <circle cx={20} cy={20} r={17} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={`${pct * 106.8} 106.8`}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dasharray 0.1s linear" }}
        />
      </svg>
      <div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase" }}>Time</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums", color }}>
          {Math.ceil(timeLeft)}
        </div>
      </div>
    </div>
  );
}

// ─── Staff SVG ──────────────────────────────────────────────────────
function StaffView({ notes, currentIndex, clef, animOffset, feedback }) {
  const staffLines = getStaffLines(clef);
  const clefInfo = CLEF_RANGES[clef];
  const svgWidth = 800;
  const svgHeight = 300;

  return (
    <svg width="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{
      background: "rgba(255,255,255,0.08)",
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.15)",
    }}>
      {/* Staff lines */}
      {staffLines.map((pos, i) => {
        const y = posToY(pos, clef);
        return <line key={i} x1={40} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} />;
      })}

      {/* Clef symbol */}
      <text x={55} y={posToY(staffLines[2], clef) + 8} fontSize={52} fill="rgba(255,255,255,0.6)"
        fontFamily="serif" textAnchor="middle">
        {clefInfo.clefSymbol}
      </text>

      {/* Target line */}
      <line x1={STAFF_LEFT + 40} y1={posToY(staffLines[0], clef) - 30} x2={STAFF_LEFT + 40} y2={posToY(staffLines[4], clef) + 30}
        stroke="rgba(99,102,241,0.5)" strokeWidth={2} strokeDasharray="4 4" />

      {/* Notes */}
      {notes.map((note, i) => {
        const relIdx = i - currentIndex;
        const x = STAFF_LEFT + 40 + relIdx * NOTE_SPACING;
        if (x < 30 || x > svgWidth - 20) return null;
        const y = posToY(note.position, clef);
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;
        const ledgers = needsLedgerLines(note.position, clef);

        let noteColor = "rgba(255,255,255,0.9)";
        if (isCurrent) noteColor = "#a5b4fc";
        if (isPast) noteColor = "rgba(255,255,255,0.15)";

        return (
          <g key={i} style={{ transition: "transform 0.2s ease-out" }}>
            {/* Ledger lines */}
            {ledgers.map((lp, li) => (
              <line key={li} x1={x - 18} y1={posToY(lp, clef)} x2={x + 18} y2={posToY(lp, clef)}
                stroke={isPast ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"} strokeWidth={1.5} />
            ))}
            {/* Note head (ellipse) */}
            <ellipse cx={x} cy={y} rx={12} ry={8}
              fill={isCurrent ? noteColor : isPast ? "none" : "rgba(255,255,255,0.85)"}
              stroke={noteColor}
              strokeWidth={2.5}
              transform={`rotate(-10 ${x} ${y})`}
              style={isCurrent ? {
                filter: "drop-shadow(0 0 12px rgba(165,180,252,0.7))",
              } : {}}
            />
            {/* Stem */}
            {!isPast && (
              <line x1={note.position >= staffLines[2] ? x - 9 : x + 9}
                y1={y}
                x2={note.position >= staffLines[2] ? x - 9 : x + 9}
                y2={note.position >= staffLines[2] ? y + 40 : y - 40}
                stroke={noteColor} strokeWidth={2} />
            )}
            {/* Current highlight */}
            {isCurrent && (
              <circle cx={x} cy={y} r={20} fill="none" stroke="rgba(165,180,252,0.4)" strokeWidth={1.5}>
                <animate attributeName="r" values="18;24;18" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Menu Screen ────────────────────────────────────────────────────
function MenuScreen({ clef, setClef, onStart, midiStatus, inputMode, setInputMode, midiDevice }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      {/* Background */}
      <div style={{
        position: "fixed", top: "-20%", right: "-10%", width: "50%", height: "60%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-10%", width: "40%", height: "50%",
        background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Big musical symbol */}
      <div style={{
        position: "absolute", top: "8%", right: "8%",
        fontSize: 200, color: "rgba(255,255,255,0.02)",
        fontFamily: "serif",
        pointerEvents: "none",
        userSelect: "none",
      }}>𝄞</div>

      <div style={{ textAlign: "center", maxWidth: 500, padding: 40 }}>
        <div style={{
          fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", marginBottom: 16, fontWeight: 300,
        }}>
          Sight Reading Challenge
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 72, fontWeight: 900, letterSpacing: -3,
          margin: "0 0 8px 0",
          background: "linear-gradient(135deg, #e8e6e1 0%, rgba(129,140,248,0.8) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          NPM
        </h1>
        <p style={{
          fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 300,
          margin: "0 0 48px 0", lineHeight: 1.6,
        }}>
          Notes Per Minute
        </p>

        {/* Clef selector */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>
            Select Clef
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {Object.entries(CLEF_RANGES).map(([key, val]) => (
              <button key={key} onClick={() => setClef(key)} style={{
                padding: "16px 28px",
                background: clef === key ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${clef === key ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 12,
                color: clef === key ? "#818cf8" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: 16,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <span style={{ fontSize: 28, display: "block", marginBottom: 4, fontFamily: "serif" }}>
                  {val.clefSymbol}
                </span>
                {key}
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode selector */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12, letterSpacing: 3, textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)", marginBottom: 16,
          }}>
            Input Method
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => setInputMode("keyboard")} style={{
              padding: "14px 24px",
              background: inputMode === "keyboard" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${inputMode === "keyboard" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12,
              color: inputMode === "keyboard" ? "#818cf8" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>⌨️</span>
              Keyboard
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Letter only</div>
            </button>
            <button onClick={() => {
              if (midiStatus !== "unsupported") setInputMode("midi");
            }} style={{
              padding: "14px 24px",
              background: inputMode === "midi" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${inputMode === "midi" ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12,
              color: inputMode === "midi" ? "#818cf8" : midiStatus === "unsupported" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
              cursor: midiStatus === "unsupported" ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              opacity: midiStatus === "unsupported" ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 22, display: "block", marginBottom: 4 }}>🎹</span>
              MIDI
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                Octave-specific
              </div>
            </button>
          </div>
          {inputMode === "midi" && (
            <div style={{
              marginTop: 12, fontSize: 12, textAlign: "center",
              color: midiStatus === "connected" ? "#34d399" : "rgba(255,255,255,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%", display: "inline-block",
                background: midiStatus === "connected" ? "#34d399" : "#f87171",
                boxShadow: midiStatus === "connected" ? "0 0 6px #34d399" : "none",
              }} />
              {midiStatus === "connected"
                ? `Connected: ${midiDevice?.name || "MIDI Device"}`
                : "No MIDI device detected — plug one in"}
            </div>
          )}
          {midiStatus === "unsupported" && inputMode !== "midi" && (
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              MIDI not supported in this browser (use Chrome/Edge)
            </div>
          )}
        </div>

        {/* Start */}
        <button onClick={() => onStart(clef)} style={{
          padding: "18px 56px",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          border: "none",
          borderRadius: 14,
          color: "#fff",
          fontSize: 18,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: 1,
          transition: "all 0.2s ease",
          boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
        }}
        onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.target.style.transform = "translateY(0)"}
        >
          Begin Test
        </button>

        <div style={{
          marginTop: 32, fontSize: 13, color: "rgba(255,255,255,0.2)",
          lineHeight: 1.8,
        }}>
          60 seconds · Identify notes as fast as you can<br />
          {inputMode === "midi"
            ? "Play the correct note on your MIDI keyboard (octave matters!)"
            : "Use keyboard (C D E F G A B) or click the buttons"}
        </div>
      </div>
    </div>
  );
}

// ─── Results Screen ─────────────────────────────────────────────────
function ResultsScreen({ stats, clef, onRestart }) {
  const chartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    if (!stats || !chartRef.current) return;

    const svg = select(chartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    if (stats.rolling.length < 2) {
      g.append("text").attr("x", width / 2).attr("y", height / 2)
        .attr("text-anchor", "middle").attr("fill", "rgba(255,255,255,0.3)")
        .attr("font-size", 14).text("Not enough data for chart");
      return;
    }

    const x = scaleLinear().domain([1, stats.rolling.length]).range([0, width]);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).ticks(stats.rolling.length).tickFormat(d => `${d}`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    // Area
    g.append("path").datum(stats.rolling)
      .attr("fill", "rgba(99,102,241,0.15)")
      .attr("d", buildAreaPath(stats.rolling, x, y, height));

    // Line
    g.append("path").datum(stats.rolling)
      .attr("fill", "none")
      .attr("stroke", "#818cf8")
      .attr("stroke-width", 2.5)
      .attr("d", buildLinePath(stats.rolling, x, y));

    // Dots
    g.selectAll(".dot").data(stats.rolling).enter().append("circle")
      .attr("cx", d => x(d.group))
      .attr("cy", d => y(d.accuracy))
      .attr("r", 4)
      .attr("fill", "#818cf8")
      .attr("stroke", "#0a0a0f")
      .attr("stroke-width", 2);

    // Label
    g.append("text")
      .attr("x", width / 2).attr("y", height + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.3)")
      .attr("font-size", 12)
      .text("Groups of 5 notes →");

  }, [stats]);

  // Bar chart for per-note accuracy
  useEffect(() => {
    if (!stats || !barChartRef.current) return;

    const svg = select(barChartRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const data = NOTE_NAMES.map(n => ({
      note: n,
      accuracy: stats.noteStats[n].total > 0 ? (stats.noteStats[n].correct / stats.noteStats[n].total) * 100 : 0,
      total: stats.noteStats[n].total,
    })).filter(d => d.total > 0);

    const x = scaleBand().domain(data.map(d => d.note)).range([0, width]).padding(0.3);
    const y = scaleLinear().domain([0, 100]).range([height, 0]);

    g.append("g").attr("transform", `translate(0,${height})`)
      .call(axisBottom(x))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.5)").attr("font-size", 13).attr("font-weight", 600);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.append("g")
      .call(axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .selectAll("text").attr("fill", "rgba(255,255,255,0.4)").attr("font-size", 11);
    g.selectAll(".domain, .tick line").attr("stroke", "rgba(255,255,255,0.1)");

    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("x", d => x(d.note))
      .attr("y", d => y(d.accuracy))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.accuracy))
      .attr("rx", 4)
      .attr("fill", d => d.accuracy >= 80 ? "rgba(52,211,153,0.6)" : d.accuracy >= 50 ? "rgba(251,191,36,0.6)" : "rgba(248,113,113,0.6)");

    g.selectAll(".label").data(data).enter().append("text")
      .attr("x", d => x(d.note) + x.bandwidth() / 2)
      .attr("y", d => y(d.accuracy) - 6)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.5)")
      .attr("font-size", 11)
      .text(d => `${Math.round(d.accuracy)}%`);

  }, [stats]);

  if (!stats) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a0f", color: "#e8e6e1",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        <p>No results to show.</p>
        <button onClick={onRestart} style={restartBtnStyle}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e6e1",
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px",
      position: "relative",
      overflow: "auto",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{
        position: "fixed", top: "-20%", left: "20%", width: "50%", height: "50%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        fontSize: 14, letterSpacing: 6, textTransform: "uppercase",
        color: "rgba(255,255,255,0.3)", marginBottom: 8, fontWeight: 300,
      }}>
        Results · {clef} Clef
      </div>

      {/* NPM Score */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 96, fontWeight: 900, letterSpacing: -4,
        background: "linear-gradient(135deg, #e8e6e1, #818cf8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        lineHeight: 1,
      }}>
        {Math.round(stats.npm)}
      </div>
      <div style={{
        fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 40,
        fontWeight: 300, letterSpacing: 2,
      }}>
        Notes Per Minute
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
        marginBottom: 40,
        width: "100%",
        maxWidth: 600,
      }}>
        {[
          { label: "Correct", value: stats.correct, color: "#34d399" },
          { label: "Wrong", value: stats.wrong, color: "#f87171" },
          { label: "Accuracy", value: `${Math.round(stats.accuracy)}%`, color: "#818cf8" },
          { label: "Avg Time", value: `${stats.avgTime.toFixed(2)}s`, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "20px 16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 24,
        width: "100%",
        maxWidth: 560,
        marginBottom: 40,
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Accuracy Over Time
          </div>
          <svg ref={chartRef} width="100%" viewBox="0 0 500 200" />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          padding: 24,
        }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            Per-Note Accuracy
          </div>
          <svg ref={barChartRef} width="100%" viewBox="0 0 500 180" />
        </div>
      </div>

      <button onClick={onRestart} style={{
        padding: "16px 48px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: 14,
        color: "#fff",
        fontSize: 16,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: 1,
        boxShadow: "0 4px 24px rgba(99,102,241,0.3)",
        transition: "all 0.2s ease",
        marginBottom: 40,
      }}
      onMouseEnter={e => e.target.style.transform = "translateY(-2px)"}
      onMouseLeave={e => e.target.style.transform = "translateY(0)"}
      >
        Try Again
      </button>
    </div>
  );
}

const restartBtnStyle = {
  padding: "14px 40px",
  background: "#6366f1",
  border: "none",
  borderRadius: 12,
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
  marginTop: 20,
};
