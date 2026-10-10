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

type SeedUser = { id: string; email: string; name: string; role: string };

function userStore() {
  const users: SeedUser[] = [];
  let next = 0;
  const findFirst = vi.fn(async ({ where }: { where: { role: string } }) => {
    return users.find((user) => user.role === where.role) ?? null;
  });
  const findUnique = vi.fn(async ({ where }: { where: { email: string } }) => {
    return users.find((user) => user.email === where.email) ?? null;
  });
  const update = vi.fn(
    async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<SeedUser>;
    }) => {
      const user = users.find((candidate) => candidate.id === where.id);
      if (user) Object.assign(user, data);
      return user;
    },
  );
  const signUpEmail = vi.fn(
    async ({
      body,
    }: {
      body: { email: string; name: string; password: string };
    }) => {
      next += 1;
      const user: SeedUser = {
        id: `user-${next}`,
        email: body.email,
        name: body.name,
        role: "PA",
      };
      users.push(user);
      return { token: `token-${next}`, user };
    },
  );
  const $disconnect = vi.fn(async () => {});
  return { users, findFirst, findUnique, update, signUpEmail, $disconnect };
}

type Store = ReturnType<typeof userStore>;

async function runSeed(store: Store) {
  vi.resetModules();
  vi.doMock("../src/lib/prisma.js", () => ({
    prisma: {
      user: {
        findFirst: store.findFirst,
        findUnique: store.findUnique,
        update: store.update,
      },
      $disconnect: store.$disconnect,
    },
  }));
  vi.doMock("../src/lib/auth.js", () => ({
    auth: { api: { signUpEmail: store.signUpEmail } },
  }));

  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const disconnects = store.$disconnect.mock.calls.length;

  await import("./seed.js");
  await vi.waitFor(() =>
    expect(store.$disconnect.mock.calls.length).toBe(disconnects + 1),
  );

  return {
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
  it("creates one PA and one CEO on an empty database", async () => {
    const store = userStore();

    const run = await runSeed(store);

    expect(store.users.map((user) => user.role).sort()).toEqual(["CEO", "PA"]);
    expect(store.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { role: "CEO" },
    });
    expect(run.logged()).toContain("created PA pa@example.com");
    expect(run.logged()).toContain("created CEO ceo@example.com");
  });

  it("stays idempotent so a second run creates nobody new", async () => {
    const store = userStore();
    await runSeed(store);
    const created = store.signUpEmail.mock.calls.length;

    const run = await runSeed(store);

    expect(store.signUpEmail.mock.calls.length).toBe(created);
    expect(store.users).toHaveLength(2);
    expect(store.users.map((user) => user.role).sort()).toEqual(["CEO", "PA"]);
    expect(run.logged()).toContain("exists  PA pa@example.com");
    expect(run.logged()).toContain("exists  CEO ceo@example.com");
  });

  it("repairs a user found by email that does not hold the role yet", async () => {
    const store = userStore();
    store.users.push({
      id: "legacy-pa",
      email: "pa@example.com",
      name: "Legacy PA",
      role: "PA",
    });
    store.users.push({
      id: "legacy-ceo",
      email: "ceo@example.com",
      name: "Legacy CEO",
      role: "",
    });

    const run = await runSeed(store);

    expect(
      store.users.find((user) => user.email === "ceo@example.com")?.role,
    ).toBe("CEO");
    expect(store.signUpEmail).not.toHaveBeenCalled();
    expect(run.logged()).toContain("repaired ceo@example.com role -> CEO");
  });

  it("keeps looking by email when no row holds the role", async () => {
    const store = userStore();
    store.users.push({
      id: "legacy-1",
      email: "pa@example.com",
      name: "Legacy",
      role: "PA",
    });
    store.users.push({
      id: "legacy-2",
      email: "ceo@example.com",
      name: "Legacy CEO",
      role: "PA",
    });

    await runSeed(store);

    expect(store.users).toHaveLength(2);
    expect(store.users.map((user) => user.role).sort()).toEqual(["CEO", "PA"]);
    expect(store.signUpEmail).not.toHaveBeenCalled();
  });

  it("reports the failure and marks the run failed when the database is unreachable", async () => {
    const store = userStore();
    store.findFirst.mockRejectedValue(new Error("database unreachable"));

    const run = await runSeed(store);

    await vi.waitFor(() =>
      expect(run.errored()).toContain("database unreachable"),
    );
    expect(process.exitCode).toBe(1);
    expect(store.signUpEmail).not.toHaveBeenCalled();
  });
});
