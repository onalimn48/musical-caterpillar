export function restartEndlessWithCountInFlow({
  endlessModeRef,
  pendingLevelAdvanceRef,
  levelTransitionPausedRef,
  activeInputSourcesRef,
  successfulHitTimesRef,
  playerInputActiveRef,
  startedRef,
  nextBeatAtRef,
  ltRef,
  animRef,
  notesRef,
  obsRef,
  syncRhythmRenderState,
  syncObstacleRender,
  clearFeedbackFlashState,
  clearLevelBanner,
  resetBurglarPresentation,
  resetRhythmLaneMotion,
  applyTempo,
  setStarted,
  setBeatIdx,
  beginCountIn,
  selectedStartLevelRef,
}, nextBpm) {
  if (!endlessModeRef.current) return;
  pendingLevelAdvanceRef.current = null;
  levelTransitionPausedRef.current = false;
  activeInputSourcesRef.current.clear();
  successfulHitTimesRef.current = [];
  playerInputActiveRef.current = false;
  startedRef.current = false;
  nextBeatAtRef.current = 0;
  ltRef.current = null;
  cancelAnimationFrame(animRef.current);
  animRef.current = null;
  notesRef.current = [];
  obsRef.current = [];
  syncRhythmRenderState([]);
  syncObstacleRender([]);
  clearFeedbackFlashState();
  clearLevelBanner();
  resetBurglarPresentation();
  resetRhythmLaneMotion();
  applyTempo(nextBpm);
  setStarted(false);
  setBeatIdx(0);
  beginCountIn(selectedStartLevelRef.current);
}

export function consumeCountInPlannedPhraseFlow({
  countInPlannedPhraseRef,
  countInPlannedNextPhraseRef,
  pullNextPhrase,
  endlessModeRef,
  ensureEndlessQueue,
  endlessQueueRef,
  endlessPhraseCountRef,
  setPhaseText,
  levelPhraseQueueRef,
  levelPhraseIndexRef,
  currentLevelDefRef,
}, now = performance.now()) {
  const plannedPhrase = countInPlannedPhraseRef.current;
  countInPlannedPhraseRef.current = null;
  countInPlannedNextPhraseRef.current = null;
  if (!plannedPhrase) return pullNextPhrase(now);
  if (endlessModeRef.current) {
    ensureEndlessQueue(now);
    if (endlessQueueRef.current[0]?.id === plannedPhrase.id) {
      endlessQueueRef.current.shift();
    }
    endlessPhraseCountRef.current += 1;
    setPhaseText(`ENDLESS PATTERN ${endlessPhraseCountRef.current}`);
    return plannedPhrase;
  }
  if (levelPhraseQueueRef.current[0] === plannedPhrase.id) {
    levelPhraseQueueRef.current.shift();
    levelPhraseIndexRef.current += 1;
    setPhaseText(`PHRASE ${levelPhraseIndexRef.current}/${currentLevelDefRef.current.phraseIds.length}`);
  }
  return plannedPhrase;
}

export function clearCountInState({
  countInFrameRef,
  countInActiveRef,
  countInTimersRef,
  countInStartRef,
  countInGameStartRef,
  countInPreviewRef,
  countInPlannedPhraseRef,
  countInPlannedNextPhraseRef,
  countInTotalBeatsRef,
  setCountingIn,
  setCountInBeat,
  setCountInRender,
  setCountInPreviewRender,
  resetRhythmLaneMotion,
}, clearPlannedPhrases = true) {
  cancelAnimationFrame(countInFrameRef.current);
  countInFrameRef.current = null;
  countInActiveRef.current = false;
  countInTimersRef.current.forEach(clearTimeout);
  countInTimersRef.current = [];
  countInStartRef.current = 0;
  countInGameStartRef.current = 0;
  countInPreviewRef.current = [];
  if (clearPlannedPhrases) {
    countInPlannedPhraseRef.current = null;
    countInPlannedNextPhraseRef.current = null;
  }
  countInTotalBeatsRef.current = 4;
  setCountingIn(false);
  setCountInBeat(0);
  setCountInRender([]);
  setCountInPreviewRender([]);
  resetRhythmLaneMotion();
}

export function disposeCountInState({
  countInFrameRef,
  countInActiveRef,
  countInTimersRef,
  countInStartRef,
  countInGameStartRef,
  countInPreviewRef,
  countInPlannedPhraseRef,
  countInTotalBeatsRef,
  resetRhythmLaneMotion,
}) {
  cancelAnimationFrame(countInFrameRef.current);
  countInFrameRef.current = null;
  countInActiveRef.current = false;
  countInTimersRef.current.forEach(clearTimeout);
  countInTimersRef.current = [];
  countInStartRef.current = 0;
  countInGameStartRef.current = 0;
  countInPreviewRef.current = [];
  countInPlannedPhraseRef.current = null;
  countInTotalBeatsRef.current = 4;
  resetRhythmLaneMotion();
}

export function startRunFlow({
  levelTransitionPausedRef,
  startedRef,
  laneOriginRef,
  currentTravelMs,
  consumeCountInPlannedPhrase,
  countInCommittedNotesRef,
  primeLaneNotes,
  notesRef,
  syncRhythmRenderState,
  beginSequence,
  scheduleRhythmForSequence,
  onBeat,
  nextBeatAtRef,
  currentBeatMs,
  setStarted,
}, startNow = performance.now()) {
  levelTransitionPausedRef.current = false;
  startedRef.current = true;
  if (!laneOriginRef.current) laneOriginRef.current = startNow - currentTravelMs();
  const firstPhrase = consumeCountInPlannedPhrase(startNow);
  const committedNotes = countInCommittedNotesRef.current;
  countInCommittedNotesRef.current = [];
  if (committedNotes.length) {
    const liveNotes = primeLaneNotes(committedNotes, laneOriginRef.current || (startNow - currentTravelMs()), currentTravelMs());
    notesRef.current = liveNotes;
    syncRhythmRenderState(liveNotes);
    beginSequence(firstPhrase, startNow, 0, true);
  } else {
    scheduleRhythmForSequence(firstPhrase, startNow, 0);
    beginSequence(firstPhrase, startNow, 0);
  }
  onBeat(startNow);
  nextBeatAtRef.current = startNow + currentBeatMs();
  setStarted(true);
}

export function getCountInNotesForRender({
  ts,
  countInStart,
  countInTotalBeats,
  currentBeatMs,
  beatMsToTravelMs,
  rhythmHitX,
  rhythmSpawnX,
}) {
  const laneW = rhythmSpawnX - rhythmHitX;
  const beatMs = currentBeatMs();
  const travelMs = beatMsToTravelMs(beatMs);
  if (!countInStart) return [];
  const markers = [];
  for (let beatNumber = 1; beatNumber <= countInTotalBeats; beatNumber++) {
    const hitTime = countInStart + (beatNumber - 1) * beatMs;
    const x = rhythmHitX + ((hitTime - ts) / travelMs) * laneW;
    if (x < rhythmHitX - 28 || x > rhythmSpawnX + 28) continue;
    markers.push({
      id: `count-in-${beatNumber}`,
      x,
      kind: "count_in",
      label: String(beatNumber),
    });
  }
  return markers;
}

export function getCountInPreviewNotesForRender({
  ts,
  countInPreview,
  currentTravelMs,
  rhythmHitX,
  rhythmSpawnX,
}) {
  const laneW = rhythmSpawnX - rhythmHitX;
  const travelMs = currentTravelMs();
  const visible = [];
  for (const note of countInPreview) {
    const x = rhythmHitX + ((note.hitTime - ts) / travelMs) * laneW;
    if (x < rhythmHitX - 28 || x > rhythmSpawnX + 28) continue;
    visible.push({ ...note, x });
  }
  return visible;
}

export function startCountInAnimationLoop({
  countInFrameRef,
  countInActiveRef,
  setCountInRender,
  setCountInPreviewRender,
  getCountInNotes,
  getCountInPreviewNotes,
}) {
  if (countInFrameRef.current || !countInActiveRef.current) return;
  const animateCountIn = ts => {
    if (!countInActiveRef.current) {
      countInFrameRef.current = null;
      return;
    }
    setCountInRender(getCountInNotes(ts));
    setCountInPreviewRender(getCountInPreviewNotes(ts));
    countInFrameRef.current = requestAnimationFrame(animateCountIn);
  };
  countInFrameRef.current = requestAnimationFrame(animateCountIn);
}

export function beginCountInFlow({
  startLevel,
  selectedStartLevelRef,
  getCampaignLevelDef,
  endlessModeRef,
  selectedMenuModeRef,
  endlessQueueRef,
  curSeqRef,
  createEndlessPhrase,
  phraseById,
  currentBeatMs,
  getBeatsPerBar,
  defaultTimeSignature,
  getTimeSignatureLabel,
  countInLeadBeatsConst,
  clearCountIn,
  clearFeedbackFlashState,
  resetBurglarPresentation,
  countInActiveRef,
  countInPlannedPhraseRef,
  countInPlannedNextPhraseRef,
  countInTotalBeatsRef,
  countInStartRef,
  countInGameStartRef,
  laneOriginRef,
  buildRhythmNotes,
  countInPreviewRef,
  setCountingIn,
  setCountInBeat,
  resetRhythmLaneMotion,
  setCountInRender,
  setCountInPreviewRender,
  countInFrameRef,
  startCountInAnimation,
  getCountInNotes,
  getCountInPreviewNotes,
  countInTimersRef,
  setBeatIdx,
  hat,
  kick,
  snare,
  setBeatFlash,
  countInCommittedNotesRef,
  startRun,
}, now = performance.now()) {
  const resolvedStartLevel = startLevel ?? selectedStartLevelRef.current;
  const startLevelDef = getCampaignLevelDef(resolvedStartLevel);
  const usingEndlessQueue = endlessModeRef.current || selectedMenuModeRef.current === "endless";
  if (usingEndlessQueue) {
    while (endlessQueueRef.current.length < 2) {
      const previousName = endlessQueueRef.current.length
        ? endlessQueueRef.current[endlessQueueRef.current.length - 1].name
        : curSeqRef.current?.name || null;
      endlessQueueRef.current.push(createEndlessPhrase(performance.now(), previousName));
    }
  }
  const firstPhrase = usingEndlessQueue
    ? endlessQueueRef.current[0]
    : phraseById[startLevelDef.phraseIds[0]];
  const nextPhrase = usingEndlessQueue
    ? (endlessQueueRef.current[1] || null)
    : (phraseById[startLevelDef.phraseIds[1]] || null);
  const beatMs = currentBeatMs();
  const countInBeats = getBeatsPerBar(usingEndlessQueue ? defaultTimeSignature : getTimeSignatureLabel(startLevelDef));
  const countInLeadBeats = usingEndlessQueue ? 0 : countInLeadBeatsConst;
  const countInLeadMs = beatMs * countInLeadBeats;
  clearCountIn();
  clearFeedbackFlashState();
  resetBurglarPresentation();
  countInActiveRef.current = true;
  countInPlannedPhraseRef.current = firstPhrase;
  countInPlannedNextPhraseRef.current = nextPhrase;
  countInTotalBeatsRef.current = countInBeats;
  countInStartRef.current = now + countInLeadMs;
  countInGameStartRef.current = countInStartRef.current + beatMs * countInBeats;
  laneOriginRef.current = countInStartRef.current;
  const previewNotes = buildRhythmNotes(firstPhrase.rhythmEvents, countInGameStartRef.current, beatMs, "intro", {
    instanceId: "intro",
    spanBeats: firstPhrase.spanBeats,
    absoluteStartBeat: 0,
  });
  const nextPreviewNotes = nextPhrase
    ? buildRhythmNotes(
        nextPhrase.rhythmEvents,
        countInGameStartRef.current + firstPhrase.spanBeats * beatMs,
        beatMs,
        "intro-next",
        {
          instanceId: "intro-next",
          spanBeats: nextPhrase.spanBeats,
          absoluteStartBeat: firstPhrase.spanBeats,
        }
      )
    : [];
  countInPreviewRef.current = [...previewNotes, ...nextPreviewNotes];
  setCountingIn(true);
  setCountInBeat(0);
  resetRhythmLaneMotion();
  setCountInRender(getCountInNotes(now));
  setCountInPreviewRender(getCountInPreviewNotes(now));
  cancelAnimationFrame(countInFrameRef.current);
  countInFrameRef.current = null;
  startCountInAnimation();
  for (let i = 0; i < countInBeats; i++) {
    const beatTimer = setTimeout(() => {
      if (!countInActiveRef.current) return;
      const beatNumber = i + 1;
      setCountInBeat(beatNumber);
      setBeatIdx(i);
      const b4 = beatNumber % 4;
      hat(b4 === 0 || b4 === 2);
      if (b4 === 0 || b4 === 2) kick(); else snare();
      setBeatFlash(true);
      setTimeout(() => setBeatFlash(false), 80);
    }, countInLeadMs + i * beatMs);
    countInTimersRef.current.push(beatTimer);
  }
  const startTimer = setTimeout(() => {
    if (!countInActiveRef.current) return;
    const startAt = countInGameStartRef.current || performance.now();
    countInCommittedNotesRef.current = countInPreviewRef.current.map(note => ({ ...note }));
    clearCountIn(false);
    startRun(startAt);
  }, countInLeadMs + beatMs * countInBeats);
  countInTimersRef.current.push(startTimer);
}
