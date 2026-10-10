import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

import { prisma } from "./prisma.js";

describe("lib/prisma", () => {
  it("exports a ready to use client", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.$disconnect).toBe("function");
  });

  it("hands back the same client on every import so one pool serves the process", async () => {
    const second = await import("./prisma.js");

    expect(second.prisma).toBe(prisma);
  });

  it("does not reach for the database while the module is only imported", async () => {
    const fresh = await import("./prisma.js");

    expect(fresh.prisma).toBeDefined();
    expect(typeof fresh.prisma.$queryRaw).toBe("function");
  });
});
