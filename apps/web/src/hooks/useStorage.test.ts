import { beforeEach, describe, expect, it, vi } from "vitest";
import { persist, retrieve, STORAGE_KEYS } from "./useStorage.ts";

describe("useStorage helpers", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    window.storage = {
      set: vi.fn(async (key, value) => {
        store.set(key, value);
      }),
      get: vi.fn(async (key) => ({ value: store.get(key) })),
    };
  });

  it("persists and retrieves JSON values", async () => {
    await persist(STORAGE_KEYS.eventos, [{ id: "evt" }]);

    await expect(retrieve(STORAGE_KEYS.eventos, [])).resolves.toEqual([{ id: "evt" }]);
  });

  it("returns fallback when storage is unavailable", async () => {
    window.storage = undefined;

    await persist("missing", { ok: true });
    await expect(retrieve("missing", "fallback")).resolves.toBe("fallback");
  });
});
