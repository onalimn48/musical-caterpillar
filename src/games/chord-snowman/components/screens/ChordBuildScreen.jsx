import { NOTE_ORDER } from "../../data/musicTheory.js";
import { STAFF_W, STAFF_H } from "../../data/staff.js";
import { Snowman, Snowflakes, Confetti, NoteBtn, NoteOnStaff } from "../ui.jsx";
import { ff, css } from "../../data/theme.js";
import GameHUD from "../../../shared/components/GameHUD.jsx";
import ScorePanel from "../../../shared/components/ScorePanel.jsx";
import GameContainer from "../../../shared/layout/GameContainer.jsx";
import GameLayout from "../../../shared/layout/GameLayout.jsx";

export default function ChordBuildScreen({ state, actions }) {
  const {
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
  } = state;
  const { chPick, resetChordBuild, replayChordBuildSequence, goMenu } = actions;

  const needed = 4;
  const progress = chords.length;

  return (
    <GameLayout
      background="linear-gradient(180deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#1e3a5f 100%)"
      fontFamily={ff}
      padding="16px 16px 100px"
      styleContent={css}
    >
      <Snowflakes count={35} />
      <Confetti show={showConf} />
      <GameContainer maxWidth={500}>
        <GameHUD
          style={{ marginBottom: 10 }}
          left={<button onClick={goMenu} style={{ background: "none", border: "none", fontSize: 14, color: "#a5b4fc", cursor: "pointer", fontFamily: ff, fontWeight: 500 }}>← Menu</button>}
          right={
            <>
              <ScorePanel icon="⛄" label="Built" value={`${progress}/${needed}`} tone="ice" valueStyle={{ fontSize: 12, color: "#c4b5fd" }} labelStyle={{ color: "#818cf8" }} />
              <ScorePanel icon="⭐" label="Score" value={chScore} tone="violet" valueStyle={{ fontSize: 15 }} />
            </>
          }
        />
      </GameContainer>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, zIndex: 1 }}>
        {Array.from({ length: needed }, (_, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: i < progress ? "#22c55e" : "rgba(255,255,255,.12)", border: i === progress && !allDone ? "2px solid #a78bfa" : "2px solid transparent", transition: "all .3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 16, zIndex: 1, minHeight: 220 }}>
        {chords.map((c, i) => <Snowman key={i} root={c.root} third={c.third} fifth={c.fifth} complete bouncing={bouncing} index={i} chordName={c.name} />)}
        {!allDone && curChord && <Snowman root={curChord.root} third={chThird} fifth={chFifth} complete={false} bouncing={false} index={progress} chordName={curChord.displayName} />}
        {!allDone && Array.from({ length: Math.max(0, needed - progress - 1) }, (_, i) => (
          <div key={`g${i}`} style={{ width: 100, height: 200, opacity: .12 }}><Snowman root="?" third={null} fifth={null} complete={false} bouncing={false} index={0} /></div>
        ))}
      </div>
      {!allDone && curChord && (
        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", animation: "slideIn .4s ease" }}>
          <div style={{ background: "rgba(139,92,246,.12)", border: "1px solid rgba(139,92,246,.25)", borderRadius: 16, padding: "10px 24px", marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#a78bfa", marginBottom: 2 }}>Build a</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "white" }}>{curChord.displayName} chord</div>
            <div style={{ fontSize: 14, color: "#c4b5fd", fontWeight: 600 }}>{chStep === 0 ? `Select the 3rd of ${curChord.root}` : `Select the 5th of ${curChord.root}`}</div>
            <div style={{ fontSize: 11, color: "#818cf8", marginTop: 4 }}>{curChord.type.name === "Major" ? "Major = root + M3 + P5" : "Minor = root + m3 + P5"}</div>
            {chRound < 8 && <div style={{ fontSize: 10, color: "#6366f1", marginTop: 3, opacity: .6 }}>Hints fade after {8 - chRound} more chord{8 - chRound !== 1 ? "s" : ""}</div>}
          </div>
          <div style={{ background: "white", borderRadius: 18, padding: "8px 12px", boxShadow: "0 8px 30px rgba(0,0,0,.2)", marginBottom: 14, display: "flex", gap: 0, animation: chHL === "wrong" ? "shakeNote .35s ease" : undefined }}>
            <NoteOnStaff name={curChord.root} octave={curChord.rootOct} showLabel />
            {chThird
              ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} highlight="correct" showLabel />
              : chRound < 8
                ? <NoteOnStaff name={curChord.third.name} octave={curChord.third.octave} ghost showLabel={false} />
                : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`} />}
            {chFifth
              ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} highlight="correct" showLabel />
              : chRound < 8
                ? <NoteOnStaff name={curChord.fifth.name} octave={curChord.fifth.octave} ghost showLabel={false} />
                : <svg width={STAFF_W} height={STAFF_H} viewBox={`0 0 ${STAFF_W} ${STAFF_H}`} />}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
            {NOTE_ORDER.map((n) => <NoteBtn key={n} note={n} onClick={chPick} disabled={chLocked} highlight={chBtnHL[n]} />)}
          </div>
          <div style={{ color: "#7c3aed", fontSize: 11, marginTop: 8, opacity: .5, zIndex: 1 }}>Press A–G on keyboard</div>
        </div>
      )}
      {allDone && (
        <div style={{ zIndex: 2, textAlign: "center", animation: "slideIn .6s ease" }}>
          <div style={{ fontSize: 42, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: "white", fontSize: 26, margin: "0 0 8px" }}>Snowman Chorus!</h2>
          <p style={{ color: "#c4b5fd", fontSize: 14, margin: "0 0 6px" }}>You built {needed} chords: {chords.map((c) => c.name).join(" → ")}</p>
          <p style={{ color: "#a5b4fc", fontSize: 13, margin: "0 0 24px" }}>Score: {chScore} points</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={resetChordBuild} style={{ padding: "12px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "white", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer", boxShadow: "0 4px 16px rgba(124,58,237,.4)" }}>Build More ⛄</button>
            <button onClick={replayChordBuildSequence} style={{ padding: "12px 28px", borderRadius: 14, border: "2px solid #6366f1", background: "transparent", color: "#a5b4fc", fontSize: 16, fontWeight: 700, fontFamily: ff, cursor: "pointer" }}>Replay 🎵</button>
            <button onClick={goMenu} style={{ padding: "12px 28px", borderRadius: 14, border: "2px solid rgba(255,255,255,.2)", background: "transparent", color: "#818cf8", fontSize: 14, fontWeight: 600, fontFamily: ff, cursor: "pointer" }}>Menu</button>
          </div>
        </div>
      )}
    </GameLayout>
  );
}
