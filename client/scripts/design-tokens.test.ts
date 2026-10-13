import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptsDir, "..");
const scriptPath = resolve(scriptsDir, "design-tokens.mjs");

type CheckResult = { status: number | null; stdout: string; stderr: string };

function runCheck(script: string): CheckResult {
  const result = spawnSync("node", [script, "--check"], {
    cwd: clientRoot,
    encoding: "utf8",
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

const fixtureRoots: string[] = [];

function createFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "design-tokens-test-"));
  fixtureRoots.push(root);
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "app"));
  copyFileSync(scriptPath, join(root, "scripts/design-tokens.mjs"));
  copyFileSync(
    join(clientRoot, "app/globals.css"),
    join(root, "app/globals.css"),
  );
  copyFileSync(join(clientRoot, "design.md"), join(root, "design.md"));
  return root;
}

afterAll(() => {
  for (const root of fixtureRoots) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("design:check gate", () => {
  // covers: AC-1, AC-9
  it("passes on the current tokens and design doc", () => {
    const { status, stdout, stderr } = runCheck(scriptPath);
    expect(status).toBe(0);
    expect(stdout).toContain(
      "All contrast pairs pass and design.md matches globals.css.",
    );
    expect(stderr).not.toContain("FAIL");
  });

  // covers: AC-11, AC-12, AC-14
  it("asserts the surface ladder, the emphasis trio, and the warm neutrals", () => {
    const { stdout } = runCheck(scriptPath);
    expect(stdout).toContain(
      "surface ladder ascends background < sidebar < card < popover",
    );
    expect(stdout).toContain(
      "secondary, muted, and accent are three distinct values",
    );
    expect(stdout).toContain(
      "every neutral carries chroma above zero at hue 80 to 115",
    );
    expect(stdout).not.toContain("FAIL");
  });

  // covers: AC-9
  it("fails when a foreground token drops below its contrast bar", () => {
    const root = createFixture();
    const cssPath = join(root, "app/globals.css");
    const css = readFileSync(cssPath, "utf8");
    const background = css.match(/--background:\s*([^;]+);/)?.[1];
    expect(background).toBeTruthy();
    const mutated = css.replace(
      /--foreground:\s*[^;]+;/,
      `--foreground: ${background};`,
    );
    expect(mutated).not.toBe(css);
    writeFileSync(cssPath, mutated);

    const { status, stderr } = runCheck(
      join(root, "scripts/design-tokens.mjs"),
    );
    expect(status).toBe(1);
    expect(stderr).toContain("below the bar");
  });

  // covers: AC-1
  it("fails when design.md drifts from globals.css", () => {
    const root = createFixture();
    const designPath = join(root, "design.md");
    const design = readFileSync(designPath, "utf8");
    const drifted = design.replace("## Color tokens", "## Color tokens stale");
    expect(drifted).not.toBe(design);
    writeFileSync(designPath, drifted);

    const { status, stderr } = runCheck(
      join(root, "scripts/design-tokens.mjs"),
    );
    expect(status).toBe(1);
    expect(stderr).toContain("out of date");
  });
});
