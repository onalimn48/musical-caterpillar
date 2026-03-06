import { INITIAL_CLASSIC_STATE, INITIAL_STATE } from "./initialState.js";

export function classicReducer(state, action) {
  switch (action.type) {
    case "START_CLASSIC":
      return {
        ...INITIAL_CLASSIC_STATE,
        unlocked: state.unlocked,
        question: action.question,
      };

    case "CLASSIC_SET_UNLOCKED":
      return {
        ...state,
        unlocked: action.unlocked,
      };

    case "CLASSIC_SWITCH_LEVEL":
      return {
        ...state,
        level: action.level,
        question: action.question,
        highlight: null,
        showAnswer: false,
        songHint: null,
        buttonHighlights: {},
        correctInLevel: 0,
        wrongCount: 0,
        showClue: false,
      };

    case "CLASSIC_CORRECT":
      return {
        ...state,
        total: state.total + 1,
        highlight: "correct",
        showAnswer: true,
        buttonHighlights: action.buttonHighlights || {},
        score: state.score + action.scoreGain,
        streak: action.streak,
        correct: state.correct + 1,
        songHint: action.songHint,
        correctInLevel: state.correctInLevel + 1,
      };

    case "CLASSIC_WRONG":
      return {
        ...state,
        total: state.total + 1,
        highlight: "wrong",
        buttonHighlights: action.buttonHighlights || {},
        streak: action.nextStreak,
        wrongCount: state.wrongCount + 1,
      };

    case "CLASSIC_CLEAR_FEEDBACK":
      return {
        ...state,
        highlight: null,
        buttonHighlights: {},
      };

    case "CLASSIC_NEXT_QUESTION":
      return {
        ...state,
        question: action.question,
        highlight: null,
        showAnswer: false,
        songHint: null,
        buttonHighlights: {},
        wrongCount: 0,
        showClue: false,
        correctInLevel: action.resetCorrectInLevel ? 0 : state.correctInLevel,
      };

    case "CLASSIC_LEVEL_UP":
      return {
        ...state,
        levelUp: action.levelUp,
        unlocked: action.unlocked,
      };

    case "CLASSIC_ACK_LEVEL_UP":
      return {
        ...state,
        level: action.level,
        levelUp: null,
        correctInLevel: 0,
        question: action.question,
        highlight: null,
        showAnswer: false,
        songHint: null,
        buttonHighlights: {},
        wrongCount: 0,
        showClue: false,
      };

    case "CLASSIC_SHOW_CLUE":
      return {
        ...state,
        showClue: action.show,
      };

    default:
      return state;
  }
}

export function createChordSnowmanReducer() {
  return function reducer(state = INITIAL_STATE, action) {
    if (action.type.startsWith("CLASSIC_") || action.type === "START_CLASSIC") {
      return {
        ...state,
        classic: classicReducer(state.classic, action),
      };
    }

    return state;
  };
}
