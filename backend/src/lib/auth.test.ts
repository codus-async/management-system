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

describe("lib/auth role configuration (AC-4)", () => {
  it("keeps role out of sign up input so a request cannot grant itself CEO", () => {
    const role = auth.options.user?.additionalFields?.role;

    expect(role?.input).toBe(false);
  });

  it("types role as a string and defaults a new user to PA", () => {
    const role = auth.options.user?.additionalFields?.role;

    expect(role?.type).toBe("string");
    expect(role?.defaultValue).toBe("PA");
  });

  it("leaves email and password sign up enabled, which the seed depends on", () => {
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });
});
