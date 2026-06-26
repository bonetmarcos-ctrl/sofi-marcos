const MESES_INGRESO = { ene:1, feb:2, mar:3, abr:4, may:5, jun:6, jul:7, ago:8, sep:9, oct:10, nov:11, dic:12 };

const toAmount = (value) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const isYearMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

const monthNumber = (pref) => Number(String(pref || "").slice(5, 7));

const previousYearMonth = (pref) => {
  const [year, month] = String(pref || "").split("-").map(Number);
  if (!year || !month) return "";

  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const yearMonthsFrom = (pref) => {
  const [year, month] = String(pref || "").split("-").map(Number);
  if (!year || !month) return [];

  return Array.from({ length:13 - month }, (_, offset) => `${year}-${String(month + offset).padStart(2, "0")}`);
};

const mesReferenciaIngreso = (valor) => {
  if (!valor) return null;
  const texto = String(valor).trim().toLowerCase();
  if (isYearMonth(texto)) return monthNumber(texto);
  return MESES_INGRESO[texto.slice(0, 3)] || null;
};

export const lineaIngresoActivaEnMes = (linea, pref) => {
  const desdeTexto = String(linea.desde || "").trim().toLowerCase();
  const hastaTexto = String(linea.hasta || "").trim().toLowerCase();

  if (isYearMonth(desdeTexto) && pref < desdeTexto) return false;
  if (isYearMonth(hastaTexto) && pref > hastaTexto) return false;

  const mes = monthNumber(pref);
  const desde = isYearMonth(desdeTexto) ? null : mesReferenciaIngreso(desdeTexto);
  const hasta = isYearMonth(hastaTexto) ? null : mesReferenciaIngreso(hastaTexto);
  if (desde && mes < desde) return false;
  if (hasta && mes > hasta) return false;
  return true;
};

const totalLineasIngresoEnMes = (lineas = [], pref) => lineas
  .filter((linea) => lineaIngresoActivaEnMes(linea, pref))
  .reduce((sum, linea) => sum + toAmount(linea.importe), 0);

export const editarLineaIngresoDesdeMes = (lineas = [], index, pref, patch, nuevoId) => {
  const linea = lineas[index];
  if (!linea) return lineas;

  const prefAnterior = previousYearMonth(pref);
  const estabaActivaAntes = prefAnterior && lineaIngresoActivaEnMes(linea, prefAnterior);

  if (!estabaActivaAntes) {
    return lineas.map((actual, lineIndex) => lineIndex === index ? { ...actual, ...patch } : actual);
  }

  return lineas.flatMap((actual, lineIndex) => {
    if (lineIndex !== index) return [actual];

    return [
      { ...actual, hasta:prefAnterior },
      { ...actual, ...patch, id:nuevoId || actual.id, desde:pref },
    ];
  });
};

export const eliminarLineaIngresoDesdeMes = (lineas = [], index, pref) => {
  const linea = lineas[index];
  if (!linea) return lineas;

  const prefAnterior = previousYearMonth(pref);
  const estabaActivaAntes = prefAnterior && lineaIngresoActivaEnMes(linea, prefAnterior);

  if (!estabaActivaAntes) {
    return lineas.filter((_, lineIndex) => lineIndex !== index);
  }

  return lineas.map((actual, lineIndex) => lineIndex === index ? { ...actual, hasta:prefAnterior } : actual);
};

export const actualizarIngresosFijosDesdeMes = (base, pref, detalleIngresos) => {
  const monthlyOverrides = { ...(base.monthlyOverrides || {}) };

  for (const prefMes of yearMonthsFrom(pref)) {
    const totalActual = monthlyOverrides[prefMes]?.fixedIncome ?? base.ingresos_fijos;
    const totalLineasActual = totalLineasIngresoEnMes(base.detalle_ingresos || [], prefMes);
    const ajuste = toAmount(totalActual) - totalLineasActual;
    const nuevoTotal = totalLineasIngresoEnMes(detalleIngresos, prefMes) + ajuste;

    monthlyOverrides[prefMes] = {
      ...(monthlyOverrides[prefMes] || {}),
      fixedIncome:nuevoTotal,
    };
  }

  return {
    ...base,
    detalle_ingresos:detalleIngresos,
    monthlyOverrides,
  };
};