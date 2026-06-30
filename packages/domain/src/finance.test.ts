import { describe, expect, it } from "vitest";
import { buildCreditCardDebtFromExpense, calculateAnnualCommitmentCashImpactForMonth, calculateAnnualCommitmentReserveForMonth, calculateDebt, calculateDebtInstallmentForMonth, calculateExpenseCashImpactForMonth, calculateMonthlyBudget, calculatePaymentMethodBreakdownForMonth, expenseFirstChargeMonth, projectExpenseItem, tripExpenseItems, predictUtilityAvailabilityDate } from "./finance.js";
import { BASE } from "./demoData.js";

const categories = {
  ocio: { tipo: "gasto" },
  habitacion: { tipo: "ingreso" },
  coche: { tipo: "ingreso" },
};

describe("finance domain", () => {
  it("calculates pending debt metrics", () => {
    const result = calculateDebt({ cuota: 100, interes_mensual: 5, cuotas_totales: 10, cuota_actual: 4, mes_inicio: "2025-01" });

    expect(result.pendientes).toBe(6);
    expect(result.pendiente_capital).toBe(600);
    expect(result.impacto_mensual).toBe(105);
    expect(result.mes_fin_real).toBe("2025-10");
  });

  it("only includes active debt installments for the target month", () => {
    const debts = [{ cuota: 100, interes_mensual: 5, cuotas_totales: 3, cuota_actual: 1, mes_inicio: "2025-01" }];

    expect(calculateDebtInstallmentForMonth(debts, "2025-01")).toBe(0);
    expect(calculateDebtInstallmentForMonth(debts, "2025-02")).toBe(105);
    expect(calculateDebtInstallmentForMonth(debts, "2025-04")).toBe(0);
  });

  it("calculates monthly budget totals", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [{ inicio: "2025-06-10", fin: "2025-06-11", tipo: "habitacion", importe: 70 }],
      trips: [],
      levers: [{ mes: "2025-06", subcategoria: "ventas", importe: 180, activa: true }],
      debts: [],
      utilities: [{ mes: "2025-06", tipo: "luz", importe: 50 }],
      year: 2025,
      currentMonth: 5,
    });

    expect(result.datosMes[5].ingresos_var_total).toBe(250);
    expect(result.datosMes[5].gasto_suministros).toBe(50);
    expect(result.totales.varAnual).toBe(250);
  });

  it("summarizes real resource margin without inflating it with inactive levers", () => {
    const result = calculateMonthlyBudget({
      base: { ...BASE, ingresos_fijos: 1000, gastos_fijos: 300, monthlyOverrides: {} },
      categories,
      events: [{ fecha: "2026-06-05", categoria: "ocio", importe: 100 }],
      blocks: [],
      trips: [],
      levers: [
        { mes: "2026-06", subcategoria: "ventas", importe: 200, activa: true },
        { mes: "2026-06", subcategoria: "ventas", importe: 500, activa: false },
      ],
      debts: [{ cuota: 50, interes_mensual: 0, cuotas_totales: 12, cuota_actual: 0, mes_inicio: "2026-01" }],
      utilities: [{ mes: "2026-06", tipo: "luz", importe: 30 }],
      variableExpenses: [{ mes: "2026-06", categoria: "ocio", titulo: "Manual", importe: 20 }],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].resumen_recursos).toMatchObject({
      ingresos_confirmados: 1200,
      gasto_comprometido: 380,
      gasto_flexible: 120,
      margen_real: 700,
      palancas_potenciales: 500,
      margen_con_potencial: 1200,
    });
  });

  it("tracks card and installment pressure separately from potential capacity", () => {
    const result = calculateMonthlyBudget({
      base: { ...BASE, ingresos_fijos: 1000, gastos_fijos: 300, monthlyOverrides: {} },
      categories,
      events: [{ fecha: "2026-06-18", categoria: "ocio", importe: 120, origenFondos: "tarjeta_mes_siguiente" }],
      blocks: [],
      trips: [],
      levers: [],
      debts: [{ id: "d-1", origenColeccion: "gastosVariables", cuota: 100, interes_mensual: 0, cuotas_totales: 3, cuota_actual: 0, mes_inicio: "2026-07" }],
      utilities: [],
      variableExpenses: [],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].resumen_recursos.presion_tarjeta).toBe(0);
    expect(result.datosMes[6].resumen_recursos).toMatchObject({
      presion_tarjeta: 220,
      tarjeta_mes_siguiente: 120,
      cuotas_tarjeta: 100,
      margen_real: 480,
    });
  });

  it("calculates monthly reserves before annual commitment due dates", () => {
    const commitment = { nombre:"IBI", importe:600, fechaVencimiento:"2026-07-15", reservaActiva:true, mesesReserva:6 };

    expect(calculateAnnualCommitmentReserveForMonth(commitment, "2026-01")).toBe(100);
    expect(calculateAnnualCommitmentReserveForMonth(commitment, "2026-06")).toBe(100);
    expect(calculateAnnualCommitmentReserveForMonth(commitment, "2026-07")).toBe(0);
  });

  it("keeps reserved annual commitments out of cash impact and inside resource margin", () => {
    const result = calculateMonthlyBudget({
      base: { ...BASE, ingresos_fijos: 1000, gastos_fijos: 300, monthlyOverrides: {} },
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [],
      debts: [],
      utilities: [],
      annualCommitments: [{ nombre:"IBI", importe:600, fechaVencimiento:"2026-07-15", reservaActiva:true, mesesReserva:6 }],
      year: 2026,
      currentMonth: 0,
    });

    expect(result.datosMes[0].gasto_reservas).toBe(100);
    expect(result.datosMes[0].resumen_recursos.reservas_necesarias).toBe(100);
    expect(result.datosMes[0].resumen_recursos.margen_real).toBe(600);
    expect(result.datosMes[6].gasto_compromisos_anuales).toBe(0);
  });

  it("applies unreserved annual commitments in their payment month", () => {
    const commitment = { nombre:"ITV", importe:120, fechaVencimiento:"2026-11-15", fechaPago:"2026-01-20", reservaActiva:false };

    expect(calculateAnnualCommitmentCashImpactForMonth(commitment, "2026-01")).toBe(120);
    expect(calculateAnnualCommitmentCashImpactForMonth(commitment, "2026-11")).toBe(0);
  });

  it("does not apply levers outside their assigned year-month", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [{ mes: "2025-06", subcategoria: "habitacion", importe: 280, activa: true }],
      debts: [],
      utilities: [],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].ing_habitacion).toBe(0);
    expect(result.datosMes[5].ingresos_var_total).toBe(0);
    expect(result.totales.varAnual).toBe(0);
  });

  it("includes monthly variable expense lines in discretionary expenses", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [],
      debts: [],
      utilities: [],
      variableExpenses: [{ mes: "2026-06", categoria: "otro", titulo: "Compra", importe: 45 }],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].gastos_var).toBe(45);
    expect(result.datosMes[5].gastos_variables_lineas).toBe(45);
    expect(result.datosMes[5].gasto_discrecional).toBe(45);
  });

  it("moves credit card expenses to the first charge month", () => {
    const expense = { fecha: "2026-06-18", importe: 120, origenFondos: "tarjeta_mes_siguiente" };

    expect(calculateExpenseCashImpactForMonth(expense, "2026-06")).toBe(0);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-07")).toBe(120);
  });

  it("reports next-month card charges as previous card balance in the charge month", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [{ fecha: "2026-06-18", categoria: "ocio", importe: 120, origenFondos: "tarjeta_mes_siguiente" }],
      blocks: [],
      trips: [],
      levers: [],
      debts: [],
      utilities: [],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].gasto_tarjeta_mes_anterior).toBe(0);
    expect(result.datosMes[6].gasto_tarjeta_mes_anterior).toBe(120);
    expect(result.datosMes[6].gastos_calendario).toBe(120);
  });

  it("spreads credit card installments across following months", () => {
    const expense = { fecha: "2026-06-18", importe: 120, origenFondos: "tarjeta_cuotas", cuotasTarjeta: 3 };

    expect(calculateExpenseCashImpactForMonth(expense, "2026-06")).toBe(0);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-07")).toBe(40);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-09")).toBe(40);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-10")).toBe(0);
  });

  it("uses the card close day to calculate the first charge month", () => {
    expect(expenseFirstChargeMonth({ fecha: "2026-06-18", tarjetaDiaCierre: 20 })).toBe("2026-07");
    expect(expenseFirstChargeMonth({ fecha: "2026-06-21", tarjetaDiaCierre: 20 })).toBe("2026-08");
  });

  it("builds a linked debt for card installment expenses", () => {
    const debt = buildCreditCardDebtFromExpense({
      id: "g-1",
      mes: "2026-06",
      titulo: "Heladera",
      importe: 600,
      origenFondos: "tarjeta_cuotas",
      cuotasTarjeta: 6,
      tarjetaNombre: "Visa BBVA",
      tarjetaDiaCierre: 25,
    });

    expect(debt).toEqual(expect.objectContaining({
      id: "tarjeta-gastosVariables-g-1",
      nombre: "Visa BBVA · Heladera",
      cuota: 100,
      cuotas_totales: 6,
      mes_inicio: "2026-07",
      origenColeccion: "gastosVariables",
      origenId: "g-1",
    }));

    expect(calculateExpenseCashImpactForMonth({ origenFondos: "tarjeta_cuotas", importe: 600, cuotasTarjeta: 6, mesPrimerCargo: "2026-07", deudaTarjetaId: debt?.id }, "2026-07")).toBe(0);
  });

  it("breaks monthly expense impact down by payment method", () => {
    const breakdown = calculatePaymentMethodBreakdownForMonth(
      [
        { fecha: "2026-06-10", importe: 50, origenFondos: "ingresos_mes" },
        { fecha: "2026-06-10", importe: 120, origenFondos: "tarjeta_mes_siguiente" },
        { id: "g-1", mes: "2026-06", importe: 300, origenFondos: "tarjeta_cuotas", cuotasTarjeta: 3, mesPrimerCargo: "2026-07", deudaTarjetaId: "d-1" },
      ],
      [{ id: "d-1", origen: "tarjeta_cuotas", cuota: 100, interes_mensual: 0, cuotas_totales: 3, cuota_actual: 0, mes_inicio: "2026-07" }],
      "2026-07",
    );

    expect(breakdown).toEqual({ cash:0, card:120, cardInstallments:100 });
  });

  it("uses project and trip payment methods in the monthly budget", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [],
      trips: [{ id:"trip-1", nombre:"Roma", inicio:"2026-06-10", fin:"2026-06-14", presupuesto:500, gastos:{ vuelo:300 }, gastosPago:{ vuelo:{ origenFondos:"tarjeta_mes_siguiente", mesPrimerCargo:"2026-07" } } }],
      levers: [],
      debts: [],
      utilities: [],
      variableExpenses: [],
      projects: [{ id:"p-1", estado:"completado", titulo:"Sofa", inicio:"2026-06-01", fin:"2026-06-20", gasto:200, origenFondos:"tarjeta_mes_siguiente", mesPrimerCargo:"2026-07" }],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].gastos_viaje).toBe(0);
    expect(result.datosMes[5].gastos_casa_tareas).toBe(0);
    expect(result.datosMes[6].gastos_viaje).toBe(300);
    expect(result.datosMes[6].gastos_casa_tareas).toBe(200);
  });

  it("converts projects and trip concepts into expense items", () => {
    expect(projectExpenseItem({ id:"p-1", titulo:"Sofa", fin:"2026-07-20", gasto:200 })).toMatchObject({ id:"p-1", titulo:"Sofa", importe:200, mes:"2026-07", origenFondos:"ingresos_mes" });
    expect(tripExpenseItems({ id:"v-1", nombre:"Roma", inicio:"2026-07-01", gastos:{ vuelo:120 }, gastosPago:{ vuelo:{ origenFondos:"tarjeta_cuotas", cuotasTarjeta:3 } } })[0]).toMatchObject({ id:"v-1:vuelo", importe:120, mes:"2026-07", origenFondos:"tarjeta_cuotas", cuotasTarjeta:3 });
  });

  it("adds linked card installment debts on top of monthly debt overrides", () => {
    const result = calculateMonthlyBudget({
      base: { ...BASE, monthlyOverrides:{ "2026-07":{ debtExpenses:1150 } } },
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [],
      debts: [
        { cuota:100, interes_mensual:0, cuotas_totales:3, cuota_actual:0, mes_inicio:"2026-07", origenColeccion:"gastosVariables" },
        { cuota:90, interes_mensual:0, cuotas_totales:3, cuota_actual:0, mes_inicio:"2026-07" },
      ],
      utilities: [],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[6].gasto_deudas).toBe(1250);
  });

  it("uses utility due dates as the cash-flow month", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [],
      debts: [],
      utilities: [{ mes: "2026-06", tipo: "luz", importe: 50, fechaFactura: "2026-06-28", fechaVencimiento: "2026-07-05" }],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].gasto_suministros).toBe(0);
    expect(result.datosMes[6].gasto_suministros).toBe(50);
  });

  it("predicts utility availability dates from previous bills", () => {
    expect(predictUtilityAvailabilityDate([
      { mes: "2026-04", tipo: "agua", fechaFactura: "2026-04-22" },
      { mes: "2026-05", tipo: "agua", fechaVencimiento: "2026-05-24" },
    ], "agua", "2026-06")).toBe("2026-06-24");
  });

  it("includes completed home task spending in the finish month discretionary expenses", () => {
    const result = calculateMonthlyBudget({
      base: BASE,
      categories,
      events: [],
      blocks: [],
      trips: [],
      levers: [],
      debts: [],
      utilities: [],
      projects: [
        { estado: "completado", fin: "2026-06-20", gasto: 120 },
        { estado: "en_curso", fin: "2026-06-21", gasto: 80 },
        { estado: "completado", fin: "2026-07-01", gasto: 40 },
      ],
      year: 2026,
      currentMonth: 5,
    });

    expect(result.datosMes[5].gastos_casa_tareas).toBe(120);
    expect(result.datosMes[5].gastos_var).toBe(120);
    expect(result.datosMes[5].gasto_discrecional).toBe(120);
  });
});