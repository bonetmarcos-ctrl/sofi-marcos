// ─── PALETA ───────────────────────────────────────────────────────────────────
export const C = {
  cyan:       "#3A949E",
  cyanLight:  "#E6F2F4",
  cyanMid:    "#6FAFB7",
  lavender:   "#9E6BC7",
  lavLight:   "#F0E9F9",
  sage:       "#A7CF99",
  sageLight:  "#EEF7EB",
  sageDark:   "#5a9147",
  fondo:      "#F5F7FA",
  superficie: "#FFFFFF",
  borde:      "#E6E8EC",
  txt:        "#111418",
  txt2:       "#6E7177",
  exito:      "#75DF90",
  exitoBg:    "#EBF9EF",
  warn:       "#D6B37A",
  warnBg:     "#FFF6E5",
  error:      "#C97C7C",
  errorBg:    "#FDECEC",
};

// ─── ESTILOS REUTILIZABLES ────────────────────────────────────────────────────
export const inputS = {
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

export const labelS = {
  fontSize: 11,
  fontWeight: 700,
  color: C.txt2,
  textTransform: "uppercase",
  letterSpacing: "0.7px",
  display: "block",
  marginBottom: 5,
};

export const cardN = (extra = {}) => ({
  background: C.superficie,
  borderRadius: 16,
  padding: "18px 20px",
  border: `1px solid ${C.borde}`,
  boxShadow: "0 1px 6px rgba(17,20,24,0.06)",
  minWidth: 0,
  ...extra,
});

// Legacy alias (usado en TabGantt)
export const card = (extra = {}) => ({
  background: "white",
  borderRadius: 14,
  padding: "16px 18px",
  border: "1px solid #ebe9f5",
  boxShadow: "0 2px 8px rgba(26,26,46,0.05)",
  minWidth: 0,
  ...extra,
});
