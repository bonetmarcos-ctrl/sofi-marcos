import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@sofi-marqui/domain";
import App from "./App.jsx";

describe("App", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url) => ({
        ok: true,
        json: async () => (String(url).endsWith("/api/state") ? createInitialState() : { ok: true }),
      })),
    );
  });

  it("renders the main application shell", async () => {
    render(<App />);

    expect(await screen.findByText("Sofi & Marqui")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /presupuesto/i })).toBeInTheDocument();
  });
});