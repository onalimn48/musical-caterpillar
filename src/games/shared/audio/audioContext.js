const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

let sharedAudioContext = null;
let masterOutputNode = null;

function ensureMasterOutputNode(ctx) {
  if (masterOutputNode?.context === ctx) {
    return masterOutputNode;
  }

  const masterGain = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();

  masterGain.gain.setValueAtTime(0.88, ctx.currentTime);
  limiter.threshold.setValueAtTime(-12, ctx.currentTime);
  limiter.knee.setValueAtTime(8, ctx.currentTime);
  limiter.ratio.setValueAtTime(12, ctx.currentTime);
  limiter.attack.setValueAtTime(0.003, ctx.currentTime);
  limiter.release.setValueAtTime(0.12, ctx.currentTime);

  masterGain.connect(limiter);
  limiter.connect(ctx.destination);

  masterOutputNode = masterGain;
  return masterOutputNode;
}

export function getAudioContext() {
  if (!AudioCtxClass) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioCtxClass();
    masterOutputNode = null;
  }
  return sharedAudioContext;
}

export function getMasterOutputNode() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return ensureMasterOutputNode(ctx);
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);

  if (ctx.state === "suspended") {
    return ctx.resume().then(() => {
      ensureMasterOutputNode(ctx);
      return ctx;
    }).catch(() => {
      ensureMasterOutputNode(ctx);
      return ctx;
    });
  }

  ensureMasterOutputNode(ctx);
  return Promise.resolve(ctx);
}
