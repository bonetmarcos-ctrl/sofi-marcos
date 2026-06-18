import { describe, expect, it } from "vitest";
import { collectionNames, eventSchema, tripSchema, debtSchema, budgetConfigSchema } from "./schemas.js";

describe("domain schemas", () => {
  it("exposes all application collections", () => {
    expect(collectionNames).toEqual([
      "configuracion",
      "eventos",
      "viajes",
      "bloqueos",
      "proyectos",
      "palancas",
      "deudas",
      "suministros",
      "gastosVariables",
    ]);
  });

  it("coerces event amounts and applies optional defaults", () => {
    const parsed = eventSchema.parse({
      fecha: "2026-06-18",
      titulo: "Ingreso",
      categoria: "habitacion",
      importe: "42.50",
    });

    expect(parsed.importe).toBe(42.5);
    expect(parsed.hora).toBe("");
    expect(parsed.notas).toBe("");
    expect(parsed.origenFondos).toBe("ingresos_mes");
    expect(parsed.cuotasTarjeta).toBe(1);
    expect(parsed.mesPrimerCargo).toBe("");
  });

  it("validates trips with numeric expense records", () => {
    const parsed = tripSchema.parse({
      nombre: "Roma",
      inicio: "2026-08-01",
      fin: "2026-08-04",
      presupuesto: "900",
      gastos: { vuelo: "120", hotel: 300 },
    });

    expect(parsed.presupuesto).toBe(900);
    expect(parsed.gastos).toEqual({ vuelo: 120, hotel: 300 });
  });

  it("rejects inconsistent debt installment values", () => {
    expect(() =>
      debtSchema.parse({
        nombre: "Prestamo",
        cuota: 100,
        interes_mensual: 3,
        cuotas_totales: -1,
        mes_inicio: "2026-01",
      }),
    ).toThrow();
  });

  it("coerces editable budget configuration tables", () => {
    const parsed = budgetConfigSchema.parse({
      ingresos_fijos: "1000",
      gastos_fijos: "500",
      deudas: "100",
      previsiones: "20",
      presupuesto_variable: "80",
      coste_coche: "5500",
      detalle_fijos: [{ nombre: "Hipoteca", importe: "750" }],
      detalle_ingresos: [{ nombre: "Sueldo", importe: "1000", recurrente: "true" }],
      monthlyOverrides: { "2026-06": { fixedIncome: "1200", fixedExpenses: "600" } },
    });

    expect(parsed.id).toBe("base");
    expect(parsed.ingresos_fijos).toBe(1000);
    expect(parsed.detalle_fijos[0].importe).toBe(750);
    expect(parsed.detalle_ingresos[0].recurrente).toBe(true);
    expect(parsed.monthlyOverrides["2026-06"].fixedIncome).toBe(1200);
  });
});
