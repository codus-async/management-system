import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

import { auth } from "./auth.js";

describe("lib/auth", () => {
  it("turns on the email and password sign in the seed accounts rely on", () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });

  it("wires accounts through the prisma adapter rather than an in memory store", () => {
    expect(typeof auth.options.database).toBe("function");
  });

  it("exposes the sign in and sign up handlers used by the routes and the seed", () => {
    expect(typeof auth.api.signInEmail).toBe("function");
    expect(typeof auth.api.signUpEmail).toBe("function");
    expect(typeof auth.api.getSession).toBe("function");
  });
});
