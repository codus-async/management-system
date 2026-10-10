import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "warn";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

import { logger } from "./logger.js";

describe("lib/logger", () => {
  it("takes its level from the LOG_LEVEL environment variable", () => {
    expect(logger.level).toBe("warn");
  });

  it("tags every log line with the api service name", () => {
    expect(logger.bindings()).toMatchObject({ service: "api" });
  });

  it("stays quiet for levels below the configured threshold", () => {
    expect(logger.isLevelEnabled("info")).toBe(false);
    expect(logger.isLevelEnabled("error")).toBe(true);
  });
});
