import { describe, expect, it } from "vitest";
import { LayoutDashboardIcon } from "lucide-react";
import { NAV_SECTIONS, isNavItemDisabled, type NavItem } from "./nav";

const ALL_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

function makeItem(overrides: Partial<NavItem>): NavItem {
  return {
    label: "Task",
    href: "/tasks",
    icon: LayoutDashboardIcon,
    ...overrides,
  };
}

describe("NAV_SECTIONS", () => {
  // covers: AC-5
  it("marks every navigation item disabled while its section is unbuilt", () => {
    expect(ALL_ITEMS.length).toBeGreaterThan(0);
    for (const item of ALL_ITEMS) {
      expect(item.disabled).toBe(true);
    }
  });

  it("gives each item a label, an in app href, and an icon", () => {
    for (const item of ALL_ITEMS) {
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.icon).toBeTruthy();
    }
  });

  it("keeps hrefs unique across all sections", () => {
    const hrefs = ALL_ITEMS.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("names every section so the sidebar can group its items", () => {
    expect(NAV_SECTIONS.length).toBeGreaterThan(0);
    for (const section of NAV_SECTIONS) {
      expect(section.label.trim().length).toBeGreaterThan(0);
      expect(section.items.length).toBeGreaterThan(0);
    }
  });
});

describe("isNavItemDisabled", () => {
  it("returns true when the item carries the disabled flag", () => {
    expect(isNavItemDisabled(makeItem({ disabled: true }))).toBe(true);
  });

  it("returns false when the flag is absent or explicitly off", () => {
    expect(isNavItemDisabled(makeItem({}))).toBe(false);
    expect(isNavItemDisabled(makeItem({ disabled: false }))).toBe(false);
  });
});
