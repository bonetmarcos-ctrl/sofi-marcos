import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthService } from "./application/authService.js";
import { AppStateService } from "./application/appStateService.js";
import { env, isProduction } from "./config/env.js";
import { createAuthRouter } from "./interfaces/http/authRouter.js";
import { createRequireAuth } from "./interfaces/http/authMiddleware.js";
import { errorMiddleware, notFoundMiddleware } from "./interfaces/http/errorMiddleware.js";
import { createStateRouter } from "./interfaces/http/stateRouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDistPath = path.resolve(__dirname, "../../web/dist");

export const createApp = ({ repository, userRepository, authConfig = env.auth }) => {
  const app = express();
  const stateService = new AppStateService(repository);
  const authService = new AuthService(authConfig, userRepository);

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(cors({ origin: isProduction ? false : env.corsOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  if (!isProduction) {
    app.use(morgan("dev"));
  }

  app.use("/api/auth", createAuthRouter(authService, stateService));
  app.use("/api", createStateRouter(stateService, createRequireAuth(authService)));

  if (isProduction) {
    app.use(express.static(webDistPath, { maxAge: "1h", index: false }));
    app.get("*", (_request, response) => {
      response.sendFile(path.join(webDistPath, "index.html"));
    });
  } else {
    app.get("/", (_request, response) => {
      response.json({ ok: true, api: "/api/health" });
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};