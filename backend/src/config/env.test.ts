import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { env } from "./env.js";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "7001";
  process.env.LOG_LEVEL = "silent";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
const envEntry = fileURLToPath(new URL("./env.ts", import.meta.url));
const preflight = path.join(backendRoot, "node_modules", "tsx", "dist", "preflight.cjs");
const loader = path.join(backendRoot, "node_modules", "tsx", "dist", "loader.mjs");

const probe = `import(${JSON.stringify(envEntry)}).then((m) => console.log("PORT=" + m.env.PORT + " LOG_LEVEL=" + m.env.LOG_LEVEL + " NODE_ENV=" + m.env.NODE_ENV));`;

function runEnvModule(cwd: string, envToUse: NodeJS.ProcessEnv) {
  return spawnSync(
    process.execPath,
    ["--require", preflight, "--import", loader, "-e", probe],
    { cwd, encoding: "utf8", env: envToUse, timeout: 60_000 },
  );
}

describe("config/env", () => {
  it("exports every variable the apps depend on", () => {
    expect(env.DATABASE_URL).toBe("postgresql://user:password@localhost:5432/test");
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
    expect(env.BETTER_AUTH_SECRET).toHaveLength(40);
    expect(env.NODE_ENV).toBe("test");
    expect(env.LOG_LEVEL).toBe("silent");
  });

  it("reads PORT as a number so it can be handed to app.listen", () => {
    expect(env.PORT).toBe(7001);
    expect(typeof env.PORT).toBe("number");
  });

  it("falls back to the documented defaults when the optional variables are absent", { timeout: 60_000 }, () => {
    const cleanEnv = { ...process.env };
    delete cleanEnv.PORT;
    delete cleanEnv.LOG_LEVEL;
    delete cleanEnv.NODE_ENV;

    const emptyDir = mkdtempSync(path.join(tmpdir(), "env-defaults-"));
    try {
      const result = runEnvModule(emptyDir, cleanEnv);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("PORT=4000");
      expect(result.stdout).toContain("LOG_LEVEL=info");
      expect(result.stdout).toContain("NODE_ENV=development");
    } finally {
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it("exits with status 1 and names the variable when a required variable is missing", { timeout: 60_000 }, () => {
    const result = runEnvModule(backendRoot, { ...process.env, DATABASE_URL: "" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid environment variables:");
    expect(result.stderr).toContain("DATABASE_URL");
  });

  it("refuses a session secret that is too short to be safe", { timeout: 60_000 }, () => {
    const result = runEnvModule(backendRoot, { ...process.env, BETTER_AUTH_SECRET: "short" });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Invalid environment variables:");
    expect(result.stderr).toContain("BETTER_AUTH_SECRET");
  });
});
