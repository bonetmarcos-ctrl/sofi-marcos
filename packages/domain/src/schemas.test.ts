import { describe, expect, it } from "vitest";
import { collectionNames, eventSchema, tripSchema, debtSchema } from "./schemas.js";

describe("domain schemas", () => {
  it("exposes all application collections", () => {
    expect(collectionNames).toEqual([
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
});
