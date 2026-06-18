import "dotenv/config";

const nodeEnv = process.env.NODE_ENV || "development";
export const isProduction = nodeEnv === "production";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dataFile: process.env.DATA_FILE || "./data/state.json",
  usersFile: process.env.USERS_FILE || "./data/users.json",
  databaseUrl: process.env.DATABASE_URL || "",
  auth: {
    username: process.env.AUTH_USERNAME || "admin",
    password: process.env.AUTH_PASSWORD || (isProduction ? "" : "admin"),
    passwordHash: process.env.AUTH_PASSWORD_HASH || "",
    jwtSecret: process.env.AUTH_JWT_SECRET || (isProduction ? "" : "dev-secret-change-me"),
    cookieName: process.env.AUTH_COOKIE_NAME || "sofi_marqui_session",
    sessionTtlSeconds: Number(process.env.AUTH_SESSION_TTL_SECONDS || 60 * 60 * 24 * 7),
  },
};