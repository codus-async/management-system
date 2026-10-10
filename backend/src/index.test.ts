import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.LOG_LEVEL = "info";
  process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL = "http://localhost:3000";
});

const backendRoot = fileURLToPath(new URL("../", import.meta.url));
const tsxCli = path.join(backendRoot, "node_modules", "tsx", "dist", "cli.mjs");

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        server.close(() => reject(new Error("no port handed out")));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(
  check: () => boolean,
  timeoutMs: number,
  what: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`timed out waiting for ${what}`);
}

function boot(extraEnv: Record<string, string>) {
  const child = spawn(process.execPath, [tsxCli, "src/index.ts"], {
    cwd: backendRoot,
    env: { ...process.env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });
  return { child, read: () => ({ stdout, stderr }) };
}

describe("index (boot)", () => {
  it(
    "boots from source, logs the port it took, and answers api requests",
    { timeout: 60_000 },
    async () => {
      const port = await freePort();
      const { child, read } = boot({ PORT: String(port) });

      try {
        await waitFor(
          () =>
            read().stdout.includes('"msg":"api listening"') ||
            child.exitCode !== null,
          45_000,
          "the api listening log line",
        );

        expect(child.exitCode).toBeNull();
        expect(read().stdout).toContain(`"port":${port}`);

        const res = await fetch(`http://127.0.0.1:${port}/api/v1/nope`);
        expect(res.status).toBe(404);
      } finally {
        child.kill("SIGTERM");
        await once(child, "exit").catch(() => undefined);
      }
    },
  );

  it(
    "stops with a clear message when a required variable is missing",
    { timeout: 60_000 },
    async () => {
      const { child, read } = boot({ DATABASE_URL: "" });

      const [code] = await once(child, "exit");

      expect(code).toBe(1);
      expect(read().stderr).toContain("Invalid environment variables:");
      expect(read().stderr).toContain("DATABASE_URL");
    },
  );
});
