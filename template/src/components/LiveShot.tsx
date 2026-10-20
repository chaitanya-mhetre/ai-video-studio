import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { EASE_IO } from "../anim";
import { C } from "../theme";
import { CHROME, Window } from "./Window";

/** Camera key: at frame f, centre page point (x, y) in 1920×1080 CSS px, magnified z× over the fitted page. */
export type CamKey = { f: number; x: number; y: number; z: number };
export type Box = { x: number; y: number; w: number; h: number; from: number; to?: number; label?: string; color?: string };

const sample = (keys: CamKey[], f: number) => {
  const frames = keys.map((k) => k.f);
  const o = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IO } as const;
  return { x: interpolate(f, frames, keys.map((k) => k.x), o), y: interpolate(f, frames, keys.map((k) => k.y), o), z: interpolate(f, frames, keys.map((k) => k.z), o) };
};

/**
 * A real console capture (2x PNG) inside browser chrome, driven by a 2D camera. Page coordinates are the 1920×1080
 * layout the capture was taken at, so highlight boxes come straight from live-layout.json.
 */
/** Where page point (px, py) sits inside the window viewport at frame f. */
export const project = (cam: CamKey[], f: number, width: number, px: number, py: number) => {
  const vw = width, vh = Math.round((width * 1080) / 1920);
  const { x, y, z } = sample(cam, f);
  const s = (vw / 1920) * z;
  const tx = Math.min(0, Math.max(vw - 1920 * s, vw / 2 - x * s));
  const ty = Math.min(0, Math.max(vh - 1080 * s, vh / 2 - y * s));
  return { x: tx + px * s, y: CHROME + ty + py * s };
};

export const LiveShot: React.FC<{ src: string; width?: number; cam: CamKey[]; boxes?: Box[]; frame?: number; children?: React.ReactNode }> = ({ src, width = 1480, cam, boxes = [], frame, children }) => {
  const local = useCurrentFrame();
  const f = frame ?? local;
  const vw = width;
  const vh = Math.round((width * 1080) / 1920);
  const fit = vw / 1920;
  const { x, y, z } = sample(cam, f);
  const s = fit * z;
  const tx = Math.min(0, Math.max(vw - 1920 * s, vw / 2 - x * s));
  const ty = Math.min(0, Math.max(vh - 1080 * s, vh / 2 - y * s));
  return (
    <Window width={vw} height={vh + CHROME}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>
        <Img src={staticFile(`live/${src}.png`)} style={{ width: 1920, height: 1080, display: "block" }} />
        {boxes.map((b, i) => {
          const p = interpolate(f, [b.from, b.from + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_IO });
          const out = b.to ? interpolate(f, [b.to, b.to + 10], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          const col = b.color ?? C.brand;
          return (
            <div key={i} style={{ position: "absolute", left: b.x - 8, top: b.y - 8, width: b.w + 16, height: b.h + 16, borderRadius: 14, border: `${3 / s}px solid ${col}`, boxShadow: `0 0 0 ${8 * p / s}px ${col}22`, opacity: p * out, transform: `scale(${1.04 - 0.04 * p})` }} />
          );
        })}
        {children}
      </div>
    </Window>
  );
};
