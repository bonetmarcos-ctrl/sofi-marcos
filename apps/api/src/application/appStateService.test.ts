import { describe, expect, it } from "vitest";
import { createEmptyState, createInitialState } from "@sofi-marqui/domain";
import { AppStateService } from "./appStateService.js";
import { MemoryStateRepository } from "../infrastructure/memoryStateRepository.js";

describe("AppStateService", () => {
  it("resets state to the domain initial state", async () => {
    const repository = new MemoryStateRepository({
      ...createInitialState(),
      eventos: [{ id: 1, fecha: "2026-06-18", titulo: "Old", hora: "", categoria: "ocio", importe: 0, notas: "" }],
    });
    const service = new AppStateService(repository);

    const state = await service.resetState();

    expect(state.eventos).toEqual(createInitialState().eventos);
    await expect(service.getState()).resolves.toEqual(state);
  });

  it("resets authenticated profiles to an empty state", async () => {
    const repository = new MemoryStateRepository({
      ...createInitialState(),
      eventos: [{ id: 1, fecha: "2026-06-18", titulo: "Old", hora: "", categoria: "ocio", importe: 0, notas: "" }],
    });
    const service = new AppStateService(repository);

    const state = await service.resetState("nueva");

    expect(state).toEqual(createEmptyState());
    await expect(service.getUserState("nueva")).resolves.toEqual(createEmptyState());
  });

  it("lists, creates, updates and removes typed collection items", async () => {
    const service = new AppStateService(new MemoryStateRepository({ ...createInitialState(), palancas: [] }));

    const created = await service.create("palancas", {
      nombre: "Venta",
      subcategoria: "ventas",
      importe: "120",
      mes: "2026-06",
      activa: false,
    });

    expect(created).toMatchObject({ nombre: "Venta", importe: 120, activa: false });
    expect(await service.list("palancas")).toHaveLength(1);

    const updated = await service.update("palancas", String(created.id), { activa: true, importe: 150 });
    expect(updated).toMatchObject({ activa: true, importe: 150 });

    await service.remove("palancas", String(created.id));
    expect(await service.list("palancas")).toEqual([]);
  });

  it("rejects unknown collections and missing items", async () => {
    const service = new AppStateService(new MemoryStateRepository());

    await expect(service.list("desconocida")).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.update("palancas", "missing", {})).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.remove("palancas", "missing")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("sanitizes full state replacements through collection schemas", async () => {
    const service = new AppStateService(new MemoryStateRepository());

    const state = await service.replaceState({
      eventos: [{ fecha: "2026-06-18", titulo: "Cena", categoria: "ocio", importe: "35" }],
      viajes: [{ nombre: "Paris", inicio: "2026-07-01", fin: "2026-07-05", presupuesto: "800", gastos: { hotel: "300" } }],
    });

    expect(state.eventos[0]).toMatchObject({ importe: 35, hora: "", notas: "" });
    expect(state.viajes[0]).toMatchObject({ presupuesto: 800, gastos: { hotel: 300 } });
    expect(state.palancas).toEqual([]);
    expect("configuracion" in state).toBe(false);
  });

  it("normalizes legacy states with missing collections", async () => {
    const { gastosVariables: _gastosVariables, ...legacyState } = createInitialState() as Record<string, unknown[]>;
    const service = new AppStateService(new MemoryStateRepository(legacyState as never));

    const state = await service.getState();
    expect(state.gastosVariables).toEqual(createEmptyState().gastosVariables);

    const created = await service.create("gastosVariables", { mes: "2026-06", titulo: "Compra", categoria: "otro", importe: "12" });
    expect(created).toMatchObject({ importe: 12, origenFondos: "ingresos_mes" });
  });
});
