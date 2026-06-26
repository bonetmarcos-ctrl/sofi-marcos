import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../i18n.tsx";
import { Login } from "./Login.tsx";

const renderLogin = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);
const submitButton = () => screen.getAllByRole("button", { name: "Login" }).at(-1)!;
const registerSubmitButton = () => screen.getAllByRole("button", { name: "Create account" }).at(-1)!;

describe("Login", () => {
  it("submits trimmed credentials", async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    renderLogin(<Login loading={false} error="" onLogin={onLogin} onRegister={vi.fn()} onError={onError} />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "  admin  " } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ username: "admin", password: "secret" }));
    expect(onError).not.toHaveBeenCalled();
  });

  it("shows login errors and disables controls while loading", () => {
    renderLogin(<Login loading error="Credenciales invalidas" onLogin={vi.fn()} onRegister={vi.fn()} onError={vi.fn()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Credenciales invalidas");
    expect(screen.getByLabelText("Username")).toBeDisabled();
    expect(submitButton()).toBeDisabled();
  });

  it("reports submit failures", async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error("No entra"));
    const onError = vi.fn();

    renderLogin(<Login loading={false} error="" onLogin={onLogin} onRegister={vi.fn()} onError={onError} />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "bad" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(onError).toHaveBeenCalledWith("No entra"));
  });

  it("submits registration credentials", async () => {
    const onLogin = vi.fn();
    const onRegister = vi.fn().mockResolvedValue(undefined);
    const onError = vi.fn();

    renderLogin(<Login loading={false} error="" onLogin={onLogin} onRegister={onRegister} onError={onError} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Create account" })[0]);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "  nueva  " } });
    fireEvent.change(screen.getByLabelText("Application name"), { target: { value: "Sofi y Marcos" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(registerSubmitButton());

    await waitFor(() => expect(onRegister).toHaveBeenCalledWith({ username: "nueva", password: "secret123", appName: "Sofi y Marcos" }));
    expect(onLogin).not.toHaveBeenCalled();
  });
});
