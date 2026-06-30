import { addMonths } from "./dates.js";

export const FUNDING_SOURCES = {
  MONTH_INCOME: "ingresos_mes",
  CREDIT_NEXT_MONTH: "tarjeta_mes_siguiente",
  CREDIT_INSTALLMENTS: "tarjeta_cuotas",
} as const;

const monthDiff = (fromYearMonth, toYearMonth) => {
  const [fromYear, fromMonth] = fromYearMonth.split("-").map(Number);
  const [toYear, toMonth] = toYearMonth.split("-").map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth);
};

const isYearMonth = (value) => /^\d{4}-\d{2}$/.test(String(value || ""));

const normalizeCloseDay = (value) => {
  const day = Math.trunc(Number(value || 0));
  return Number.isFinite(day) && day > 0 ? Math.min(31, day) : null;
};

const isoDay = (value) => {
  const day = Number(String(value || "").slice(8, 10));
  return Number.isFinite(day) && day > 0 ? day : null;
};

export const expensePurchaseMonth = (expense) => expense.mes || expense.fecha?.slice(0, 7) || "";

export const estimateCreditCardFirstChargeMonth = (expense) => {
  const purchaseMonth = expensePurchaseMonth(expense);
  if (!purchaseMonth) return "";

  const closeDay = normalizeCloseDay(expense.tarjetaDiaCierre);
  const purchaseDay = isoDay(expense.fecha);
  if (!closeDay || !purchaseDay) return addMonths(purchaseMonth, 1);

  return addMonths(purchaseMonth, purchaseDay <= closeDay ? 1 : 2);
};

export const expenseFirstChargeMonth = (expense) => {
  const purchaseMonth = expensePurchaseMonth(expense);
  if (!purchaseMonth) return "";
  return isYearMonth(expense.mesPrimerCargo) ? expense.mesPrimerCargo : estimateCreditCardFirstChargeMonth(expense);
};

export const creditCardDebtIdForExpense = (expense, collection = "gastosVariables") =>
  `tarjeta-${collection}-${expense.id}`;

export const buildCreditCardDebtFromExpense = (expense, collection = "gastosVariables") => {
  const fundingSource = expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const amount = Number(expense.importe || 0);
  const installments = Math.max(1, Number(expense.cuotasTarjeta || 1));

  if (fundingSource !== FUNDING_SOURCES.CREDIT_INSTALLMENTS || amount <= 0 || installments <= 1 || !expense.id) {
    return null;
  }

  const firstChargeMonth = expenseFirstChargeMonth(expense);
  if (!firstChargeMonth) return null;

  const debtId = expense.deudaTarjetaId || creditCardDebtIdForExpense(expense, collection);
  const cardName = String(expense.tarjetaNombre || "Tarjeta").trim() || "Tarjeta";
  const title = String(expense.titulo || expense.nombre || "Compra").trim() || "Compra";
  const closeDay = normalizeCloseDay(expense.tarjetaDiaCierre);
  const notes = [
    `${expensePurchaseMonth(expense)} compra`,
    closeDay ? `cierre dia ${closeDay}` : "",
    expense.notas || "",
  ].filter(Boolean).join(" · ");

  return {
    id: debtId,
    nombre: `${cardName} · ${title}`,
    tipo: FUNDING_SOURCES.CREDIT_INSTALLMENTS,
    cuota: amount / installments,
    interes_mensual: 0,
    cuotas_totales: installments,
    cuota_actual: 0,
    mes_inicio: firstChargeMonth,
    notas: notes,
    origen: FUNDING_SOURCES.CREDIT_INSTALLMENTS,
    origenColeccion: collection,
    origenId: expense.id,
    tarjetaNombre: cardName,
    tarjetaDiaCierre: closeDay || undefined,
    compraMes: expensePurchaseMonth(expense),
  };
};

export const projectExpenseItem = (project) => ({
  id: project.id,
  titulo: project.titulo || project.nombre || "Proyecto",
  nombre: project.titulo || project.nombre || "Proyecto",
  importe: Number(project.gasto || 0),
  mes: project.fin?.slice(0, 7) || project.inicio?.slice(0, 7) || "",
  origenFondos: project.origenFondos || FUNDING_SOURCES.MONTH_INCOME,
  cuotasTarjeta: project.cuotasTarjeta || 1,
  mesPrimerCargo: project.mesPrimerCargo || "",
  tarjetaNombre: project.tarjetaNombre || "",
  tarjetaDiaCierre: project.tarjetaDiaCierre,
  deudaTarjetaId: project.deudaTarjetaId || "",
});

export const tripExpenseItems = (trip) => Object.entries(trip.gastos || {})
  .filter(([, amount]) => Number(amount || 0) > 0)
  .map(([key, amount]) => {
    const payment = trip.gastosPago?.[key] || {};
    return {
      id: `${trip.id || trip.nombre || "viaje"}:${key}`,
      tripId: trip.id,
      conceptKey: key,
      titulo: `${trip.nombre || "Viaje"} · ${key}`,
      nombre: `${trip.nombre || "Viaje"} · ${key}`,
      importe: Number(amount || 0),
      mes: trip.inicio?.slice(0, 7) || trip.fin?.slice(0, 7) || "",
      origenFondos: payment.origenFondos || FUNDING_SOURCES.MONTH_INCOME,
      cuotasTarjeta: payment.cuotasTarjeta || 1,
      mesPrimerCargo: payment.mesPrimerCargo || "",
      tarjetaNombre: payment.tarjetaNombre || "",
      tarjetaDiaCierre: payment.tarjetaDiaCierre,
      deudaTarjetaId: payment.deudaTarjetaId || "",
    };
  });

export const calculateExpenseCashImpactForMonth = (expense, yearMonth) => {
  const amount = Number(expense.importe || 0);
  if (!amount || !yearMonth) return 0;

  const fundingSource = expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME;
  const purchaseMonth = expensePurchaseMonth(expense);

  if (fundingSource === FUNDING_SOURCES.CREDIT_NEXT_MONTH) {
    return expenseFirstChargeMonth(expense) === yearMonth ? amount : 0;
  }

  if (fundingSource === FUNDING_SOURCES.CREDIT_INSTALLMENTS) {
    if (expense.deudaTarjetaId) return 0;

    const firstChargeMonth = expenseFirstChargeMonth(expense);
    const installments = Math.max(1, Number(expense.cuotasTarjeta || 1));
    const offset = firstChargeMonth ? monthDiff(firstChargeMonth, yearMonth) : -1;
    return offset >= 0 && offset < installments ? amount / installments : 0;
  }

  return purchaseMonth === yearMonth ? amount : 0;
};

export const utilityCashMonth = (utility) =>
  utility.fechaVencimiento?.slice(0, 7) || utility.fechaDisponible?.slice(0, 7) || utility.fechaFactura?.slice(0, 7) || utility.mes || "";

export const utilityAvailabilityDate = (utility) =>
  utility.fechaDisponible || utility.fechaVencimiento || utility.fechaFactura || (utility.mes ? `${utility.mes}-01` : "");

export const predictUtilityAvailabilityDate = (utilities, type, yearMonth) => {
  if (!type || !yearMonth) return "";

  const historical = utilities
    .filter((utility) => utility.tipo === type)
    .map((utility) => utilityAvailabilityDate(utility))
    .filter(Boolean)
    .sort();
  const lastDate = historical[historical.length - 1];
  if (!lastDate) return "";

  const day = Math.min(Number(lastDate.slice(8, 10)) || 1, new Date(Number(yearMonth.slice(0, 4)), Number(yearMonth.slice(5, 7)), 0).getDate());
  return `${yearMonth}-${String(day).padStart(2, "0")}`;
};

export const calculateDebt = (debt) => {
  const paidInstallments = Number(debt.cuota_actual || 0);
  const totalInstallments = Number(debt.cuotas_totales || 0);
  const installment = Number(debt.cuota || 0);
  const monthlyInterest = Number(debt.interes_mensual || 0);
  const pendingInstallments = Math.max(0, totalInstallments - paidInstallments);
  const pendingCapital = pendingInstallments * installment;
  const totalInterestCost = totalInstallments * monthlyInterest;
  const paidInterest = paidInstallments * monthlyInterest;
  const pendingInterest = pendingInstallments * monthlyInterest;
  const monthlyImpact = installment + monthlyInterest;
  const endMonth = addMonths(debt.mes_inicio, totalInstallments);
  const realEndMonth = addMonths(debt.mes_inicio, totalInstallments - 1);
  const percent = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;

  return {
    pagadas: paidInstallments,
    pendientes: pendingInstallments,
    pendiente_capital: pendingCapital,
    coste_total_intereses: totalInterestCost,
    intereses_pagados: paidInterest,
    intereses_pendientes: pendingInterest,
    impacto_mensual: monthlyImpact,
    mes_fin: endMonth,
    mes_fin_real: realEndMonth,
    pct: percent,
  };
};

export const calculateDebtInstallmentForMonth = (debts, yearMonth) => {
  const [targetYear, targetMonth] = yearMonth.split("-").map(Number);

  return debts.reduce((total, debt) => {
    const [initialYear, initialMonth] = debt.mes_inicio.split("-").map(Number);
    const offset = (targetYear - initialYear) * 12 + (targetMonth - initialMonth);
    const isActive = offset >= Number(debt.cuota_actual || 0) && offset < Number(debt.cuotas_totales || 0);
    return isActive ? total + Number(debt.cuota || 0) + Number(debt.interes_mensual || 0) : total;
  }, 0);
};

const isNextMonthCardExpense = (expense) =>
  (expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.CREDIT_NEXT_MONTH;

export const isLinkedCardInstallmentDebt = (debt) =>
  debt.origen === FUNDING_SOURCES.CREDIT_INSTALLMENTS ||
  debt.tipo === FUNDING_SOURCES.CREDIT_INSTALLMENTS ||
  Boolean(debt.origenColeccion);

export const calculateNextMonthCardBalanceForMonth = (expenses, yearMonth) =>
  expenses
    .filter(isNextMonthCardExpense)
    .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, yearMonth), 0);

export const calculatePaymentMethodBreakdownForMonth = (expenses, debts, yearMonth) => ({
  cash: expenses
    .filter((expense) => (expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.MONTH_INCOME)
    .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, yearMonth), 0),
  card: expenses
    .filter((expense) => (expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.CREDIT_NEXT_MONTH)
    .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, yearMonth), 0),
  cardInstallments: expenses
    .filter((expense) => (expense.origenFondos || FUNDING_SOURCES.MONTH_INCOME) === FUNDING_SOURCES.CREDIT_INSTALLMENTS)
    .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, yearMonth), 0)
    + calculateDebtInstallmentForMonth(debts.filter(isLinkedCardInstallmentDebt), yearMonth),
});

const asAmount = (value) => Number(value || 0);

export const calculateResourceMonthSummary = ({
  pref = "",
  fixedIncome = 0,
  variableIncome = 0,
  fixedExpenses = 0,
  debtExpenses = 0,
  utilityExpenses = 0,
  calendarExpenses = 0,
  variableExpenseLines = 0,
  projectExpenses = 0,
  tripExpenses = 0,
  reserveCommitments = 0,
  assignedSavings = 0,
  potentialLevers = 0,
  nextMonthCardBalance = 0,
  cardInstallmentExpenses = 0,
} = {}) => {
  const confirmedIncome = asAmount(fixedIncome) + asAmount(variableIncome);
  const committedSpending = asAmount(fixedExpenses) + asAmount(debtExpenses) + asAmount(utilityExpenses) + asAmount(reserveCommitments);
  const flexibleSpending = asAmount(calendarExpenses) + asAmount(variableExpenseLines) + asAmount(projectExpenses) + asAmount(tripExpenses);
  const assignedMoney = asAmount(assignedSavings);
  const realMonthlyUse = committedSpending + flexibleSpending + assignedMoney;
  const realFreeMargin = confirmedIncome - realMonthlyUse;
  const potentialCapacity = asAmount(potentialLevers);
  const cardPressure = asAmount(nextMonthCardBalance) + asAmount(cardInstallmentExpenses);

  return {
    pref,
    ingresos_confirmados: confirmedIncome,
    ingresos_fijos: asAmount(fixedIncome),
    ingresos_variables_confirmados: asAmount(variableIncome),
    gasto_comprometido: committedSpending,
    gasto_flexible: flexibleSpending,
    gasto_total_real: realMonthlyUse,
    reservas_necesarias: asAmount(reserveCommitments),
    ahorro_asignado: assignedMoney,
    margen_real: realFreeMargin,
    palancas_potenciales: potentialCapacity,
    margen_con_potencial: realFreeMargin + potentialCapacity,
    presion_financiera: confirmedIncome > 0 ? Math.round((realMonthlyUse / confirmedIncome) * 100) : 0,
    presion_tarjeta: cardPressure,
    tarjeta_mes_siguiente: asAmount(nextMonthCardBalance),
    cuotas_tarjeta: asAmount(cardInstallmentExpenses),
  };
};

type MonthlyBudgetInput = {
  base: any;
  categories: Record<string, any>;
  events: any[];
  blocks?: any[];
  trips: any[];
  levers: any[];
  debts: any[];
  utilities: any[];
  variableExpenses?: any[];
  projects?: any[];
  year: number;
  currentMonth: number;
};

export const calculateMonthlyBudget = ({
  base,
  categories,
  events,
  blocks = [],
  trips,
  levers,
  debts,
  utilities,
  variableExpenses = [],
  projects = [],
  year,
  currentMonth,
}: MonthlyBudgetInput) => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthlyOverride = base.monthlyOverrides?.[prefix] || {};
    const monthEvents = events.filter((event) => event.fecha?.startsWith(prefix));
    const monthBlocks = blocks.filter((block) => block.inicio?.startsWith(prefix) || block.fin?.startsWith(prefix));
    const completedProjectExpenseItems = projects
      .filter((project) => project.estado === "completado")
      .map(projectExpenseItem);
    const isFuture = index > currentMonth;
    const fixedIncome = monthlyOverride.fixedIncome ?? Number(base.ingresos_fijos || 0);
    const fixedExpenses = monthlyOverride.fixedExpenses ?? Number(base.gastos_fijos || 0);

    const legacyRoomIncome = monthEvents
      .filter((event) => event.categoria === "habitacion")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const legacyCarIncome = monthEvents
      .filter((event) => event.categoria === "coche")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const roomIncome = legacyRoomIncome + monthBlocks
      .filter((block) => block.tipo === "habitacion")
      .reduce((sum, block) => sum + Number(block.importe || 0), 0);
    const carIncome = legacyCarIncome + monthBlocks
      .filter((block) => block.tipo === "coche")
      .reduce((sum, block) => sum + Number(block.importe || 0), 0);
    const otherIncome = monthEvents
      .filter(
        (event) =>
          categories[event.categoria]?.tipo === "ingreso" &&
          event.categoria !== "habitacion" &&
          event.categoria !== "coche",
      )
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);

    const activeLevers = levers.filter((lever) => lever.activa && matchesBudgetMonth(lever, prefix));
    const leverRoom = sumLevers(activeLevers, "habitacion");
    const leverCar = sumLevers(activeLevers, "coche");
    const leverSales = sumLevers(activeLevers, "ventas");
    const leverOther = sumLevers(activeLevers, "otros");
    const leverTotal = leverRoom + leverCar + leverSales + leverOther;

    const potentialLevers = levers
      .filter((lever) => !lever.activa && matchesBudgetMonth(lever, prefix))
      .reduce((sum, lever) => sum + Number(lever.importe || 0), 0);

    const variableIncomeTotal = roomIncome + carIncome + otherIncome + leverTotal;
    const calendarVariableExpenses = events
      .filter((event) => categories[event.categoria]?.tipo === "gasto")
      .reduce((sum, event) => sum + calculateExpenseCashImpactForMonth(event, prefix), 0);
    const monthlyVariableExpenses = variableExpenses
      .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, prefix), 0);
    const nextMonthCardBalance = calculateNextMonthCardBalanceForMonth(
      [
        ...events.filter((event) => categories[event.categoria]?.tipo === "gasto"),
        ...variableExpenses,
      ],
      prefix,
    );
    const monthCompletedHomeExpenses = completedProjectExpenseItems
      .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, prefix), 0);
    const tripExpenses = trips
      .flatMap(tripExpenseItems)
      .reduce((sum, expense) => sum + calculateExpenseCashImpactForMonth(expense, prefix), 0);
    const cardInstallmentPressure = calculateDebtInstallmentForMonth(debts.filter(isLinkedCardInstallmentDebt), prefix);
    const linkedCardInstallmentExpenses = monthlyOverride.debtExpenses !== undefined ? cardInstallmentPressure : 0;
    const debtExpenses = (monthlyOverride.debtExpenses ?? calculateDebtInstallmentForMonth(debts, prefix)) + linkedCardInstallmentExpenses;
    const utilityExpenses = utilities
      .filter((utility) => utilityCashMonth(utility) === prefix)
      .reduce((sum, utility) => sum + Number(utility.importe || 0), 0);

    const structuralExpenses = fixedExpenses + debtExpenses;
    const discretionaryExpenses = calendarVariableExpenses + monthlyVariableExpenses + monthCompletedHomeExpenses + tripExpenses;
    const totalIncome = fixedIncome + variableIncomeTotal;
    const totalExpenses = structuralExpenses + utilityExpenses + discretionaryExpenses;
    const balance = totalIncome - totalExpenses;
    const resourceSummary = calculateResourceMonthSummary({
      pref: prefix,
      fixedIncome,
      variableIncome: variableIncomeTotal,
      fixedExpenses,
      debtExpenses,
      utilityExpenses,
      calendarExpenses: calendarVariableExpenses,
      variableExpenseLines: monthlyVariableExpenses,
      projectExpenses: monthCompletedHomeExpenses,
      tripExpenses,
      potentialLevers,
      nextMonthCardBalance,
      cardInstallmentExpenses: cardInstallmentPressure,
    });

    return {
      nombre: prefix,
      mes: index,
      pref: prefix,
      esFuturo: isFuture,
      esPassado: index < currentMonth,
      esActual: index === currentMonth,
      ing_habitacion: roomIncome + leverRoom,
      ing_coche: carIncome + leverCar,
      ing_ventas: leverSales,
      ing_otros: otherIncome + leverOther,
      ingresos_var_total: variableIncomeTotal,
      gastos_var: calendarVariableExpenses + monthlyVariableExpenses + monthCompletedHomeExpenses,
      gastos_calendario: calendarVariableExpenses,
      gastos_variables_lineas: monthlyVariableExpenses,
      gastos_casa_tareas: monthCompletedHomeExpenses,
      gastos_viaje: tripExpenses,
      gasto_tarjeta_mes_anterior: nextMonthCardBalance,
      gasto_deudas: debtExpenses,
      gasto_suministros: utilityExpenses,
      gasto_estructural: structuralExpenses,
      gasto_discrecional: discretionaryExpenses,
      total_ingresos: totalIncome,
      total_gastos: totalExpenses,
      saldo: balance,
      presion: totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0,
      palancasMes: activeLevers,
      palancasPot: potentialLevers,
      resumen_recursos: resourceSummary,
    };
  });

  return {
    datosMes: months,
    totales: {
      varAnual: months.reduce((sum, month) => sum + month.ingresos_var_total, 0),
      potencial: levers
        .filter((lever) => !lever.activa && months.some((month) => matchesBudgetMonth(lever, month.pref)))
        .reduce((sum, lever) => sum + Number(lever.importe || 0), 0),
      presionActual: months[currentMonth]?.presion || 0,
    },
  };
};

const sumLevers = (levers, subcategory) =>
  levers
    .filter((lever) => lever.subcategoria === subcategory)
    .reduce((sum, lever) => sum + Number(lever.importe || 0), 0);

const matchesBudgetMonth = (lever, yearMonth) => {
  if (!lever.mes || !yearMonth) return false;
  return lever.mes === yearMonth;
};