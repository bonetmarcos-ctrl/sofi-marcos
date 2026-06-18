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
  trips,
  levers,
  debts,
  utilities,
  year,
  currentMonth,
}) => {
  const months = Array.from({ length: 12 }, (_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthEvents = events.filter((event) => event.fecha?.startsWith(prefix));
    const isFuture = index > currentMonth;

    const roomIncome = monthEvents
      .filter((event) => event.categoria === "habitacion")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const carIncome = monthEvents
      .filter((event) => event.categoria === "coche")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const otherIncome = monthEvents
      .filter(
        (event) =>
          categories[event.categoria]?.tipo === "ingreso" &&
          event.categoria !== "habitacion" &&
          event.categoria !== "coche",
      )
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);

    const activeLevers = levers.filter((lever) => lever.activa && lever.mes === prefix);
    const leverRoom = sumLevers(activeLevers, "habitacion");
    const leverCar = sumLevers(activeLevers, "coche");
    const leverSales = sumLevers(activeLevers, "ventas");
    const leverOther = sumLevers(activeLevers, "otros");
    const leverTotal = leverRoom + leverCar + leverSales + leverOther;

    const potentialLevers = levers
      .filter((lever) => !lever.activa && lever.mes === prefix)
      .reduce((sum, lever) => sum + Number(lever.importe || 0), 0);

    const variableIncomeTotal = roomIncome + carIncome + otherIncome + leverTotal;
    const variableExpenses = monthEvents
      .filter((event) => categories[event.categoria]?.tipo === "gasto")
      .reduce((sum, event) => sum + Number(event.importe || 0), 0);
    const tripExpenses = trips
      .filter((trip) => trip.inicio?.startsWith(prefix) || trip.fin?.startsWith(prefix))
      .reduce((sum, trip) => sum + Object.values(trip.gastos || {}).reduce((a, b) => a + Number(b || 0), 0), 0);
    const debtExpenses = calculateDebtInstallmentForMonth(debts, prefix);
    const utilityExpenses = utilities
      .filter((utility) => utility.mes === prefix)
      .reduce((sum, utility) => sum + Number(utility.importe || 0), 0);

    const structuralExpenses = Number(base.gastos_fijos || 0) + debtExpenses;
    const discretionaryExpenses = variableExpenses + tripExpenses;
    const totalIncome = Number(base.ingresos_fijos || 0) + variableIncomeTotal;
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
      gastos_var: variableExpenses,
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
      potencial: levers.filter((lever) => !lever.activa).reduce((sum, lever) => sum + Number(lever.importe || 0), 0),
      presionActual: months[currentMonth]?.presion || 0,
    },
  };
};

const sumLevers = (levers, subcategory) =>
  levers
    .filter((lever) => lever.subcategoria === subcategory)
    .reduce((sum, lever) => sum + Number(lever.importe || 0), 0);