import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { lerp, rise, useSpringIn } from "../anim";
import { Broll, Scrim } from "../components/Broll";
import { LiveShot } from "../components/LiveShot";
import { C, FONT, MONO, SHADOW_MD } from "../theme";
import { cue, scene, type SceneProps } from "../timeline";
import lines from "../vo-lines.json";
import { Caption, Kicker, Note, Sub, Title } from "../ui";

// Five reference shots. Each scene gets local frames (0 = its own start) plus `lead` = frame its VO starts.
// Time on-screen beats to speech with `lead + cue(vo, "word")`, never hard-coded seconds.

/** Opening: logo on a white card above the film title. Holds ≥30 still frames before the cut. */
export const TitleCard: React.FC<SceneProps> = () => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 40, marginTop: -40 }}>
    <div style={{ padding: "26px 48px", borderRadius: 28, background: "#fff", boxShadow: SHADOW_MD, ...rise(useSpringIn(6), 30, 8) }}>
      <Img src={staticFile("brand/logo.png")} style={{ height: 120, display: "block" }} />
    </div>
    <Title lines={["Field reports, *verified.*"]} size={96} align="center" delay={22} />
    <Sub delay={40} align="center">A short film</Sub>
  </AbsoluteFill>
);

/** Documentary B-roll (Veo clip or Ken Burns still) with a bottom scrim and a caption cued to the narration. */
export const Problem: React.FC<SceneProps> = ({ duration, lead }) => (
  <AbsoluteFill>
    <Broll src="problem" rate={0.7} dur={duration} />
    <Scrim side="bottom" strength={0.75} />
    <Caption kicker="The problem" delay={lead + cue("problem", "faster")}>Inspections pile up</Caption>
  </AbsoluteFill>
);

/** Real product capture under a 2D camera: start wide, push to the area the narration names, draw a box. */
export const Product: React.FC<SceneProps> = ({ lead }) => {
  const at = lead + cue("product", "verified");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
      <div><Kicker delay={4}>The product</Kicker></div>
      <div style={rise(useSpringIn(10), 60, 8)}>
        <LiveShot src="app" width={1200} cam={[{ f: 0, x: 960, y: 540, z: 1 }, { f: at - 10, x: 960, y: 540, z: 1 }, { f: at + 30, x: 1300, y: 420, z: 1.6 }]} boxes={[{ x: 1100, y: 300, w: 420, h: 240, from: at + 30 }]} />
      </div>
    </AbsoluteFill>
  );
};

/** AI-assistant video call: remote camera feed + self-view + live transcript that types along with each TTS turn. */
const WHO = ["ai", "user"] as const;
export const Call: React.FC<SceneProps> = ({ duration }) => {
  const f = useCurrentFrame();
  const turns = scene("call").turns;
  const speaking = turns.findIndex((t) => f >= t.from && f <= t.to);
  const text = (vo: string) => lines.find((l) => l.id === vo)!.spoken;
  return (
    <AbsoluteFill style={{ background: "#0b120e" }}>
      <div style={{ position: "absolute", left: 60, top: 60, width: 1140, height: 960, borderRadius: 36, overflow: "hidden" }}>
        <Broll src="call" rate={0.6} dur={duration} push={[1.05, 1.2]} />
        <div style={{ position: "absolute", left: 30, top: 28, display: "flex", alignItems: "center", gap: 14, padding: "10px 20px 12px", borderRadius: 999, background: "rgba(0,0,0,0.5)" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: "#e35d4f", opacity: 0.5 + 0.5 * Math.abs(Math.sin(f / 10)) }} />
          <span style={{ fontFamily: MONO, fontSize: 24, color: "#fff" }}>LIVE 00:{String(Math.floor(f / 30) + 4).padStart(2, "0")}</span>
        </div>
        <div style={{ position: "absolute", right: 28, top: 28, width: 260, height: 340, borderRadius: 22, overflow: "hidden", boxShadow: `0 0 0 ${WHO[speaking] === "user" ? 5 : 2}px ${WHO[speaking] === "user" ? "#9fdcb3" : "rgba(255,255,255,0.5)"}` }}>
          <OffthreadVideo src={staticFile("broll/self.mp4")} muted playbackRate={0.6} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 1240, top: 60, width: 620, height: 960, borderRadius: 36, background: C.canvas, padding: "30px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 14 }}>
        {turns.map((t, i) => {
          if (f < t.from - 4) return null;
          const ai = WHO[i % 2] === "ai";
          const line = text(t.vo);
          const shown = Math.floor(lerp(f, [t.from, t.to - 4], [0, line.length], (x) => x));
          return (
            <div key={t.vo} style={{ alignSelf: ai ? "flex-start" : "flex-end", maxWidth: 500, padding: "14px 20px 16px", borderRadius: ai ? "22px 22px 22px 6px" : "22px 22px 6px 22px", background: ai ? "#fff" : C.brand, color: ai ? C.ink : "#fff", boxShadow: ai ? SHADOW_MD : undefined, fontFamily: FONT, fontSize: 28, lineHeight: 1.45, ...rise(lerp(f, [t.from - 4, t.from + 8], [0, 1]), 16, 4) }}>
              {line.slice(0, shown)}
              <span style={{ opacity: 0.2 }}>{line.slice(shown)}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** End frame: "Powered by" + company logo (white artwork → dark canvas), thanks, AI-visuals disclosure, fade to black. */
export const Outro: React.FC<SceneProps> = ({ duration, lead }) => {
  const f = useCurrentFrame();
  const out = lerp(f, [duration - 40, duration - 4], [0, 1]);
  return (
    <AbsoluteFill style={{ background: "#0b120e", alignItems: "center", justifyContent: "center", gap: 30, paddingBottom: 60 }}>
      <div style={{ fontFamily: FONT, fontSize: 30, fontWeight: 500, letterSpacing: 6, textTransform: "uppercase", color: "rgba(255,255,255,0.6)", ...rise(useSpringIn(4), 16, 6) }}>Powered by</div>
      <Img src={staticFile("brand/company-white.png")} style={{ width: 560, display: "block", ...rise(useSpringIn(10), 24, 10) }} />
      <div style={{ width: 120 * lerp(f, [lead - 10, lead + 20], [0, 1]), height: 3, borderRadius: 2, background: "rgba(255,255,255,0.25)", margin: "24px 0 6px" }} />
      <Title lines={["Thank you"]} size={100} align="center" delay={lead - 2} color="#fff" />
      <Note dark delay={lead + 30}>Visuals generated with Google Veo & Gemini (illustrative) · Music: Mixkit</Note>
      <AbsoluteFill style={{ background: "#000", opacity: out }} />
    </AbsoluteFill>
  );
};
