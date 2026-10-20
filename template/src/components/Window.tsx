import type { CSSProperties, ReactNode } from "react";
import { C, MONO, SHADOW_LG } from "../theme";

export const CHROME = 54;

/** Browser chrome around a live capture. */
export const Window: React.FC<{ width: number; height: number; url?: string; style?: CSSProperties; children: ReactNode }> = ({ width, height, url = "example.com", style, children }) => (
  <div style={{ width, height, borderRadius: 22, background: C.surface, boxShadow: SHADOW_LG, overflow: "hidden", display: "flex", flexDirection: "column", ...style }}>
    <div style={{ height: CHROME, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 22px", gap: 10, background: "linear-gradient(#fbfcfa, #f2f5f0)", borderBottom: `1px solid ${C.border}` }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
      <div style={{ margin: "0 auto", padding: "7px 22px", borderRadius: 10, background: C.surface, boxShadow: `0 0 0 1px ${C.border}`, fontFamily: MONO, fontSize: 16, color: C.muted, display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="12" height="14" viewBox="0 0 12 14"><rect x="1" y="6" width="10" height="7" rx="2" fill={C.brand} /><path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke={C.brand} strokeWidth="1.6" fill="none" /></svg>
        {url}
      </div>
      <span style={{ width: 62 }} />
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);
