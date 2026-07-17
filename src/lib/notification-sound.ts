// A short, gentle chime for new-enquiry notifications, plus a persisted mute
// preference. Everything here is best-effort: browsers block audio until the
// user has interacted with the page, so every path fails silently rather than
// throwing — a missed beep must never break the notification it accompanies.

const MUTE_KEY = "mdw:enquiry-sound-muted";

export function isEnquirySoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setEnquirySoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable (private mode / disabled) — preference just won't persist */
  }
}

// One reused AudioContext. Created lazily on the first beep so we never spin one
// up during SSR or before it's needed.
let ctx: AudioContext | null = null;

function playTone(context: AudioContext, freq: number, start: number, dur: number) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(context.destination);
  // Soft attack + exponential decay so it reads as a chime, not a flat test tone.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/**
 * Play the two-note new-enquiry chime, unless muted or the browser won't allow
 * audio yet. No-ops (silently) in every failure case.
 */
export function playEnquiryBeep(): void {
  if (isEnquirySoundMuted()) return;
  if (typeof window === "undefined") return;
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    // Autoplay policy: a context created without a recent user gesture starts
    // "suspended". resume() may reject — swallow it; a later gesture-driven
    // call (e.g. toggling sound on) will have primed it.
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    playTone(ctx, 784, t, 0.12); // G5
    playTone(ctx, 1047, t + 0.11, 0.16); // C6
  } catch {
    /* AudioContext blocked/unavailable — stay silent, by design */
  }
}
