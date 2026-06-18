/** Date → "YYYY-MM-DD" */
export const toISO = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/** Fecha ISO de hoy */
export const todayISO = toISO(new Date());

/** Días entre dos fechas ISO (mínimo 1) */
export const daysBetween = (a, b) =>
  Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));

/** Genera array de fechas ISO entre a y b (inclusive) */
export const rangoFechas = (a, b) => {
  const r = [];
  let d = new Date(a + "T12:00:00");
  const f = new Date(b + "T12:00:00");
  while (d <= f) {
    r.push(toISO(d));
    d.setDate(d.getDate() + 1);
  }
  return r;
};

/**
 * Suma n meses a un string "YYYY-MM"
 * addMeses("2025-05", 3) → "2025-08"
 */
export const addMeses = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
