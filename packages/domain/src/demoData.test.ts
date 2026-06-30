import { describe, expect, it } from "vitest";
import { BASE, createEmptyState, createInitialState, normalizeBudgetBase } from "./demoData.js";

describe("demo and empty state data", () => {
  it("keeps demo data only in the initial demo state", () => {
    const initial = createInitialState();

    expect(initial.base.ingresos_fijos).toBe(BASE.ingresos_fijos);
    expect(initial.eventos.length).toBeGreaterThan(0);
    expect(initial.deudas.length).toBeGreaterThan(0);
  });

  it("creates truly empty user states without inherited records", () => {
    const empty = createEmptyState();

    expect(empty.base).toMatchObject({
      ingresos_fijos: 0,
      gastos_fijos: 0,
      deudas: 0,
      previsiones: 0,
      presupuesto_variable: 0,
      coste_coche: 0,
      detalle_fijos: [],
      detalle_ingresos: [],
      detalle_deudas: [],
      ingresos_puntuales_mayo: [],
      monthlyOverrides: {},
    });
    expect(empty.eventos).toEqual([]);
    expect(empty.proyectos).toEqual([]);
    expect(empty.palancas).toEqual([]);
    expect(empty.deudas).toEqual([]);
    expect(empty.suministros).toEqual([]);
  });

  it("normalizes partial bases without falling back to demo records", () => {
    const base = normalizeBudgetBase({ ingresos_fijos: "1200" });

    expect(base.ingresos_fijos).toBe(1200);
    expect(base.gastos_fijos).toBe(0);
    expect(base.detalle_fijos).toEqual([]);
    expect(base.detalle_ingresos).toEqual([]);
    expect(base.monthlyOverrides).toEqual({});
  });
});