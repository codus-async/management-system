import { afterEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
  process.env.SEED_PA_EMAIL = "pa@example.com";
  process.env.SEED_CEO_EMAIL = "ceo@example.com";
  process.env.SEED_PASSWORD = "local-dev-password";
});

type SeedRun = Awaited<ReturnType<typeof runSeed>>;

async function runSeed(findUnique: ReturnType<typeof vi.fn>) {
  const signUpEmail = vi.fn().mockResolvedValue({});
  const disconnect = vi.fn().mockResolvedValue(undefined);

  vi.resetModules();
  vi.doMock("../src/lib/prisma.js", () => ({
    prisma: { user: { findUnique }, $disconnect: disconnect },
  }));
  vi.doMock("../src/lib/auth.js", () => ({ auth: { api: { signUpEmail } } }));

  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});

  await import("./seed.js");

  return {
    findUnique,
    signUpEmail,
    disconnect,
    logged: () => log.mock.calls.map((call) => String(call[0])).join("\n"),
    errored: () => error.mock.calls.map((call) => String(call[0])).join("\n"),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../src/lib/prisma.js");
  vi.doUnmock("../src/lib/auth.js");
  process.exitCode = undefined;
});

describe("prisma/seed", () => {
  it("skips accounts that already exist so running it twice is safe", async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: "user-1" });

    const run: SeedRun = await runSeed(findUnique);

    await vi.waitFor(() => expect(findUnique).toHaveBeenCalledTimes(2));
    expect(run.signUpEmail).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(run.logged()).toContain("exists  ceo@example.com"));
    expect(run.logged()).toContain("exists  pa@example.com");
    await vi.waitFor(() => expect(run.disconnect).toHaveBeenCalled());
  });

  it("creates both first accounts when the tables are empty", async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    const run: SeedRun = await runSeed(findUnique);

    await vi.waitFor(() => expect(run.signUpEmail).toHaveBeenCalledTimes(2));
    expect(run.signUpEmail.mock.calls[0]?.[0]).toEqual({
      body: {
        email: "pa@example.com",
        name: "Personal Assistant",
        password: "local-dev-password",
      },
    });
    expect(run.signUpEmail.mock.calls[1]?.[0]).toEqual({
      body: {
        email: "ceo@example.com",
        name: "Chief Executive",
        password: "local-dev-password",
      },
    });
    await vi.waitFor(() => expect(run.logged()).toContain("created pa@example.com"));
    expect(run.logged()).toContain("created ceo@example.com");
  });

  it("reports the failure and marks the run failed when the database is unreachable", async () => {
    const findUnique = vi.fn().mockRejectedValue(new Error("database unreachable"));

    const run: SeedRun = await runSeed(findUnique);

    await vi.waitFor(() => expect(run.errored()).toContain("database unreachable"));
    expect(process.exitCode).toBe(1);
    expect(run.signUpEmail).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(run.disconnect).toHaveBeenCalled());
  });
});
