import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { lerp } from "../anim";

/** Full-bleed Veo clip with a slow push, muted. `rate` < 1 stretches an 8 s clip over a longer scene. */
export const Broll: React.FC<{ src: string; rate?: number; from?: number; push?: [number, number]; dur: number; dim?: number; style?: React.CSSProperties }> = ({ src, rate = 1, from = 0, push = [1.04, 1.12], dur, dim = 0, style }) => {
  const f = useCurrentFrame();
  const z = lerp(f, [0, dur], push, (t) => t);
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <OffthreadVideo src={staticFile(`broll/${src}.mp4`)} muted playbackRate={rate} trimBefore={Math.round(from * 30)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})` }} />
      {dim > 0 && <AbsoluteFill style={{ background: `rgba(10,20,14,${dim})` }} />}
    </AbsoluteFill>
  );
};

/** Bottom-weighted scrim so type over footage stays legible without darkening the whole frame. */
export const Scrim: React.FC<{ side?: "bottom" | "left" | "right"; strength?: number }> = ({ side = "bottom", strength = 0.75 }) => {
  const dir = side === "bottom" ? "to top" : side === "left" ? "to right" : "to left";
  return <AbsoluteFill style={{ background: `linear-gradient(${dir}, rgba(8,18,12,${strength}) 0%, rgba(8,18,12,${strength * 0.55}) 38%, rgba(8,18,12,0) 72%)` }} />;
};
