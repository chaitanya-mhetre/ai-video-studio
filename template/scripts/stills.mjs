// Render QA stills from one bundle: node scripts/stills.mjs <Composition> <outDir> name:frame ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [comp, outDir, ...shots] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: comp, inputProps: { bgm: true } });
for (const s of shots) {
  const [name, frame] = s.split(":");
  await renderStill({ serveUrl, composition, frame: +frame, output: `${outDir}/${name}-${frame}.jpg`, imageFormat: "jpeg", jpegQuality: 85, scale: 0.5, inputProps: { bgm: true } });
  console.log("still", name, frame);
}
