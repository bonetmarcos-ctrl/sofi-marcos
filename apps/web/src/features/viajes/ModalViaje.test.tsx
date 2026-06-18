import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../i18n.tsx";
import ModalViaje from "./ModalViaje.tsx";

const renderWithI18n = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe("ModalViaje", () => {
  it("saves a trip with budget and expense breakdown", () => {
    const onSave = vi.fn();

    renderWithI18n(<ModalViaje viaje={undefined} onSave={onSave} onDelete={vi.fn()} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Rome, Paris..."), { target: { value: "Roma" } });
    fireEvent.change(screen.getByPlaceholderText("1000"), { target: { value: "900" } });
    fireEvent.change(screen.getAllByPlaceholderText("0")[0], { target: { value: "120" } });
    fireEvent.click(screen.getByRole("button", { name: "Save trip" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      nombre: "Roma",
      presupuesto: 900,
      gastos: expect.objectContaining({ vuelo: 120 }),
    }));
  });

  it("deletes existing trips", () => {
    const onDelete = vi.fn();

    renderWithI18n(
      <ModalViaje
        viaje={{ id: "trip-1", nombre: "Roma", inicio: "2026-07-01", fin: "2026-07-04", presupuesto: 900, gastos: {}, color: "#000", emoji: "✈️" }}
        onSave={vi.fn()}
        onDelete={onDelete}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith("trip-1");
  });
});
