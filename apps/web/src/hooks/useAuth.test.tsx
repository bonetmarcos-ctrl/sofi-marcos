import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth.ts";
import { apiClient } from "../services/apiClient.ts";

vi.mock("../services/apiClient.ts", () => ({
  apiClient: {
    getSession: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedApi = vi.mocked(apiClient);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates an existing session", async () => {
    mockedApi.getSession.mockResolvedValue({ user: { username: "tester" } });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ username: "tester" });
  });

  it("logs in and logs out", async () => {
    mockedApi.getSession.mockRejectedValue(new Error("No session"));
    mockedApi.login.mockResolvedValue({ user: { username: "admin" } });
    mockedApi.logout.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login({ username: "admin", password: "secret" });
    });

    expect(result.current.user).toEqual({ username: "admin" });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it("registers and stores the created session", async () => {
    mockedApi.getSession.mockRejectedValue(new Error("No session"));
    mockedApi.register.mockResolvedValue({ user: { username: "nueva" } });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({ username: "nueva", password: "secret123" });
    });

    expect(result.current.user).toEqual({ username: "nueva" });
  });

  it("keeps login errors in state", async () => {
    mockedApi.getSession.mockRejectedValue(new Error("No session"));
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setLoginError("Credenciales invalidas"));

    expect(result.current.error).toBe("Credenciales invalidas");
  });
});
