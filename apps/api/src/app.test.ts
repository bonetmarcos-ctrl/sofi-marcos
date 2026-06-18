import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { MemoryStateRepository } from "./infrastructure/memoryStateRepository.js";
import { MemoryUserRepository } from "./infrastructure/memoryUserRepository.js";

const authConfig = {
  username: "tester",
  password: "secret",
  passwordHash: "",
  jwtSecret: "test-secret",
  cookieName: "test_session",
  sessionTtlSeconds: 3600,
};

const createTestApp = () => createApp({
  repository: new MemoryStateRepository(),
  userRepository: new MemoryUserRepository(),
  authConfig,
});

const createAuthenticatedAgent = async () => {
  const agent = request.agent(createTestApp());
  await agent.post("/api/auth/login").send({ username: "tester", password: "secret" }).expect(200);
  return agent;
};

describe("api", () => {
  it("returns health status", async () => {
    const response = await request(createTestApp()).get("/api/health").expect(200);

    expect(response.body.ok).toBe(true);
  });

  it("requires authentication for application data", async () => {
    await request(createTestApp()).get("/api/state").expect(401);
  });

  it("authenticates users with username and password", async () => {
    const agent = await createAuthenticatedAgent();

    const response = await agent.get("/api/auth/me").expect(200);

    expect(response.body.user.username).toBe("tester");
    await agent.get("/api/state").expect(200);
  });

  it("registers new users and creates a session", async () => {
    const agent = request.agent(createTestApp());

    const response = await agent
      .post("/api/auth/register")
      .send({ username: "Nueva", password: "secret123" })
      .expect(201);

    expect(response.body.user).toEqual({ username: "nueva" });
    await agent.get("/api/state").expect(200);
  });

  it("keeps application state isolated per authenticated user", async () => {
    const app = createTestApp();
    const firstUser = request.agent(app);
    const secondUser = request.agent(app);

    await firstUser.post("/api/auth/register").send({ username: "sofi", password: "secret123" }).expect(201);
    await secondUser.post("/api/auth/register").send({ username: "marqui", password: "secret123" }).expect(201);

    await firstUser
      .post("/api/palancas")
      .send({ nombre: "Solo Sofi", subcategoria: "otros", importe: 10, mes: "2026-06", activa: true })
      .expect(201);

    const firstState = await firstUser.get("/api/state").expect(200);
    const secondState = await secondUser.get("/api/state").expect(200);

    expect(firstState.body.palancas.some((palanca: { nombre: string }) => palanca.nombre === "Solo Sofi")).toBe(true);
    expect(secondState.body.palancas.some((palanca: { nombre: string }) => palanca.nombre === "Solo Sofi")).toBe(false);
  });

  it("rejects invalid login attempts", async () => {
    const response = await request(createTestApp())
      .post("/api/auth/login")
      .send({ username: "tester", password: "wrong" })
      .expect(401);

    expect(response.body.error).toBe("Invalid username or password");
  });

  it("clears sessions on logout", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.post("/api/auth/logout").expect(204);
    await agent.get("/api/state").expect(401);
  });

  it("creates, updates and deletes collection items", async () => {
    const agent = await createAuthenticatedAgent();
    const created = await agent
      .post("/api/palancas")
      .send({ nombre: "Test", subcategoria: "otros", importe: 10, mes: "2026-06", activa: false })
      .expect(201);

    expect(created.body.id).toBeDefined();

    const updated = await agent
      .put(`/api/palancas/${created.body.id}`)
      .send({ importe: 20, activa: true })
      .expect(200);

    expect(updated.body.importe).toBe(20);
    expect(updated.body.activa).toBe(true);

    await agent.delete(`/api/palancas/${created.body.id}`).expect(200);
  });

  it("replaces full application state", async () => {
    const agent = await createAuthenticatedAgent();
    const state = await agent.get("/api/state").expect(200);

    const response = await agent
      .put("/api/state")
      .send({ ...state.body, bloqueos: [{ tipo: "coche", inicio: "2026-06-01", fin: "2026-06-02" }] })
      .expect(200);

    expect(response.body.bloqueos).toHaveLength(1);
  });

  it("resets full application state", async () => {
    const agent = await createAuthenticatedAgent();

    await agent
      .post("/api/palancas")
      .send({ nombre: "Temporal", subcategoria: "otros", importe: 10, mes: "2026-06", activa: true })
      .expect(201);

    const response = await agent.post("/api/state/reset").expect(200);

    expect(response.body.palancas.some((palanca: { nombre: string }) => palanca.nombre === "Temporal")).toBe(false);
  });

  it("validates payloads", async () => {
    const agent = await createAuthenticatedAgent();
    const response = await agent.post("/api/eventos").send({ titulo: "Sin fecha" }).expect(422);

    expect(response.body.error).toBe("Validation failed");
  });
});