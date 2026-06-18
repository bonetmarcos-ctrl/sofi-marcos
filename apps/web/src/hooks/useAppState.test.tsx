import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@sofi-marqui/domain";
import { useAppState } from "./useAppState.ts";
import { apiClient } from "../services/apiClient.ts";

vi.mock("../services/apiClient.ts", () => ({
  apiClient: {
    getState: vi.fn(),
    replaceState: vi.fn(),
  },
}));

const mockedApi = vi.mocked(apiClient);

const installLocalStorage = () => {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
    },
  });
  return store;
};

describe("useAppState", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    installLocalStorage();
  });

  it("hydrates from API and syncs collection updates", async () => {
    const remoteState = { ...createInitialState(), eventos: [] };
    mockedApi.getState.mockResolvedValue(remoteState);
    mockedApi.replaceState.mockResolvedValue(remoteState);

    const { result } = renderHook(() => useAppState());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.status).toBe("api");

    act(() => {
      result.current.setCollection("eventos", (items: unknown[]) => [
        ...items,
        { id: "evt", fecha: "2026-06-18", titulo: "Cena", categoria: "ocio", importe: 42 },
      ]);
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    });

    await waitFor(() => expect(mockedApi.replaceState).toHaveBeenCalled());
    expect(JSON.stringify(mockedApi.replaceState.mock.calls.at(-1)?.[0])).toContain("Cena");
  });

  it("falls back to local mode when API loading fails", async () => {
    mockedApi.getState.mockRejectedValue(new Error("offline"));
    mockedApi.replaceState.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useAppState());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.status).toBe("local");
  });
});
