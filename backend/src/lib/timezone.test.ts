import { afterEach, describe, expect, it, vi } from "vitest";
import { env } from "../config/env.js";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

async function helperFor(timezone: string) {
  vi.resetModules();
  vi.stubEnv("TIMEZONE", timezone);
  const helper = await import("./timezone.js");
  vi.unstubAllEnvs();
  return helper;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("lib/timezone", () => {
  it("falls back to UTC when TIMEZONE is unset", () => {
    expect(env.TIMEZONE).toBe("UTC");
  });

  it("returns the local midnight and last millisecond of the instant's day", async () => {
    const { startOfDay, endOfDay } = await helperFor("UTC");

    expect(startOfDay(new Date("2026-06-15T13:45:00.000Z")).toISOString()).toBe(
      "2026-06-15T00:00:00.000Z",
    );
    expect(endOfDay(new Date("2026-06-15T13:45:00.000Z")).toISOString()).toBe(
      "2026-06-15T23:59:59.999Z",
    );
  });

  it("reads the calendar day in Africa/Lagos even when the UTC day differs", async () => {
    const { startOfDay, endOfDay } = await helperFor("Africa/Lagos");
    const instant = new Date("2026-03-09T23:30:00.000Z");

    expect(startOfDay(instant).toISOString()).toBe("2026-03-10T00:00:00.000Z");
    expect(endOfDay(instant).toISOString()).toBe("2026-03-10T23:59:59.999Z");
  });

  it("follows daylight saving in America/New_York", async () => {
    const { startOfDay } = await helperFor("America/New_York");

    expect(startOfDay(new Date("2026-07-01T04:00:00.000Z")).toISOString()).toBe(
      "2026-07-01T00:00:00.000Z",
    );
    expect(startOfDay(new Date("2026-01-01T06:00:00.000Z")).toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });

  it("handles a zone ahead of UTC where the local day starts the day before", async () => {
    const { startOfDay } = await helperFor("Pacific/Kiritimati");
    const instant = new Date("2025-12-31T23:00:00.000Z");

    expect(startOfDay(instant).toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("uses the current instant when no argument is passed", async () => {
    const { startOfDay, endOfDay } = await helperFor("Africa/Lagos");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T23:30:00.000Z"));

    try {
      expect(startOfDay().toISOString()).toBe("2026-03-10T00:00:00.000Z");
      expect(endOfDay().toISOString()).toBe("2026-03-10T23:59:59.999Z");
    } finally {
      vi.useRealTimers();
    }
  });
});
