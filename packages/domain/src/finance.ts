import { addMonths } from "./dates.js";

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
}) => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthlyOverride = base.monthlyOverrides?.[prefix] || {};
    const monthEvents = events.filter((event) => event.fecha?.startsWith(prefix));
    const monthBlocks = blocks.filter((block) => block.inicio?.startsWith(prefix) || block.fin?.startsWith(prefix));
    const monthVariableExpenses = variableExpenses.filter((expense) => expense.mes === prefix);
    const monthCompletedHomeExpenses = projects
      .filter((project) => project.estado === "completado" && project.fin?.startsWith(prefix))
      .reduce((sum, project) => sum + Number(project.gasto || 0), 0);
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
    const calendarVariableExpenses = monthEvents
      .filter((event) => categories[event.categoria]?.tipo === "gasto")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const monthlyVariableExpenses = monthVariableExpenses
      .reduce((sum, expense) => sum + Number(expense.importe || 0), 0);
    const tripExpenses = trips
      .filter((trip) => trip.inicio?.startsWith(prefix) || trip.fin?.startsWith(prefix))
      .reduce(
        (sum, trip) =>
          sum + Object.values(trip.gastos || {}).reduce<number>((tripSum, amount) => tripSum + Number(amount || 0), 0),
        0,
      );
    const debtExpenses = monthlyOverride.debtExpenses ?? calculateDebtInstallmentForMonth(debts, prefix);
    const utilityExpenses = utilities
      .filter((utility) => utility.mes === prefix)
      .reduce((sum, utility) => sum + Number(utility.importe || 0), 0);

    const structuralExpenses = fixedExpenses + debtExpenses;
    const discretionaryExpenses = calendarVariableExpenses + monthlyVariableExpenses + monthCompletedHomeExpenses + tripExpenses;
    const totalIncome = fixedIncome + variableIncomeTotal;
    const totalExpenses = structuralExpenses + utilityExpenses + discretionaryExpenses;
    const balance = totalIncome - totalExpenses;

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