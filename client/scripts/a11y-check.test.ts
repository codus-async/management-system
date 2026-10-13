import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "a11y-check.mjs",
);

describe("a11y gate", () => {
  it("exits with a clear message when the app is not running", () => {
    const result = spawnSync("node", [scriptPath], {
      encoding: "utf8",
      env: { ...process.env, BASE_URL: "http://127.0.0.1:1" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Could not reach");
    expect(result.stderr).toContain("npm run dev");
  }, 60_000);
});
