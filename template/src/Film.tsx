import { springTiming, TransitionSeries, type TransitionPresentation, type TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill } from "remotion";
import { Soundtrack } from "./audio";
import { Background } from "./components/Background";
import { Call, Outro, Problem, Product, TitleCard } from "./scenes/Scenes";
import { TIMELINE, TRANSITION, type SceneProps } from "./timeline";

const COMPONENTS: Record<string, React.FC<SceneProps>> = { title: TitleCard, problem: Problem, product: Product, call: Call, outro: Outro };

// Documentary dissolve: incoming scene fades up out of a slight blur. (Promo cut: add scale 1.04→1 for a zoom-fade.)
const Dissolve: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress: p }) => {
  const entering = presentationDirection === "entering";
  return <AbsoluteFill style={entering ? { opacity: p, filter: `blur(${(1 - p) * 6}px)` } : { opacity: 1 - p }}>{children}</AbsoluteFill>;
};
const dissolve = (): TransitionPresentation<Record<string, never>> => ({ component: Dissolve, props: {} });

export const Film: React.FC<{ bgm: boolean }> = ({ bgm }) => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {TIMELINE.flatMap(({ id, duration, lead }, i) => {
        const Scene = COMPONENTS[id];
        const nodes = [
          <TransitionSeries.Sequence key={id} durationInFrames={duration} premountFor={30} name={id}>
            <Scene duration={duration} lead={lead} />
          </TransitionSeries.Sequence>,
        ];
        if (i < TIMELINE.length - 1)
          nodes.push(<TransitionSeries.Transition key={`${id}-t`} presentation={dissolve()} timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION, durationRestThreshold: 0.001 })} />);
        return nodes;
      })}
    </TransitionSeries>
    <Soundtrack bgm={bgm} />
  </AbsoluteFill>
);
