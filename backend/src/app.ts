import { toNodeHandler } from "better-auth/node";
import express from "express";
import { pinoHttp } from "pino-http";
import { auth } from "./lib/auth.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.all("/api/auth/{*splat}", toNodeHandler(auth));
  app.use("/api/v1", healthRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}
