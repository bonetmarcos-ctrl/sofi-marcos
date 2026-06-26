import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialState } from "@sofi-marqui/domain";
import App from "./App.tsx";
import { LanguageProvider } from "./i18n.tsx";

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
        json: async () => {
          if (String(url).endsWith("/api/auth/me")) return { user: { username: "tester", appName: "Tester App" } };
          if (String(url).endsWith("/api/state")) return createInitialState();
          return { ok: true };
        },
      })),
    );
  });

  it("renders the main application shell", async () => {
    render(<LanguageProvider><App /></LanguageProvider>);

    expect(await screen.findByRole("button", { name: /budget/i })).toBeInTheDocument();
    expect(screen.getByText("Tester App")).toBeInTheDocument();
  });
});