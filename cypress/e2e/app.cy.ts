describe("Sofi & Marqui", () => {
  beforeEach(() => {
    cy.login();
    cy.request("POST", "/api/state/reset");
    cy.request("POST", "/api/auth/logout");
  });

  it("requires login and opens the authenticated shell", () => {
    cy.visit("/");
    cy.window().then((window) => window.localStorage.setItem("sofi_marqui_language", "en"));
    cy.reload();

    cy.contains("label", "Username").find("input").type("admin");
    cy.contains("label", "Password").find("input").type("admin");
    cy.intercept("POST", "/api/auth/login").as("loginRequest");
    cy.intercept("GET", "/api/state").as("loadState");
    cy.get('button[type="submit"]').click();
    cy.wait("@loginRequest").its("response.statusCode").should("eq", 200);
    cy.wait("@loadState");

    cy.contains("button", /Today/).should("be.visible");
    cy.contains("button", /Resources/).should("be.visible");
    cy.contains("admin").should("be.visible");
  });

  it("navigates main sections after login", () => {
    cy.login();
    cy.visit("/");
    cy.window().then((window) => window.localStorage.setItem("sofi_marqui_language", "en"));
    cy.reload();

    cy.contains("button", /Time/).click();
    cy.contains(/Month|Week/).should("be.visible");

    cy.contains("button", /Projects/).click();
    cy.contains(/Total projects|Cards|Timeline/).should("be.visible");

    cy.contains("button", /Resources/).click();
    cy.contains(/Monthly summary|Income|Expenses/).should("be.visible");
  });

  it("creates an event and persists it through the API", () => {
    cy.login();
    cy.visit("/");
    cy.window().then((window) => window.localStorage.setItem("sofi_marqui_language", "en"));
    cy.reload();

    cy.contains("button", /Add event|Event/).click();
    cy.get('input[placeholder="What is it?"]').clear().type("Cena Cypress");
    cy.get('input[placeholder="0.00"]').clear().type("42");
    cy.intercept("PUT", "/api/state").as("saveState");
    cy.contains("button", "Save event").click();
    cy.wait("@saveState");

    cy.request("GET", "/api/state").its("body.eventos").should((eventos) => {
      expect(eventos).to.have.length.greaterThan(0);
      expect(eventos.some((evento: { titulo: string; importe: number }) => evento.titulo === "Cena Cypress" && evento.importe === 42)).to.equal(true);
    });
  });
});
