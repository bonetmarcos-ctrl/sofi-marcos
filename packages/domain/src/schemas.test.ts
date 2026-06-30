import { describe, expect, it } from "vitest";
import { annualCommitmentSchema, birthdaySchema, blockSchema, collectionNames, debtSchema, eventSchema, leverSchema, projectSchema, supermarketPurchaseSchema, tripSchema } from "./schemas.js";

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
      "comprasSuper",
      "cumpleanos",
      "compromisosAnuales",
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

  it("accepts generic resource availability blocks", () => {
    const parsed = blockSchema.parse({
      tipo: "recurso",
      recursoNombre: "Parking",
      inicio: "2026-08-10",
      fin: "2026-08-12",
      horaInicio: "09:00",
      horaFin: "18:00",
      importe: "120",
    });

    expect(parsed).toMatchObject({
      tipo: "recurso",
      recursoNombre: "Parking",
      inicio: "2026-08-10",
      fin: "2026-08-12",
      horaInicio: "09:00",
      horaFin: "18:00",
      importe: 120,
    });
  });

  it("keeps legacy room and car block types valid", () => {
    expect(blockSchema.parse({ tipo: "habitacion", inicio: "2026-08-01", fin: "2026-08-02" }).tipo).toBe("habitacion");
    expect(blockSchema.parse({ tipo: "coche", inicio: "2026-08-01", fin: "2026-08-02" }).tipo).toBe("coche");
  });

  it("normalizes generic project planning fields", () => {
    const parsed = projectSchema.parse({
      categoria: "compra",
      titulo: "Comprar parking",
      prioridad: "media",
      estado: "pendiente",
      inicio: "2026-07-01",
      fin: "2026-07-31",
      presupuesto: "25000",
      gasto: "0",
      objetivo: "Tener una plaza viable",
      siguientePaso: "Comparar opciones",
    });

    expect(parsed).toMatchObject({
      categoria: "compra",
      habitacion: "general",
      presupuesto: 25000,
      gasto: 0,
      objetivo: "Tener una plaza viable",
      siguientePaso: "Comparar opciones",
      decisionPendiente: "",
    });
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

  it("normalizes supermarket purchases with product lines", () => {
    const parsed = supermarketPurchaseSchema.parse({
      fecha: "2026-06-22",
      comercio: "Mercadona",
      importe: "54.30",
      lineas: [{ producto: "Leche", cantidad: "6", unidad: "u", importe: "7.20" }],
    });

    expect(parsed.importe).toBe(54.3);
    expect(parsed.origenFondos).toBe("ingresos_mes");
    expect(parsed.lineas[0]).toMatchObject({ producto: "Leche", cantidad: 6, importe: 7.2 });
  });

  it("normalizes birthdays for the calendar", () => {
    const parsed = birthdaySchema.parse({ nombre: "Sofi", fecha: "1990-06-22", presupuestoRegalo: "40" });

    expect(parsed).toMatchObject({ nombre: "Sofi", fecha: "1990-06-22", presupuestoRegalo: 40, relacion: "" });
  });

  it("normalizes annual commitments with reserve defaults", () => {
    const parsed = annualCommitmentSchema.parse({ nombre: "IBI", importe: "720", fechaVencimiento: "2026-05-15" });

    expect(parsed).toMatchObject({
      nombre: "IBI",
      importe: 720,
      frecuencia: "anual",
      origenFondos: "ingresos_mes",
      reservaActiva: true,
      mesesReserva: 12,
      avisoDiasAntes: 30,
    });
  });

  it("keeps calendar metadata optional for levers", () => {
    const parsed = leverSchema.parse({ nombre: "Habitacion", subcategoria: "habitacion", importe: "180", mes: "2026-08" });

    expect(parsed).toMatchObject({
      nombre: "Habitacion",
      importe: 180,
      activa: false,
      calendarioVinculado: false,
      fechaInicio: "",
      fechaFin: "",
      precioUnidad: 0,
      unidadCalendario: "",
    });
  });
});
