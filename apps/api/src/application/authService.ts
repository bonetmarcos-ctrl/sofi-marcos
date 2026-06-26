import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { DEFAULT_APP_NAME, normalizeAppName } from "@sofi-marqui/domain";
import type { HttpError, UserRepository } from "./types.js";

export type AuthConfig = {
  username: string;
  password: string;
  passwordHash: string;
  jwtSecret: string;
  cookieName: string;
  cookieSecure: boolean;
  sessionTtlSeconds: number;
};

export type RegisterCredentials = {
  username?: string;
  password?: string;
  appName?: string;
};

export type SessionUser = {
  username: string;
  appName: string;
};

const createHttpError = (statusCode: number, message: string) => {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
};

const safeCompare = (left = "", right = "") => {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export class AuthService {
  private readonly config: AuthConfig;
  private readonly users?: UserRepository;

  constructor(config: AuthConfig, users?: UserRepository) {
    this.config = config;
    this.users = users;
  }

  get cookieName() {
    return this.config.cookieName;
  }

  get cookieSecure() {
    return this.config.cookieSecure;
  }

  get sessionTtlSeconds() {
    return this.config.sessionTtlSeconds;
  }

  get isConfigured() {
    return Boolean(this.config.jwtSecret && (this.users || (this.config.username && (this.config.password || this.config.passwordHash))));
  }

  async login({ username, password }: { username?: string; password?: string }) {
    if (!this.isConfigured) {
      throw createHttpError(503, "Authentication is not configured");
    }

    const normalizedUsername = this.normalizeUsername(username);
    const registeredUser = this.users ? await this.users.findByUsername(normalizedUsername) : null;
    const validRegisteredPassword = registeredUser ? await bcrypt.compare(password || "", registeredUser.passwordHash) : false;
    const validUsername = safeCompare(normalizedUsername, this.config.username);
    const validPassword = await this.verifyPassword(password);

    if (!validRegisteredPassword && (!validUsername || !validPassword)) {
      throw createHttpError(401, "Invalid username or password");
    }

    const sessionUsername = registeredUser?.username || this.config.username;
    const appName = normalizeAppName(registeredUser?.appName || DEFAULT_APP_NAME);

    return this.createSession(sessionUsername, appName);
  }

  async register({ username, password, appName }: RegisterCredentials) {
    if (!this.isConfigured || !this.users) {
      throw createHttpError(503, "Registration is not configured");
    }

    const normalizedUsername = this.normalizeUsername(username);
    if (normalizedUsername.length < 3) {
      throw createHttpError(422, "Username must have at least 3 characters");
    }
    if (!password || password.length < 6) {
      throw createHttpError(422, "Password must have at least 6 characters");
    }

    const reservedConfiguredUser = safeCompare(normalizedUsername, this.config.username);
    const existingUser = await this.users.findByUsername(normalizedUsername);
    if (reservedConfiguredUser || existingUser) {
      throw createHttpError(409, "Username is already registered");
    }

    const user = await this.users.create({
      username: normalizedUsername,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
      appName: normalizeAppName(appName),
    });

    return this.createSession(user.username, user.appName);
  }

  async verifyPassword(password = "") {
    if (this.config.passwordHash) {
      return bcrypt.compare(password || "", this.config.passwordHash);
    }

    return safeCompare(password, this.config.password);
  }

  verifyToken(token?: string): SessionUser | null {
    if (!this.isConfigured || !token) return null;

    try {
      const payload = jwt.verify(token, this.config.jwtSecret);
      if (typeof payload === "string" || typeof payload.sub !== "string") return null;
      const appName = typeof payload.appName === "string" ? payload.appName : DEFAULT_APP_NAME;
      return this.createSessionUser(payload.sub, appName);
    } catch {
      return null;
    }
  }

  normalizeUsername(username = "") {
    return username.trim().toLowerCase();
  }

  createSessionUser(username = this.config.username, appName = DEFAULT_APP_NAME): SessionUser {
    return { username, appName: normalizeAppName(appName) };
  }

  private createSession(username: string, appName = DEFAULT_APP_NAME) {
    const user = this.createSessionUser(username, appName);

    return {
      token: jwt.sign({ sub: user.username, appName: user.appName }, this.config.jwtSecret, {
        expiresIn: this.sessionTtlSeconds,
      }),
      user,
    };
  }
}