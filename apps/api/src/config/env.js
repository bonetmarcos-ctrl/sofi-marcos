import "dotenv/config";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dataFile: process.env.DATA_FILE || "./data/state.json",
  databaseUrl: process.env.DATABASE_URL || "",
};

export const isProduction = env.nodeEnv === "production";