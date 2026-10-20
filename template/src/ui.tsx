import type { CSSProperties, ReactNode } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, rise, SMOOTH, useSpringIn } from "./anim";
import { C, DEVA, FONT, GRADIENT } from "./theme";

// Indic scripts (Devanagari etc.) need room above the line for matras and NO negative letter-spacing
// (it breaks conjunct shaping). lineHeight 1.32 + paddingTop 6% of size is safe for both Latin and Devanagari.

/** Word-by-word kinetic headline. Wrap a word in *asterisks* to paint it with the gradient accent. */
export const Title: React.FC<{ lines: string[]; delay?: number; size?: number; stagger?: number; align?: CSSProperties["textAlign"]; color?: string; weight?: number; accent?: string; font?: string }> = ({
  lines, delay = 0, size = 84, stagger = 4, align = "left", color = C.ink, weight = 600, accent = GRADIENT, font = FONT,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let index = 0;
  return (
    <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, lineHeight: 1.32, color, textAlign: align, position: "relative", zIndex: 20 }}>
      {lines.map((line, li) => (
        <div key={li} style={{ whiteSpace: "nowrap" }}>
          {line.split(" ").map((raw, wi) => {
            const p = spring({ frame: frame - delay - index++ * stagger, fps, config: SMOOTH });
            const hi = raw.startsWith("*") && raw.endsWith("*");
            const word = hi ? raw.slice(1, -1) : raw;
            return (
              <span key={wi} style={{ display: "inline-block", marginRight: size * 0.26, paddingTop: size * 0.06, ...rise(p, size * 0.4, 10), ...(hi ? { backgroundImage: accent, WebkitBackgroundClip: "text", color: "transparent" } : null) }}>
                {word}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Kicker: React.FC<{ children: ReactNode; delay?: number; dark?: boolean; font?: string }> = ({ children, delay = 0, dark, font = FONT }) => {
  const p = useSpringIn(delay);
  return (
    <div style={{ display: "inline-flex", alignSelf: "flex-start", width: "fit-content", whiteSpace: "nowrap", alignItems: "center", gap: 14, padding: "10px 26px 12px 16px", borderRadius: 999, background: dark ? "rgba(16,16,20,0.45)" : "rgba(255,255,255,0.88)", boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.25)" : `0 0 0 1px ${C.soft}`, fontFamily: font, fontSize: 28, fontWeight: 600, color: dark ? "#fff" : C.brand, ...rise(p, 20, 6) }}>
      <span style={{ width: 11, height: 11, borderRadius: 6, background: dark ? "#9fdcb3" : C.brand, boxShadow: `0 0 0 5px ${dark ? "rgba(159,220,179,0.25)" : C.tint}` }} />
      {children}
    </div>
  );
};

export const Sub: React.FC<{ children: ReactNode; delay?: number; size?: number; color?: string; width?: number; align?: CSSProperties["textAlign"]; font?: string }> = ({ children, delay = 0, size = 36, color = C.muted, width, align, font = FONT }) => {
  const p = useSpringIn(delay);
  return <div style={{ fontFamily: font, fontSize: size, lineHeight: 1.5, color, maxWidth: width, textAlign: align, ...rise(p, 24, 8) }}>{children}</div>;
};

/** Documentary lower-left caption over footage: a short rule, then the line. Fades out at `out`. */
export const Caption: React.FC<{ children: ReactNode; kicker?: string; delay?: number; out?: number; size?: number; font?: string }> = ({ children, kicker, delay = 0, out, size = 64, font = FONT }) => {
  const f = useCurrentFrame();
  const p = useSpringIn(delay);
  const rule = lerp(f, [delay, delay + 24], [0, 1]);
  const gone = out ? lerp(f, [out, out + 10], [0, 1]) : 0;
  return (
    <div style={{ position: "absolute", left: 120, bottom: 120, display: "flex", flexDirection: "column", gap: 14, opacity: 1 - gone, zIndex: 20 }}>
      {kicker && <div style={{ fontFamily: font, fontSize: 28, fontWeight: 500, color: "#b9f0c9", ...rise(p, 16, 4) }}>{kicker}</div>}
      <div style={{ width: 120 * rule, height: 4, borderRadius: 2, background: "#b9f0c9" }} />
      <div style={{ fontFamily: font, fontSize: size, fontWeight: 600, lineHeight: 1.3, color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,0.45)", whiteSpace: "nowrap", ...rise(p, 30, 8) }}>{children}</div>
    </div>
  );
};

/** Small source / disclosure note, bottom-right. */
export const Note: React.FC<{ children: ReactNode; delay?: number; dark?: boolean }> = ({ children, delay = 0, dark }) => {
  const p = useSpringIn(delay);
  return <div style={{ position: "absolute", right: 72, bottom: 44, fontFamily: FONT, fontSize: 22, color: dark ? "rgba(255,255,255,0.75)" : C.faint, opacity: p, zIndex: 30 }}>{children}</div>;
};

/** Native digits for Indic on-screen numbers: mr(2026) → "२०२६". */
const DEVA_DIGITS = "०१२३४५६७८९";
export const deva = (n: number | string) => String(n).replace(/\d/g, (d) => DEVA_DIGITS[+d]);
export { DEVA };
