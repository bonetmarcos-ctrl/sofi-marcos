import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../i18n.tsx";
import ModalEvento from "./ModalEvento.tsx";

const renderWithI18n = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe("ModalEvento", () => {
  it("saves a manual expense event", () => {
    const onSave = vi.fn();

    renderWithI18n(<ModalEvento fechaInicial="2026-06-18" evento={undefined} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("What is it?"), { target: { value: "Cena" } });
    fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: "42" } });
    fireEvent.click(screen.getByRole("button", { name: "Save event" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      fecha: "2026-06-18",
      titulo: "Cena",
      categoria: "ocio",
      importe: 42,
    }));
  });

  it("deletes edited events after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDelete = vi.fn();

    renderWithI18n(
      <ModalEvento
        fechaInicial={undefined}
        evento={{ id: "evt-1", fecha: "2026-06-18", titulo: "Cena", categoria: "ocio", importe: 42 }}
        onSave={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Delete/ }));

    expect(onDelete).toHaveBeenCalledWith("evt-1");
  });
});
