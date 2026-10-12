import { toNodeHandler } from "better-auth/node";
import express, { type ErrorRequestHandler } from "express";
import { pinoHttp } from "pino-http";
import { auth } from "./lib/auth.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.js";

function statusOf(err: unknown): number {
  const code =
    (err as { status?: unknown }).status ??
    (err as { statusCode?: unknown }).statusCode;
  return typeof code === "number" && code >= 400 && code < 600 ? code : 500;
}

function messageOf(err: unknown, status: number): string {
  if (status < 500 && err instanceof Error && err.message) return err.message;
  return status < 500 ? "Bad request" : "Internal server error";
}

// catches anything a route lets out: db outages, bugs, bad json.
// without it express falls back to an html body with a stack trace.
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  const status = statusOf(err);
  if (status >= 500) logger.error({ err }, "request failed");
  res.status(status).json({ error: messageOf(err, status) });
};

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

  app.use(errorHandler);

  return app;
}
