import "./fonts";
import { Composition } from "remotion";
import { Film } from "./Film";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { TOTAL_FRAMES } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ bgm: true }} />
);
