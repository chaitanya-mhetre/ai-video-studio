import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

/** Light canvas with two slow drifting light pools and a faded dot grid — continuous under every scene. */
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const a = f / 110;
  return (
    <AbsoluteFill style={{ backgroundColor: C.canvas, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1500, height: 1500, left: -420 + Math.sin(a) * 120, top: -760 + Math.cos(a * 0.8) * 80, borderRadius: "50%", background: `radial-gradient(circle, ${C.soft}dd 0%, ${C.tint}99 38%, transparent 68%)` }} />
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(${C.brandDeep}1a 1.2px, transparent 1.2px)`, backgroundSize: "34px 34px", backgroundPosition: `${(f * 0.15) % 34}px 0px`, maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)", WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 20%, transparent 80%)" }} />
    </AbsoluteFill>
  );
};
