import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JsonStateRepository } from "./jsonStateRepository.js";

let tempDir = "";

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "sofi-json-repo-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("JsonStateRepository", () => {
  it("creates initial state when the file does not exist", async () => {
    const filePath = path.join(tempDir, "state.json");
    const repository = new JsonStateRepository(filePath);

    const state = await repository.read();

    expect(state).toHaveProperty("eventos");
    expect(JSON.parse(await readFile(filePath, "utf8"))).toEqual(state);
  });

  it("serializes writes sequentially", async () => {
    const filePath = path.join(tempDir, "state.json");
    const repository = new JsonStateRepository(filePath);

    await Promise.all([
      repository.write({ eventos: [{ id: "a" }], viajes: [], bloqueos: [], proyectos: [], palancas: [], deudas: [], suministros: [] }),
      repository.write({ eventos: [{ id: "b" }], viajes: [], bloqueos: [], proyectos: [], palancas: [], deudas: [], suministros: [] }),
    ]);

    const state = await repository.read();
    expect(state.eventos).toEqual([{ id: "b" }]);
  });

  it("stores separate state for each user", async () => {
    const filePath = path.join(tempDir, "state.json");
    const repository = new JsonStateRepository(filePath);

    await repository.write({ eventos: [{ id: "sofi" }], viajes: [], bloqueos: [], proyectos: [], palancas: [], deudas: [], suministros: [] }, "sofi");
    await repository.write({ eventos: [{ id: "marqui" }], viajes: [], bloqueos: [], proyectos: [], palancas: [], deudas: [], suministros: [] }, "marqui");

    await expect(repository.read("sofi")).resolves.toMatchObject({ eventos: [{ id: "sofi" }] });
    await expect(repository.read("marqui")).resolves.toMatchObject({ eventos: [{ id: "marqui" }] });
  });
});
