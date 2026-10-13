#!/usr/bin/env node

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const TAGS = ["wcag2a", "wcag2aa", "wcag22a", "wcag22aa"];
const BLOCKING = new Set(["serious", "critical"]);

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
];

const THEMES = [
  { name: "light", colorScheme: "light" },
  { name: "dark", colorScheme: "dark" },
];

function describe(violation) {
  const targets = violation.nodes
    .slice(0, 4)
    .map((node) => node.target.join(" "));
  const more =
    violation.nodes.length > 4 ? ` (+${violation.nodes.length - 4} more)` : "";
  return `${violation.id}: ${violation.help} [${targets.join(", ")}${more}]`;
}

async function main() {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const failures = [];
  let total = 0;

  for (const { name: viewportName, viewport } of VIEWPORTS) {
    for (const { name: themeName, colorScheme } of THEMES) {
      const context = await browser.newContext({ viewport, colorScheme });
      const page = await context.newPage();
      try {
        await page.goto(BASE_URL, { waitUntil: "networkidle" });
      } catch {
        console.error(
          `Could not reach ${BASE_URL}. Start the app first: npm run dev (or npm run build && npm run start).`,
        );
        await browser.close();
        process.exit(1);
      }

      // Open the mobile drawer so its contents are checked too.
      if (viewportName === "mobile") {
        await page.locator("[data-slot='sidebar-trigger']").click();
        await page.waitForTimeout(400);
      }

      const results = await new AxeBuilder({ page })
        .withTags(TAGS)
        .exclude("#nextjs-portal")
        .analyze();

      total += results.violations.length;
      const label = `${viewportName}/${themeName}`;
      if (results.violations.length === 0) {
        console.log(`ok   ${label}: no violations`);
      } else {
        for (const violation of results.violations) {
          const line = `${label} ${describe(violation)}`;
          if (BLOCKING.has(violation.impact)) {
            failures.push(line);
            console.log(`FAIL ${line}`);
          } else {
            console.log(`warn ${line}`);
          }
        }
      }
      await context.close();
    }
  }

  await browser.close();

  if (failures.length > 0) {
    console.error(`\n${failures.length} blocking accessibility violation(s).`);
    process.exit(1);
  }
  console.log(
    `\nChecked ${VIEWPORTS.length * THEMES.length} page states, ${total} violation(s) total.`,
  );
}

main();
