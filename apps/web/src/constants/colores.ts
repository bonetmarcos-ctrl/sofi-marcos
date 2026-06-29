import type { CSSProperties } from "react";

// ─── PALETA ───────────────────────────────────────────────────────────────────
export const C = {
  cyan:       "#2F6F5E",
  cyanLight:  "#EAF3EE",
  cyanMid:    "#72A494",
  lavender:   "#E87C5D",
  lavLight:   "#FCEDE8",
  sage:       "#9BBE8F",
  sageLight:  "#EFF6EA",
  sageDark:   "#4D7C5C",
  fondo:      "#F7F8F5",
  superficie: "#FFFFFF",
  borde:      "#DDE4DC",
  txt:        "#1F2421",
  txt2:       "#66736B",
  muted:      "#66736B",
  exito:      "#4F9D69",
  exitoBg:    "#EBF9EF",
  warn:       "#C99738",
  warnBg:     "#FFF6E5",
  error:      "#B85D4B",
  errorBg:    "#FCEDE8",
};

// ─── ESTILOS REUTILIZABLES ────────────────────────────────────────────────────
export const inputS: CSSProperties = {
  width: "100%",
  border: `1px solid ${C.borde}`,
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13.5,
  outline: "none",
  fontFamily: "'Lato',sans-serif",
  color: C.txt,
  background: C.fondo,
  boxSizing: "border-box",
};

export const labelS: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: C.txt2,
  textTransform: "uppercase",
  letterSpacing: "0.7px",
  display: "block",
  marginBottom: 5,
};

export const cardN = (extra: CSSProperties = {}): CSSProperties => ({
  background: C.superficie,
  borderRadius: 16,
  padding: "18px 20px",
  border: `1px solid ${C.borde}`,
  boxShadow: "0 1px 6px rgba(17,20,24,0.06)",
  minWidth: 0,
  ...extra,
});

// Legacy alias (usado en TabGantt)
export const card = (extra: CSSProperties = {}): CSSProperties => ({
  background: "white",
  borderRadius: 14,
  padding: "16px 18px",
  border: "1px solid #ebe9f5",
  boxShadow: "0 2px 8px rgba(26,26,46,0.05)",
  minWidth: 0,
  ...extra,
});
