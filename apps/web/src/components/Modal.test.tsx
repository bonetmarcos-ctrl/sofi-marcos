import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Modal from "./Modal.tsx";

describe("Modal", () => {
  it("renders children and closes only from the overlay", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal onClose={onClose}>
        <button>Contenido</button>
      </Modal>,
    );

    fireEvent.click(screen.getByText("Contenido"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(container.firstElementChild as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
