import request from "supertest";
import { describe, expect, it, vi } from "vitest";

// development mode: better-auth switches its origin check off under NODE_ENV=test
// and switches rate limiting on under NODE_ENV=production
vi.hoisted(() => {
  process.env.NODE_ENV = "development";
  delete process.env.TEST;
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

vi.mock("./lib/prisma.js", () => {
  const existingUser = {
    id: "user-1",
    name: "Personal Assistant",
    email: "pa@example.com",
    emailVerified: false,
    image: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  const findUserByEmail = async ({
    where,
  }: {
    where?: { email?: unknown };
  }) => {
    const raw = where?.email;
    const email =
      typeof raw === "object" && raw !== null
        ? (raw as { equals?: string }).equals
        : raw;
    if (email === "db-down@example.com") {
      throw new Error("database unreachable");
    }
    return email === "pa@example.com" ? existingUser : null;
  };
  return {
    prisma: {
      $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
      user: {
        findUnique: vi.fn(findUserByEmail),
        findFirst: vi.fn(findUserByEmail),
        findMany: vi.fn().mockResolvedValue([]),
      },
      account: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  };
});

import { createApp } from "./app.js";

const app = createApp();

const trustedOrigin = { Origin: "http://localhost:3000" };

describe("app", () => {
  it("serves the health probe at the path the web app proxies to", async () => {
    // covers AC-1: the api answers on the proxy path
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "up" });
  });

  it("answers unknown v1 routes with 404 json", async () => {
    const res = await request(app).get("/api/v1/meetings");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("answers unknown api paths with 404 json so nothing falls through", async () => {
    // covers AC-2: api paths stay with the api, the web app never sees them
    const res = await request(app).get("/api/nope");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("serves no web pages, only the api", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(404);
    expect(res.text).not.toContain("Create Next App");
  });

  it("sends no permissive cross origin headers on api responses", async () => {
    const res = await request(app).get("/api/v1/health");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
    expect(res.headers["access-control-allow-methods"]).toBeUndefined();
  });

  it("trusts the first proxy hop so the forwarded protocol is honoured", () => {
    expect(app.get("trust proxy")).toBe(1);
  });

  it("issues no session cookie when the request carries no credentials", async () => {
    const res = await request(app).get("/api/auth/get-session");

    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("better-auth.session_token");
    expect(JSON.stringify(res.body)).not.toContain('"password"');
  });

  it("refuses a sign in from an origin other than the web app", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", "http://evil.example")
      .send({ email: "pa@example.com", password: "local-dev-password" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("INVALID_ORIGIN");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("gives no session to an account that does not exist", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .set(trustedOrigin)
      .send({ email: "nobody@example.com", password: "local-dev-password" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("answers the same for a known and an unknown account so emails cannot be probed", async () => {
    const unknown = await request(app)
      .post("/api/auth/sign-in/email")
      .set(trustedOrigin)
      .send({ email: "nobody@example.com", password: "local-dev-password" });
    const knownWithoutCredentials = await request(app)
      .post("/api/auth/sign-in/email")
      .set(trustedOrigin)
      .send({ email: "pa@example.com", password: "local-dev-password" });

    expect(knownWithoutCredentials.status).toBe(unknown.status);
    expect(knownWithoutCredentials.body).toEqual(unknown.body);
  });

  it("answers a broken database with a json error body instead of an empty 500", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in/email")
      .set(trustedOrigin)
      .send({ email: "db-down@example.com", password: "local-dev-password" });

    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toContain("application/json");
    expect(res.body).toEqual({ error: "Internal server error" });
  });

  it("rejects malformed json bodies without taking the server down", async () => {
    const res = await request(app)
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{ not json");

    expect(res.status).toBe(400);

    const after = await request(app).get("/api/v1/health");
    expect(after.status).toBe(200);
  });
});
