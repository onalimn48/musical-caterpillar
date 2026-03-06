import {
  displayName,
  shortDisplay,
  enharmonic,
  noteToMidi,
  midiToChromatic,
  getAccuracyPercent,
  countCompletedItems,
} from "../../state/gameLogic.js";
import {
  ff,
  css,
} from "../../data/theme.js";
import { CHROMATIC, NOTE_ORDER, CHROMATIC_BUTTONS } from "../../data/musicTheory.js";
import {
  SONG_SNIPPETS,
  INTERVAL_DB,
  TRAINING_LEVELS,
  CLASSIC_LEVELS,
} from "../../data/intervals.js";
import { CHORD_TYPES, CHORD_EAR_LEVELS } from "../../data/chords.js";
import { ACHIEVEMENTS } from "../../data/achievements.js";
import { IE_OBSTACLES, IE_LEVELS } from "../../data/journey.js";
import {
  NoteOnStaff,
  DualStaff,
  Snowman,
  MeltingSnowman,
  Snowflakes,
  Confetti,
  NoteBtn,
  EnharmonicBtn,
  StreakCelebration,
  WinterCaterpillar,
  ExplanationOverlay,
} from "../ui.jsx";

export default function PhaseRouter({ state, actions }) {
  const {
    mode,
    tLevel,
    setTLevel,
    tPhase,
    setTPhase,
    tQ,
    tHL,
    tShow,
    tSong,
    tScore,
    tStreak,
    tCorrectInLevel,
    setTCorrectInLevel,
    tMissesInLevel,
    tBtnHL,
    tLevelStats,
    setTLevelStats,
    tWrongCount,
    tShowClue,
    setTShowClue,
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
    setCeLevel,
    cePhase,
    setCePhase,
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
    setIePhase,
    ieQ,
    ieHL,
    ieCorrect,
    ieHP,
    ieScore,
    ieLevelStats,
    ieShowRef,
    setIeShowRef,
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
    setShowStats,
    showIntro,
    unlockedAch,
    showAchPopup,
    setShowAchPopup,
    achToast,
    intervalStats,
    sessionStats,
    midiStatus,
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
  } = { ...state, ...actions };

  // Intro overlay — "What is an interval?"
  const IntroOverlay = () => {
    if (!showIntro) return null;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}
        onClick={dismissIntro}>
        <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 24px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}
          onClick={e => e.stopPropagation()}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:40,marginBottom:6}}>🎵</div>
            <h2 style={{color:"white",fontSize:24,margin:"0 0 6px"}}>What is an Interval?</h2>
            <p style={{color:"#a5b4fc",fontSize:14,margin:0}}>The building block of all music</p>
          </div>

          <div style={{background:"rgba(99,102,241,.08)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.7,margin:"0 0 10px"}}>
              An <span style={{color:"white",fontWeight:700}}>interval</span> is the distance between two notes. 
              It's measured in <span style={{color:"white",fontWeight:700}}>half steps</span> — the smallest step on a piano (one key to the very next).
            </p>
            <p style={{color:"#c4b5fd",fontSize:14,lineHeight:1.7,margin:0}}>
              Every melody and every chord is made of intervals. Learning to recognize them lets you understand how music works!
            </p>
          </div>

          {/* Visual: piano keys showing half steps */}
          <div style={{background:"rgba(0,0,0,.2)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
            <div style={{color:"#818cf8",fontSize:11,fontWeight:600,marginBottom:8,textAlign:"center"}}>A piano keyboard — each key to the next is 1 half step</div>
            <div style={{display:"flex",justifyContent:"center",gap:1,marginBottom:8}}>
              {["C","","D","","E","F","","G","","A","","B"].map((n, i) => {
                const isBlack = [1,3,6,8,10].includes(i);
                return (
                  <div key={i} style={{width:isBlack?18:26,height:isBlack?40:60,background:isBlack?"#1e1b4b":"white",borderRadius:"0 0 4px 4px",border:"1px solid #444",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:3,marginTop:isBlack?0:0,zIndex:isBlack?2:1,marginLeft:isBlack?-9:0,marginRight:isBlack?-9:0}}>
                    {n && <span style={{fontSize:9,color:isBlack?"#818cf8":"#4b5563",fontWeight:600}}>{n}</span>}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"#a5b4fc"}}>C → D = <span style={{color:"white",fontWeight:700}}>2 half steps</span> (Major 2nd)</span>
              <span style={{fontSize:12,color:"#a5b4fc"}}>C → E = <span style={{color:"white",fontWeight:700}}>4 half steps</span> (Major 3rd)</span>
            </div>
          </div>

          {/* Key intervals with audio */}
          <div style={{background:"rgba(99,102,241,.08)",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
            <div style={{color:"#a5b4fc",fontSize:12,fontWeight:600,marginBottom:8}}>Some intervals to try:</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
              {[
                { name: "Minor 2nd", half: 1, emoji: "🦈" },
                { name: "Major 3rd", half: 4, emoji: "🎺" },
                { name: "Perfect 5th", half: 7, emoji: "⭐" },
                { name: "Octave", half: 12, emoji: "🌈" },
              ].map((iv, i) => (
                <button key={i} onClick={() => playIntervalHalfStepPreview(iv.half)}
                  style={{padding:"6px 10px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"white",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:16}}>{iv.emoji}</div>
                  <div style={{fontSize:10,color:"#a5b4fc"}}>{iv.name}</div>
                  <div style={{fontSize:9,color:"#818cf8"}}>{iv.half} half steps</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{background:"rgba(34,197,94,.08)",borderRadius:12,padding:"10px 16px",marginBottom:18}}>
            <p style={{color:"#86efac",fontSize:13,lineHeight:1.6,margin:0,textAlign:"center"}}>
              🎧 <span style={{fontWeight:700}}>Tip:</span> Each interval has a unique sound. You can learn to recognize them by associating them with famous songs!
            </p>
          </div>

          <button onClick={dismissIntro}
            style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(99,102,241,.4)"}}>
            Got it — let's go! 🎵
          </button>
        </div>
      </div>
    );
  };

  // Stats panel
  // ── Achievement Toast ──
  const AchToast = () => {
    if (!achToast) return null;
    return (
      <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",zIndex:999,animation:"slideIn .4s ease",pointerEvents:"none"}}>
        <div style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",borderRadius:16,padding:"10px 20px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 30px rgba(245,158,11,.4)"}}>
          <span style={{fontSize:28}}>{achToast.icon}</span>
          <div>
            <div style={{color:"white",fontSize:13,fontWeight:800}}>🏆 {achToast.name}!</div>
            <div style={{color:"rgba(255,255,255,.8)",fontSize:11}}>{achToast.desc}</div>
          </div>
        </div>
      </div>
    );
  };

  // ── Trophy Case Popup ──
  const TrophyCase = () => {
    if (!showAchPopup) return null;
    const count = countCompletedItems(unlockedAch);
    return (
      <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)"}}
        onClick={() => setShowAchPopup(false)}>
        <div style={{background:"linear-gradient(180deg,#451a03,#7c2d12)",borderRadius:24,padding:"24px 20px",maxWidth:420,width:"92%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"popIn .3s ease",fontFamily:ff}}
          onClick={e => e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{color:"white",fontSize:20,fontWeight:700,margin:0}}>🏆 Achievements</h2>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:"#fde68a",fontSize:13,fontWeight:600}}>{count}/{ACHIEVEMENTS.length}</span>
              <button onClick={() => setShowAchPopup(false)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,width:32,height:32,color:"white",fontSize:16,cursor:"pointer",fontFamily:ff}}>✕</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {ACHIEVEMENTS.map(ach => {
              const got = !!unlockedAch[ach.id];
              return (
                <div key={ach.id} style={{background: got ? "rgba(245,158,11,.1)" : "rgba(0,0,0,.2)",border:`1px solid ${got ? "rgba(245,158,11,.3)" : "rgba(255,255,255,.06)"}`,borderRadius:12,padding:"10px 10px",textAlign:"center",opacity:got?1:.45}}>
                  <div style={{fontSize:28,marginBottom:2,filter:got?"none":"grayscale(1)"}}>{ach.icon}</div>
                  <div style={{color:got?"white":"#9ca3af",fontSize:12,fontWeight:700}}>{ach.name}</div>
                  <div style={{color:got?"#fed7aa":"#6b7280",fontSize:10,lineHeight:1.3}}>{ach.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const StatsPanel = () => {
    if (!showStats) return null;
    const total = sessionStats.correct + sessionStats.wrong;
    const pct = getAccuracyPercent(sessionStats.correct, total);
    const elapsed = Math.floor((Date.now() - sessionStats.started) / 60000);
    const mins = elapsed < 1 ? "<1" : elapsed;

    // Sort intervals by most attempted
    const ivEntries = INTERVAL_DB.map((iv, i) => {
      const s = intervalStats[i];
      if (!s) return null;
      const t = s.correct + s.wrong;
      return { iv, idx: i, correct: s.correct, wrong: s.wrong, total: t, pct: getAccuracyPercent(s.correct, t) };
    }).filter(Boolean).sort((a, b) => b.total - a.total);

    const best = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct > b.pct ? a : b) : null;
    const worst = ivEntries.length > 0 ? ivEntries.reduce((a, b) => a.pct < b.pct ? a : b) : null;

    return (
      <div style={{position:"fixed",inset:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(6px)"}}
        onClick={() => setShowStats(false)}>
        <div style={{background:"linear-gradient(180deg,#1e1b4b,#312e81)",borderRadius:24,padding:"24px 20px",maxWidth:420,width:"92%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"popIn .3s ease",fontFamily:ff}}
          onClick={e => e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h2 style={{color:"white",fontSize:20,fontWeight:700,margin:0}}>📊 Session Stats</h2>
            <button onClick={() => setShowStats(false)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:10,width:32,height:32,color:"white",fontSize:16,cursor:"pointer",fontFamily:ff}}>✕</button>
          </div>

          {/* Session overview */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            {[
              { label: "Correct", value: sessionStats.correct, color: "#4ade80", icon: "✓" },
              { label: "Wrong", value: sessionStats.wrong, color: "#f87171", icon: "✗" },
              { label: "Accuracy", value: total > 0 ? pct + "%" : "—", color: pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171", icon: "🎯" },
            ].map((s, i) => (
              <div key={i} style={{background:"rgba(99,102,241,.1)",borderRadius:14,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"#818cf8",marginBottom:4}}>{s.icon} {s.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <div style={{flex:1,background:"rgba(99,102,241,.08)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"#818cf8"}}>🕐 Time Played</div>
              <div style={{fontSize:16,fontWeight:700,color:"white"}}>{mins} min</div>
            </div>
            <div style={{flex:1,background:"rgba(99,102,241,.08)",borderRadius:12,padding:"10px 12px",textAlign:"center"}}>
              <div style={{fontSize:11,color:"#818cf8"}}>📝 Total Questions</div>
              <div style={{fontSize:16,fontWeight:700,color:"white"}}>{total}</div>
            </div>
          </div>

          {/* Highlights */}
          {best && worst && best.idx !== worst.idx && ivEntries.length >= 2 && (
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <div style={{flex:1,background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:12,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#4ade80",fontWeight:600,marginBottom:4}}>💪 Strongest</div>
                <div style={{fontSize:13,color:"white",fontWeight:700}}>{best.iv.emoji} {best.iv.short}</div>
                <div style={{fontSize:11,color:"#86efac"}}>{best.pct}% ({best.correct}/{best.total})</div>
              </div>
              <div style={{flex:1,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:12,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:"#f87171",fontWeight:600,marginBottom:4}}>🎯 Needs Work</div>
                <div style={{fontSize:13,color:"white",fontWeight:700}}>{worst.iv.emoji} {worst.iv.short}</div>
                <div style={{fontSize:11,color:"#fca5a5"}}>{worst.pct}% ({worst.correct}/{worst.total})</div>
              </div>
            </div>
          )}

          {/* Per-interval breakdown */}
          {ivEntries.length > 0 && (
            <>
              <div style={{fontSize:13,fontWeight:700,color:"#a5b4fc",marginBottom:8}}>Per-Interval Breakdown</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {ivEntries.map(e => (
                  <div key={e.idx} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(99,102,241,.06)",borderRadius:10,padding:"6px 10px"}}>
                    <span style={{fontSize:16,width:24,textAlign:"center"}}>{e.iv.emoji}</span>
                    <span style={{color:"white",fontSize:12,fontWeight:600,width:40}}>{e.iv.short}</span>
                    {/* Accuracy bar */}
                    <div style={{flex:1,height:10,background:"rgba(99,102,241,.15)",borderRadius:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:e.pct+"%",borderRadius:5,background:e.pct>=80?"linear-gradient(90deg,#22c55e,#4ade80)":e.pct>=60?"linear-gradient(90deg,#eab308,#fbbf24)":"linear-gradient(90deg,#ef4444,#f87171)",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:e.pct>=80?"#4ade80":e.pct>=60?"#fbbf24":"#f87171",width:36,textAlign:"right"}}>{e.pct}%</span>
                    <span style={{fontSize:10,color:"#818cf8",width:32,textAlign:"right"}}>{e.correct}/{e.total}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {total === 0 && (
            <div style={{textAlign:"center",padding:"20px 0",color:"#818cf8",fontSize:14}}>
              No stats yet — start playing to see your progress!
            </div>
          )}

          {/* Reset button */}
          {total > 0 && (
            <button onClick={resetAllProgress} style={{marginTop:16,width:"100%",padding:"8px 16px",borderRadius:10,border:"1px solid rgba(239,68,68,.3)",background:"rgba(239,68,68,.08)",color:"#fca5a5",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              Reset All Progress
            </button>
          )}
        </div>
      </div>
    );
  };

  const bg = "linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 100%)";

  // ═══════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════

  // ── MENU ──
  if (!mode) {
    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
        <style>{css}</style>
        <Snowflakes count={40}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center",animation:"slideIn .6s ease"}}>
          <div style={{fontSize:48,marginBottom:4}}>⛄🎵</div>
          <h1 style={{fontSize:"clamp(28px,6vw,42px)",fontWeight:700,color:"white",margin:"0 0 8px",letterSpacing:-1,textShadow:"0 4px 20px rgba(99,102,241,.5)"}}>Chord Snowman</h1>
          <p style={{color:"#a5b4fc",fontSize:15,margin:"0 0 36px",maxWidth:360}}>Learn intervals & build chords through music!</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[
              { fn: startTraining, icon: "📚", title: "Training", desc: "Step-by-step interval lessons", border: "#4f46e5", bg: "linear-gradient(135deg,#1e1b4b,#312e81)" },
              { fn: startClassic,  icon: "🎼", title: "Classic", desc: "Progressive difficulty levels", border: "#6366f1", bg: "linear-gradient(135deg,#1e1b4b,#3730a3)" },
              { fn: startIntervalEar, icon: "🐛", title: "Ear Journey", desc: "Identify intervals by ear!", border: "#06b6d4", bg: "linear-gradient(135deg,#083344,#164e63)" },
              { fn: startChordEar, icon: "🎧", title: "Chord Ear", desc: "Hear & identify chord types", border: "#ec4899", bg: "linear-gradient(135deg,#4a1942,#831843)" },
              { fn: startChord,    icon: "⛄", title: "Build Chords", desc: "Stack notes to build chords", border: "#7c3aed", bg: "linear-gradient(135deg,#2e1065,#4c1d95)" },
              { fn: startWeakPractice, icon: "🎯", title: "Weak Spots", desc: "Drill your weakest intervals", border: "#f97316", bg: "linear-gradient(135deg,#431407,#7c2d12)" },
            ].map((m, i) => (
              <button key={i} onClick={m.fn} style={{width:"clamp(140px,42vw,175px)",padding:"20px 12px",borderRadius:20,border:`2px solid ${m.border}`,background:m.bg,cursor:"pointer",textAlign:"center",fontFamily:ff,boxShadow:`0 8px 30px ${m.border}44`,transition:"all .2s"}}>
                <div style={{fontSize:32,marginBottom:6}}>{m.icon}</div>
                <div style={{fontSize:18,fontWeight:700,color:"white",marginBottom:4}}>{m.title}</div>
                <div style={{fontSize:12,color:"#a5b4fc",lineHeight:1.4}}>{m.desc}</div>
              </button>
            ))}
          </div>
          {/* Stats + Trophy buttons */}
          {midiStatus === "connected" && (
            <div style={{marginTop:8,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#4ade80",fontWeight:600}}>🎹 MIDI keyboard connected</div>
          )}
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24}}>
            <button onClick={() => setShowStats(true)}
              style={{padding:"10px 24px",borderRadius:14,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              📊 Stats
            </button>
            <button onClick={() => setShowAchPopup(true)}
              style={{padding:"10px 24px",borderRadius:14,border:"1px solid rgba(245,158,11,.3)",background:"rgba(245,158,11,.08)",color:"#fde68a",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
              🏆 {countCompletedItems(unlockedAch)}/{ACHIEVEMENTS.length}
            </button>
          </div>
        </div>
        <StatsPanel/><AchToast/>
        <TrophyCase/>
        <AchToast/>
        <IntroOverlay/>
      </div>
    );
  }

  // ── TRAINING MODE ──
  if (mode === "training") {
    const lv = TRAINING_LEVELS[tLevel];
    const iv = lv ? INTERVAL_DB[lv.intervalIdx] : null;

    if (tPhase === "select") {
      // Group levels by interval for cleaner display
      const groups = [];
      let lastIv = -1;
      TRAINING_LEVELS.forEach((l, i) => {
        const ivData = INTERVAL_DB[l.intervalIdx];
        if (l.intervalIdx !== lastIv) {
          groups.push({ iv: ivData, idx: l.intervalIdx, levels: [] });
          lastIv = l.intervalIdx;
        }
        groups[groups.length - 1].levels.push({ ...l, index: i });
      });

      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:14,color:"#818cf8",fontWeight:600}}>📚 Training</div>
            </div>

            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:4}}>📚</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>Choose a Lesson</h2>
              <p style={{color:"#a5b4fc",fontSize:13,margin:"0 0 6px"}}>Pick any interval to practice, or start from the beginning</p>
              {countCompletedItems(tLevelStats) > 0 && (
                <div style={{display:"flex",gap:12,justifyContent:"center",fontSize:12,color:"#818cf8"}}>
                  <span>✅ {countCompletedItems(tLevelStats)}/{TRAINING_LEVELS.length} completed</span>
                  <span>⭐ {Object.values(tLevelStats).filter(s => s.perfect).length} perfect</span>
                </div>
              )}
            </div>

            {/* Start from beginning button */}
            <button onClick={() => tSelectLevel(0)}
              style={{width:"100%",padding:"12px 20px",borderRadius:14,border:"2px solid #6366f1",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer",marginBottom:16,boxShadow:"0 4px 16px rgba(99,102,241,.3)"}}>
              ▶ Start from Beginning
            </button>

            {/* Level grid */}
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {groups.map((g, gi) => {
                const allDoneInGroup = g.levels.every(l => tLevelStats[l.index]);
                const allPerfectInGroup = g.levels.every(l => tLevelStats[l.index]?.perfect);
                return (
                <div key={gi} style={{background: allPerfectInGroup ? "rgba(250,204,21,.06)" : allDoneInGroup ? "rgba(34,197,94,.05)" : "rgba(99,102,241,.06)",border:`1px solid ${allPerfectInGroup ? "rgba(250,204,21,.2)" : allDoneInGroup ? "rgba(34,197,94,.15)" : "rgba(99,102,241,.15)"}`,borderRadius:14,padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:20}}>{g.iv.emoji}</span>
                    <span style={{color:"white",fontSize:14,fontWeight:700}}>{g.iv.name}</span>
                    <span style={{color:"#818cf8",fontSize:11}}>{g.iv.half} half step{g.iv.half !== 1 ? "s" : ""}</span>
                    {allPerfectInGroup && <span style={{fontSize:14,marginLeft:"auto"}} title="All perfect!">🌟</span>}
                    {allDoneInGroup && !allPerfectInGroup && <span style={{fontSize:13,marginLeft:"auto",color:"#4ade80"}} title="All completed">✓</span>}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {g.levels.map(l => {
                      const stats = tLevelStats[l.index];
                      const done = !!stats;
                      const perfect = stats && stats.perfect;
                      return (
                        <button key={l.index} onClick={() => tSelectLevel(l.index)}
                          style={{padding:"6px 14px",borderRadius:10,border:`1px solid ${perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.35)" : "rgba(99,102,241,.3)"}`,background:perfect ? "rgba(250,204,21,.1)" : done ? "rgba(34,197,94,.08)" : "rgba(99,102,241,.1)",color:perfect ? "#fde68a" : done ? "#86efac" : "#c4b5fd",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5}}>
                          {perfect ? "⭐" : done ? "✅" : ""}{l.direction === "up" ? "⬆ Up" : "⬇ Down"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (tPhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={30}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .6s ease"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>Training Complete!</h2>
            <p style={{color:"#c4b5fd",fontSize:15,marginBottom:8}}>You've learned all the intervals! Score: {tScore}</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startTraining} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Restart Training</button>
              <button onClick={startClassic} style={{padding:"12px 28px",borderRadius:14,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Try Classic Mode</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    if (tPhase === "levelUp") {
      const nextLvl = tLevel + 1;
      const isAllDone = nextLvl >= TRAINING_LEVELS.length;
      const nextIv = !isAllDone ? INTERVAL_DB[TRAINING_LEVELS[nextLvl].intervalIdx] : null;
      const completedIv = INTERVAL_DB[lv.intervalIdx];
      const wasPerfect = tMissesInLevel === 0;
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/>
          <Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{wasPerfect ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Complete!</h2>
            {wasPerfect && (
              <div style={{color:"#fde68a",fontSize:15,fontWeight:700,marginBottom:8,animation:"popIn .5s ease"}}>⭐ Perfect Score — No Mistakes! ⭐</div>
            )}
            <div style={{background: wasPerfect ? "rgba(250,204,21,.12)" : "rgba(34,197,94,.12)",border:`1px solid ${wasPerfect ? "rgba(250,204,21,.3)" : "rgba(34,197,94,.3)"}`,borderRadius:16,padding:"14px 24px",marginBottom:16}}>
              <div style={{fontSize:28,marginBottom:4}}>{completedIv.emoji}</div>
              <div style={{color: wasPerfect ? "#fde68a" : "#4ade80",fontSize:18,fontWeight:700}}>{completedIv.name} {wasPerfect ? "⭐" : "✓"}</div>
              <div style={{color: wasPerfect ? "#fcd34d" : "#86efac",fontSize:13,marginTop:2}}>{wasPerfect ? "Flawless!" : "Mastered!"}</div>
            </div>
            <div style={{marginBottom:16}}>
              <WinterCaterpillar streak={tStreak} shiver={false}/>
            </div>
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:16}}>Score: {tScore} · Streak: {tStreak}</div>
            {!isAllDone ? (
              <>
                <div style={{color:"#818cf8",fontSize:13,marginBottom:12}}>
                  Next up: <span style={{color:"white",fontWeight:700}}>{nextIv.emoji} {nextIv.name}</span>
                </div>
                <button onClick={() => {
                  setTLevel(nextLvl); setTPhase("explain"); setTCorrectInLevel(0);
                }} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)",animation:"popIn .4s ease"}}>
                  Continue →
                </button>
              </>
            ) : (
              <button onClick={() => setTPhase("done")} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)"}}>
                See Results 🏆
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={20}/>
        {tPhase === "explain" && (
          <ExplanationOverlay
            level={tLevel}
            onStart={tStartPractice}
            onPlaySong={playIntervalSong}
            onPlaySeparate={playIntervalPairSeparate}
            onPlayTogether={playIntervalPairTogether}
          />
        )}
        <StreakCelebration milestone={showMilestone}/>
        <StatsPanel/><AchToast/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:6,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setTPhase("select")} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋 Lessons</button>
            <button onClick={() => setShowStats(true)} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📊</button>
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {tScore}</div>
          </div>
        </div>

        {/* Winter Caterpillar */}
        <div style={{zIndex:1,marginBottom:6}}>
          <WinterCaterpillar streak={tStreak} shiver={catShiver}/>
        </div>

        {/* Level info */}
        <div style={{color:"#818cf8",fontSize:12,marginBottom:4,zIndex:1}}>
          📚 Training · Level {tLevel+1}/{TRAINING_LEVELS.length}
        </div>
        <div style={{color:"white",fontSize:16,fontWeight:700,marginBottom:4,zIndex:1}}>{lv.title}</div>

        {/* Progress bar */}
        <div style={{width:"100%",maxWidth:300,height:8,background:"rgba(255,255,255,.1)",borderRadius:4,marginBottom:16,zIndex:1,overflow:"hidden"}}>
          <div style={{width:`${(tCorrectInLevel/NEEDED_PER_LEVEL)*100}%`,height:"100%",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:4,transition:"width .3s"}}/>
        </div>
        <div style={{color:"#a5b4fc",fontSize:11,marginBottom:12,zIndex:1}}>{tCorrectInLevel}/{NEEDED_PER_LEVEL} correct to advance</div>

        {tPhase === "practice" && tQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Prompt */}
            <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#818cf8",marginBottom:2}}>Find the note a</div>
              <div style={{fontSize:22,fontWeight:700,color:"white"}}>{tQ.interval.name}</div>
              <div style={{fontSize:14,color:"#a5b4fc",fontWeight:600}}>{tQ.dir==="up"?"⬆ above":"⬇ below"} {shortDisplay(tQ.startName)}</div>
            </div>

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 16px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,animation:tHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <DualStaff startName={tQ.startName} startOct={tQ.startOct} targetName={tQ.targetName} targetOct={tQ.targetOct} highlight={tHL} showTarget={tShow} showGhost={tWrongCount >= 3 && !tShow}/>
            </div>

            {/* Clue / help area */}
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,alignItems:"center",minHeight:28,flexWrap:"wrap"}}>
              {!tShowClue && tHL !== "correct" && (
                <button onClick={() => setTShowClue(true)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  💡 Clue
                </button>
              )}
              {tHL !== "correct" && SONG_SNIPPETS[tQ.interval.short + "_" + tQ.dir] && (
                <button onClick={() => playIntervalSong(INTERVAL_DB.indexOf(tQ.interval), tQ.dir)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Hear Song
                </button>
              )}
              {tShowClue && (
                <div style={{width:"100%",textAlign:"center",background:"rgba(250,204,21,.1)",border:"1px solid rgba(250,204,21,.25)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#fde68a",fontWeight:600,animation:"popIn .3s ease"}}>
                  💡 {tQ.interval.name} = {tQ.interval.half} half step{tQ.interval.half !== 1 ? "s" : ""} {tQ.dir === "up" ? "up ⬆" : "down ⬇"}
                </div>
              )}
              {tWrongCount >= 3 && !tShow && (
                <div style={{fontSize:11,color:"#c4b5fd",animation:"popIn .3s ease"}}>
                  👻 Ghost note showing answer position
                </div>
              )}
            </div>

            {/* Song hint */}
            {tSong && (
              <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:14,padding:"8px 20px",marginBottom:14,color:"#4ade80",fontSize:14,fontWeight:600,textAlign:"center",animation:"popIn .4s ease",maxWidth:340}}>
                <div style={{fontSize:11,color:"#86efac",marginBottom:2}}>Think of:</div>{tSong}
              </div>
            )}

            {/* Note buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
              {NOTE_ORDER.map(n=>{
                const hl = tBtnHL[n] || (tWrongCount >= 3 && !tShow && n === tQ.targetName ? "hint" : undefined);
                return <NoteBtn key={n} note={n} onClick={tPick} disabled={tHL==="correct"} highlight={hl}/>;
              })}
            </div>
            <div style={{color:"#6366f1",fontSize:11,marginTop:8,opacity:.5,zIndex:1}}>Press A–G on keyboard</div>
          </div>
        )}
      </div>
    );
  }

  // ── CLASSIC MODE ──
  if (mode === "classic") {
    const lv = CLASSIC_LEVELS[cLevel];
    const notePool = lv.accidentals ? CHROMATIC : NOTE_ORDER;
    const isEarOnly = lv.earOnly;

    // Level-up popup
    if (cLevelUp) {
      const nextLv = CLASSIC_LEVELS[cLevelUp.to];
      const prevLv = CLASSIC_LEVELS[cLevelUp.from];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/>
          <Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>🎉</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Unlocked!</h2>
            <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:16,padding:"12px 24px",marginBottom:12}}>
              <div style={{color:"#4ade80",fontSize:16,fontWeight:700}}>{prevLv.name} ✓ Complete</div>
            </div>
            <div style={{marginBottom:12}}>
              <WinterCaterpillar streak={cStreak} shiver={false}/>
            </div>
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:12}}>Score: {cScore} · {cTotal > 0 ? `${getAccuracyPercent(cCorrect, cTotal)}% accuracy` : ""}</div>
            <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:14,padding:"12px 20px",marginBottom:20}}>
              <div style={{color:"#818cf8",fontSize:12,marginBottom:4}}>Next level:</div>
              <div style={{color:"white",fontSize:20,fontWeight:700}}>{nextLv.name}</div>
              <div style={{color:"#a5b4fc",fontSize:13}}>{nextLv.desc}</div>
            </div>
            <button onClick={ackClassicLevelUp} style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(99,102,241,.4)",animation:"popIn .4s ease"}}>
              Let's Go! →
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={20}/>
        <StreakCelebration milestone={showMilestone}/>
        <StatsPanel/><AchToast/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:540,marginBottom:6,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setShowStats(true)} style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#a5b4fc",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📊</button>
            <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {cScore}</div>
          </div>
        </div>

        {/* Winter Caterpillar */}
        <div style={{zIndex:1,marginBottom:6}}>
          <WinterCaterpillar streak={cStreak} shiver={catShiver}/>
        </div>

        {/* Level tabs */}
        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap",justifyContent:"center",zIndex:1}}>
          {CLASSIC_LEVELS.map((l, i) => (
            <button key={i} onClick={() => cSwitchLevel(i)} disabled={i >= cUnlocked}
              style={{padding:"4px 10px",borderRadius:8,border:`2px solid ${i===cLevel?"#6366f1":"rgba(99,102,241,.25)"}`,background:i===cLevel?"rgba(99,102,241,.15)":"transparent",color:i>=cUnlocked?"#374151":i===cLevel?"white":"#818cf8",fontSize:11,fontWeight:600,fontFamily:ff,cursor:i>=cUnlocked?"default":"pointer",opacity:i>=cUnlocked?0.4:1}}>
              {i >= cUnlocked ? "🔒 " : ""}{l.name}
            </button>
          ))}
        </div>

        <div style={{color:"#818cf8",fontSize:11,marginBottom:4,zIndex:1}}>
          {lv.desc} · {cTotal > 0 ? `${getAccuracyPercent(cCorrect, cTotal)}% accuracy` : "Let's go!"}
        </div>

        {/* Progress to unlock next */}
        {cLevel + 1 < CLASSIC_LEVELS.length && cLevel + 1 >= cUnlocked && (
          <div style={{width:"100%",maxWidth:280,marginBottom:8,zIndex:1}}>
            <div style={{height:6,background:"rgba(255,255,255,.08)",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,(cCorrectInLevel/CLASSIC_NEEDED)*100)}%`,height:"100%",background:"linear-gradient(90deg,#6366f1,#a855f7)",borderRadius:3,transition:"width .3s"}}/>
            </div>
            <div style={{color:"#6366f1",fontSize:10,marginTop:2,textAlign:"center"}}>{cCorrectInLevel}/{CLASSIC_NEEDED} to unlock next</div>
          </div>
        )}

        {cQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Prompt — for ear-only, just show interval direction */}
            {!isEarOnly && (
              <div style={{background:"rgba(99,102,241,.12)",border:"1px solid rgba(99,102,241,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:13,color:"#818cf8",marginBottom:2}}>Find the note a</div>
                <div style={{fontSize:22,fontWeight:700,color:"white"}}>{cQ.interval.name}</div>
                <div style={{fontSize:14,color:"#a5b4fc",fontWeight:600}}>{cQ.dir==="up"?"⬆ above":"⬇ below"} {shortDisplay(cQ.startName)}</div>
              </div>
            )}
            {isEarOnly && (
              <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:13,color:"#a78bfa",marginBottom:2}}>Listen and identify the interval</div>
                <div style={{fontSize:20,fontWeight:700,color:"white"}}>🎧 Ear Training</div>
                <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:8}}>
                  <button onClick={() => playIntervalPairReplay(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🔄 Play Again
                  </button>
                  <button onClick={() => playIntervalPairSeparate(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🎵 Separate
                  </button>
                  <button onClick={() => playIntervalPairTogether(cQ.startName, cQ.startOct, cQ.targetName, cQ.targetOct)}
                    style={{padding:"6px 14px",borderRadius:8,border:"1px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                    🎶 Together
                  </button>
                </div>
              </div>
            )}

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 16px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,animation:cHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <DualStaff startName={cQ.startName} startOct={cQ.startOct} targetName={cQ.targetName} targetOct={cQ.targetOct} highlight={cHL} showTarget={cShow} earOnly={isEarOnly} showGhost={cWrongCount >= 3 && !cShow}/>
            </div>

            {/* Clue / help area */}
            <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10,alignItems:"center",minHeight:28,flexWrap:"wrap"}}>
              {!cShowClue && cHL !== "correct" && (
                <button onClick={showClassicClue}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.08)",color:"#a5b4fc",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  💡 Clue
                </button>
              )}
              {cHL !== "correct" && SONG_SNIPPETS[cQ.interval.short + "_" + cQ.dir] && (
                <button onClick={() => playIntervalSong(INTERVAL_DB.indexOf(cQ.interval), cQ.dir)}
                  style={{padding:"4px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Hear Song
                </button>
              )}
              {cShowClue && (
                <div style={{width:"100%",textAlign:"center",background:"rgba(250,204,21,.1)",border:"1px solid rgba(250,204,21,.25)",borderRadius:10,padding:"4px 14px",fontSize:12,color:"#fde68a",fontWeight:600,animation:"popIn .3s ease"}}>
                  💡 {cQ.interval.name} = {cQ.interval.half} half step{cQ.interval.half !== 1 ? "s" : ""} {cQ.dir === "up" ? "up ⬆" : "down ⬇"}
                </div>
              )}
              {cWrongCount >= 3 && !cShow && (
                <div style={{fontSize:11,color:"#c4b5fd",animation:"popIn .3s ease"}}>
                  👻 Ghost note showing answer
                </div>
              )}
            </div>

            {/* Song hint */}
            {cSong && (
              <div style={{background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.3)",borderRadius:14,padding:"8px 20px",marginBottom:14,color:"#4ade80",fontSize:14,fontWeight:600,textAlign:"center",animation:"popIn .4s ease",maxWidth:340}}>
                <div style={{fontSize:11,color:"#86efac",marginBottom:2}}>Think of:</div>{cSong}
              </div>
            )}

            {/* Buttons */}
            {!isEarOnly ? (
              <>
                {lv.accidentals ? (
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    {/* Black keys row (accidentals) */}
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      {CHROMATIC_BUTTONS.filter(([,alt]) => alt).map(([primary, alt]) => {
                        const t = cQ.targetName;
                        const isHint = cWrongCount >= 3 && !cShow && (primary === t || alt === t || primary === enharmonic(t) || alt === enharmonic(t));
                        const hl = cBtnHL[primary] || cBtnHL[alt] || (isHint ? "hint" : undefined);
                        return <EnharmonicBtn key={primary} primary={primary} alt={alt} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                      })}
                    </div>
                    {/* White keys row (naturals) */}
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      {CHROMATIC_BUTTONS.filter(([,alt]) => !alt).map(([primary]) => {
                        const isHint = cWrongCount >= 3 && !cShow && (primary === cQ.targetName || primary === enharmonic(cQ.targetName));
                        const hl = cBtnHL[primary] || (isHint ? "hint" : undefined);
                        return <EnharmonicBtn key={primary} primary={primary} alt={null} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
                    {notePool.map(n=>{
                      const hl = cBtnHL[n] || (cWrongCount >= 3 && !cShow && n === cQ.targetName ? "hint" : undefined);
                      return <NoteBtn key={n} note={n} onClick={cPick} disabled={cHL==="correct"} highlight={hl}/>;
                    })}
                  </div>
                )}
                {!lv.accidentals && <div style={{color:"#6366f1",fontSize:11,marginTop:8,opacity:.5}}>Press A–G on keyboard</div>}
              </>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:480}}>
                {INTERVAL_DB.map((iv, idx) => {
                  const isCorrectIV = cHL === "correct" && idx === INTERVAL_DB.indexOf(cQ.interval);
                  const bg2 = isCorrectIV ? "linear-gradient(135deg,#22c55e,#16a34a)" : "linear-gradient(135deg,#4338ca,#6366f1)";
                  return (
                    <button key={idx} onClick={()=>cPickInterval(idx)} disabled={cHL==="correct"}
                      style={{padding:"6px 12px",borderRadius:10,border:"none",background:cHL==="correct"?"#374151":bg2,color:cHL==="correct"?"#6b7280":"white",fontSize:12,fontWeight:600,fontFamily:ff,cursor:cHL==="correct"?"default":"pointer",opacity:cHL==="correct"&&!isCorrectIV?0.4:1,transition:"all .15s",transform:isCorrectIV?"scale(1.1)":"scale(1)"}}>
                      {iv.short}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── INTERVAL EAR TRAINING ──
  if (mode === "intervalEar") {
    const ieLv = IE_LEVELS[ieLevel];
    const obstacle = IE_OBSTACLES[ieLv.obstacle];

    // Journey intro — what is an interval + minor/major 2nds
    if (iePhase === "journeyIntro") {
      const m2 = INTERVAL_DB[0];
      const M2 = INTERVAL_DB[1];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:460,animation:"slideIn .5s ease"}}>
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontSize:44,marginBottom:6}}>🐛 → ⛄</div>
              <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Your Ear Journey Begins!</h2>
              <p style={{color:"#67e8f9",fontSize:14,margin:0}}>Before we start, let's learn about intervals</p>
            </div>

            {/* What is an interval */}
            <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
              <h3 style={{color:"white",fontSize:17,margin:"0 0 8px"}}>🎵 What is an Interval?</h3>
              <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7,margin:"0 0 8px"}}>
                An <span style={{color:"white",fontWeight:700}}>interval</span> is the distance between two notes. On a piano, each key to the next is one <span style={{color:"#67e8f9",fontWeight:700}}>half step</span>.
              </p>
              <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.7,margin:0}}>
                Two half steps = a <span style={{color:"#67e8f9",fontWeight:700}}>whole step</span>. Each interval has its own unique sound!
              </p>
            </div>

            {/* Piano visual */}
            <div style={{background:"rgba(0,0,0,.25)",borderRadius:14,padding:"12px 16px",marginBottom:14,textAlign:"center"}}>
              <div style={{color:"#818cf8",fontSize:11,fontWeight:600,marginBottom:8}}>Each key to the next = 1 half step</div>
              <div style={{display:"flex",justifyContent:"center",gap:1,marginBottom:6}}>
                {["C","","D","","E","F","","G","","A","","B","C"].map((n, i) => {
                  const isBlack = [1,3,6,8,10].includes(i);
                  const isHL = i <= 2;
                  return (
                    <div key={i} style={{width:isBlack?16:24,height:isBlack?36:56,background:isBlack?"#1e1b4b": isHL ? "#cffafe" : "white",borderRadius:"0 0 4px 4px",border:isBlack?"1px solid #555":"1px solid #aaa",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:3,zIndex:isBlack?2:1,marginLeft:isBlack?-8:0,marginRight:isBlack?-8:0}}>
                      {n && <span style={{fontSize:8,color:isBlack?"#818cf8":"#4b5563",fontWeight:600}}>{n}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:12,color:"#67e8f9"}}>
                C → D = <span style={{color:"white",fontWeight:700}}>2 half steps</span> (a whole step)
              </div>
            </div>

            {/* First two intervals */}
            <div style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.2)",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
              <h3 style={{color:"white",fontSize:16,margin:"0 0 12px",textAlign:"center"}}>Your first two intervals:</h3>

              {/* Minor 2nd */}
              <div style={{background:"rgba(0,0,0,.15)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:"white",fontSize:15,fontWeight:700}}>{m2.emoji} {m2.name}</span>
                  <span style={{color:"#67e8f9",fontSize:11}}>1 half step</span>
                </div>
                <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.5,margin:"0 0 8px"}}>{m2.desc.split(".")[0]}.</p>
                {/* Ascending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:4}}>⬆ Ascending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={4} targetName="Db" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#67e8f9"}}>C → D♭</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {m2.songUp}</span>
                    <button onClick={() => playIntervalHalfStepPreview(1)}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["m2_up"] && (
                      <button onClick={() => playIntervalSong(0, "up")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Jaws
                      </button>
                    )}
                  </div>
                </div>
                {/* Descending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px"}}>
                  <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:4}}>⬇ Descending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={5} targetName="B" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#f9a8d4"}}>C → B</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {m2.songDown}</span>
                    <button onClick={() => playIntervalPairSeparate("C", 5, "B", 4)}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["m2_down"] && (
                      <button onClick={() => playIntervalSong(0, "down")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Für Elise
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Major 2nd */}
              <div style={{background:"rgba(0,0,0,.15)",borderRadius:12,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:"white",fontSize:15,fontWeight:700}}>{M2.emoji} {M2.name}</span>
                  <span style={{color:"#67e8f9",fontSize:11}}>2 half steps</span>
                </div>
                <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.5,margin:"0 0 8px"}}>{M2.desc.split(".")[0]}.</p>
                {/* Ascending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px",marginBottom:6}}>
                  <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:4}}>⬆ Ascending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="C" startOct={4} targetName="D" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#67e8f9"}}>C → D</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {M2.songUp}</span>
                    <button onClick={() => playIntervalHalfStepPreview(2)}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["M2_up"] && (
                      <button onClick={() => playIntervalSong(1, "up")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Birthday
                      </button>
                    )}
                  </div>
                </div>
                {/* Descending */}
                <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"6px 10px"}}>
                  <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:4}}>⬇ Descending</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                      <DualStaff startName="D" startOct={4} targetName="C" targetOct={4} highlight="correct" showTarget={true}/>
                    </div>
                    <div style={{fontSize:11,color:"#f9a8d4"}}>D → C</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"#a5b4fc"}}>🎵 {M2.songDown}</span>
                    <button onClick={() => playIntervalPairSeparate("D", 4, "C", 4)}
                      style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                      🔊 Hear
                    </button>
                    {SONG_SNIPPETS["M2_down"] && (
                      <button onClick={() => playIntervalSong(1, "down")}
                        style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                        🎶 Mary
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div style={{background:"rgba(34,197,94,.08)",borderRadius:12,padding:"10px 16px",marginBottom:16,textAlign:"center"}}>
              <p style={{color:"#86efac",fontSize:13,lineHeight:1.5,margin:0}}>
                🎧 <span style={{fontWeight:700}}>Tip:</span> The minor 2nd sounds tense and creepy (like Jaws!). The major 2nd sounds natural and singable (like Happy Birthday). Listen for the difference!
              </p>
            </div>

            <button onClick={ieFinishJourneyIntro}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.4)"}}>
              Let's go! 🐛❄️
            </button>
          </div>
        </div>
      );
    }

    // Level select
    if (iePhase === "select") {
      const completedCount = countCompletedItems(ieLevelStats, ["_seenJourneyIntro"]);
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a3a5c 100%)",fontFamily:ff,padding:"16px 14px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={15}/>
          {/* Stars */}
          {[15,35,55,75,90].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:10+i*12,left:`${l}%`,width:2,height:2,borderRadius:"50%",background:"#e0e7ff",animation:`starTwinkle ${2+i*.4}s ease infinite`,animationDelay:`${i*.3}s`,zIndex:0}}/>
          ))}
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:13,color:"#67e8f9",fontWeight:600}}>🐛 Ear Journey</div>
            </div>
            {/* Header with caterpillar scene */}
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:32,marginBottom:4}}>
                <span style={{display:"inline-block",animation:"catWalk 1.2s ease-in-out infinite"}}>🐛</span>
                <span style={{color:"#67e8f9",fontSize:18,margin:"0 8px"}}>→→→</span>
                <span style={{display:"inline-block",animation:"snowmanWave 3s ease-in-out infinite"}}>⛄</span>
              </div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>The Journey Map</h2>
              <p style={{color:"#67e8f9",fontSize:12,margin:0}}>{completedCount}/{IE_LEVELS.length} obstacles cleared</p>
            </div>

            {/* Journey path */}
            <div style={{display:"flex",flexDirection:"column",gap:6,position:"relative"}}>
              {/* Dotted line connecting levels */}
              <div style={{position:"absolute",left:28,top:30,bottom:30,width:2,background:"repeating-linear-gradient(180deg,rgba(6,182,212,.2) 0px,rgba(6,182,212,.2) 6px,transparent 6px,transparent 12px)",zIndex:0}}/>

              {IE_LEVELS.map((lv, i) => {
                const stats = ieLevelStats[i];
                const done = !!stats;
                const perfect = done && stats.hpLeft === lv.hp;
                const prevDone = i === 0 || !!ieLevelStats[i - 1];
                const locked = !prevDone;
                const obs = IE_OBSTACLES[lv.obstacle];
                const isNext = !done && prevDone;
                return (
                  <button key={i} onClick={() => !locked && ieSelectLevel(i)} disabled={locked}
                    style={{padding:"12px 14px",borderRadius:16,border:`2px solid ${locked ? "rgba(255,255,255,.05)" : isNext ? "rgba(6,182,212,.5)" : perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.3)" : "rgba(6,182,212,.15)"}`,background:locked ? "rgba(15,15,35,.5)" : isNext ? "rgba(6,182,212,.08)" : perfect ? "rgba(250,204,21,.05)" : done ? "rgba(34,197,94,.04)" : "rgba(6,182,212,.04)",cursor:locked?"default":"pointer",fontFamily:ff,textAlign:"left",display:"flex",alignItems:"center",gap:12,opacity:locked?.35:1,position:"relative",zIndex:1,transition:"all .2s",animation:isNext?"glowPulse 3s infinite":"none",boxShadow:isNext?"0 0 16px rgba(6,182,212,.15)":"none"}}>
                    <div style={{fontSize:26,width:34,textAlign:"center",flexShrink:0}}>
                      {locked ? "🔒" : perfect ? "⭐" : done ? "✅" : obs.emoji}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:locked?"#4b5563":isNext?"#67e8f9":"white",fontSize:14,fontWeight:700}}>{lv.name}</div>
                      <div style={{color:locked?"#374151":"#94a3b8",fontSize:11}}>{lv.desc}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      {done ? (
                        <div style={{fontSize:10,color:perfect?"#fde68a":"#86efac"}}>{perfect?"Perfect!":"Cleared"}</div>
                      ) : (
                        <div style={{fontSize:10,color:"#818cf8"}}>{lv.needed} needed</div>
                      )}
                    </div>
                    {isNext && <div style={{position:"absolute",left:-6,top:"50%",transform:"translateY(-50%)",fontSize:16,animation:"catWalk 1s ease-in-out infinite"}}>🐛</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Explain intervals in this level
    if (iePhase === "explain") {
      const newIvIdx = ieLv.newIv;
      const newIv = newIvIdx !== null ? INTERVAL_DB[newIvIdx] : null;
      const prevIvs = ieLv.ivs.filter(i => i !== newIvIdx);
      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}>
          <div style={{background:"linear-gradient(135deg,#083344,#164e63)",borderRadius:24,padding:"24px 20px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:36,marginBottom:4}}>{obstacle.emoji}</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>{ieLv.name}</h2>
              <div style={{color:"#67e8f9",fontSize:13}}>{obstacle.name} — {ieLv.desc}</div>
            </div>

            {/* NEW interval — full detail */}
            {newIv && (
              <>
                <div style={{color:"#22d3ee",fontSize:12,fontWeight:700,textAlign:"center",marginBottom:8}}>✨ New Interval ✨</div>
                <div style={{background:"rgba(34,211,238,.1)",border:"2px solid rgba(34,211,238,.3)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <span style={{color:"white",fontSize:16,fontWeight:700}}>{newIv.emoji} {newIv.name}</span>
                    <span style={{color:"#67e8f9",fontSize:11}}>{newIv.half} half step{newIv.half!==1?"s":""}</span>
                  </div>
                  <p style={{color:"#94a3b8",fontSize:12,lineHeight:1.4,margin:"0 0 6px"}}>{newIv.desc.split(".")[0]}.</p>

                  {/* Ascending */}
                  {(() => { const t = midiToChromatic(noteToMidi("C",4) + newIv.half); return (
                    <div style={{background:"rgba(6,182,212,.06)",borderRadius:8,padding:"5px 8px",marginBottom:5}}>
                      <div style={{fontSize:10,color:"#67e8f9",fontWeight:600,marginBottom:3}}>⬆ Ascending</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                          <DualStaff startName="C" startOct={4} targetName={t.name} targetOct={t.octave} highlight="correct" showTarget={true}/>
                        </div>
                        <div style={{fontSize:10,color:"#67e8f9"}}>C → {shortDisplay(t.name)}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"#a5b4fc"}}>🎵 {newIv.songUp}</span>
                        <button onClick={() => playIntervalPairSeparate("C", 4, t.name, t.octave)}
                          style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🔊</button>
                        {SONG_SNIPPETS[newIv.short + "_up"] && (
                          <button onClick={() => playIntervalSong(newIvIdx, "up")}
                            style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🎶</button>
                        )}
                      </div>
                    </div>
                  ); })()}

                  {/* Descending */}
                  {(() => { const t = midiToChromatic(noteToMidi("C",5) - newIv.half); return (
                    <div style={{background:"rgba(249,168,212,.06)",borderRadius:8,padding:"5px 8px"}}>
                      <div style={{fontSize:10,color:"#f9a8d4",fontWeight:600,marginBottom:3}}>⬇ Descending</div>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <div style={{background:"white",borderRadius:8,padding:"2px 6px"}}>
                          <DualStaff startName="C" startOct={5} targetName={t.name} targetOct={t.octave} highlight="correct" showTarget={true}/>
                        </div>
                        <div style={{fontSize:10,color:"#f9a8d4"}}>C → {shortDisplay(t.name)}</div>
                      </div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:10,color:"#a5b4fc"}}>🎵 {newIv.songDown}</span>
                        <button onClick={() => playIntervalPairSeparate("C", 5, t.name, t.octave)}
                          style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🔊</button>
                        {SONG_SNIPPETS[newIv.short + "_down"] && (
                          <button onClick={() => playIntervalSong(newIvIdx, "down")}
                            style={{padding:"6px 14px",borderRadius:10,border:"1px solid rgba(250,204,21,.3)",background:"rgba(250,204,21,.08)",color:"#fde68a",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>🎶</button>
                        )}
                      </div>
                    </div>
                  ); })()}
                </div>
              </>
            )}

            {/* Already learned — compact list */}
            {prevIvs.length > 0 && (
              <div style={{marginBottom:10}}>
                <div style={{color:"#94a3b8",fontSize:11,fontWeight:600,marginBottom:6}}>{newIv ? "Plus everything you've learned:" : "Intervals in this round:"}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {prevIvs.map(ivIdx => {
                    const iv = INTERVAL_DB[ivIdx];
                    const t = midiToChromatic(noteToMidi("C",4) + iv.half);
                    return (
                      <button key={ivIdx} onClick={() => playIntervalPairSeparate("C", 4, t.name, t.octave)}
                        style={{padding:"4px 8px",borderRadius:8,border:"1px solid rgba(6,182,212,.2)",background:"rgba(6,182,212,.06)",color:"white",fontSize:11,fontWeight:600,fontFamily:ff,cursor:"pointer",textAlign:"center"}}>
                        {iv.emoji} {iv.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{color:"#67e8f9",fontSize:11,textAlign:"center",margin:"10px 0"}}>
              Get {ieLv.needed} correct · {ieLv.hp} ❤️ HP
            </div>

            <button onClick={ieStartPractice}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Level up
    if (iePhase === "levelUp") {
      const nextLv = IE_LEVELS[ieLevel + 1];
      const nextObs = nextLv ? IE_OBSTACLES[nextLv.obstacle] : null;
      const perfect = ieHP === ieLv.hp;
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 40%,#1a4a3a 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={25}/><Confetti show={true}/>
          {/* Celebration sparkles */}
          {[20,40,60,80].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:30+i*20,left:`${l}%`,fontSize:16+i*2,animation:`musicFloat ${2+i*.3}s ease infinite`,animationDelay:`${i*.2}s`}}>
              {["🎵","✨","🎶","⭐"][i]}
            </div>
          ))}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:64,marginBottom:8,animation:"correctBurst .6s ease"}}>{perfect ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 4px",textShadow:"0 2px 20px rgba(34,211,238,.3)"}}>{obstacle.emoji} {obstacle.name} Cleared!</h2>
            {perfect && <div style={{color:"#fde68a",fontSize:16,fontWeight:800,marginBottom:8,animation:"glowPulse 2s infinite"}}>⭐ Perfect — No Hits Taken! ⭐</div>}
            <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
              <div style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"6px 14px"}}>
                <div style={{fontSize:10,color:"#fde68a"}}>Score</div>
                <div style={{fontSize:18,color:"white",fontWeight:700}}>⭐ {ieScore}</div>
              </div>
              <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",borderRadius:10,padding:"6px 14px"}}>
                <div style={{fontSize:10,color:"#fca5a5"}}>HP Left</div>
                <div style={{fontSize:18}}>{"❤️".repeat(ieHP)}</div>
              </div>
            </div>
            {/* Caterpillar celebrating */}
            <div style={{fontSize:40,marginBottom:12,animation:"catWalk 1s ease-in-out infinite"}}>🐛🎉</div>
            {nextLv ? (
              <>
                <div style={{color:"#94a3b8",fontSize:13,marginBottom:12}}>
                  Next obstacle: <span style={{color:"white",fontWeight:700,fontSize:15}}>{nextObs.emoji} {nextLv.name}</span>
                </div>
                <button onClick={() => ieSelectLevel(ieLevel + 1)}
                  style={{padding:"14px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 30px rgba(6,182,212,.4)",transition:"transform .15s",animation:"glowPulse 2s infinite"}}>
                  Continue the Journey →
                </button>
              </>
            ) : (
              <button onClick={() => setIePhase("done")}
                style={{padding:"14px 40px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 30px rgba(245,158,11,.4)"}}>
                🏆 Victory!
              </button>
            )}
          </div>
        </div>
      );
    }

    // Game over
    if (iePhase === "gameover") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#1a1a3e 50%,#2a1a3e 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={25}/>
          {/* Dramatic snow */}
          {[10,30,50,70,90].map((l,i)=>(
            <div key={i} style={{position:"absolute",top:20+i*15,left:`${l}%`,fontSize:20,animation:`snowfall ${3+i*.5}s linear infinite`,animationDelay:`${i*.3}s`,opacity:.3}}>❄️</div>
          ))}
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease"}}>
            {/* Sad caterpillar with snowflakes */}
            <div style={{fontSize:56,marginBottom:8}}>
              <span style={{display:"inline-block",animation:"catShiver 1s ease-in-out infinite"}}>🐛</span>
              <span style={{fontSize:24,verticalAlign:"top"}}>❄️</span>
            </div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Brrr! Too Cold!</h2>
            <p style={{color:"#fca5a5",fontSize:14,marginBottom:2}}>The caterpillar needs to warm up...</p>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:4}}>{obstacle.emoji} {obstacle.name} — {ieCorrect}/{ieLv.needed} intervals identified</p>
            <div style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",borderRadius:10,padding:"6px 16px",display:"inline-block",marginBottom:16}}>
              <span style={{color:"#fde68a",fontSize:14,fontWeight:700}}>⭐ {ieScore} points earned</span>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={ieStartPractice} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(6,182,212,.3)"}}>🔄 Try Again</button>
              <button onClick={() => setIePhase("select")} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(6,182,212,.3)",background:"transparent",color:"#67e8f9",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>📋 Levels</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // All done
    if (iePhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#1a3a5c 30%,#1a4a3a 60%,#2a4a2a 100%)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/><Confetti show={true}/>
          {/* Tons of sparkles */}
          {Array.from({length:12}).map((_,i)=>(
            <div key={i} style={{position:"absolute",top:`${10+Math.random()*60}%`,left:`${5+Math.random()*90}%`,fontSize:12+Math.random()*10,animation:`musicFloat ${2+Math.random()*2}s ease infinite`,animationDelay:`${Math.random()*2}s`}}>
              {["🎵","✨","⭐","🎶","💫","🌟"][i%6]}
            </div>
          ))}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease"}}>
            {/* Caterpillar meets snowman */}
            <div style={{fontSize:48,marginBottom:4}}>
              <span style={{display:"inline-block",animation:"catWalk .8s ease-in-out infinite"}}>🐛</span>
              <span style={{fontSize:24,animation:"popIn .5s ease"}}>❤️</span>
              <span style={{display:"inline-block",animation:"snowmanWave 2s ease-in-out infinite"}}>⛄</span>
            </div>
            <h2 style={{color:"white",fontSize:30,margin:"0 0 8px",textShadow:"0 2px 20px rgba(34,211,238,.3)"}}>Journey Complete!</h2>
            <p style={{color:"#86efac",fontSize:16,marginBottom:4,fontWeight:600}}>The caterpillar reached the snowman!</p>
            <p style={{color:"#c4b5fd",fontSize:14,marginBottom:16}}>Your ears are truly amazing! 🎧✨</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startIntervalEar} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 20px rgba(6,182,212,.3)"}}>🔄 Play Again</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    const journeyPct = ieLv.needed > 0 ? (ieCorrect / ieLv.needed) * 100 : 0;
    const catX = Math.max(6, Math.min(82, 6 + journeyPct * 0.76));
    const obsDefeated = journeyPct > 55;
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c1445 0%,#162055 30%,#1a3a5c 60%,#1e4d6b 100%)",fontFamily:ff,padding:"10px 12px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style>

        {/* Aurora / northern lights effect */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:200,background:"linear-gradient(135deg,rgba(34,211,238,.06) 0%,rgba(168,85,247,.04) 30%,rgba(52,211,153,.05) 60%,transparent 100%)",animation:"fadeIn 2s ease",pointerEvents:"none",zIndex:0}}/>

        {/* Twinkling stars */}
        {[12,25,38,55,72,85,8,45,68,90,33,60].map((l,i)=>(
          <div key={`st${i}`} style={{position:"absolute",top:8+((i*17)%60),left:`${l}%`,width:i%3===0?3:2,height:i%3===0?3:2,borderRadius:"50%",background:i%4===0?"#fde68a":"#e0e7ff",animation:`starTwinkle ${1.5+i*.3}s ease infinite`,animationDelay:`${i*.2}s`,zIndex:0,opacity:.7}}/>
        ))}

        {/* Moon */}
        <div style={{position:"absolute",top:12,right:20,width:40,height:40,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#fef9c3,#fde68a)",boxShadow:"0 0 20px rgba(253,230,138,.3),0 0 60px rgba(253,230,138,.1)",zIndex:0}}/>

        <Snowflakes count={20}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:6,zIndex:2}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={() => setIePhase("select")} style={{background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.25)",borderRadius:10,padding:"3px 8px",fontSize:11,color:"#67e8f9",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋</button>
            <button onClick={() => setIeShowRef(true)} style={{background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.25)",borderRadius:10,padding:"3px 8px",fontSize:11,color:"#67e8f9",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>ℹ️</button>
            <div style={{background:"linear-gradient(135deg,#f59e0b,#f97316)",color:"white",borderRadius:12,padding:"3px 12px",fontSize:14,fontWeight:700,boxShadow:"0 2px 10px rgba(245,158,11,.3)"}}>⭐ {ieScore}</div>
          </div>
        </div>

        {/* Level title banner */}
        <div style={{background:"rgba(6,182,212,.1)",border:"1px solid rgba(6,182,212,.2)",borderRadius:12,padding:"4px 16px",marginBottom:8,zIndex:2,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20}}>{obstacle.emoji}</span>
          <div>
            <div style={{color:"white",fontSize:13,fontWeight:700}}>{obstacle.name}</div>
            <div style={{color:"#67e8f9",fontSize:10}}>{ieLv.desc}</div>
          </div>
        </div>

        {/* ═══ JOURNEY SCENE SVG ═══ */}
        <div style={{width:"100%",maxWidth:460,marginBottom:8,zIndex:1}}>
          <svg viewBox="0 0 460 160" style={{width:"100%",height:"auto",borderRadius:16,overflow:"visible"}}>
            {/* Sky gradient */}
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f1b3d"/>
                <stop offset="100%" stopColor="#1a3a5c"/>
              </linearGradient>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#b8d4e8"/>
                <stop offset="100%" stopColor="#8bb8d0"/>
              </linearGradient>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a8c8dc"/>
                <stop offset="100%" stopColor="#d4e8f4"/>
              </linearGradient>
            </defs>

            {/* Background */}
            <rect width="460" height="160" rx="16" fill="url(#skyGrad)"/>

            {/* Distant mountains */}
            <polygon points="0,80 40,35 80,65 130,25 170,60 220,40 260,70 300,30 340,55 380,45 420,65 460,50 460,100 0,100" fill="#1a2a4a" opacity=".6"/>
            <polygon points="0,95 50,55 100,75 160,50 210,70 270,55 320,80 370,60 420,75 460,65 460,100 0,100" fill="#1e3555" opacity=".5"/>

            {/* Snow ground */}
            <ellipse cx="230" cy="155" rx="250" ry="50" fill="url(#groundGrad)" opacity=".9"/>
            <ellipse cx="230" cy="152" rx="240" ry="42" fill="#d4e8f4" opacity=".4"/>

            {/* Pine trees background */}
            {[30,80,350,410].map((tx,i)=>(
              <g key={`tree${i}`} style={{animation:`treeSway ${3+i*.5}s ease-in-out infinite`,transformOrigin:`${tx}px 120px`}}>
                <polygon points={`${tx},${70+i%2*10} ${tx-12},${110+i%2*5} ${tx+12},${110+i%2*5}`} fill="#1a4a3a" opacity=".7"/>
                <polygon points={`${tx},${60+i%2*10} ${tx-9},${85+i%2*5} ${tx+9},${85+i%2*5}`} fill="#1e5a45" opacity=".6"/>
                <rect x={tx-2} y={110+i%2*5} width="4" height="10" fill="#5a3a2a" opacity=".5"/>
              </g>
            ))}

            {/* Dotted path */}
            <line x1="35" y1="128" x2="425" y2="128" stroke="#8ab4cc" strokeWidth="3" strokeDasharray="8 6" opacity=".4"/>

            {/* Footprints behind caterpillar */}
            {Array.from({length: Math.floor(journeyPct/12)}).map((_,i)=>(
              <circle key={`fp${i}`} cx={35 + i * 42} cy={131} r="2" fill="#7aa8c0" opacity=".3"/>
            ))}

            {/* Obstacle */}
            <g style={{animation: obsDefeated ? "none" : `obsBob 2s ease-in-out infinite`,opacity: obsDefeated ? 0.15 : 1,transition:"opacity .8s"}}>
              <text x="230" y="118" textAnchor="middle" fontSize={obsDefeated ? "20" : "32"} style={{transition:"font-size .5s"}}>{obstacle.emoji}</text>
            </g>
            {/* Obstacle defeated sparkles */}
            {obsDefeated && [215,230,245].map((sx,i)=>(
              <text key={`osp${i}`} x={sx} y={100+i*5} fontSize="10" opacity=".6" style={{animation:`musicFloat 2s ease infinite`,animationDelay:`${i*.3}s`}}>✨</text>
            ))}

            {/* Snowman at end */}
            <g style={{animation:"snowmanWave 3s ease-in-out infinite"}}>
              {/* Body */}
              <circle cx="425" cy="130" r="10" fill="white" stroke="#b8d4e8" strokeWidth="1"/>
              <circle cx="425" cy="116" r="7" fill="white" stroke="#b8d4e8" strokeWidth="1"/>
              {/* Eyes */}
              <circle cx="423" cy="114" r="1.2" fill="#1a1a2e"/>
              <circle cx="427" cy="114" r="1.2" fill="#1a1a2e"/>
              {/* Nose */}
              <polygon points="425,116 430,117 425,118" fill="#f97316"/>
              {/* Hat */}
              <rect x="419" y="106" width="12" height="3" rx="1" fill="#1a1a2e"/>
              <rect x="421" y="97" width="8" height="10" rx="2" fill="#1a1a2e"/>
              {/* Scarf */}
              <path d="M418,121 Q425,124 432,121" stroke="#ef4444" strokeWidth="2" fill="none"/>
              {/* Arms */}
              <line x1="415" y1="120" x2="408" y2="114" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="435" y1="120" x2="441" y2="113" stroke="#8B4513" strokeWidth="1.5" strokeLinecap="round"/>
            </g>

            {/* Speech bubble from snowman */}
            {journeyPct > 80 && (
              <g style={{animation:"fadeIn .5s ease"}}>
                <rect x="395" y="78" width="30" height="16" rx="8" fill="white" opacity=".9"/>
                <text x="410" y="90" textAnchor="middle" fontSize="10">🎵</text>
              </g>
            )}

            {/* ═══ CATERPILLAR ═══ */}
            <g style={{transform:`translateX(${catX * 4.2}px)`,transition:"transform .7s cubic-bezier(.34,1.56,.64,1)"}}>
              {/* Shadow */}
              <ellipse cx="18" cy="136" rx="12" ry="3" fill="rgba(0,0,0,.15)"/>
              {/* Body segments */}
              {[0,1,2,3].map((seg,i)=>(
                <circle key={`seg${i}`} cx={18 - i*7} cy={124 + (i===0?0:2)} r={i===0?7:5.5-i*.3} 
                  fill={i===0?"#4ade80":"#22c55e"} stroke="#16a34a" strokeWidth="1"
                  style={{animation:`catWalk .6s ease-in-out infinite`,animationDelay:`${i*.08}s`}}/>
              ))}
              {/* Face */}
              <circle cx="16" cy="122" r="1.2" fill="#1a1a2e"/>
              <circle cx="21" cy="122" r="1.2" fill="#1a1a2e"/>
              <path d="M16,125 Q18.5,127 21,125" stroke="#1a1a2e" strokeWidth=".8" fill="none"/>
              {/* Antennae */}
              <line x1="17" y1="117" x2="14" y2="111" stroke="#16a34a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="20" y1="117" x2="23" y2="111" stroke="#16a34a" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="14" cy="110" r="1.5" fill="#fde68a"/>
              <circle cx="23" cy="110" r="1.5" fill="#fde68a"/>
              {/* Scarf */}
              <path d="M12,126 Q18,129 24,126" stroke="#06b6d4" strokeWidth="2.5" fill="none"/>
              <line x1="12" y1="126" x2="8" y2="130" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round"/>
              {/* Blush */}
              <ellipse cx="14" cy="124" rx="2" ry="1.2" fill="#fb7185" opacity=".4"/>
              <ellipse cx="23" cy="124" rx="2" ry="1.2" fill="#fb7185" opacity=".4"/>
            </g>

            {/* Music notes floating on correct */}
            {ieHL === "correct" && ["♪","♫","🎵"].map((n,i)=>(
              <text key={`mn${i}`} x={catX*4.2 + 10 + i*12} y={100} fontSize="14" style={{animation:`musicFloat 1.5s ease forwards`,animationDelay:`${i*.15}s`}}>{n}</text>
            ))}

            {/* Hit effect on wrong */}
            {ieHL === "wrong" && (
              <circle cx={catX*4.2+18} cy="124" r="20" fill="none" stroke="#f87171" strokeWidth="2" opacity=".6" style={{animation:"popIn .4s ease"}}/>
            )}

            {/* Snow lumps */}
            {[60,140,200,290,360].map((sx,i)=>(
              <ellipse key={`sl${i}`} cx={sx} cy={138+i%2*3} rx={6+i%3*2} ry={3} fill="white" opacity=".3"/>
            ))}
          </svg>

          {/* Progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{width:`${journeyPct}%`,height:"100%",background:"linear-gradient(90deg,#06b6d4,#22d3ee,#34d399)",borderRadius:4,transition:"width .5s cubic-bezier(.34,1.56,.64,1)",boxShadow: journeyPct > 0 ? "0 0 8px rgba(6,182,212,.4)" : "none"}}/>
            </div>
            <span style={{color:"#67e8f9",fontSize:12,fontWeight:700,minWidth:36,textAlign:"right"}}>{ieCorrect}/{ieLv.needed}</span>
          </div>

          {/* HP as scarves */}
          <div style={{display:"flex",justifyContent:"center",gap:4,marginTop:6,animation: ieHL==="wrong" ? "hpShake .4s ease" : "none"}}>
            {Array.from({length: ieLv.hp}).map((_, i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:2,background: i < ieHP ? "rgba(239,68,68,.15)" : "rgba(255,255,255,.04)",border:`1px solid ${i < ieHP ? "rgba(239,68,68,.3)" : "rgba(255,255,255,.08)"}`,borderRadius:8,padding:"3px 8px",transition:"all .3s"}}>
                <span style={{fontSize:14}}>{i < ieHP ? "❤️" : "💔"}</span>
              </div>
            ))}
          </div>
        </div>

        {ieQ && (
          <div style={{zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:460}}>
            {/* Prompt card */}
            <div style={{background:"linear-gradient(135deg,rgba(6,182,212,.12),rgba(99,102,241,.08))",border:"1px solid rgba(6,182,212,.25)",borderRadius:18,padding:"12px 20px",marginBottom:12,textAlign:"center",width:"100%",maxWidth:340,backdropFilter:"blur(8px)",animation: ieHL==="correct" ? "correctBurst .4s ease" : ieHL==="wrong" ? "hpShake .35s ease" : "none"}}>
              <div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:6}}>🎧 What interval do you hear?</div>
              <button onClick={() => playIntervalPairReplay(ieQ.startName, ieQ.startOct, ieQ.targetName, ieQ.targetOct)}
                style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(6,182,212,.4)",background:"rgba(6,182,212,.15)",color:"#67e8f9",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer",transition:"all .15s"}}>
                🔊 Hear Again
              </button>
            </div>

            {/* Feedback */}
            {ieHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:18,fontWeight:800,marginBottom:8,animation:"popIn .3s ease",textShadow:"0 0 16px rgba(74,222,128,.4)"}}>
                ✨ {ieQ.interval.emoji} {ieQ.interval.name}! ✨
              </div>
            )}
            {ieHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:15,fontWeight:700,marginBottom:8,animation:"shakeNote .35s ease"}}>
                💥 Oops! That was {ieQ.interval.emoji} {ieQ.interval.name}
              </div>
            )}

            {/* Interval buttons — fun bouncy grid */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:440}}>
              {ieLv.ivs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const isCorrectHL = ieHL === "correct" && ivIdx === INTERVAL_DB.indexOf(ieQ.interval);
                const isReveal = ieHL === "wrong" && ivIdx === INTERVAL_DB.indexOf(ieQ.interval);
                const colors = ["#06b6d4","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316","#84cc16","#e879f9","#22d3ee"];
                const btnColor = colors[ivIdx % colors.length];
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : isReveal ? "linear-gradient(135deg,rgba(34,197,94,.5),rgba(22,163,74,.5))"
                  : `linear-gradient(135deg,${btnColor}22,${btnColor}11)`;
                const btnBorder = isCorrectHL ? "#22c55e" : isReveal ? "#22c55e88" : `${btnColor}55`;
                return (
                  <button key={ivIdx} onClick={() => iePick(ivIdx)} disabled={!!ieHL}
                    style={{padding:"10px 12px",borderRadius:14,border:`2px solid ${btnBorder}`,background:btnBg,color:"white",fontSize:13,fontWeight:700,fontFamily:ff,cursor:ieHL?"default":"pointer",transition:"all .2s cubic-bezier(.34,1.56,.64,1)",transform:isCorrectHL?"scale(1.12)":"scale(1)",opacity:ieHL && !isCorrectHL && !isReveal?0.3:1,minWidth:64,textAlign:"center",backdropFilter:"blur(4px)"}}>
                    <div style={{fontSize:20,marginBottom:2,transition:"transform .2s"}}>{iv.emoji}</div>
                    <div style={{fontSize:10,letterSpacing:".3px"}}>{iv.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Reference popup */}
        {ieShowRef && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:16,animation:"fadeIn .3s ease"}}
            onClick={() => setIeShowRef(false)}>
            <div style={{background:"linear-gradient(135deg,#083344,#164e63)",borderRadius:24,padding:"24px 20px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",animation:"slideIn .4s ease",maxHeight:"90vh",overflowY:"auto"}}
              onClick={e => e.stopPropagation()}>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:32,marginBottom:4}}>{obstacle.emoji}</div>
                <h2 style={{color:"white",fontSize:20,margin:"0 0 4px"}}>{ieLv.name} — Reference</h2>
                <div style={{color:"#67e8f9",fontSize:12}}>{ieLv.desc}</div>
              </div>
              {ieLv.ivs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const upTarget = midiToChromatic(noteToMidi("C", 4) + iv.half);
                const dnTarget = midiToChromatic(noteToMidi("C", 5) - iv.half);
                return (
                  <div key={ivIdx} style={{background:"rgba(6,182,212,.08)",border:"1px solid rgba(6,182,212,.15)",borderRadius:14,padding:"10px 14px",marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{color:"white",fontSize:14,fontWeight:700}}>{iv.emoji} {iv.name}</span>
                      <span style={{color:"#67e8f9",fontSize:11}}>{iv.half} half step{iv.half!==1?"s":""}</span>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {/* Up */}
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#67e8f9"}}>⬆ {iv.songUp}</span>
                        <button onClick={() => playIntervalPairSeparate("C", 4, upTarget.name, upTarget.octave)}
                          style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(6,182,212,.3)",background:"rgba(6,182,212,.1)",color:"#67e8f9",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                          🔊
                        </button>
                      </div>
                      {/* Down */}
                      <div style={{display:"flex",gap:4,alignItems:"center"}}>
                        <span style={{fontSize:10,color:"#f9a8d4"}}>⬇ {iv.songDown}</span>
                        <button onClick={() => playIntervalPairSeparate("C", 5, dnTarget.name, dnTarget.octave)}
                          style={{padding:"6px 12px",borderRadius:10,border:"1px solid rgba(249,168,212,.3)",background:"rgba(249,168,212,.1)",color:"#f9a8d4",fontSize:13,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                          🔊
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => setIeShowRef(false)}
                style={{width:"100%",marginTop:8,padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#06b6d4,#22d3ee)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── WEAK SPOTS PRACTICE ──
  if (mode === "weakSpots") {

    // Not enough data
    if (wpIvs.length < 2) {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={10}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease",maxWidth:380}}>
            <div style={{fontSize:48,marginBottom:8}}>🎯</div>
            <h2 style={{color:"white",fontSize:24,margin:"0 0 8px"}}>Not Enough Data Yet</h2>
            <p style={{color:"#fed7aa",fontSize:14,lineHeight:1.6,marginBottom:16}}>
              Play some rounds in Training, Classic, or Ear Journey first! Once you've answered at least 3 questions per interval, your weak spots will appear here.
            </p>
            <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(249,115,22,.3)"}}>
              ← Back to Menu
            </button>
          </div>
        </div>
      );
    }

    // Menu — show weak intervals
    if (wpPhase === "menu") {
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={10}/>
          <div style={{zIndex:1,width:"100%",maxWidth:460,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#fed7aa",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:13,color:"#fb923c",fontWeight:600}}>🎯 Weak Spots</div>
            </div>

            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:40,marginBottom:4}}>🎯</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 6px"}}>Practice Your Weak Spots</h2>
              <p style={{color:"#fed7aa",fontSize:13,margin:0}}>10 rounds focusing on the intervals you find hardest</p>
            </div>

            <div style={{color:"#fb923c",fontSize:12,fontWeight:600,marginBottom:8}}>Your weakest intervals:</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {wpIvs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const s = intervalStats[ivIdx];
                const total = s ? s.correct + s.wrong : 0;
                const pct = getAccuracyPercent(s.correct, total);
                return (
                  <div key={ivIdx} style={{background:"rgba(249,115,22,.08)",border:"1px solid rgba(249,115,22,.2)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:24}}>{iv.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"white",fontSize:14,fontWeight:700}}>{iv.name}</div>
                      <div style={{color:"#fed7aa",fontSize:11}}>{s.correct}/{total} correct</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{color: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171",fontSize:18,fontWeight:800}}>{pct}%</div>
                    </div>
                    {/* Mini bar */}
                    <div style={{width:50,height:6,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background: pct >= 70 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171",borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={wpBegin}
              style={{width:"100%",padding:"14px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(249,115,22,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Done
    if (wpPhase === "done") {
      const pct = getAccuracyPercent(wpCorrect, wpTotal);
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00,#431407,#7c2d12)",fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={15}/>
          {pct >= 70 && <Confetti show={true}/>}
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{pct >= 80 ? "🌟" : pct >= 60 ? "💪" : "📈"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Practice Complete!</h2>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:12}}>
              <div style={{background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",borderRadius:10,padding:"6px 16px"}}>
                <div style={{fontSize:10,color:"#86efac"}}>Correct</div>
                <div style={{fontSize:20,color:"white",fontWeight:700}}>{wpCorrect}/{wpTotal}</div>
              </div>
              <div style={{background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.2)",borderRadius:10,padding:"6px 16px"}}>
                <div style={{fontSize:10,color:"#fed7aa"}}>Accuracy</div>
                <div style={{fontSize:20,color:"white",fontWeight:700}}>{pct}%</div>
              </div>
            </div>
            <p style={{color:"#fed7aa",fontSize:13,marginBottom:16}}>
              {pct >= 80 ? "Amazing! Those weak spots are getting stronger! 💪" :
               pct >= 60 ? "Nice work! Keep practicing and you'll master these!" :
               "Don't give up — every practice session makes you better!"}
            </p>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={wpBegin} style={{padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#f97316,#f59e0b)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>🔄 Again</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.15)",background:"transparent",color:"#fed7aa",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0a00 0%,#431407 40%,#7c2d12 100%)",fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={8}/>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:13,color:"#fed7aa",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{color:"#fb923c",fontSize:13,fontWeight:700}}>🎯 {wpTotal + 1}/10</div>
        </div>

        {/* Progress */}
        <div style={{width:"100%",maxWidth:440,marginBottom:12,zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{flex:1,height:8,background:"rgba(255,255,255,.08)",borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${wpTotal * 10}%`,height:"100%",background:"linear-gradient(90deg,#f97316,#f59e0b)",borderRadius:4,transition:"width .4s"}}/>
            </div>
            <span style={{color:"#fb923c",fontSize:12,fontWeight:700}}>{wpCorrect}✓</span>
          </div>
        </div>

        {wpQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",width:"100%",maxWidth:460}}>
            {/* Prompt */}
            <div style={{background:"rgba(249,115,22,.1)",border:"1px solid rgba(249,115,22,.25)",borderRadius:18,padding:"12px 24px",marginBottom:14,textAlign:"center",animation: wpHL==="correct" ? "correctBurst .4s ease" : wpHL==="wrong" ? "hpShake .35s ease" : "none"}}>
              <div style={{fontSize:16,fontWeight:700,color:"white",marginBottom:6}}>🎧 What interval?</div>
              <button onClick={() => playIntervalPairReplay(wpQ.startName, wpQ.startOct, wpQ.targetName, wpQ.targetOct)}
                style={{padding:"10px 24px",borderRadius:12,border:"1px solid rgba(249,115,22,.4)",background:"rgba(249,115,22,.15)",color:"#fed7aa",fontSize:15,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>
                🔊 Hear Again
              </button>
            </div>

            {/* Feedback */}
            {wpHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:18,fontWeight:800,marginBottom:8,animation:"popIn .3s ease",textShadow:"0 0 16px rgba(74,222,128,.4)"}}>
                ✨ {wpQ.interval.emoji} {wpQ.interval.name}! ✨
              </div>
            )}
            {wpHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:15,fontWeight:700,marginBottom:8,animation:"shakeNote .35s ease"}}>
                💥 That was {wpQ.interval.emoji} {wpQ.interval.name}
              </div>
            )}

            {/* Buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:440}}>
              {wpIvs.map(ivIdx => {
                const iv = INTERVAL_DB[ivIdx];
                const isCorrectHL = wpHL === "correct" && ivIdx === INTERVAL_DB.indexOf(wpQ.interval);
                const isReveal = wpHL === "wrong" && ivIdx === INTERVAL_DB.indexOf(wpQ.interval);
                const colors = ["#06b6d4","#8b5cf6","#ec4899","#f59e0b","#10b981","#ef4444","#6366f1","#14b8a6","#f97316","#84cc16","#e879f9","#22d3ee"];
                const c = colors[ivIdx % colors.length];
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)" : isReveal ? "linear-gradient(135deg,rgba(34,197,94,.5),rgba(22,163,74,.5))" : `linear-gradient(135deg,${c}22,${c}11)`;
                const border = isCorrectHL ? "#22c55e" : isReveal ? "#22c55e88" : `${c}55`;
                return (
                  <button key={ivIdx} onClick={() => wpPick(ivIdx)} disabled={!!wpHL}
                    style={{padding:"10px 12px",borderRadius:14,border:`2px solid ${border}`,background:btnBg,color:"white",fontSize:13,fontWeight:700,fontFamily:ff,cursor:wpHL?"default":"pointer",transition:"all .2s",transform:isCorrectHL?"scale(1.12)":"scale(1)",opacity:wpHL && !isCorrectHL && !isReveal?0.3:1,minWidth:64,textAlign:"center"}}>
                    <div style={{fontSize:20,marginBottom:2}}>{iv.emoji}</div>
                    <div style={{fontSize:10}}>{iv.name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CHORD EAR TRAINING ──
  if (mode === "chordEar") {
    const ceLv = CHORD_EAR_LEVELS[ceLevel];

    // Level select
    if (cePhase === "select") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"20px 16px 60px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,width:"100%",maxWidth:500,animation:"slideIn .4s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
              <div style={{fontSize:14,color:"#f9a8d4",fontWeight:600}}>🎧 Chord Ear Training</div>
            </div>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:36,marginBottom:4}}>🎧</div>
              <h2 style={{color:"white",fontSize:22,margin:"0 0 4px"}}>Chord Ear Training</h2>
              <p style={{color:"#f9a8d4",fontSize:13,margin:0}}>Learn to hear the difference between chord types</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {CHORD_EAR_LEVELS.map((lv, i) => {
                const stats = ceLevelStats[i];
                const done = !!stats;
                const perfect = done && stats.snowmenLost === 0;
                return (
                  <button key={i} onClick={() => ceSelectLevel(i)}
                    style={{padding:"14px 18px",borderRadius:14,border:`1px solid ${perfect ? "rgba(250,204,21,.4)" : done ? "rgba(34,197,94,.3)" : "rgba(236,72,153,.25)"}`,background:perfect ? "rgba(250,204,21,.06)" : done ? "rgba(34,197,94,.05)" : "rgba(236,72,153,.06)",cursor:"pointer",fontFamily:ff,textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
                    <div style={{fontSize:28,width:36,textAlign:"center"}}>{perfect ? "⭐" : done ? "✅" : lv.types.map(t => CHORD_TYPES[t].emoji).join("")}</div>
                    <div style={{flex:1}}>
                      <div style={{color:"white",fontSize:15,fontWeight:700}}>{lv.name}</div>
                      <div style={{color:"#c4b5fd",fontSize:12}}>{lv.desc}</div>
                    </div>
                    <div style={{color:"#818cf8",fontSize:11}}>
                      {lv.needed} to pass · {lv.lives} ⛄
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Explain chord type
    if (cePhase === "explain") {
      const types = ceLv.types.map(i => CHORD_TYPES[i]);
      return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,fontFamily:ff,padding:20,animation:"fadeIn .3s ease"}}>
          <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:24,padding:"28px 24px",maxWidth:440,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.5)",textAlign:"center",animation:"slideIn .4s ease",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:36,marginBottom:8}}>{types.map(t => t.emoji).join(" ")}</div>
            <h2 style={{color:"white",margin:"0 0 12px",fontSize:22}}>{ceLv.name}</h2>

            {types.map((ct, i) => (
              <div key={i} style={{background:"rgba(99,102,241,.1)",borderRadius:14,padding:"12px 16px",marginBottom:10,textAlign:"left"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{color:ct.color,fontSize:16,fontWeight:700}}>{ct.emoji} {ct.name}</span>
                  <span style={{color:"#818cf8",fontSize:11}}>intervals: {ct.intervals.join("-")}</span>
                </div>
                <p style={{color:"#c4b5fd",fontSize:13,lineHeight:1.5,margin:"0 0 8px"}}>{ct.desc}</p>
                <button onClick={() => {
                  const notes = ct.intervals.map(hs => {
                    const m = noteToMidi("C", 4) + hs;
                    return midiToChromatic(m);
                  });
                  playChordNotesBoth(notes);
                }} style={{padding:"8px 16px",borderRadius:10,border:`1px solid ${ct.color}44`,background:`${ct.color}15`,color:ct.color,fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🔊 Hear C {ct.name}
                </button>
              </div>
            ))}

            <div style={{color:"#a5b4fc",fontSize:12,margin:"12px 0"}}>
              Get {ceLv.needed} correct · You have {ceLv.lives} snowmen — 3 wrong melts one!
            </div>

            <button onClick={ceStartPractice}
              style={{padding:"12px 32px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:17,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(236,72,153,.4)"}}>
              Start Practice →
            </button>
          </div>
        </div>
      );
    }

    // Level up
    if (cePhase === "levelUp") {
      const nextLv = CHORD_EAR_LEVELS[ceLevel + 1];
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
          <style>{css}</style><Snowflakes count={30}/><Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease",maxWidth:400}}>
            <div style={{fontSize:56,marginBottom:8}}>{ceSnowmenLost === 0 ? "🌟" : "🎉"}</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 6px"}}>Level Complete!</h2>
            {ceSnowmenLost === 0 && <div style={{color:"#fde68a",fontSize:15,fontWeight:700,marginBottom:8}}>⭐ No Snowmen Lost! ⭐</div>}
            <div style={{color:"#a5b4fc",fontSize:14,marginBottom:6}}>Score: {ceScore} · Snowmen lost: {ceSnowmenLost}</div>
            <MeltingSnowman meltStage={0} maxStages={3}/>
            <div style={{color:"#818cf8",fontSize:13,marginBottom:12}}>
              Next: <span style={{color:"white",fontWeight:700}}>{nextLv.name}</span>
            </div>
            <button onClick={advanceChordEarLevel}
              style={{padding:"14px 36px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:18,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 6px 24px rgba(236,72,153,.4)"}}>
              Continue →
            </button>
          </div>
        </div>
      );
    }

    // Game over
    if (cePhase === "gameover") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={20}/>
          <div style={{zIndex:1,textAlign:"center",animation:"slideIn .5s ease"}}>
            <MeltingSnowman meltStage={3} maxStages={3}/>
            <h2 style={{color:"white",fontSize:24,margin:"8px 0 4px"}}>All Snowmen Melted!</h2>
            <p style={{color:"#fca5a5",fontSize:14,marginBottom:4}}>You got {ceCorrect}/{ceLv.needed} correct</p>
            <p style={{color:"#a5b4fc",fontSize:13,marginBottom:16}}>Score: {ceScore}</p>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={ceStartPractice} style={{padding:"12px 24px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Try Again</button>
              <button onClick={() => setCePhase("select")} style={{padding:"12px 24px",borderRadius:14,border:"2px solid #ec4899",background:"transparent",color:"#f9a8d4",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Levels</button>
              <button onClick={goMenu} style={{padding:"12px 24px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // All done
    if (cePhase === "done") {
      return (
        <div style={{minHeight:"100vh",background:bg,fontFamily:ff,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
          <style>{css}</style><Snowflakes count={30}/><Confetti show={true}/>
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .5s ease"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h2 style={{color:"white",fontSize:28,margin:"0 0 8px"}}>Chord Master!</h2>
            <p style={{color:"#c4b5fd",fontSize:15,marginBottom:16}}>You've completed all chord ear training levels!</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={startChordEar} style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Play Again</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        </div>
      );
    }

    // Practice
    return (
      <div style={{minHeight:"100vh",background:bg,fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={15}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={() => setCePhase("select")} style={{background:"rgba(236,72,153,.12)",border:"1px solid rgba(236,72,153,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#f9a8d4",fontWeight:600,fontFamily:ff,cursor:"pointer"}}>📋 Levels</button>
            <div style={{background:"linear-gradient(135deg,#ec4899,#f472b6)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {ceScore}</div>
          </div>
        </div>

        {/* Level info */}
        <div style={{color:"#f9a8d4",fontSize:12,marginBottom:4,zIndex:1}}>🎧 {ceLv.name}</div>

        {/* Progress bar */}
        <div style={{width:"100%",maxWidth:300,height:8,background:"rgba(255,255,255,.1)",borderRadius:4,marginBottom:6,zIndex:1,overflow:"hidden"}}>
          <div style={{width:`${(ceCorrect / ceLv.needed) * 100}%`,height:"100%",background:"linear-gradient(90deg,#ec4899,#f472b6)",borderRadius:4,transition:"width .3s"}}/>
        </div>
        <div style={{color:"#a5b4fc",fontSize:11,marginBottom:14,zIndex:1}}>{ceCorrect}/{ceLv.needed} correct</div>

        {/* Snowman + Lives */}
        <div style={{zIndex:1,display:"flex",alignItems:"flex-end",gap:16,marginBottom:10}}>
          <div style={{textAlign:"center"}}>
            <MeltingSnowman meltStage={ceMelt} maxStages={3}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,paddingBottom:30}}>
            <div style={{fontSize:11,color:"#a5b4fc",fontWeight:600}}>Snowmen left</div>
            <div style={{display:"flex",gap:4}}>
              {Array.from({length: ceLv.lives}).map((_, i) => (
                <span key={i} style={{fontSize:22,opacity: i < ceLives ? 1 : 0.2,transition:"opacity .3s"}}>{i < ceLives ? "⛄" : "💧"}</span>
              ))}
            </div>
            <div style={{fontSize:10,color:"#818cf8"}}>3 wrong = 1 melted</div>
          </div>
        </div>

        {ceQ && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            {/* Chord name + replay */}
            <div style={{background:"rgba(236,72,153,.1)",border:"1px solid rgba(236,72,153,.25)",borderRadius:16,padding:"10px 20px",marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:"white",marginBottom:8}}>{ceHL ? ceQ.displayName : ceQ.root + " ?"}</div>
              <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                <button onClick={() => playChordNotesBoth(ceQ.notes)}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🔊 Both
                </button>
                <button onClick={() => playChordNotesSeparate(ceQ.notes)}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎵 Separate
                </button>
                <button onClick={() => playChordNotesTogether(ceQ.notes)}
                  style={{padding:"5px 12px",borderRadius:8,border:"1px solid rgba(236,72,153,.4)",background:"rgba(236,72,153,.1)",color:"#f9a8d4",fontSize:12,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>
                  🎶 Together
                </button>
              </div>
            </div>

            {/* Feedback */}
            {ceHL === "correct" && (
              <div style={{color:"#4ade80",fontSize:16,fontWeight:700,marginBottom:10,animation:"popIn .3s ease"}}>
                ✓ Correct! {ceQ.type.name} chord
              </div>
            )}
            {ceHL === "wrong" && (
              <div style={{color:"#f87171",fontSize:14,fontWeight:600,marginBottom:10,animation:"shakeNote .35s ease"}}>
                ✗ Not quite! {ceMelt >= 3 ? "Snowman melted! 💧" : `(${3 - ceMelt} more before melt)`}
              </div>
            )}

            {/* Type buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:400}}>
              {ceLv.types.map(tIdx => {
                const ct = CHORD_TYPES[tIdx];
                const isCorrectHL = ceHL === "correct" && tIdx === ceQ.typeIdx;
                const isWrongHL = ceHL === "wrong" && tIdx !== ceQ.typeIdx;
                const btnBg = isCorrectHL ? "linear-gradient(135deg,#22c55e,#16a34a)"
                  : isWrongHL ? "rgba(99,102,241,.15)"
                  : `linear-gradient(135deg,${ct.color}33,${ct.color}22)`;
                return (
                  <button key={tIdx} onClick={() => cePick(tIdx)} disabled={!!ceHL}
                    style={{padding:"14px 22px",borderRadius:14,border:`2px solid ${isCorrectHL ? "#22c55e" : ct.color}44`,background:btnBg,color:isCorrectHL ? "white" : ct.color,fontSize:16,fontWeight:700,fontFamily:ff,cursor:ceHL?"default":"pointer",transition:"all .15s",transform:isCorrectHL?"scale(1.08)":"scale(1)",opacity:ceHL && !isCorrectHL ? 0.5 : 1}}>
                    {ct.emoji} {ct.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── CHORD MODE ──
  if (mode === "chord") {
    const needed = 4;
    const progress = chords.length;

    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#1e3a5f 100%)",fontFamily:ff,padding:"16px 16px 100px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
        <style>{css}</style><Snowflakes count={35}/><Confetti show={showConf}/>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:500,marginBottom:10,zIndex:1}}>
          <button onClick={goMenu} style={{background:"none",border:"none",fontSize:14,color:"#a5b4fc",cursor:"pointer",fontFamily:ff,fontWeight:500}}>← Menu</button>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:10,padding:"3px 10px",fontSize:12,color:"#c4b5fd",fontWeight:600}}>⛄ {progress}/{needed}</div>
            <div style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"white",borderRadius:12,padding:"4px 14px",fontSize:15,fontWeight:700}}>⭐ {chScore}</div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{display:"flex",gap:8,marginBottom:14,zIndex:1}}>
          {Array.from({length:needed},(_,i)=>(
            <div key={i} style={{width:12,height:12,borderRadius:"50%",background:i<progress?"#22c55e":"rgba(255,255,255,.12)",border:i===progress&&!allDone?"2px solid #a78bfa":"2px solid transparent",transition:"all .3s"}}/>
          ))}
        </div>

        {/* Snowmen row */}
        <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",marginBottom:16,zIndex:1,minHeight:220}}>
          {chords.map((c,i)=><Snowman key={i} root={c.root} third={c.third} fifth={c.fifth} complete bouncing={bouncing} index={i} chordName={c.name}/>)}
          {!allDone && curChord && <Snowman root={curChord.root} third={chThird} fifth={chFifth} complete={false} bouncing={false} index={progress} chordName={curChord.displayName}/>}
          {!allDone && Array.from({length:Math.max(0,needed-progress-1)},(_,i)=>(
            <div key={`g${i}`} style={{width:100,height:200,opacity:.12}}><Snowman root="?" third={null} fifth={null} complete={false} bouncing={false} index={0}/></div>
          ))}
        </div>

        {/* Current chord controls */}
        {!allDone && curChord && (
          <div style={{zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",animation:"slideIn .4s ease"}}>
            <div style={{background:"rgba(139,92,246,.12)",border:"1px solid rgba(139,92,246,.25)",borderRadius:16,padding:"10px 24px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:13,color:"#a78bfa",marginBottom:2}}>Build a</div>
              <div style={{fontSize:22,fontWeight:700,color:"white"}}>{curChord.displayName} chord</div>
              <div style={{fontSize:14,color:"#c4b5fd",fontWeight:600}}>{chStep===0?`Select the 3rd of ${curChord.root}`:`Select the 5th of ${curChord.root}`}</div>
              <div style={{fontSize:11,color:"#818cf8",marginTop:4}}>{curChord.type.name==="Major"?"Major = root + M3 + P5":"Minor = root + m3 + P5"}</div>
              {chRound < 8 && <div style={{fontSize:10,color:"#6366f1",marginTop:3,opacity:.6}}>Hints fade after {8 - chRound} more chord{8 - chRound !== 1 ? "s" : ""}</div>}
            </div>

            {/* Staff */}
            <div style={{background:"white",borderRadius:18,padding:"8px 12px",boxShadow:"0 8px 30px rgba(0,0,0,.2)",marginBottom:14,display:"flex",gap:0,animation:chHL==="wrong"?"shakeNote .35s ease":undefined}}>
              <NoteOnStaff name={curChord.root} octave={curChord.rootOct} showLabel/>
              {chThird
                ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} highlight="correct" showLabel/>
                : chRound < 8
                  ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} ghost showLabel={false}/>
                  : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}/>}
              {chFifth
                ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} highlight="correct" showLabel/>
                : chRound < 8
                  ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} ghost showLabel={false}/>
                  : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`}/>}
            </div>

            {/* Note buttons */}
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:420}}>
              {NOTE_ORDER.map(n=><NoteBtn key={n} note={n} onClick={chPick} disabled={chLocked} highlight={chBtnHL[n]}/>)}
            </div>
            <div style={{color:"#7c3aed",fontSize:11,marginTop:8,opacity:.5,zIndex:1}}>Press A–G on keyboard</div>
          </div>
        )}

        {/* All complete */}
        {allDone && (
          <div style={{zIndex:2,textAlign:"center",animation:"slideIn .6s ease"}}>
            <div style={{fontSize:42,marginBottom:8}}>🎉</div>
            <h2 style={{color:"white",fontSize:26,margin:"0 0 8px"}}>Snowman Chorus!</h2>
            <p style={{color:"#c4b5fd",fontSize:14,margin:"0 0 6px"}}>You built {needed} chords: {chords.map(c=>c.name).join(" → ")}</p>
            <p style={{color:"#a5b4fc",fontSize:13,margin:"0 0 24px"}}>Score: {chScore} points</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
              <button onClick={resetChordBuild}
                style={{padding:"12px 28px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#7c3aed,#a855f7)",color:"white",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer",boxShadow:"0 4px 16px rgba(124,58,237,.4)"}}>Build More ⛄</button>
              <button onClick={replayChordBuildSequence}
                style={{padding:"12px 28px",borderRadius:14,border:"2px solid #6366f1",background:"transparent",color:"#a5b4fc",fontSize:16,fontWeight:700,fontFamily:ff,cursor:"pointer"}}>Replay 🎵</button>
              <button onClick={goMenu} style={{padding:"12px 28px",borderRadius:14,border:"2px solid rgba(255,255,255,.2)",background:"transparent",color:"#818cf8",fontSize:14,fontWeight:600,fontFamily:ff,cursor:"pointer"}}>Menu</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
