import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MemoryStateRepository } from "./infrastructure/memoryStateRepository.js";

const createTestApp = () => createApp({ repository: new MemoryStateRepository() });

describe("api", () => {
  it("returns health status", async () => {
    const response = await request(createTestApp()).get("/api/health").expect(200);

    expect(response.body.ok).toBe(true);
  });

  it("creates, updates and deletes collection items", async () => {
    const app = createTestApp();
    const created = await request(app)
      .post("/api/palancas")
      .send({ nombre: "Test", subcategoria: "otros", importe: 10, mes: "2026-06", activa: false })
      .expect(201);

    expect(created.body.id).toBeDefined();

    const updated = await request(app)
      .put(`/api/palancas/${created.body.id}`)
      .send({ importe: 20, activa: true })
      .expect(200);

    expect(updated.body.importe).toBe(20);
    expect(updated.body.activa).toBe(true);

    await request(app).delete(`/api/palancas/${created.body.id}`).expect(200);
  });

  it("replaces full application state", async () => {
    const app = createTestApp();
    const state = await request(app).get("/api/state").expect(200);

    const response = await request(app)
      .put("/api/state")
      .send({ ...state.body, bloqueos: [{ tipo: "coche", inicio: "2026-06-01", fin: "2026-06-02" }] })
      .expect(200);

    expect(response.body.bloqueos).toHaveLength(1);
  });

  it("validates payloads", async () => {
    const response = await request(createTestApp()).post("/api/eventos").send({ titulo: "Sin fecha" }).expect(422);

    expect(response.body.error).toBe("Validation failed");
  });
});