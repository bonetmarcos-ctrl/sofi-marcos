import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { DEFAULT_APP_NAME } from "@sofi-marqui/domain";
import { AuthService, type AuthConfig } from "./authService.js";
import { MemoryUserRepository } from "../infrastructure/memoryUserRepository.js";

const baseConfig: AuthConfig = {
  username: "tester",
  password: "secret",
  passwordHash: "",
  jwtSecret: "unit-secret",
  cookieName: "unit_session",
  cookieSecure: false,
  sessionTtlSeconds: 60,
};

describe("AuthService", () => {
  it("creates and verifies sessions for valid credentials", async () => {
    const service = new AuthService(baseConfig);

    const session = await service.login({ username: "tester", password: "secret" });

    expect(session.user).toEqual({ username: "tester", appName: DEFAULT_APP_NAME });
    expect(service.verifyToken(session.token)).toEqual({ username: "tester", appName: DEFAULT_APP_NAME });
  });

  it("rejects invalid credentials and invalid tokens", async () => {
    const service = new AuthService(baseConfig);

    await expect(service.login({ username: "tester", password: "bad" })).rejects.toMatchObject({ statusCode: 401 });
    expect(service.verifyToken("not-a-token")).toBeNull();
  });

  it("supports bcrypt password hashes", async () => {
    const passwordHash = await bcrypt.hash("hashed-secret", 4);
    const service = new AuthService({ ...baseConfig, password: "", passwordHash });

    await expect(service.login({ username: "tester", password: "hashed-secret" })).resolves.toHaveProperty("token");
  });

  it("registers users and authenticates them with persisted hashes", async () => {
    const users = new MemoryUserRepository();
    const service = new AuthService(baseConfig, users);

    const session = await service.register({ username: "  Nueva  ", password: "secret123", appName: "Casa Nueva" });
    const storedUser = await users.findByUsername("nueva");

    expect(session.user).toEqual({ username: "nueva", appName: "Casa Nueva" });
    expect(storedUser?.appName).toBe("Casa Nueva");
    expect(storedUser?.passwordHash).not.toBe("secret123");
    await expect(service.login({ username: "nueva", password: "secret123" })).resolves.toHaveProperty("token");
  });

  it("rejects duplicate or weak registrations", async () => {
    const service = new AuthService(baseConfig, new MemoryUserRepository());

    await expect(service.register({ username: "tester", password: "secret123" })).rejects.toMatchObject({ statusCode: 409 });
    await expect(service.register({ username: "ab", password: "secret123" })).rejects.toMatchObject({ statusCode: 422 });
    await expect(service.register({ username: "valid", password: "123" })).rejects.toMatchObject({ statusCode: 422 });
  });

  it("reports missing production auth configuration", async () => {
    const service = new AuthService({ ...baseConfig, password: "", passwordHash: "", jwtSecret: "" });

    expect(service.isConfigured).toBe(false);
    await expect(service.login({ username: "tester", password: "secret" })).rejects.toMatchObject({ statusCode: 503 });
  });
});
