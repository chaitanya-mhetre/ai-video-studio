// Replace with the product's own tokens (CSS variables, Tailwind config, app theme file). Never invent a palette.
export const C = {
  brand: "#0f7a3d",
  brandDeep: "#0F3D2A",
  accent: "#529632",
  tint: "#e8f3ec",
  soft: "#cfe6d6",
  canvas: "#F5F7F3",
  surface: "#ffffff",
  border: "#e4e4e7",
  ink: "#101014",
  muted: "#52525b",
  faint: "#71717a",
};

export const FONT = "Inter, system-ui, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, monospace";
/** Indic scripts: Noto Sans Devanagari covers Marathi/Hindi. Swap for Noto Sans Tamil/Bengali/... as needed. */
export const DEVA = "'Noto Sans Devanagari', Inter, sans-serif";

export const FPS = 30;
// 16:9 film. For Shorts/Reels use 1080 × 1920 and re-check every layout.
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const SHADOW_LG = "0 50px 120px -30px rgba(15,61,42,0.26), 0 18px 40px -20px rgba(15,61,42,0.18), 0 0 0 1px rgba(15,61,42,0.06)";
export const SHADOW_MD = "0 18px 40px -18px rgba(15,61,42,0.24), 0 0 0 1px rgba(15,61,42,0.06)";
export const GRADIENT = `linear-gradient(100deg in oklch, ${C.brandDeep} 0%, ${C.brand} 50%, ${C.accent} 100%)`;
