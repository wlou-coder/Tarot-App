export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Exponential Moving Average smoother — reduces jitter without a long delay
export class LandmarkSmoother {
  private prev: Landmark[] | null = null;
  private readonly alpha: number;

  constructor(alpha = 0.22) {
    this.alpha = alpha; // lower = smoother but laggier
  }

  smooth(current: Landmark[]): Landmark[] {
    if (!this.prev || this.prev.length !== current.length) {
      this.prev = current.map((l) => ({ ...l }));
      return this.prev;
    }
    const a = this.alpha;
    const b = 1 - a;
    const out = current.map((lm, i) => ({
      x: a * lm.x + b * this.prev![i].x,
      y: a * lm.y + b * this.prev![i].y,
      z: a * lm.z + b * this.prev![i].z,
    }));
    this.prev = out;
    return out;
  }

  reset() {
    this.prev = null;
  }
}

// Palm center: average of wrist + 4 knuckle bases
export function getPalmCenter(lm: Landmark[]): { x: number; y: number } {
  const pts = [0, 5, 9, 13, 17];
  return {
    x: pts.reduce((s, i) => s + lm[i].x, 0) / pts.length,
    y: pts.reduce((s, i) => s + lm[i].y, 0) / pts.length,
  };
}

export function isHandInCenter(lm: Landmark[]): boolean {
  const c = getPalmCenter(lm);
  const mx = 1 - c.x; // mirror for selfie view
  return mx > 0.2 && mx < 0.8 && c.y > 0.1 && c.y < 0.9;
}

// tip.y > pip.y  →  finger has curled downward toward palm (y increases downward in MediaPipe)
function isCurled(lm: Landmark[], tip: number, pip: number): boolean {
  return lm[tip].y > lm[pip].y;
}

// Open palm: 2+ fingertips clearly above their base knuckle (MCP)
export function isOpenPalm(lm: Landmark[]): boolean {
  const extended = [
    lm[8].y  < lm[5].y,   // index tip above index MCP
    lm[12].y < lm[9].y,   // middle
    lm[16].y < lm[13].y,  // ring
    lm[20].y < lm[17].y,  // pinky
  ].filter(Boolean).length;
  return extended >= 2;
}

// Grasp / fist: 3+ fingers with tip dropped below their PIP joint
export function isGrasp(lm: Landmark[]): boolean {
  const TIPS = [8,  12, 16, 20];
  const PIPS = [6,  10, 14, 18];
  const curled = TIPS.filter((tip, i) => isCurled(lm, tip, PIPS[i])).length;
  return curled >= 3;
}

// Tracks position stability and returns 0→1 charge progress.
// Uses a separate stableStart timestamp so progress reliably reaches 1.0.
export class StabilityTracker {
  // Short rolling window just for movement detection
  private recent: { x: number; y: number; t: number }[] = [];
  private stableStart: number | null = null;
  private readonly holdMs: number;
  private readonly threshold: number;
  private readonly recentWindowMs: number;

  constructor(holdMs = 1400, threshold = 0.05, recentWindowMs = 350) {
    this.holdMs          = holdMs;
    this.threshold       = threshold;
    this.recentWindowMs  = recentWindowMs;
  }

  update(pos: { x: number; y: number }, now: number): number {
    this.recent.push({ ...pos, t: now });
    this.recent = this.recent.filter((p) => now - p.t < this.recentWindowMs);

    if (this.recent.length < 4) return 0;

    const xs = this.recent.map((p) => p.x);
    const ys = this.recent.map((p) => p.y);
    const movement = Math.max(
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys)
    );

    if (movement > this.threshold) {
      // Too much jitter — restart the hold clock
      this.stableStart = null;
      return 0;
    }

    // Hand is steady: start or continue counting
    if (this.stableStart === null) this.stableStart = now;
    const elapsed = now - this.stableStart;
    return Math.min(elapsed / this.holdMs, 1.0); // cleanly reaches 1.0
  }

  reset() {
    this.recent      = [];
    this.stableStart = null;
  }
}
