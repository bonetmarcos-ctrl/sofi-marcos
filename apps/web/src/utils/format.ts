import { MESES } from "../constants/meses.ts";

/** Formatea como €, sin decimales */
export const fmt = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

/** Formatea como €, con 2 decimales */
export const fmtd = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

/** "2025-05" → "Mayo 2025" */
export const labelMes = (ym) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MESES[+m - 1]} ${y}`;
};
