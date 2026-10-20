import type { CSSProperties } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig, type SpringConfig } from "remotion";

export const SMOOTH: Partial<SpringConfig> = { damping: 200 };
export const SOFT: Partial<SpringConfig> = { damping: 200, stiffness: 70 };
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (f: number, i: number[], o: number[], easing = EASE) => interpolate(f, i, o, { ...clamp, easing });

export const useSpringIn = (delay = 0, config: Partial<SpringConfig> = SMOOTH) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

/** Fade + rise + unblur from a 0 → 1 progress. */
export const rise = (p: number, distance = 36, blur = 10): CSSProperties => ({
  opacity: Math.min(1, p * 1.4),
  transform: `translateY(${(1 - p) * distance}px)`,
  filter: blur ? `blur(${Math.max(0, (1 - p) * blur)}px)` : undefined,
});

/** Exit: 0 → 1 progress fades out and lifts slightly (exits ~10f vs entrances ~20f). */
export const fall = (p: number): CSSProperties => ({ opacity: 1 - p, transform: `translateY(${-p * 14}px)` });

/** Deterministic ≤1px idle breathing. */
export const breathe = (f: number, seed = 0) => Math.sin(f / 22 + seed) * 0.8;
