#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = resolve(clientRoot, "app/globals.css");
const designPath = resolve(clientRoot, "design.md");

const START = "<!-- tokens:start -->";
const END = "<!-- tokens:end -->";

const TEXT_MIN = 4.5;
const UI_MIN = 3;
// Decorative and structural borders (card edges, dividers, section rules) are
// not interactive component boundaries, so WCAG 1.4.11 does not constrain them.
// This floor only confirms the hairline is present and visible, not that it
// meets the interactive bar. --input, --ring, and --sidebar-border do not get
// this allowance; they stay at UI_MIN.
const DECOR_MIN = 1.15;

function parseBlock(css, selector) {
  const re = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{`,
  );
  const match = re.exec(css);
  if (!match) throw new Error(`Missing ${selector} in globals.css`);
  const open = css.indexOf("{", match.index);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  return css.slice(open + 1, end);
}

function parseVars(block) {
  const vars = {};
  for (const match of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    vars[match[1]] = match[2].trim();
  }
  return vars;
}

function parseOkLch(value) {
  const m = value.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)%\s*)?\)/,
  );
  if (!m) return null;
  return {
    l: Number(m[1]),
    c: Number(m[2]),
    h: Number(m[3]),
    alpha: m[4] === undefined ? 1 : Number(m[4]) / 100,
  };
}

function clamp(x) {
  return Math.min(1, Math.max(0, x));
}

function oklchToLinearSrgb(l, c, hDegrees) {
  const h = (hDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ ** 3;
  const m3 = m_ ** 3;
  const s3 = s_ ** 3;

  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  ];
}

function toSrgb16(c) {
  const v = clamp(c);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
}

function toHex(parsed, backdrop) {
  const linear = oklchToLinearSrgb(parsed.l, parsed.c, parsed.h).map(clamp);
  const channels = linear.map((c) => Math.round(toSrgb16(c) * 255));
  const hex = channels.map((v) => v.toString(16).padStart(2, "0")).join("");
  if (parsed.alpha >= 1) return `#${hex}`;
  const over = channels.map((c) =>
    Math.round(c * parsed.alpha + backdrop * (1 - parsed.alpha)),
  );
  return `#${over.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function luminance(parsed, backdropLinear) {
  const linear = oklchToLinearSrgb(parsed.l, parsed.c, parsed.h).map(clamp);
  const y = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  if (parsed.alpha >= 1) return y;
  return parsed.alpha * y + (1 - parsed.alpha) * backdropLinear;
}

function ratio(a, b) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

function whiteLinear() {
  return 1;
}

// Accepts "--token" or "--token/10" (alpha in percent).
function resolveRef(vars, ref) {
  const slash = ref.lastIndexOf("/");
  const name = slash > 2 ? ref.slice(0, slash) : ref;
  const alphaPct = slash > 2 ? Number(ref.slice(slash + 1)) : null;
  const parsed = parseOkLch(vars[name]);
  if (!parsed) return null;
  if (alphaPct === null) return parsed;
  return { ...parsed, alpha: alphaPct / 100 };
}

const PAIRS = [
  { fg: "--foreground", bg: "--background", min: TEXT_MIN },
  { fg: "--card-foreground", bg: "--card", min: TEXT_MIN },
  { fg: "--popover-foreground", bg: "--popover", min: TEXT_MIN },
  { fg: "--muted-foreground", bg: "--background", min: TEXT_MIN },
  { fg: "--muted-foreground", bg: "--card", min: TEXT_MIN },
  { fg: "--muted-foreground", bg: "--muted", min: TEXT_MIN },
  { fg: "--secondary-foreground", bg: "--secondary", min: TEXT_MIN },
  { fg: "--accent-foreground", bg: "--accent", min: TEXT_MIN },
  { fg: "--primary-foreground", bg: "--primary", min: TEXT_MIN },
  { fg: "--sidebar-foreground", bg: "--sidebar", min: TEXT_MIN },
  { fg: "--sidebar-accent-foreground", bg: "--sidebar-accent", min: TEXT_MIN },
  { fg: "--destructive-foreground", bg: "--destructive", min: TEXT_MIN },
  // Hover on a destructive surface mixes toward --foreground by 12 percent,
  // which is the same as compositing the fill over --foreground at that rate.
  {
    fg: "--destructive-foreground",
    bg: "--destructive/88",
    bgOver: "--foreground",
    min: TEXT_MIN,
  },
  { fg: "--destructive", bg: "--background", min: TEXT_MIN },
  { fg: "--destructive", bg: "--card", min: TEXT_MIN },
  // Link and accent text can sit on any surface level, so each is checked.
  { fg: "--primary", bg: "--background", min: TEXT_MIN },
  { fg: "--primary", bg: "--card", min: TEXT_MIN },
  { fg: "--primary", bg: "--popover", min: TEXT_MIN },
  { fg: "--primary", bg: "--sidebar", min: TEXT_MIN },
  // Decorative and structural borders. Floor is DECOR_MIN, not UI_MIN.
  { fg: "--border", bg: "--background", min: DECOR_MIN },
  { fg: "--border", bg: "--card", min: DECOR_MIN },
  { fg: "--border", bg: "--sidebar", min: DECOR_MIN },
  // Interactive component boundaries. No decorative allowance here.
  { fg: "--input", bg: "--background", min: UI_MIN },
  { fg: "--input", bg: "--card", min: UI_MIN },
  { fg: "--input", bg: "--popover", min: UI_MIN },
  { fg: "--ring", bg: "--background", min: UI_MIN },
  { fg: "--ring", bg: "--card", min: UI_MIN },
  { fg: "--sidebar-border", bg: "--sidebar", min: UI_MIN },
  { fg: "--sidebar-ring", bg: "--sidebar", min: UI_MIN },
];

const ROLES = {
  "--background": "Page background",
  "--foreground": "Body text",
  "--card": "Card surface",
  "--card-foreground": "Card text",
  "--popover": "Popover surface",
  "--popover-foreground": "Popover text",
  "--primary": "Accent, primary action, link text",
  "--primary-foreground": "Text on accent",
  "--secondary": "Lower emphasis surface",
  "--secondary-foreground": "Text on secondary",
  "--muted": "Subtle surface",
  "--muted-foreground": "Secondary text, placeholder",
  "--accent": "Hover and highlight surface",
  "--accent-foreground": "Text on accent surface",
  "--destructive": "Error emphasis, destructive action fill",
  "--destructive-foreground": "Text on destructive fill",
  "--border":
    "Decorative dividers and card edges (not an interactive boundary)",
  "--input": "Form control boundary (interactive, held to 3 to 1)",
  "--ring": "Focus ring",
  "--sidebar": "Sidebar surface",
  "--sidebar-foreground": "Sidebar text",
  "--sidebar-primary": "Sidebar accent",
  "--sidebar-primary-foreground": "Text on sidebar accent",
  "--sidebar-accent": "Sidebar hover and selected",
  "--sidebar-accent-foreground": "Text on sidebar hover",
  "--sidebar-border": "Sidebar boundary",
  "--sidebar-ring": "Sidebar focus ring",
};

function themeTokens(css) {
  return {
    light: parseVars(parseBlock(css, ":root")),
    dark: parseVars(parseBlock(css, ".dark")),
  };
}

function checkContrast(light, dark) {
  const results = [];
  for (const theme of [
    { name: "light", vars: light },
    { name: "dark", vars: dark },
  ]) {
    const bg = parseOkLch(theme.vars["--background"]);
    const backdrop = luminance(bg, whiteLinear());
    for (const pair of PAIRS) {
      const fg = resolveRef(theme.vars, pair.fg);
      const bgVar = resolveRef(theme.vars, pair.bg);
      if (!fg || !bgVar) {
        results.push({ ...pair, theme: theme.name, ok: false, value: NaN });
        continue;
      }
      const bgBackdrop = luminance(
        resolveRef(theme.vars, pair.bgOver ?? "--background"),
        backdrop,
      );
      const value = ratio(
        luminance(fg, bgBackdrop),
        luminance(bgVar, bgBackdrop),
      );
      results.push({
        ...pair,
        theme: theme.name,
        value,
        ok: value >= pair.min,
      });
    }
  }
  return results;
}

function checkStructure(light, dark) {
  const results = [];
  for (const [name, vars] of [
    ["light", light],
    ["dark", dark],
  ]) {
    // AC-11: the surface ladder must ascend, so a card reads as raised from the
    // page by its own lightness rather than by a border drawn around it.
    const ladder = ["--background", "--sidebar", "--card", "--popover"].map(
      (t) => parseOkLch(vars[t]),
    );
    const ladderOk = ladder.every(
      (p, i) => p && (i === 0 || p.l > ladder[i - 1].l),
    );
    results.push({
      theme: name,
      label: "surface ladder ascends background < sidebar < card < popover",
      ok: ladderOk,
    });

    // AC-12: hover and selection must be legible as such, so the three
    // emphasis surfaces may not collapse onto one value.
    const trio = ["--secondary", "--muted", "--accent"].map((t) => vars[t]);
    const distinctOk =
      new Set(trio).size === trio.length && trio.every(Boolean);
    results.push({
      theme: name,
      label: "secondary, muted, and accent are three distinct values",
      ok: distinctOk,
    });

    // AC-14: warm tinted neutrals in the Ember band, not pure grey at chroma zero.
    const neutrals = [
      "--background",
      "--foreground",
      "--card",
      "--sidebar",
      "--muted",
      "--secondary",
      "--border",
    ];
    const warmOk = neutrals.every((t) => {
      const p = parseOkLch(vars[t]);
      return p && p.c > 0 && p.h >= 80 && p.h <= 115;
    });
    results.push({
      theme: name,
      label: "every neutral carries chroma above zero at hue 80 to 115",
      ok: warmOk,
    });
  }
  return results;
}

function renderTables(css) {
  const { light, dark } = themeTokens(css);
  const themeBlock = parseBlock(css, ".dark");
  void themeBlock;

  const colorNames = Object.keys(ROLES);
  const lines = [];
  lines.push("## Color tokens");
  lines.push("");
  lines.push(
    "Values live in `app/globals.css` under `:root` (light) and `.dark`. Hex columns are derived from the `oklch` values.",
  );
  lines.push("");
  lines.push("| Token | Role | Light | Dark |");
  lines.push("|---|---|---|---|");
  for (const name of colorNames) {
    const l = light[name];
    const d = dark[name];
    const lh = l ? toHex(parseOkLch(l), 1) : "";
    const dh = d ? toHex(parseOkLch(d), 1) : "";
    lines.push(
      `| \`${name}\` | ${ROLES[name]} | \`${l}\` (${lh}) | \`${d}\` (${dh}) |`,
    );
  }
  lines.push("");

  lines.push("## Type scale");
  lines.push("");
  lines.push(
    "Defined in `app/globals.css` under `@theme inline`. These are the only font sizes used in the shell and demo screens.",
  );
  lines.push("");
  lines.push("| Token | Size | Line height |");
  lines.push("|---|---|---|");
  const themeInline = parseVars(parseBlock(css, "@theme inline"));
  for (const size of ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]) {
    const key = `--text-${size}`;
    lines.push(
      `| \`${key}\` | ${themeInline[key]} | ${themeInline[`${key}--line-height`]} |`,
    );
  }
  lines.push("");

  lines.push("## Radius");
  lines.push("");
  lines.push(
    "`--radius` is the base step; the rest are derived from it. Components use `sm` (controls), `md` (compact surfaces), and `lg` (cards, panels).",
  );
  lines.push("");
  lines.push("| Token | Value |");
  lines.push("|---|---|");
  lines.push(`| \`--radius\` | ${light["--radius"]} |`);
  for (const step of ["sm", "md", "lg", "xl"]) {
    lines.push(`| \`--radius-${step}\` | ${themeInline[`--radius-${step}`]} |`);
  }
  lines.push("");

  lines.push("## Spacing and fonts");
  lines.push("");
  lines.push(
    `Spacing base unit: \`${themeInline["--spacing"] ?? "0.25rem"}\`${themeInline["--spacing"] ? "" : " (Tailwind 4 default; the app does not override it)"}. Every gap, pad, and margin is a multiple of it, so gaps land on an 8px rhythm.`,
  );
  lines.push("");
  lines.push(
    `Sans: \`${themeInline["--font-sans"]}\` (Inter, loaded with \`next/font/google\`). Headings h1 to h3: \`${themeInline["--font-heading"]}\` (Newsreader, resolved from \`--font-newsreader\`). Mono: \`${themeInline["--font-mono"]}\` (Geist Mono, code only).`,
  );
  lines.push("");

  return lines.join("\n");
}

function main() {
  const css = readFileSync(cssPath, "utf8");
  const { light, dark } = themeTokens(css);
  const structure = checkStructure(light, dark);
  const check = [...checkContrast(light, dark), ...structure];
  const failures = check.filter((r) => !r.ok);

  const tables = renderTables(css);

  if (process.argv.includes("--check")) {
    for (const r of check) {
      const flag = r.ok ? "ok  " : "FAIL";
      const detail =
        r.label ??
        `${r.fg} on ${r.bg} = ${r.value.toFixed(2)}:1 (min ${r.min})`;
      console.log(`${flag} ${r.theme.padEnd(5)} ${detail}`);
    }
    if (failures.length > 0) {
      console.error(`\n${failures.length} contrast pair(s) below the bar.`);
      process.exit(1);
    }
    if (!existsSync(designPath)) {
      console.error("design.md is missing.");
      process.exit(1);
    }
    const design = readFileSync(designPath, "utf8");
    const start = design.indexOf(START);
    const end = design.indexOf(END);
    if (start === -1 || end === -1 || end < start) {
      console.error(`design.md is missing the ${START} / ${END} markers.`);
      process.exit(1);
    }
    const written = design.slice(start + START.length, end).trim();
    if (written !== tables.trim()) {
      console.error(
        "design.md token tables are out of date. Run `npm run design:tokens`.",
      );
      process.exit(1);
    }
    console.log("\nAll contrast pairs pass and design.md matches globals.css.");
    return;
  }

  if (!existsSync(designPath)) {
    console.error("design.md is missing; create it first.");
    process.exit(1);
  }
  const design = readFileSync(designPath, "utf8");
  const start = design.indexOf(START);
  const end = design.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    console.error(`design.md is missing the ${START} / ${END} markers.`);
    process.exit(1);
  }
  const next = `${design.slice(0, start + START.length)}\n\n${tables}\n${design.slice(end)}`;
  writeFileSync(designPath, next);
  console.log(
    `Wrote token tables into design.md (${check.length} pairs checked).`,
  );
  if (failures.length > 0) {
    for (const r of failures) {
      const detail =
        r.label ??
        `${r.fg} on ${r.bg} = ${r.value.toFixed(2)}:1 (min ${r.min})`;
      console.error(`FAIL ${r.theme} ${detail}`);
    }
    process.exit(1);
  }
}

main();
