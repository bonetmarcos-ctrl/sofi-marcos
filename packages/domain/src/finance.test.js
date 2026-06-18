import { describe, expect, it } from "vitest";
import { calculateDebt, calculateDebtInstallmentForMonth, calculateMonthlyBudget } from "./finance.js";
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
      events: [{ fecha: "2025-06-10", categoria: "habitacion", importe: 70 }],
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
});