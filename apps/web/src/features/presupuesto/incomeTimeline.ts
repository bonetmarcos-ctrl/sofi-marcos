const MESES_INGRESO = { ene:1, feb:2, mar:3, abr:4, may:5, jun:6, jul:7, ago:8, sep:9, oct:10, nov:11, dic:12 };

const toAmount = (value) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const isYearMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const explicitCreditDate = (linea) => {
  const fecha = String(linea?.fechaAcreditacion || linea?.fechaCobro || linea?.fechaPago || "").trim();
  return isIsoDate(fecha) ? fecha : "";
};

const explicitCreditDay = (linea) => {
  const fecha = explicitCreditDate(linea);
  return fecha ? Number(fecha.slice(8, 10)) : null;
};

const monthNumber = (pref) => Number(String(pref || "").slice(5, 7));

const clampDay = (value) => {
  const day = Math.trunc(Number(value || 1));
  return Number.isFinite(day) && day > 0 ? Math.min(31, day) : 1;
};

const recurringIncomeRule = (linea: Record<string, any> = {}) => {
  const rest: Record<string, any> = { ...linea };
  delete rest.fechaAcreditacion;
  delete rest.fechaCobro;
  delete rest.fechaPago;
  const day = explicitCreditDay(linea) ?? linea?.diaAcreditacion ?? linea?.diaCobro ?? linea?.diaPago;
  return day === undefined || day === null ? rest : { ...rest, diaAcreditacion:clampDay(day) };
};

const previousYearMonth = (pref) => {
  const [year, month] = String(pref || "").split("-").map(Number);
  if (!year || !month) return "";

  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const nextYearMonth = (pref) => {
  const [year, month] = String(pref || "").split("-").map(Number);
  if (!year || !month) return "";

  const date = new Date(year, month, 1);
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

export const diaAcreditacionIngreso = (linea) => clampDay(explicitCreditDay(linea) ?? linea?.diaAcreditacion ?? linea?.diaCobro ?? linea?.diaPago ?? 1);

export const fechaAcreditacionIngresoEnMes = (linea, pref) => {
  const fechaExplicita = explicitCreditDate(linea);
  if (fechaExplicita && String(linea?.desde || "").trim() === pref && String(linea?.hasta || "").trim() === pref) return fechaExplicita;

  const [year, month] = String(pref || "").split("-").map(Number);
  if (!year || !month) return "";

  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(diaAcreditacionIngreso(linea), lastDay);
  return `${pref}-${String(day).padStart(2, "0")}`;
};

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
    const reglaRecurrente = recurringIncomeRule(actual);

    return [
      { ...reglaRecurrente, hasta:prefAnterior },
      { ...reglaRecurrente, ...patch, id:nuevoId || actual.id, desde:pref },
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

type IncomeSplitIds = { current?: string | number; future?: string | number };

export const editarLineaIngresoEnMes = (lineas = [], index, pref, patch, ids: IncomeSplitIds = {}) => {
  const linea = lineas[index];
  if (!linea) return lineas;

  const prefAnterior = previousYearMonth(pref);
  const prefSiguiente = nextYearMonth(pref);
  const estabaActivaAntes = prefAnterior && lineaIngresoActivaEnMes(linea, prefAnterior);
  const sigueActivaDespues = prefSiguiente && lineaIngresoActivaEnMes(linea, prefSiguiente);
  const soloMesActual = linea.desde === pref && linea.hasta === pref;

  if (soloMesActual || (!estabaActivaAntes && !sigueActivaDespues)) {
    return lineas.map((actual, lineIndex) => lineIndex === index ? { ...actual, ...patch } : actual);
  }

  return lineas.flatMap((actual, lineIndex) => {
    if (lineIndex !== index) return [actual];
    const reglaRecurrente = recurringIncomeRule(actual);

    const parts = [];
    if (estabaActivaAntes) parts.push({ ...reglaRecurrente, hasta:prefAnterior });
    parts.push({ ...reglaRecurrente, ...patch, id:ids.current || actual.id, desde:pref, hasta:pref });
    if (sigueActivaDespues) parts.push({ ...reglaRecurrente, id:ids.future || `${actual.id || "income"}-${pref}-next`, desde:prefSiguiente });
    return parts;
  });
};

export const eliminarLineaIngresoEnMes = (lineas = [], index, pref, ids: IncomeSplitIds = {}) => {
  const linea = lineas[index];
  if (!linea) return lineas;

  const prefAnterior = previousYearMonth(pref);
  const prefSiguiente = nextYearMonth(pref);
  const estabaActivaAntes = prefAnterior && lineaIngresoActivaEnMes(linea, prefAnterior);
  const sigueActivaDespues = prefSiguiente && lineaIngresoActivaEnMes(linea, prefSiguiente);

  if (!estabaActivaAntes && !sigueActivaDespues) {
    return lineas.filter((_, lineIndex) => lineIndex !== index);
  }

  return lineas.flatMap((actual, lineIndex) => {
    if (lineIndex !== index) return [actual];
    const reglaRecurrente = recurringIncomeRule(actual);

    const parts = [];
    if (estabaActivaAntes) parts.push({ ...reglaRecurrente, hasta:prefAnterior });
    if (sigueActivaDespues) parts.push({ ...reglaRecurrente, id:ids.future || `${actual.id || "income"}-${pref}-next`, desde:prefSiguiente });
    return parts;
  });
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