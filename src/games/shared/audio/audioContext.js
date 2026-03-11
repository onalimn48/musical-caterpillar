const AudioCtxClass = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);

let sharedAudioContext = null;

export function getAudioContext() {
  if (!AudioCtxClass) return null;
  if (!sharedAudioContext || sharedAudioContext.state === "closed") {
    sharedAudioContext = new AudioCtxClass();
  }
  return sharedAudioContext;
}

export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(null);

  if (ctx.state === "suspended") {
    return ctx.resume().then(() => ctx).catch(() => ctx);
  }

  return Promise.resolve(ctx);
}
