import { describe, expect, it } from "vitest";
import { calculateDebt, calculateDebtInstallmentForMonth, calculateExpenseCashImpactForMonth, calculateMonthlyBudget } from "./finance.js";
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

  it("spreads credit card installments across following months", () => {
    const expense = { fecha: "2026-06-18", importe: 120, origenFondos: "tarjeta_cuotas", cuotasTarjeta: 3 };

    expect(calculateExpenseCashImpactForMonth(expense, "2026-06")).toBe(0);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-07")).toBe(40);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-09")).toBe(40);
    expect(calculateExpenseCashImpactForMonth(expense, "2026-10")).toBe(0);
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