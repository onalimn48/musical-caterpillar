export function createStepTransport({
  context,
  getTempo,
  getStepCount,
  onStep,
  stepsPerBeat = 2,
  lookaheadMs = 25,
  scheduleAheadTime = 0.12,
}) {
  let isRunning = false;
  let currentStep = 0;
  let nextStepTime = 0;
  let schedulerId = null;

  function getStepDuration() {
    return 60 / getTempo() / stepsPerBeat;
  }

  function advanceStep() {
    currentStep = (currentStep + 1) % getStepCount();
    nextStepTime += getStepDuration();
  }

  function scheduler() {
    if (!isRunning || !context) return;

    while (nextStepTime < context.currentTime + scheduleAheadTime) {
      onStep(currentStep, nextStepTime);
      advanceStep();
    }

    schedulerId = window.setTimeout(scheduler, lookaheadMs);
  }

  return {
    start(startAt = context?.currentTime ?? 0) {
      if (!context || isRunning) return;

      isRunning = true;
      currentStep = 0;
      nextStepTime = startAt;
      scheduler();
    },
    stop() {
      isRunning = false;
      currentStep = 0;
      nextStepTime = 0;
      if (schedulerId) {
        window.clearTimeout(schedulerId);
        schedulerId = null;
      }
    },
    isRunning() {
      return isRunning;
    },
  };
}
