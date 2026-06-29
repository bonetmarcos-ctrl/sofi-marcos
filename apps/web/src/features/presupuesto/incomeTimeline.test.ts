import { describe, expect, it } from "vitest";
import { actualizarIngresosFijosDesdeMes, editarLineaIngresoDesdeMes, editarLineaIngresoEnMes, eliminarLineaIngresoDesdeMes, eliminarLineaIngresoEnMes, fechaAcreditacionIngresoEnMes, lineaIngresoActivaEnMes } from "./incomeTimeline.ts";

describe("income timeline", () => {
  it("starts edited income lines in the selected month without changing previous months", () => {
    const base = {
      ingresos_fijos:1000,
      detalle_ingresos:[{ id:"salary", nombre:"Salary", importe:1000, recurrente:true }],
      monthlyOverrides:{
        "2026-06": { fixedIncome:1000 },
        "2026-07": { fixedIncome:1000 },
        "2026-08": { fixedIncome:1100 },
      },
    };

    const detalleIngresos = editarLineaIngresoDesdeMes(base.detalle_ingresos, 0, "2026-07", { importe:1200 }, "salary-2026-07");
    const result = actualizarIngresosFijosDesdeMes(base, "2026-07", detalleIngresos);

    expect(result.monthlyOverrides["2026-06"].fixedIncome).toBe(1000);
    expect(result.monthlyOverrides["2026-07"].fixedIncome).toBe(1200);
    expect(result.monthlyOverrides["2026-08"].fixedIncome).toBe(1300);
    expect(result.detalle_ingresos[0]).toMatchObject({ id:"salary", hasta:"2026-06", importe:1000 });
    expect(result.detalle_ingresos[1]).toMatchObject({ id:"salary-2026-07", desde:"2026-07", importe:1200 });
    expect(lineaIngresoActivaEnMes(result.detalle_ingresos[0], "2026-06")).toBe(true);
    expect(lineaIngresoActivaEnMes(result.detalle_ingresos[0], "2026-07")).toBe(false);
  });

  it("ends deleted income lines in the previous month when they already existed", () => {
    const base = {
      ingresos_fijos:1000,
      detalle_ingresos:[{ id:"salary", nombre:"Salary", importe:1000, recurrente:true }],
      monthlyOverrides:{
        "2026-06": { fixedIncome:1000 },
        "2026-07": { fixedIncome:1000 },
      },
    };

    const detalleIngresos = eliminarLineaIngresoDesdeMes(base.detalle_ingresos, 0, "2026-07");
    const result = actualizarIngresosFijosDesdeMes(base, "2026-07", detalleIngresos);

    expect(result.monthlyOverrides["2026-06"].fixedIncome).toBe(1000);
    expect(result.monthlyOverrides["2026-07"].fixedIncome).toBe(0);
    expect(result.detalle_ingresos).toEqual([{ id:"salary", nombre:"Salary", importe:1000, recurrente:true, hasta:"2026-06" }]);
  });

  it("keeps new income lines inactive before their start month", () => {
    const base = {
      ingresos_fijos:1000,
      detalle_ingresos:[{ id:"salary", nombre:"Salary", importe:1000, recurrente:true }],
      monthlyOverrides:{
        "2026-06": { fixedIncome:1000 },
        "2026-07": { fixedIncome:1000 },
      },
    };
    const detalleIngresos = [...base.detalle_ingresos, { id:"raise", nombre:"Raise", importe:200, recurrente:true, desde:"2026-07" }];
    const result = actualizarIngresosFijosDesdeMes(base, "2026-07", detalleIngresos);

    expect(lineaIngresoActivaEnMes(detalleIngresos[1], "2026-06")).toBe(false);
    expect(lineaIngresoActivaEnMes(detalleIngresos[1], "2026-07")).toBe(true);
    expect(result.monthlyOverrides["2026-06"].fixedIncome).toBe(1000);
    expect(result.monthlyOverrides["2026-07"].fixedIncome).toBe(1200);
  });

  it("edits only the selected month while preserving later monthly totals", () => {
    const base = {
      ingresos_fijos:1000,
      detalle_ingresos:[{ id:"salary", nombre:"Salary", importe:1000, recurrente:true, diaAcreditacion:28 }],
      monthlyOverrides:{
        "2026-06": { fixedIncome:1000 },
        "2026-07": { fixedIncome:1000 },
        "2026-08": { fixedIncome:1100 },
      },
    };

    const detalleIngresos = editarLineaIngresoEnMes(base.detalle_ingresos, 0, "2026-07", { importe:1200, diaAcreditacion:31 }, { current:"salary-2026-07", future:"salary-2026-08" });
    const result = actualizarIngresosFijosDesdeMes(base, "2026-07", detalleIngresos);

    expect(result.monthlyOverrides["2026-06"].fixedIncome).toBe(1000);
    expect(result.monthlyOverrides["2026-07"].fixedIncome).toBe(1200);
    expect(result.monthlyOverrides["2026-08"].fixedIncome).toBe(1100);
    expect(result.detalle_ingresos).toEqual([
      { id:"salary", nombre:"Salary", importe:1000, recurrente:true, diaAcreditacion:28, hasta:"2026-06" },
      { id:"salary-2026-07", nombre:"Salary", importe:1200, recurrente:true, diaAcreditacion:31, desde:"2026-07", hasta:"2026-07" },
      { id:"salary-2026-08", nombre:"Salary", importe:1000, recurrente:true, diaAcreditacion:28, desde:"2026-08" },
    ]);
  });

  it("deletes only the selected month while preserving later monthly totals", () => {
    const base = {
      ingresos_fijos:1000,
      detalle_ingresos:[{ id:"salary", nombre:"Salary", importe:1000, recurrente:true }],
      monthlyOverrides:{
        "2026-06": { fixedIncome:1000 },
        "2026-07": { fixedIncome:1000 },
        "2026-08": { fixedIncome:1100 },
      },
    };

    const detalleIngresos = eliminarLineaIngresoEnMes(base.detalle_ingresos, 0, "2026-07", { future:"salary-2026-08" });
    const result = actualizarIngresosFijosDesdeMes(base, "2026-07", detalleIngresos);

    expect(result.monthlyOverrides["2026-06"].fixedIncome).toBe(1000);
    expect(result.monthlyOverrides["2026-07"].fixedIncome).toBe(0);
    expect(result.monthlyOverrides["2026-08"].fixedIncome).toBe(1100);
    expect(result.detalle_ingresos).toEqual([
      { id:"salary", nombre:"Salary", importe:1000, recurrente:true, hasta:"2026-06" },
      { id:"salary-2026-08", nombre:"Salary", importe:1000, recurrente:true, desde:"2026-08" },
    ]);
  });

  it("calculates the real credit date for the month", () => {
    expect(fechaAcreditacionIngresoEnMes({ diaAcreditacion:31 }, "2026-02")).toBe("2026-02-28");
    expect(fechaAcreditacionIngresoEnMes({ diaCobro:15 }, "2026-07")).toBe("2026-07-15");
  });
});