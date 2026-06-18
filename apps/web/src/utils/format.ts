import { MESES } from "../constants/meses.ts";

/** Formats as EUR without decimals. */
export const fmt = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

/** Formats as EUR with two decimals. */
export const fmtd = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

/** "2025-05" -> "May 2025". */
export const labelMes = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MESES[+m - 1]} ${y}`;
};
