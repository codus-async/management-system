import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

vi.mock("../lib/prisma.js", () => ({
  prisma: { $queryRaw: vi.fn() },
}));

import { prisma } from "../lib/prisma.js";
import { healthRouter } from "./health.js";

const queryRaw = prisma.$queryRaw as unknown as ReturnType<typeof vi.fn>;

const app = express();
app.use("/api/v1", healthRouter);

beforeEach(() => {
  queryRaw.mockReset();
});

describe("routes/health", () => {
  it("answers 200 ok when the database answers the probe", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("answers 503 degraded when the database probe fails", async () => {
    queryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: "degraded", database: "down" });
  });

  it("never leaks the database error text to the caller", async () => {
    queryRaw.mockRejectedValue(new Error("password authentication failed for user neondb"));

    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(503);
    expect(res.text).not.toContain("password");
    expect(res.text).not.toContain("neondb");
  });

  it("does not answer any other method on the probe path", async () => {
    queryRaw.mockResolvedValue([]);

    const res = await request(app).post("/api/v1/health");

    expect(res.status).toBe(404);
    expect(queryRaw).not.toHaveBeenCalled();
  });
});
