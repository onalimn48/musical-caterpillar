export const DEFAULT_TIME_SIGNATURE = "4/4";

export function getTimeSignatureLabel(levelDef) {
  return levelDef?.timeSignature || DEFAULT_TIME_SIGNATURE;
}

export function getBeatsPerBar(timeSignature = DEFAULT_TIME_SIGNATURE) {
  const beats = Number(String(timeSignature).split("/")[0]);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

export function getActiveNoteValuesLabel(events = []) {
  const labels = [];
  const seen = new Set();
  for (const event of events) {
    const label = ({
      quarter: "Q",
      dotted_quarter: "DQ",
      eighth: "8",
      sixteenth: "16",
      triplet: "3",
      hold: event.holdStyle === "quarter_rest"
        ? "REST"
        : event.holdStyle === "half_hold"
          ? "HOLD 2"
          : event.holdStyle === "measure_rest"
            ? "REST 4"
            : event.holdStyle === "endless_hold"
              ? "HOLD 3"
              : "HOLD",
    })[event.kind] || null;
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels.join(" · ") || "Q";
}

function phraseWindowRatio(events) {
  let smallest = Infinity;
  for (const event of events) {
    if (event.kind === "hold") continue;
    const duration = event.durationBeats ?? 1;
    if (duration < smallest) smallest = duration;
  }
  if (smallest <= 0.25) return 0.12;
  if (smallest <= 1 / 3) return 0.15;
  if (smallest <= 0.5) return 0.22;
  return 0.28;
}

export function createHeistRhythmData({ obstacleAtBeat }) {
  const MOVE_TEMPLATES = {
    RUN: {
      name: "RUN",
      poses: ["run_a", "run_b", "run_a", "run_b"],
      label: "",
      col: "#888",
      peakPose: null,
      obstacleAtBeat: null,
    },
    JUMP: {
      name: "JUMP",
      poses: ["run_a", "run_b", "jump_open", "jump_open", "jump_tuck", "run_a", "run_b"],
      label: "JUMP",
      col: "#ff3366",
      obstacleAtBeat: 3,
      peakPose: "jump_open",
    },
    DUCK: {
      name: "DUCK",
      poses: ["run_a", "run_b", "run_a", "duck_low", "duck_crawl", "duck_low", "run_b"],
      label: "DUCK",
      col: "#44cc88",
      obstacleAtBeat: obstacleAtBeat,
      peakPose: "duck_crawl",
    },
    SLIDE: {
      name: "SLIDE",
      poses: ["run_a", "run_b", "run_a", "duck_low", "slide_low", "duck_low", "run_b"],
      label: "SLIDE",
      col: "#ff6600",
      obstacleAtBeat: obstacleAtBeat,
      peakPose: "slide_low",
    },
    WINDMILL: {
      name: "WINDMILL",
      poses: ["run_a", "run_b", "run_a", "windmill_a", "windmill_b", "windmill_a", "run_b"],
      label: "WINDMILL",
      col: "#ff9900",
      obstacleAtBeat: obstacleAtBeat,
      peakPose: "windmill_b",
    },
    HEADSPIN: {
      name: "HEADSPIN",
      poses: ["run_a", "run_b", "run_a", "headspin", "headspin", "headspin", "run_b"],
      label: "HEADSPIN",
      col: "#cc44ff",
      obstacleAtBeat: obstacleAtBeat,
      peakPose: "headspin",
    },
    FREEZE: {
      name: "FREEZE",
      poses: ["run_a", "run_b", "run_a", "freeze", "run_b", "run_a", "run_b"],
      label: "HIDE!",
      col: "#00ccff",
      obstacleAtBeat: obstacleAtBeat,
      peakPose: "freeze",
    },
    TUCK: {
      name: "TUCK",
      poses: ["run_a", "run_b", "jump_tuck", "jump_tuck", "jump_tuck", "run_a", "run_b"],
      label: "TUCK",
      col: "#ff88cc",
      obstacleAtBeat: 3,
      peakPose: "jump_tuck",
    },
  };

  const pattern = (...parts) => parts.flatMap(part => Array.isArray(part) ? part : [part]);
  const q = at => ({ at, kind: "quarter", durationBeats: 1 });
  const dq = at => ({ at, kind: "dotted_quarter", durationBeats: 1.5 });
  const e = at => ({ at, kind: "eighth", durationBeats: 0.5 });
  const hold = (at, durationBeats, holdStyle = "hold") => ({ at, kind: "hold", durationBeats, holdStyle });
  const pair = (at, key) => [
    { at, kind: "eighth", durationBeats: 0.5, groupKey: key, beamCount: 1 },
    { at: at + 0.5, kind: "eighth", durationBeats: 0.5, groupKey: key, beamCount: 1 },
  ];
  const sixteenthPairPlusEighth = (at, key) => [
    { at, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.25, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.5, kind: "eighth", durationBeats: 0.5, groupKey: key, beamCount: 1 },
  ];
  const fourSixteenths = (at, key) => [
    { at, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.25, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.5, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.75, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
  ];
  const eighthPlusSixteenthPair = (at, key, accent = null) => [
    { at, kind: "eighth", durationBeats: 0.5, groupKey: key, beamCount: 1, accent },
    { at: at + 0.5, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
    { at: at + 0.75, kind: "sixteenth", durationBeats: 0.25, groupKey: key, beamCount: 2 },
  ];
  const triplet = (at, key) => [
    { at, kind: "triplet", durationBeats: 1 / 3, groupKey: key, beamCount: 1, groupLabel: "3" },
    { at: at + 1 / 3, kind: "triplet", durationBeats: 1 / 3, groupKey: key, beamCount: 1, groupLabel: "3" },
    { at: at + 2 / 3, kind: "triplet", durationBeats: 1 / 3, groupKey: key, beamCount: 1, groupLabel: "3" },
  ];

  function validateRhythmEvents(id, rhythmEvents, { allowTumbao = false } = {}) {
    const sortedEvents = [...rhythmEvents].sort((left, right) => left.at - right.at);
    for (let index = 0; index < sortedEvents.length; index++) {
      const event = sortedEvents[index];
      if (event.kind !== "dotted_quarter") continue;
      const nextEvent = sortedEvents[index + 1] || null;
      const expectedAt = event.at + (event.durationBeats || 1.5);
      const hasTrailingEighth =
        nextEvent &&
        nextEvent.kind === "eighth" &&
        Math.abs(nextEvent.at - expectedAt) < 0.001;
      if (!hasTrailingEighth && !allowTumbao) {
        throw new Error(`Phrase "${id}" uses a dotted quarter without a following eighth note.`);
      }
    }
  }

  function validateSpanLength(id, rhythmEvents, spanBeats) {
    if (!Number.isFinite(spanBeats) || spanBeats <= 0) return;
    const maxEndBeat = rhythmEvents.reduce(
      (latest, event) => Math.max(latest, event.at + (event.durationBeats || 1)),
      0
    );
    if (Math.abs(maxEndBeat - spanBeats) > 0.001) {
      throw new Error(`Phrase "${id}" has spanBeats ${spanBeats} but its last event ends at beat ${maxEndBeat}.`);
    }
  }

  function makePhrase(id, templateKey, rhythmEvents, options = {}) {
    const template = MOVE_TEMPLATES[templateKey];
    const hideCue = options.boxCue || null;
    validateRhythmEvents(id, rhythmEvents, options);
    const firstHoldEvent = rhythmEvents.find(event => event.kind === "hold") || null;
    const defaultLabelAtBeat = templateKey === "FREEZE" && firstHoldEvent
      ? Math.max(0, firstHoldEvent.at - 0.5)
      : 0;
    const defaultObstacleAtBeat = templateKey === "FREEZE" && firstHoldEvent
      ? (hideCue
        ? hideCue.startBeat + hideCue.durationBeats / 2
        : firstHoldEvent.at + firstHoldEvent.durationBeats / 2)
      : template.obstacleAtBeat;
    return {
      id,
      ...template,
      spanBeats: options.spanBeats ?? template.poses.length,
      obstacleAtBeat: options.obstacleAtBeat ?? defaultObstacleAtBeat,
      labelAtBeat: options.labelAtBeat ?? defaultLabelAtBeat,
      rhythmEvents: [...rhythmEvents].sort((left, right) => left.at - right.at),
      boxCue: hideCue,
      difficulty: options.difficulty || 1,
      levelHint: options.levelHint || template.label || template.name,
      endlessWeight: options.endlessWeight ?? 0,
      windowRatio: phraseWindowRatio(rhythmEvents),
    };
  }

  const PHRASES = [
    makePhrase("casing_jump", "JUMP", pattern(q(0), q(1), q(2), q(3), q(4), q(5), q(6)), { difficulty: 1, levelHint: "QUARTERS" }),
    makePhrase("casing_duck", "DUCK", pattern(q(0), q(1), q(2), q(3), q(4), q(5), q(6)), { difficulty: 1, levelHint: "QUARTERS" }),
    makePhrase("casing_slide", "SLIDE", pattern(q(0), q(1), q(2), q(3), q(4), q(5), q(6)), { difficulty: 1, levelHint: "QUARTERS" }),
    makePhrase("casing_freeze", "FREEZE", pattern(q(0), q(1), q(2), hold(3, 1, "quarter_rest"), q(4), q(5), q(6)), {
      difficulty: 1,
      levelHint: "QUARTER HOLDS",
      boxCue: { startBeat: 3, durationBeats: 1 },
    }),
    makePhrase("side_jump", "JUMP", pattern(q(0), q(1), q(2), pair(3, "sj-1"), q(4), q(5), q(6)), { difficulty: 2, levelHint: "EIGHTH PAIRS" }),
    makePhrase("side_duck", "DUCK", pattern(q(0), q(1), q(2), q(3), pair(4, "sd-1"), q(5), q(6)), { difficulty: 2, levelHint: "EIGHTH PAIRS" }),
    makePhrase("side_slide", "SLIDE", pattern(q(0), q(1), pair(2, "ss-1"), q(3), q(4), q(5), q(6)), { difficulty: 2, levelHint: "TIPTOE PAIRS" }),
    makePhrase("side_freeze", "FREEZE", pattern(q(0), q(1), q(2), hold(3, 1, "quarter_rest"), q(4), pair(5, "sf-1"), q(6)), {
      difficulty: 2,
      levelHint: "PAIR THEN HOLD",
      boxCue: { startBeat: 3, durationBeats: 1 },
    }),
    makePhrase("security_jump", "JUMP", pattern(q(0), pair(1, "secj-1"), dq(2), e(3.5), q(4), pair(5, "secj-2"), q(6)), {
      difficulty: 3,
      levelHint: "DOTTED LURCH",
    }),
    makePhrase("security_duck", "DUCK", pattern(q(0), q(1), dq(2), e(3.5), q(4), pair(5, "secd-1"), q(6)), {
      difficulty: 3,
      levelHint: "READ AHEAD",
    }),
    makePhrase("security_slide", "SLIDE", pattern(q(0), pair(1, "secs-1"), q(2), dq(3), e(4.5), q(5), q(6)), {
      difficulty: 3,
      levelHint: "DOTTED + PAIR",
    }),
    makePhrase("vault_hold", "FREEZE", pattern(q(0), q(1), q(2), hold(3, 2, "half_hold"), pair(5, "vh-1"), q(6)), {
      difficulty: 4,
      levelHint: "HALF HOLD",
      boxCue: { startBeat: 3, durationBeats: 2 },
    }),
    makePhrase("vault_jump", "JUMP", pattern(q(0), q(1), pair(2, "vj-1"), q(3), q(4), q(5), q(6)), {
      difficulty: 4,
      levelHint: "BREATH BEFORE HOLD",
    }),
    makePhrase("vault_duck", "DUCK", pattern(q(0), pair(1, "vd-1"), q(2), q(3), hold(4, 2, "half_hold"), q(6)), {
      difficulty: 4,
      levelHint: "PAIRS TO HOLD",
    }),
    makePhrase("watch_setup_quarters", "RUN", pattern(q(0), q(1), q(2), q(3)), {
      difficulty: 5,
      levelHint: "SETUP QUARTERS",
      spanBeats: 4,
    }),
    makePhrase("watch_whole_opening", "FREEZE", pattern(hold(0, 4, "measure_rest")), {
      difficulty: 5,
      levelHint: "WHOLE WAIT",
      boxCue: { startBeat: 0, durationBeats: 4 },
      spanBeats: 4,
    }),
    makePhrase("jewel_sync_jump", "JUMP", pattern(q(0), dq(1), e(2.5), q(3), pair(4, "jsj-1"), q(5), q(6)), {
      difficulty: 5,
      levelHint: "OFFBEAT STEP",
    }),
    makePhrase("jewel_sync_slide", "SLIDE", pattern(dq(0), e(1.5), q(2), dq(3), e(4.5), q(5), q(6)), {
      difficulty: 5,
      levelHint: "SYNCOPATED",
    }),
    makePhrase("jewel_sync_gap", "WINDMILL", pattern(q(0), q(1), pair(2, "jsg-1"), dq(3), e(4.5), q(5), q(6)), {
      difficulty: 5,
      levelHint: "OFFBEAT GAP",
    }),
    makePhrase("roof_straight_jump", "JUMP", pattern(q(0), q(1), fourSixteenths(2, "rfj-1"), q(3), q(4), q(5), q(6)), {
      difficulty: 6,
      levelHint: "STRAIGHT 16S",
    }),
    makePhrase("roof_straight_gap", "HEADSPIN", pattern(q(0), fourSixteenths(1, "rfg-1"), q(2), q(3), q(4), q(5), q(6)), {
      difficulty: 6,
      levelHint: "BURST THEN BREATHE",
    }),
    makePhrase("roof_straight_tuck", "TUCK", pattern(q(0), q(1), q(2), fourSixteenths(3, "rft-1"), q(4), q(5), q(6)), {
      difficulty: 6,
      levelHint: "ONE BEAT IN FOUR",
    }),
    makePhrase("roof_sprint_jump", "JUMP", pattern(q(0), pair(1, "rsj-1"), q(2), eighthPlusSixteenthPair(3, "rsj-2"), q(4), q(5), q(6)), {
      difficulty: 7,
      levelHint: "16-16-8",
    }),
    makePhrase("roof_sprint_gap", "HEADSPIN", pattern(q(0), q(1), pair(2, "rsg-1"), q(3), eighthPlusSixteenthPair(4, "rsg-2"), q(5), q(6)), {
      difficulty: 7,
      levelHint: "8-16-16",
    }),
    makePhrase("roof_sprint_tuck", "TUCK", pattern(q(0), q(1), q(2), sixteenthPairPlusEighth(3, "rst-1"), q(4), q(5), q(6)), {
      difficulty: 7,
      levelHint: "MIXED SIXTEENTHS",
    }),
    makePhrase("penthouse_triplet_gap", "WINDMILL", pattern(q(0), q(1), triplet(2, "ptg-1"), q(3), pair(4, "ptg-2"), q(5), q(6)), {
      difficulty: 8,
      levelHint: "TRIPLET FIGURE",
    }),
    makePhrase("penthouse_triplet_tuck", "TUCK", pattern(q(0), pair(1, "ptt-1"), triplet(2, "ptt-2"), q(3), q(4), q(5), q(6)), {
      difficulty: 8,
      levelHint: "THIRD PATH",
    }),
    makePhrase("penthouse_triplet_spin", "HEADSPIN", pattern(q(0), q(1), q(2), triplet(3, "pts-1"), q(4), pair(5, "pts-2"), q(6)), {
      difficulty: 8,
      levelHint: "TRIPLET BODY FEEL",
    }),
    makePhrase("heist_mix_jump", "JUMP", pattern(q(0), pair(1, "hmj-1"), dq(2), e(3.5), eighthPlusSixteenthPair(4, "hmj-2"), q(5), q(6)), {
      difficulty: 9,
      levelHint: "FULL MIX",
      endlessWeight: 3,
    }),
    makePhrase("heist_mix_freeze", "FREEZE", pattern(q(0), q(1), q(2), q(3), hold(4, 4, "measure_rest")), {
      difficulty: 9,
      levelHint: "FULL MEASURE REST",
      boxCue: { startBeat: 4, durationBeats: 4 },
      endlessWeight: 2,
      spanBeats: 8,
    }),
    makePhrase("heist_mix_gap", "HEADSPIN", pattern(q(0), triplet(1, "hmg-1"), dq(2), e(3.5), pair(4, "hmg-2"), sixteenthPairPlusEighth(5, "hmg-3"), q(6)), {
      difficulty: 9,
      levelHint: "MIXED MEMORY",
      endlessWeight: 3,
    }),
    makePhrase("heist_mix_tuck", "TUCK", pattern(q(0), q(1), pair(2, "hmt-1"), triplet(3, "hmt-2"), q(4), q(5)), {
      difficulty: 9,
      levelHint: "FULL VOCAB",
      endlessWeight: 3,
      spanBeats: 6,
    }),
  ];

  const PHRASE_BY_ID = Object.fromEntries(PHRASES.map(phrase => [phrase.id, phrase]));

  const LEVEL_THEME_PRESETS = {
    casing: {
      accent: "#7ce7ff",
      backdrop: "radial-gradient(circle at 50% 18%, rgba(16,46,78,.34) 0%, rgba(5,9,18,.28) 48%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 38%, rgba(0,0,0,.08) 58%, rgba(0,0,0,.22) 76%, rgba(0,0,0,.42) 100%)",
      edgeGlow: "inset 24px 0 36px rgba(124,231,255,.06), inset -24px 0 36px rgba(255,200,120,.03)",
    },
    side_entrance: {
      accent: "#ffb86a",
      backdrop: "radial-gradient(circle at 50% 20%, rgba(70,34,11,.3) 0%, rgba(11,6,4,.2) 52%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 36%, rgba(0,0,0,.12) 60%, rgba(0,0,0,.28) 80%, rgba(0,0,0,.48) 100%)",
      edgeGlow: "inset 20px 0 32px rgba(255,170,90,.06), inset -20px 0 32px rgba(255,80,40,.04)",
    },
    security_wing: {
      accent: "#7fffd4",
      backdrop: "radial-gradient(circle at 50% 18%, rgba(14,52,58,.3) 0%, rgba(4,12,16,.22) 50%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 38%, rgba(0,0,0,.09) 58%, rgba(0,0,0,.22) 77%, rgba(0,0,0,.44) 100%)",
      edgeGlow: "inset 24px 0 36px rgba(80,255,220,.05), inset -24px 0 36px rgba(120,220,255,.04)",
    },
    vault_corridor: {
      accent: "#f5e642",
      backdrop: "radial-gradient(circle at 50% 16%, rgba(96,76,12,.28) 0%, rgba(15,10,3,.24) 55%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 34%, rgba(0,0,0,.14) 58%, rgba(0,0,0,.3) 80%, rgba(0,0,0,.5) 100%)",
      edgeGlow: "inset 26px 0 40px rgba(245,230,66,.05), inset -26px 0 40px rgba(255,120,60,.04)",
    },
    jewel_room: {
      accent: "#ff8bd8",
      backdrop: "radial-gradient(circle at 50% 20%, rgba(82,17,53,.28) 0%, rgba(15,4,11,.2) 54%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 40%, rgba(0,0,0,.08) 60%, rgba(0,0,0,.22) 78%, rgba(0,0,0,.44) 100%)",
      edgeGlow: "inset 20px 0 34px rgba(255,139,216,.06), inset -20px 0 34px rgba(255,100,160,.04)",
    },
    rooftop_gallery: {
      accent: "#9ed9ff",
      backdrop: "radial-gradient(circle at 50% 14%, rgba(32,58,92,.32) 0%, rgba(7,11,20,.18) 56%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 42%, rgba(0,0,0,.06) 60%, rgba(0,0,0,.2) 77%, rgba(0,0,0,.42) 100%)",
      edgeGlow: "inset 24px 0 36px rgba(158,217,255,.07), inset -24px 0 36px rgba(255,255,255,.03)",
    },
    penthouse: {
      accent: "#d8b5ff",
      backdrop: "radial-gradient(circle at 50% 18%, rgba(56,24,78,.28) 0%, rgba(10,6,18,.22) 52%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 38%, rgba(0,0,0,.1) 58%, rgba(0,0,0,.26) 79%, rgba(0,0,0,.46) 100%)",
      edgeGlow: "inset 24px 0 36px rgba(216,181,255,.06), inset -24px 0 36px rgba(255,230,160,.03)",
    },
    great_heist: {
      accent: "#ff6f61",
      backdrop: "radial-gradient(circle at 50% 16%, rgba(88,22,22,.3) 0%, rgba(18,5,7,.24) 54%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 36%, rgba(0,0,0,.12) 58%, rgba(0,0,0,.28) 80%, rgba(0,0,0,.48) 100%)",
      edgeGlow: "inset 26px 0 40px rgba(255,111,97,.06), inset -26px 0 40px rgba(255,212,102,.04)",
    },
    endless: {
      accent: "#44ff88",
      backdrop: "radial-gradient(circle at 50% 15%, rgba(20,88,54,.32) 0%, rgba(5,16,10,.22) 52%, rgba(0,0,0,0) 100%)",
      vignette: "radial-gradient(circle at center, rgba(0,0,0,0) 35%, rgba(0,0,0,.12) 58%, rgba(0,0,0,.3) 80%, rgba(0,0,0,.5) 100%)",
      edgeGlow: "inset 26px 0 42px rgba(68,255,136,.07), inset -26px 0 42px rgba(68,200,255,.05)",
    },
  };

  const LEVELS = [
    { level: 1, title: "Casing the Joint", chapter: "Early Game", stageKey: "casing", bpm: 90, environment: "Wide gallery · one guard", coaching: "Walk the square beat like you own the floor", phraseIds: ["casing_jump", "casing_duck", "casing_freeze", "casing_slide"] },
    { level: 2, title: "Casing the Joint", chapter: "Early Game", stageKey: "casing", bpm: 88, environment: "Wide gallery · one guard", coaching: "Quarter notes, calm face, no heroics yet", phraseIds: ["casing_duck", "casing_jump", "casing_slide", "casing_freeze"] },
    { level: 3, title: "Casing the Joint", chapter: "Early Game", stageKey: "casing", bpm: 86, environment: "Wide gallery · one guard", coaching: "Let the pulse do the sneaking for you", phraseIds: ["casing_jump", "casing_freeze", "casing_duck", "casing_slide"] },
    { level: 4, title: "The Vault Corridor", chapter: "Levels 4-6", stageKey: "vault_corridor", bpm: 86, environment: "Close walls · first long holds", coaching: "A longer note means the body must wait", phraseIds: ["vault_hold", "vault_jump", "vault_duck", "vault_hold", "vault_jump", "vault_duck", "vault_hold"] },
    { level: 5, title: "The Vault Corridor", chapter: "Levels 4-6", stageKey: "vault_corridor", bpm: 85, environment: "Close walls · tense patrols", coaching: "Flatten the breath and stay hidden for two", phraseIds: ["vault_duck", "vault_hold", "vault_jump", "vault_hold", "vault_duck", "vault_jump", "vault_hold"] },
    { level: 6, title: "The Vault Corridor", chapter: "Levels 4-6", stageKey: "vault_corridor", bpm: 85, environment: "Close walls · tense patrols", coaching: "Release the hold like opening a locked latch", phraseIds: ["vault_jump", "vault_hold", "vault_duck", "vault_hold", "vault_jump", "vault_duck", "vault_hold"] },
    { level: 7, title: "The Night Watch", chapter: "Levels 7-9", stageKey: "security_wing", bpm: 82, environment: "Long sightline · sweeping guard", coaching: "The whole bar goes quiet; so should you", phraseIds: ["watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening"] },
    { level: 8, title: "The Night Watch", chapter: "Levels 7-9", stageKey: "security_wing", bpm: 84, environment: "Long sightline · sweeping guard", coaching: "Stand inside the silence until it passes", phraseIds: ["watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening"] },
    { level: 9, title: "The Night Watch", chapter: "Levels 7-9", stageKey: "security_wing", bpm: 85, environment: "Long sightline · sweeping guard", coaching: "Return from the hush exactly on time", phraseIds: ["watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening", "watch_setup_quarters", "watch_whole_opening"] },
    { level: 10, title: "The Side Entrance", chapter: "Levels 10-12", stageKey: "side_entrance", bpm: 90, environment: "Tighter corridor · patrol pairs", coaching: "Two neat footsteps fit inside one beat", phraseIds: ["side_jump", "side_duck", "side_slide", "side_freeze", "side_duck"] },
    { level: 11, title: "The Side Entrance", chapter: "Levels 10-12", stageKey: "side_entrance", bpm: 90, environment: "Tighter corridor · predictable guards", coaching: "Pair the notes and keep the shoes quiet", phraseIds: ["side_duck", "side_jump", "side_freeze", "side_slide", "side_jump"] },
    { level: 12, title: "The Side Entrance", chapter: "Levels 10-12", stageKey: "side_entrance", bpm: 90, environment: "Tighter corridor · second patrol feel", coaching: "Small quick steps, no rattling keys", phraseIds: ["side_slide", "side_duck", "side_jump", "side_freeze", "side_duck"] },
    { level: 13, title: "The Security Wing", chapter: "Levels 13-15", stageKey: "security_wing", bpm: 93, environment: "Security lanes · repeating phrase", coaching: "A dotted quarter leans long before it lands", phraseIds: ["security_jump", "security_duck", "security_jump", "security_duck", "security_slide", "security_jump", "security_duck"] },
    { level: 14, title: "The Security Wing", chapter: "Levels 13-15", stageKey: "security_wing", bpm: 95, environment: "Security lanes · repeating phrase", coaching: "Look ahead; the next step is already whispering", phraseIds: ["security_slide", "security_jump", "security_slide", "security_jump", "security_duck", "security_slide", "security_duck"] },
    { level: 15, title: "The Security Wing", chapter: "Levels 13-15", stageKey: "security_wing", bpm: 95, environment: "Security lanes · repeating phrase", coaching: "The loop repeats until it becomes instinct", phraseIds: ["security_duck", "security_slide", "security_duck", "security_slide", "security_jump", "security_duck", "security_jump"] },
    { level: 16, title: "The Jewel Room", chapter: "Levels 16-18", stageKey: "jewel_room", bpm: 90, environment: "Clean room · rhythm in focus", coaching: "The note slips off the beat and keeps smiling", phraseIds: ["jewel_sync_jump", "jewel_sync_slide", "jewel_sync_gap", "jewel_sync_jump", "jewel_sync_slide", "jewel_sync_gap", "jewel_sync_jump"] },
    { level: 17, title: "The Jewel Room", chapter: "Levels 16-18", stageKey: "jewel_room", bpm: 92, environment: "Clean room · rhythm in focus", coaching: "Hear the offbeat before the room hears you", phraseIds: ["jewel_sync_slide", "jewel_sync_jump", "jewel_sync_gap", "jewel_sync_slide", "jewel_sync_jump", "jewel_sync_gap", "jewel_sync_slide"] },
    { level: 18, title: "The Jewel Room", chapter: "Levels 16-18", stageKey: "jewel_room", bpm: 92, environment: "Clean room · rhythm in focus", coaching: "If you stumble here, learn from the glitter", phraseIds: ["jewel_sync_gap", "jewel_sync_jump", "jewel_sync_slide", "jewel_sync_gap", "jewel_sync_jump", "jewel_sync_slide", "jewel_sync_gap"] },
    { level: 19, title: "The Rooftop Gallery", chapter: "Levels 19-21", stageKey: "rooftop_gallery", bpm: 96, environment: "Open floor · one burst at a time", coaching: "Four tiny feet inside one beat, then breathe", phraseIds: ["roof_straight_jump", "roof_straight_gap", "roof_straight_tuck", "roof_straight_jump", "roof_straight_gap", "roof_straight_tuck", "roof_straight_jump", "roof_straight_gap", "roof_straight_tuck"] },
    { level: 20, title: "The Rooftop Gallery", chapter: "Levels 19-21", stageKey: "rooftop_gallery", bpm: 98, environment: "Open floor · settle after the burst", coaching: "Burst once, then let the quarters steady the heart", phraseIds: ["roof_straight_gap", "roof_straight_jump", "roof_straight_tuck", "roof_straight_gap", "roof_straight_jump", "roof_straight_tuck", "roof_straight_gap", "roof_straight_jump", "roof_straight_tuck"] },
    { level: 21, title: "The Rooftop Gallery", chapter: "Levels 19-21", stageKey: "rooftop_gallery", bpm: 100, environment: "Open floor · varied burst placement", coaching: "Find the four without falling out of the bar", phraseIds: ["roof_straight_tuck", "roof_straight_jump", "roof_straight_gap", "roof_straight_tuck", "roof_straight_jump", "roof_straight_gap", "roof_straight_tuck", "roof_straight_jump", "roof_straight_gap"] },
    { level: 22, title: "The Rooftop Gallery", chapter: "Levels 22-24", stageKey: "rooftop_gallery", bpm: 100, environment: "Open floor · sprint windows", coaching: "Now the quick notes change shape but not pulse", phraseIds: ["roof_sprint_jump", "roof_sprint_gap", "roof_sprint_tuck", "roof_sprint_jump", "roof_sprint_gap", "roof_sprint_tuck", "roof_sprint_jump", "roof_sprint_gap", "roof_sprint_tuck"] },
    { level: 23, title: "The Rooftop Gallery", chapter: "Levels 22-24", stageKey: "rooftop_gallery", bpm: 101, environment: "Open floor · sprint windows", coaching: "Read the knot: 16-16-8, then 8-16-16", phraseIds: ["roof_sprint_gap", "roof_sprint_jump", "roof_sprint_tuck", "roof_sprint_gap", "roof_sprint_jump", "roof_sprint_tuck", "roof_sprint_gap", "roof_sprint_jump", "roof_sprint_tuck"] },
    { level: 24, title: "The Rooftop Gallery", chapter: "Levels 22-24", stageKey: "rooftop_gallery", bpm: 102, environment: "Open floor · sprint windows", coaching: "Mixed fast feet, same moon, less mercy", phraseIds: ["roof_sprint_tuck", "roof_sprint_jump", "roof_sprint_gap", "roof_sprint_tuck", "roof_sprint_jump", "roof_sprint_gap", "roof_sprint_tuck", "roof_sprint_jump", "roof_sprint_gap"] },
    { level: 25, title: "The Penthouse Collection", chapter: "Levels 25-26", stageKey: "penthouse", bpm: 95, environment: "Elegant top floor · sparse triplets", coaching: "Three notes share one beat like a secret handshake", phraseIds: ["penthouse_triplet_gap", "penthouse_triplet_tuck", "penthouse_triplet_spin", "penthouse_triplet_gap", "penthouse_triplet_tuck", "penthouse_triplet_spin", "penthouse_triplet_gap", "penthouse_triplet_tuck", "penthouse_triplet_spin"] },
    { level: 26, title: "The Penthouse Collection", chapter: "Levels 25-26", stageKey: "penthouse", bpm: 96, environment: "Elegant top floor · sparse triplets", coaching: "Keep the triplet round; do not let it become three squares", phraseIds: ["penthouse_triplet_spin", "penthouse_triplet_gap", "penthouse_triplet_tuck", "penthouse_triplet_spin", "penthouse_triplet_gap", "penthouse_triplet_tuck", "penthouse_triplet_spin", "penthouse_triplet_gap", "penthouse_triplet_tuck"] },
    { level: 27, title: "The Great Heist", chapter: "Levels 27-28", stageKey: "great_heist", bpm: 94, environment: "Climax route · full mixed vocab", coaching: "Everything you learned is now in the same room", phraseIds: ["heist_mix_jump", "heist_mix_gap", "heist_mix_tuck", "heist_mix_freeze", "heist_mix_jump", "heist_mix_gap", "heist_mix_tuck", "heist_mix_freeze", "heist_mix_jump", "heist_mix_gap"] },
    { level: 28, title: "The Great Heist", chapter: "Levels 27-28", stageKey: "great_heist", bpm: 96, environment: "Climax route · full mixed vocab", coaching: "The vault asks for everything at once, including nerve", phraseIds: ["heist_mix_freeze", "heist_mix_jump", "heist_mix_gap", "heist_mix_tuck", "heist_mix_freeze", "heist_mix_jump", "heist_mix_gap", "heist_mix_tuck", "heist_mix_freeze", "heist_mix_gap"] },
  ];

  const PRIZE_BY_LEVEL = {
    1: { name: "Blueprint Scroll", kind: "scroll", colors: ["#eedcb2", "#9f6a2f", "#5e3d19"] },
    2: { name: "Gallery Ruby", kind: "gem", colors: ["#ff6a8a", "#8a1737", "#ffd3dc"] },
    3: { name: "Mini Crown", kind: "crown", colors: ["#f7d15c", "#9f6f12", "#fff1a6"] },
    4: { name: "Vault Sapphire", kind: "gem", colors: ["#6fd7ff", "#1a4a89", "#d7f6ff"] },
    5: { name: "Silver Chalice", kind: "chalice", colors: ["#d9ebff", "#6f849e", "#ffffff"] },
    6: { name: "Moon Pearl", kind: "orb", colors: ["#faf9ff", "#97a8c9", "#ffffff"] },
    7: { name: "Watchman Mask", kind: "mask", colors: ["#d7dfe8", "#44505f", "#fefefe"] },
    8: { name: "Ivory Statuette", kind: "idol", colors: ["#f5ead7", "#967352", "#fff8ef"] },
    9: { name: "Night Opal", kind: "gem", colors: ["#8d7cff", "#332175", "#efe9ff"] },
    10: { name: "Amber Cameo", kind: "cameo", colors: ["#ffb15c", "#8d4d19", "#ffe1be"] },
    11: { name: "Porcelain Vase", kind: "vase", colors: ["#f0f9ff", "#6891b2", "#ffffff"] },
    12: { name: "Bronze Lion", kind: "idol", colors: ["#d39b5f", "#72431f", "#ffe1ba"] },
    13: { name: "Security Emerald", kind: "gem", colors: ["#4ce89c", "#14613e", "#d8ffe8"] },
    14: { name: "Signal Tiara", kind: "crown", colors: ["#9bf0ff", "#2c7296", "#eefcff"] },
    15: { name: "Velvet Brooch", kind: "cameo", colors: ["#ff8bc5", "#7f204e", "#ffe0f0"] },
    16: { name: "Sunburst Diamond", kind: "gem", colors: ["#fff48f", "#b08b19", "#fffce0"] },
    17: { name: "Jeweled Crown", kind: "crown", colors: ["#ffd86c", "#9f6f12", "#ffecc2"] },
    18: { name: "Crystal Lotus", kind: "orb", colors: ["#c7f5ff", "#4c8eb5", "#f0fdff"] },
    19: { name: "Cloudline Diamond", kind: "gem", colors: ["#a8e7ff", "#2e6d8f", "#f1fdff"] },
    20: { name: "Stormglass Vase", kind: "vase", colors: ["#d7f6ff", "#5f8fa7", "#ffffff"] },
    21: { name: "Moonroof Compass", kind: "medallion", colors: ["#ffd273", "#966121", "#fff3c8"] },
    22: { name: "Skylight Prism", kind: "gem", colors: ["#8dd2ff", "#285ca0", "#e7f8ff"] },
    23: { name: "Windglass Vase", kind: "vase", colors: ["#d8fbff", "#5790ab", "#ffffff"] },
    24: { name: "Star Compass", kind: "medallion", colors: ["#ffca64", "#9a6320", "#fff0be"] },
    25: { name: "Penthouse Relic", kind: "idol", colors: ["#d8b5ff", "#6a42a3", "#f4ebff"] },
    26: { name: "Royal Tapestry", kind: "painting", colors: ["#ffb3bf", "#81304a", "#ffe8ee"] },
    27: { name: "Grand Heist Crown", kind: "crown", colors: ["#ff8a6e", "#973526", "#ffe0d8"] },
    28: { name: "Masterpiece Portrait", kind: "painting", colors: ["#ffcf86", "#7a4124", "#fff0d7"] },
  };

  const ENDLESS_BLUEPRINTS = [
    { id: "endless-pairs", levelHint: "PROCEDURAL PAIRS", difficulty: 6, endlessWeight: 2, spanBeats: 8, rhythmEvents: pattern(q(0), pair(1, "ep-1"), dq(2), e(3.5), q(4), pair(5, "ep-2"), q(6), q(7)) },
    { id: "endless-burst", levelHint: "PROCEDURAL BURST", difficulty: 7, endlessWeight: 3, spanBeats: 8, rhythmEvents: pattern(q(0), q(1), q(2), sixteenthPairPlusEighth(3, "eb-1"), q(4), q(5), q(6), q(7)) },
    { id: "endless-triplet", levelHint: "PROCEDURAL TRIPLET", difficulty: 7, endlessWeight: 2, spanBeats: 8, rhythmEvents: pattern(q(0), triplet(1, "et-1"), q(2), q(3), pair(4, "et-2"), q(5), q(6), q(7)) },
    { id: "endless-freeze", levelHint: "PROCEDURAL SILENCE", difficulty: 8, endlessWeight: 2, spanBeats: 8, templateKey: "FREEZE", rhythmEvents: pattern(q(0), q(1), hold(2, 3, "endless_hold"), q(5), q(6), q(7)), boxCue: { startBeat: 2, durationBeats: 3 } },
    { id: "endless-fullmix", levelHint: "PROCEDURAL FULL MIX", difficulty: 9, endlessWeight: 4, spanBeats: 8, rhythmEvents: pattern(q(0), pair(1, "ef-1"), triplet(2, "ef-2"), eighthPlusSixteenthPair(3, "ef-3"), q(4), q(5), q(6), q(7)) },
  ];
  ENDLESS_BLUEPRINTS.forEach(blueprint => {
    validateRhythmEvents(blueprint.id, blueprint.rhythmEvents);
    validateSpanLength(blueprint.id, blueprint.rhythmEvents, blueprint.spanBeats);
  });

  const clampCampaignLevel = level => {
    const numericLevel = Number.isFinite(level) ? Math.floor(level) : 1;
    return Math.max(1, Math.min(LEVELS.length, numericLevel));
  };

  const getCampaignLevelDef = level => LEVELS[clampCampaignLevel(level) - 1] || LEVELS[0];

  return {
    MOVE_TEMPLATES,
    PHRASES,
    PHRASE_BY_ID,
    LEVEL_THEME_PRESETS,
    LEVELS,
    PRIZE_BY_LEVEL,
    ENDLESS_BLUEPRINTS,
    makePhrase,
    clampCampaignLevel,
    getCampaignLevelDef,
  };
}

export function getLevelTeachingIntro(levelDef) {
  if (!levelDef?.level) return null;

  const teachingByLevel = {
    1: {
      id: "quarter-notes",
      title: "Quarter Notes",
      detail: "A quarter note gets 1 beat.",
      coaching: "Tap once on each beat and keep the pulse steady.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "quarter", at: 1, durationBeats: 1 },
        { kind: "quarter", at: 2, durationBeats: 1 },
        { kind: "quarter", at: 3, durationBeats: 1 },
      ],
    },
    4: {
      id: "half-note-hold",
      title: "Half-Note Holds",
      detail: "A half note lasts two beats.",
      coaching: "Press once and hold for two beats.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "hold", at: 1, durationBeats: 2, holdStyle: "half_hold" },
        { kind: "quarter", at: 3, durationBeats: 1 },
      ],
    },
    7: {
      id: "whole-note-wait",
      title: "Whole-Note Waits",
      detail: "A whole note spans all 4 beats.",
      coaching: "Tap and hold for four beats.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "hold", at: 0, durationBeats: 4, holdStyle: "measure_rest" },
      ],
    },
    10: {
      id: "eighth-notes",
      title: "Eighth Notes",
      detail: "Each eighth note gets 1/2 beat.",
      coaching: "Play two even notes within one beat.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "eighth", at: 1, durationBeats: 0.5, groupKey: "intro-8a", beamCount: 1 },
        { kind: "eighth", at: 1.5, durationBeats: 0.5, groupKey: "intro-8a", beamCount: 1 },
        { kind: "eighth", at: 2, durationBeats: 0.5, groupKey: "intro-8b", beamCount: 1 },
        { kind: "eighth", at: 2.5, durationBeats: 0.5, groupKey: "intro-8b", beamCount: 1 },
        { kind: "eighth", at: 3, durationBeats: 0.5, groupKey: "intro-8c", beamCount: 1 },
        { kind: "eighth", at: 3.5, durationBeats: 0.5, groupKey: "intro-8c", beamCount: 1 },
      ],
    },
    13: {
      id: "dotted-quarter",
      title: "Dotted Quarters",
      detail: "A dotted quarter lasts 1 1/2 beats.",
      coaching: "Feel the longer step, then land the next note without rushing.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "dotted_quarter", at: 0, durationBeats: 1.5 },
        { kind: "eighth", at: 1.5, durationBeats: 0.5 },
        { kind: "quarter", at: 2, durationBeats: 1 },
        { kind: "quarter", at: 3, durationBeats: 1 },
      ],
    },
    19: {
      id: "sixteenth-notes",
      title: "Sixteenth Notes",
      detail: "Each sixteenth note gets 1/4 beat.",
      coaching: "Stay relaxed and subdivide the beat into four even clicks.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "sixteenth", at: 1, durationBeats: 0.25, groupKey: "intro-16", beamCount: 2 },
        { kind: "sixteenth", at: 1.25, durationBeats: 0.25, groupKey: "intro-16", beamCount: 2 },
        { kind: "sixteenth", at: 1.5, durationBeats: 0.25, groupKey: "intro-16", beamCount: 2 },
        { kind: "sixteenth", at: 1.75, durationBeats: 0.25, groupKey: "intro-16", beamCount: 2 },
        { kind: "quarter", at: 2, durationBeats: 1 },
        { kind: "quarter", at: 3, durationBeats: 1 },
      ],
    },
    22: {
      id: "mixed-sixteenth-groupings",
      title: "Mixed Sixteenth Groups",
      detail: "A mix of an eighth note and two sixteenth notes.",
      coaching: "Keep the beat steady while the grouping shape changes.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "sixteenth", at: 1, durationBeats: 0.25, groupKey: "intro-mix-a", beamCount: 2 },
        { kind: "sixteenth", at: 1.25, durationBeats: 0.25, groupKey: "intro-mix-a", beamCount: 2 },
        { kind: "eighth", at: 1.5, durationBeats: 0.5, groupKey: "intro-mix-a", beamCount: 1 },
        { kind: "quarter", at: 2, durationBeats: 1 },
        { kind: "eighth", at: 3, durationBeats: 0.5, groupKey: "intro-mix-b", beamCount: 1 },
        { kind: "sixteenth", at: 3.5, durationBeats: 0.25, groupKey: "intro-mix-b", beamCount: 2 },
        { kind: "sixteenth", at: 3.75, durationBeats: 0.25, groupKey: "intro-mix-b", beamCount: 2 },
      ],
    },
    25: {
      id: "triplets",
      title: "Triplets",
      detail: "Three equal notes fit inside 1 beat.",
      coaching: "Count evenly in threes so the figure stays smooth, not rushed.",
      sampleSpanBeats: 4,
      sampleEvents: [
        { kind: "quarter", at: 0, durationBeats: 1 },
        { kind: "triplet", at: 1, durationBeats: 1 / 3, groupKey: "intro-triplet", beamCount: 1, groupLabel: "3" },
        { kind: "triplet", at: 1 + 1 / 3, durationBeats: 1 / 3, groupKey: "intro-triplet", beamCount: 1, groupLabel: "3" },
        { kind: "triplet", at: 1 + 2 / 3, durationBeats: 1 / 3, groupKey: "intro-triplet", beamCount: 1, groupLabel: "3" },
        { kind: "quarter", at: 2, durationBeats: 1 },
        { kind: "quarter", at: 3, durationBeats: 1 },
      ],
    },
  };

  return teachingByLevel[levelDef.level] || null;
}
