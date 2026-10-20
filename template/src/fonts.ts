import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as plex } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as deva } from "@remotion/google-fonts/NotoSansDevanagari";

// @remotion/google-fonts blocks rendering until the faces load, so no frame renders in a fallback font.
inter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
plex("normal", { weights: ["400", "500"], subsets: ["latin"] });
deva("normal", { weights: ["400", "500", "600"], subsets: ["devanagari", "latin"] });
