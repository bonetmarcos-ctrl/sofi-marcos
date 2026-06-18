Cypress.Commands.add("login", () => {
  cy.request("POST", "/api/auth/login", { username: "admin", password: "admin" });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
    }
  }
}

export {};
