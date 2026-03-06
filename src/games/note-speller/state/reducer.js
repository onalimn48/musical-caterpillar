import {
  calcXpAward,
  didReachButterflyTrigger,
  getButterflyProgress,
  getPlayerLevel,
  getSlots,
  getStreakMilestone,
  getWeakNotesList,
  makeScramble,
  pickScrambleWord,
  pickWeakWord,
  pickWord,
} from "./gameLogic.js";
import { INITIAL_STATE, INIT_POWERUPS } from "./initialState.js";

export function createNoteSpellerReducer({ STAGES, POWERUPS, ARCADE_WORDS, STORY_CHAPTERS, SONGS }) {
  function reducer(state, action) {
    switch (action.type) {
      case "START": {
        const startStage = Math.min(state.stageIndex, STAGES.length - 1);
        const word = pickWord(STAGES[startStage].words, []);
        return {
          ...INITIAL_STATE,
          phase: "game", clef: action.clef, unlockedStages: state.unlockedStages,
          stageIndex: startStage, score: state.score,
          word, slots: getSlots(word), message: `Hint: "${word.h}"`,
          stats: state.stats, powerups: state.powerups,
        };
      }
      case "MENU":
        return { ...INITIAL_STATE, unlockedStages: state.unlockedStages, stageIndex: state.stageIndex, score: state.score, stats: state.stats, powerups: state.powerups };

      case "LOAD_STATS":
        return { ...state, stats: action.stats };

      case "LOAD_POWERUPS":
        return { ...state, powerups: { ...INIT_POWERUPS, ...action.powerups } };

      case "LOAD_PROGRESS": {
        const unlocked = (action.unlockedStages || [0]).filter(i => i < STAGES.length);
        if (unlocked.length === 0) unlocked.push(0);
        const stageIdx = Math.min(action.stageIndex ?? 0, STAGES.length - 1);
        const savedScore = action.score ?? 0;
        return { ...state, unlockedStages: unlocked, stageIndex: stageIdx, score: savedScore };
      }

      case "BUY_POWERUP": {
        const pu = POWERUPS[action.id];
        if (!pu || state.score < pu.cost) return state;
        return {
          ...state,
          score: state.score - pu.cost,
          powerups: { ...state.powerups, [action.id]: (state.powerups[action.id] || 0) + 1 },
          message: `Bought ${pu.icon} ${pu.name}!`,
        };
      }
      case "USE_REVEAL": {
        if (!state.powerups.reveal || state.isDone || !state.word || !state.slots.length) return state;
        const targetIdx = state.slots[state.slotIndex];
        const expected = state.word.w[targetIdx];
        return {
          ...state,
          powerups: { ...state.powerups, reveal: state.powerups.reveal - 1 },
          highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
          message: `${POWERUPS.reveal.icon} That note is ${expected}!`,
        };
      }
      case "USE_DOUBLE": {
        if (!state.powerups.double || state.isDone) return state;
        return {
          ...state,
          powerups: { ...state.powerups, double: state.powerups.double - 1 },
          doubleActive: true,
          message: `${POWERUPS.double.icon} 2x points on this word!`,
        };
      }
      case "USE_SHIELD": {
        if (!state.powerups.shield || state.isDone) return state;
        return {
          ...state,
          powerups: { ...state.powerups, shield: state.powerups.shield - 1 },
          shieldActive: true,
          message: `${POWERUPS.shield.icon} Streak protected!`,
        };
      }

      case "PICK": {
        if (state.isDone || !state.word || !state.slots.length) return state;
        const targetIdx = state.slots[state.slotIndex];
        const expected = state.word.w[targetIdx];
        const newStats = { ...state.stats };
        newStats.totalGuesses = (newStats.totalGuesses || 0) + 1;
        newStats.noteAttempts = { ...newStats.noteAttempts };
        newStats.noteAttempts[expected] = (newStats.noteAttempts[expected] || 0) + 1;

        if (action.note !== expected) {
          const newSlotWrongs = state.slotWrongCount + 1;
          const loseStreak = !state.shieldActive;
          const newShield = false;
          const newStreak = loseStreak ? 0 : state.streak;
          if (newSlotWrongs >= 3) {
            return {
              ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
              wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
              streak: newStreak, shieldActive: newShield,
              message: state.shieldActive ? `🛡️ Shield! That note is ${expected}!` : `That note is ${expected}! Remember it!`,
              stats: newStats,
            };
          }
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
            wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
            streak: newStreak, shieldActive: newShield,
            message: state.shieldActive
              ? `🛡️ Shield absorbed it! (${3 - newSlotWrongs} tries left)`
              : `Not quite — try again! (${3 - newSlotWrongs} tries left)`,
            stats: newStats,
          };
        }

        const newStreak = state.streak + 1;
        const prevButterflyCorrectCount = state.butterflyCorrectCount;
        const newButterflyCorrectCount = state.butterflyCorrectCount + 1;
        const butterflyProgress = getButterflyProgress(newButterflyCorrectCount);
        const butterflyHitNow = didReachButterflyTrigger(prevButterflyCorrectCount, newButterflyCorrectCount);
        newStats.correctGuesses = (newStats.correctGuesses || 0) + 1;
        newStats.noteCorrect = { ...newStats.noteCorrect };
        newStats.noteCorrect[expected] = (newStats.noteCorrect[expected] || 0) + 1;
        if (newStreak > (newStats.bestStreak || 0)) newStats.bestStreak = newStreak;
        const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };

        if (newStreak > 5) newStats.xp = (newStats.xp || 0) + 2;

        if (state.slotIndex + 1 < state.slots.length) {
          return {
            ...state,
            guessed: newGuessed,
            highlights: newHL,
            slotIndex: state.slotIndex + 1,
            slotWrongCount: 0,
            streak: newStreak,
            butterflyCorrectCount: newButterflyCorrectCount,
            butterflyPending: state.butterflyPending || butterflyHitNow,
            stats: newStats,
          };
        }

        const stage = STAGES[state.stageIndex];
        let pts = stage.pts;
        const butterfly = state.butterflyPending || butterflyHitNow || butterflyProgress.shouldTrigger;
        if (butterfly) pts += 10;
        if (state.doubleActive) pts *= 2;

        const milestone = getStreakMilestone(newStreak);
        if (milestone) pts += milestone.streak;

        newStats.wordsCompleted = (newStats.wordsCompleted || 0) + 1;
        if (butterfly) newStats.butterflies = (newStats.butterflies || 0) + 1;

        const xpGain = calcXpAward(true, newStreak, butterfly, milestone);
        newStats.xp = (newStats.xp || 0) + xpGain;
        const oldLevel = getPlayerLevel((state.stats.xp || 0));
        const newLevel = getPlayerLevel(newStats.xp);
        const leveledUp = newLevel > oldLevel;

        const levelUpStr = leveledUp ? ` 🆙 Level ${newLevel}!` : "";
        const milestoneMsg = milestone
          ? `${milestone.emoji} ${milestone.title} ${newStreak} notes! +${pts}!${levelUpStr}`
          : butterfly
            ? `🦋 BUTTERFLY! ${newButterflyCorrectCount} correct! +${pts}!${levelUpStr}`
            : `🎵 "${state.word.w}" — +${pts}! (${newStreak}🔥)${levelUpStr}`;

        return {
          ...state, guessed: newGuessed, highlights: newHL, isDone: true, streak: newStreak,
          butterflyCorrectCount: newButterflyCorrectCount,
          butterflyPending: false,
          score: state.score + pts, completed: state.completed + 1,
          isButterfly: butterfly, showConfetti: butterfly || !!milestone, slotWrongCount: 0,
          streakMilestone: milestone,
          doubleActive: false, shieldActive: false,
          message: milestoneMsg,
          stats: newStats,
        };
      }

      case "ADVANCE_AFTER_REVEAL": {
        const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
        }
        const newStats = { ...state.stats, wordsCompleted: (state.stats.wordsCompleted || 0) + 1 };
        newStats.xp = (newStats.xp || 0) + 5;
        return {
          ...state, guessed: newGuessed, highlights: newHL, isDone: true, streak: 0,
          score: state.score + 1, completed: state.completed + 1, slotWrongCount: 0,
          doubleActive: false, shieldActive: false,
          message: `"${state.word.w}" — Keep practicing!`, stats: newStats,
        };
      }

      case "CLEAR_WRONG": {
        const newHL = { ...state.highlights };
        delete newHL[action.index];
        return { ...state, highlights: newHL };
      }

      case "NEXT": {
        const stageIdx = action.stageIndex ?? state.stageIndex;
        const stage = STAGES[stageIdx];
        const newUsed = [...state.usedWords, state.word?.w].filter(Boolean);
        const word = pickWord(stage.words, newUsed);
        return {
          ...state, word, slots: getSlots(word), slotIndex: 0, guessed: {}, highlights: {},
          isDone: false, wrongCount: 0, slotWrongCount: 0,
          message: `Hint: "${word.h}"`, usedWords: newUsed,
          isButterfly: false, showConfetti: false, streakMilestone: null, butterflyPending: false, doubleActive: false, shieldActive: false,
          streak: action.resetStreak ? 0 : state.streak,
          stageIndex: stageIdx, popup: null, transitioning: false,
        };
      }

      case "SKIP": return reducer(state, { type: "NEXT", resetStreak: true });

      case "UNLOCK":
        return { ...state, unlockedStages: [...state.unlockedStages, action.index], stageIndex: action.index, popup: STAGES[action.index] };

      case "DISMISS": {
        const stage = STAGES[state.stageIndex];
        const word = pickWord(stage.words, []);
        return {
          ...state, popup: null, word, slots: getSlots(word), slotIndex: 0,
          guessed: {}, highlights: {}, isDone: false, wrongCount: 0, slotWrongCount: 0,
          message: `Hint: "${word.h}"`, usedWords: [],
          isButterfly: false, showConfetti: false, streakMilestone: null, butterflyPending: false,
        };
      }

      case "SWITCH": {
        const stage = STAGES[action.index];
        const word = pickWord(stage.words, []);
        return {
          ...state, stageIndex: action.index, word, slots: getSlots(word), slotIndex: 0,
          guessed: {}, highlights: {}, isDone: false, wrongCount: 0, slotWrongCount: 0,
          message: `Hint: "${word.h}"`, usedWords: [],
        };
      }

      case "RESET_BFLY": return { ...state, isButterfly: false, showConfetti: false, streakMilestone: null, butterflyPending: false };
      case "TRANSITION": return { ...state, transitioning: true };
      case "SHOW_STATS": return { ...state, showStats: true };
      case "HIDE_STATS": return { ...state, showStats: false };

      case "ARCADE_START": {
        const word = pickWord(action.pool || ARCADE_WORDS, []);
        return {
          ...INITIAL_STATE,
          phase: "arcade", clef: action.clef, arcadeClef: action.clef,
          unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
          word, slots: getSlots(word), message: "Name the notes!",
          arcadeScore: 0, arcadeOver: false, arcadeWordDone: false,
          arcadePool: action.pool || null, arcadePractice: action.practice || false,
        };
      }

      case "ARCADE_PICK": {
        if (state.isDone || state.arcadeOver || state.arcadeWordDone || !state.word || !state.slots.length) return state;
        const targetIdx = state.slots[state.slotIndex];
        const expected = state.word.w[targetIdx];

        if (action.note !== expected) {
          return { ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" }, message: "Try again!" };
        }

        const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        const newScore = state.arcadeScore + 1;

        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, arcadeScore: newScore };
        }

        return {
          ...state, guessed: newGuessed, highlights: newHL, arcadeScore: newScore,
          arcadeWordDone: true, message: `🎵 "${state.word.w}"!`,
        };
      }

      case "ARCADE_ADVANCE": {
        const pool = state.arcadePool || ARCADE_WORDS;
        const newUsed = [...state.usedWords, state.word.w];
        const word = pickWord(pool, newUsed);
        return {
          ...state, guessed: {}, highlights: {}, slotIndex: 0,
          word, slots: getSlots(word), message: "Name the notes!",
          usedWords: newUsed, isDone: false, arcadeWordDone: false,
        };
      }

      case "ARCADE_CLEAR": {
        const newHL = { ...state.highlights };
        delete newHL[action.index];
        return { ...state, highlights: newHL };
      }

      case "ARCADE_END":
        return { ...state, arcadeOver: true, enteringName: !state.arcadePractice, arcadeInitials: "" };

      case "SET_INIT": return { ...state, arcadeInitials: action.value.toUpperCase().slice(0, 3) };
      case "SUBMIT": return { ...state, enteringName: false, showLeaderboard: true };
      case "SHOW_LB": return { ...state, showLeaderboard: true };
      case "HIDE_LB": return { ...state, showLeaderboard: false };

      case "SHOW_STREAK_LB": return { ...state, showStreakLB: true };
      case "HIDE_STREAK_LB": return { ...state, showStreakLB: false, streakLBEntering: false };
      case "STREAK_LB_ENTER": return { ...state, streakLBEntering: true, streakInitials: "", lastBigStreak: action.streak };
      case "SET_STREAK_INIT": return { ...state, streakInitials: action.value.toUpperCase().slice(0, 3) };
      case "SUBMIT_STREAK": return { ...state, streakLBEntering: false, showStreakLB: true };

      case "STORY_START": {
        const ch = STORY_CHAPTERS[0];
        const word = ch.word;
        return {
          ...INITIAL_STATE,
          phase: "story", clef: action.clef,
          unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
          word, slots: getSlots(word), message: `Hint: "${word.h}"`,
          storyChapter: 0, storyComplete: false, storyWordDone: false,
        };
      }
      case "STORY_PICK": {
        if (state.storyWordDone || !state.word || !state.slots.length) return state;
        const targetIdx = state.slots[state.slotIndex];
        const expected = state.word.w[targetIdx];
        if (action.note !== expected) {
          const newSlotWrongs = state.slotWrongCount + 1;
          if (newSlotWrongs >= 3) {
            return {
              ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
              wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
              message: `That note is ${expected}! Remember it!`,
            };
          }
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
            wrongCount: state.wrongCount + 1, slotWrongCount: newSlotWrongs,
            message: `Not quite — try again! (${3 - newSlotWrongs} tries left)`,
          };
        }
        const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
        }
        return { ...state, guessed: newGuessed, highlights: newHL, storyWordDone: true, message: "✨ Spell complete!" };
      }
      case "STORY_ADVANCE_REVEAL": {
        const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
        }
        return { ...state, guessed: newGuessed, highlights: newHL, storyWordDone: true, message: "✨ Spell complete!" };
      }
      case "STORY_NEXT": {
        const nextCh = state.storyChapter + 1;
        if (nextCh >= STORY_CHAPTERS.length) {
          return { ...state, storyComplete: true };
        }
        const ch = STORY_CHAPTERS[nextCh];
        const word = ch.word;
        return {
          ...state, storyChapter: nextCh, word, slots: getSlots(word), slotIndex: 0,
          guessed: {}, highlights: {}, storyWordDone: false, wrongCount: 0, slotWrongCount: 0,
          message: `Hint: "${word.h}"`,
        };
      }
      case "STORY_CLEAR": {
        const newHL = { ...state.highlights };
        delete newHL[action.index];
        return { ...state, highlights: newHL };
      }

      case "SONG_START": {
        const idx = Math.floor(Math.random() * SONGS.length);
        const song = SONGS[idx];
        return {
          ...INITIAL_STATE,
          phase: "song", clef: action.clef,
          unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
          songIndex: idx, songNoteIndex: 0, songNotes: song.notes,
          songDone: false, songCorrect: 0, songNoteWrongCount: 0,
          message: `🎵 ${song.title} — Name each note!`,
        };
      }
      case "SONG_SELECT": {
        const song = SONGS[action.index];
        return {
          ...state,
          songIndex: action.index, songNoteIndex: 0, songNotes: song.notes,
          highlights: {}, songDone: false, songCorrect: 0, songNoteWrongCount: 0,
          message: `🎵 ${song.title} — Name each note!`,
        };
      }
      case "SONG_PICK": {
        if (state.songDone || !state.songNotes) return state;
        const raw = state.songNotes[state.songNoteIndex];
        const expected = raw.charAt(0);
        if (action.note !== expected) {
          const newSongWrongs = state.songNoteWrongCount + 1;
          if (newSongWrongs >= 3) {
            const revealHL = { ...state.highlights, [state.songNoteIndex]: "reveal" };
            if (state.songNoteIndex + 1 >= state.songNotes.length) {
              return { ...state, highlights: revealHL, songDone: true, songCorrect: state.songCorrect, songNoteWrongCount: 0, message: "🎉 Song complete!" };
            }
            return { ...state, highlights: revealHL, songNoteIndex: state.songNoteIndex + 1, songNoteWrongCount: 0, message: `That note is ${expected}! Remember it!` };
          }
          return { ...state, highlights: { ...state.highlights, [state.songNoteIndex]: "wrong" }, songNoteWrongCount: newSongWrongs, message: `Not quite — try again! (${3 - newSongWrongs} tries left)` };
        }
        const newHL = { ...state.highlights, [state.songNoteIndex]: "correct" };
        const newCorrect = state.songCorrect + 1;
        if (state.songNoteIndex + 1 >= state.songNotes.length) {
          return { ...state, highlights: newHL, songDone: true, songCorrect: newCorrect, songNoteWrongCount: 0, message: "🎉 Song complete! Beautiful!" };
        }
        return { ...state, highlights: newHL, songNoteIndex: state.songNoteIndex + 1, songCorrect: newCorrect, songNoteWrongCount: 0 };
      }
      case "SONG_CLEAR": {
        const newHL = { ...state.highlights };
        delete newHL[action.index];
        return { ...state, highlights: newHL };
      }

      case "WEAK_START": {
        const weakNotes = getWeakNotesList(state.stats);
        const word = pickWeakWord(weakNotes, []);
        return {
          ...INITIAL_STATE, phase: "weak", clef: action.clef,
          unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
          weakNotes, word, slots: getSlots(word), slotIndex: 0,
          guessed: {}, highlights: {}, weakScore: 0, weakTotal: 0,
          message: `Focus on: ${weakNotes.join(", ")}`,
        };
      }
      case "WEAK_PICK": {
        if (state.isDone || !state.word || !state.slots.length) return state;
        const targetIdx = state.slots[state.slotIndex];
        const expected = state.word.w[targetIdx];
        const newStats = { ...state.stats };
        newStats.totalGuesses = (newStats.totalGuesses || 0) + 1;
        newStats.noteAttempts = { ...newStats.noteAttempts };
        newStats.noteAttempts[expected] = (newStats.noteAttempts[expected] || 0) + 1;
        const newWeakTotal = state.weakTotal + 1;

        if (action.note !== expected) {
          const newSlotWrongs = state.slotWrongCount + 1;
          if (newSlotWrongs >= 3) {
            return {
              ...state, highlights: { ...state.highlights, [state.slotIndex]: "reveal" },
              slotWrongCount: newSlotWrongs, weakTotal: newWeakTotal,
              message: `That note is ${expected} — study it!`, stats: newStats,
            };
          }
          return {
            ...state, highlights: { ...state.highlights, [state.slotIndex]: "wrong" },
            slotWrongCount: newSlotWrongs, weakTotal: newWeakTotal,
            message: `Not quite — try again! (${3 - newSlotWrongs} left)`, stats: newStats,
          };
        }
        newStats.correctGuesses = (newStats.correctGuesses || 0) + 1;
        newStats.noteCorrect = { ...newStats.noteCorrect };
        newStats.noteCorrect[expected] = (newStats.noteCorrect[expected] || 0) + 1;
        const newGuessed = { ...state.guessed, [state.slotIndex]: action.note };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        const newWeakScore = state.weakScore + 1;

        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0, weakScore: newWeakScore, weakTotal: newWeakTotal, stats: newStats };
        }
        newStats.wordsCompleted = (newStats.wordsCompleted || 0) + 1;
        newStats.xp = (newStats.xp || 0) + 10;
        return {
          ...state, guessed: newGuessed, highlights: newHL, isDone: true, slotWrongCount: 0,
          weakScore: newWeakScore, weakTotal: newWeakTotal, stats: newStats,
          message: `✨ "${state.word.w}" complete! ${newWeakScore}/${newWeakTotal} correct`,
        };
      }
      case "WEAK_NEXT": {
        const word = pickWeakWord(state.weakNotes, [...state.usedWords, state.word?.w].filter(Boolean));
        return {
          ...state, word, slots: getSlots(word), slotIndex: 0,
          guessed: {}, highlights: {}, isDone: false, slotWrongCount: 0,
          usedWords: [...state.usedWords, state.word?.w].filter(Boolean),
          message: `Focus on: ${state.weakNotes.join(", ")}`,
        };
      }
      case "WEAK_ADVANCE_REVEAL": {
        const newGuessed = { ...state.guessed, [state.slotIndex]: state.word.w[state.slots[state.slotIndex]] };
        const newHL = { ...state.highlights, [state.slotIndex]: "correct" };
        if (state.slotIndex + 1 < state.slots.length) {
          return { ...state, guessed: newGuessed, highlights: newHL, slotIndex: state.slotIndex + 1, slotWrongCount: 0 };
        }
        return { ...state, guessed: newGuessed, highlights: newHL, isDone: true, slotWrongCount: 0, message: `"${state.word.w}" — Keep practicing!` };
      }
      case "WEAK_CLEAR": {
        const newHL = { ...state.highlights };
        delete newHL[action.index];
        return { ...state, highlights: newHL };
      }

      case "SCRAMBLE_START": {
        const word = pickScrambleWord([]);
        const scrambled = makeScramble(word);
        return {
          ...INITIAL_STATE,
          phase: "scramble", clef: action.clef,
          unlockedStages: state.unlockedStages, stats: state.stats, powerups: state.powerups,
          score: state.score,
          scrambleWord: word,
          scrambleNotes: scrambled,
          scrambleGuessed: {},
          scrambleHL: {},
          scrambleSlotIndex: 0,
          scrambleDone: false,
          scrambleScore: 0,
          scrambleTotal: 0,
          scrambleWrongCount: 0,
          scrambleHintsUsed: 0,
          message: `🔀 Unscramble! Hint: "${word.h}"`,
        };
      }
      case "SCRAMBLE_PICK": {
        if (state.scrambleDone || !state.scrambleWord) return state;
        const expected = state.scrambleWord.w[state.scrambleSlotIndex];

        if (action.note !== expected) {
          const newWrongs = state.scrambleWrongCount + 1;
          if (newWrongs >= 3) {
            const revealHL = { ...state.scrambleHL, [state.scrambleSlotIndex]: "reveal" };
            const revealGuessed = { ...state.scrambleGuessed, [state.scrambleSlotIndex]: expected };
            const nextIdx = state.scrambleSlotIndex + 1;
            if (nextIdx >= state.scrambleWord.w.length) {
              return { ...state, scrambleHL: revealHL, scrambleGuessed: revealGuessed, scrambleDone: true, scrambleWrongCount: 0, scrambleTotal: state.scrambleTotal + 1, message: `That was "${state.scrambleWord.w}"! Keep practicing!` };
            }
            return { ...state, scrambleHL: revealHL, scrambleGuessed: revealGuessed, scrambleSlotIndex: nextIdx, scrambleWrongCount: 0, scrambleTotal: state.scrambleTotal + 1, message: `That letter is ${expected}! (${nextIdx + 1}/${state.scrambleWord.w.length})` };
          }
          return { ...state, scrambleHL: { ...state.scrambleHL, [state.scrambleSlotIndex]: "wrong" }, scrambleWrongCount: newWrongs, message: `Not quite — try again! (${3 - newWrongs} tries left)` };
        }

        const newGuessed = { ...state.scrambleGuessed, [state.scrambleSlotIndex]: action.note };
        const newHL = { ...state.scrambleHL, [state.scrambleSlotIndex]: "correct" };
        const newTotal = state.scrambleTotal + 1;
        const newScore = state.scrambleScore + 1;
        const nextIdx2 = state.scrambleSlotIndex + 1;

        if (nextIdx2 >= state.scrambleWord.w.length) {
          return { ...state, scrambleGuessed: newGuessed, scrambleHL: newHL, scrambleDone: true, scrambleWrongCount: 0, scrambleScore: newScore, scrambleTotal: newTotal, message: `🎉 "${state.scrambleWord.w}" — Great job!` };
        }
        return { ...state, scrambleGuessed: newGuessed, scrambleHL: newHL, scrambleSlotIndex: nextIdx2, scrambleWrongCount: 0, scrambleScore: newScore, scrambleTotal: newTotal };
      }
      case "SCRAMBLE_NEXT": {
        const newUsed = [...state.usedWords, state.scrambleWord?.w].filter(Boolean);
        const word = pickScrambleWord(newUsed);
        const scrambled = makeScramble(word);
        return {
          ...state,
          scrambleWord: word,
          scrambleNotes: scrambled,
          scrambleGuessed: {},
          scrambleHL: {},
          scrambleSlotIndex: 0,
          scrambleDone: false,
          scrambleWrongCount: 0,
          scrambleHintsUsed: 0,
          usedWords: newUsed,
          message: `🔀 Unscramble! Hint: "${word.h}"`,
        };
      }
      case "SCRAMBLE_CLEAR": {
        const newHL = { ...state.scrambleHL };
        delete newHL[action.index];
        return { ...state, scrambleHL: newHL };
      }

      default: return state;
    }
  }

  return reducer;
}
