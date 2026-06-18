import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { HttpError } from "./types.js";

export type AuthConfig = {
  username: string;
  password: string;
  passwordHash: string;
  jwtSecret: string;
  cookieName: string;
  sessionTtlSeconds: number;
};

export type SessionUser = {
  username: string;
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

  constructor(config: AuthConfig) {
    this.config = config;
  }

  get cookieName() {
    return this.config.cookieName;
  }

  get sessionTtlSeconds() {
    return this.config.sessionTtlSeconds;
  }

  get isConfigured() {
    return Boolean(
      this.config.username &&
        this.config.jwtSecret &&
        (this.config.password || this.config.passwordHash),
    );
  }

  async login({ username, password }: { username?: string; password?: string }) {
    if (!this.isConfigured) {
      throw createHttpError(503, "Authentication is not configured");
    }

    const validUsername = safeCompare(username, this.config.username);
    const validPassword = await this.verifyPassword(password);

    if (!validUsername || !validPassword) {
      throw createHttpError(401, "Invalid username or password");
    }

    return {
      token: jwt.sign({ sub: this.config.username }, this.config.jwtSecret, {
        expiresIn: this.sessionTtlSeconds,
      }),
      user: this.createSessionUser(),
    };
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
      if (typeof payload === "string" || payload.sub !== this.config.username) return null;
      return this.createSessionUser();
    } catch {
      return null;
    }
  }

  createSessionUser(): SessionUser {
    return { username: this.config.username };
  }
}