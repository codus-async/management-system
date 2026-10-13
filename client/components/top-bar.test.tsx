// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "./theme-provider";
import { SidebarProvider } from "./ui/sidebar";
import { TopBar } from "./top-bar";

function renderTopBar() {
  return render(
    <ThemeProvider>
      <SidebarProvider>
        <TopBar />
      </SidebarProvider>
    </ThemeProvider>,
  );
}

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});

describe("TopBar", () => {
  // covers: AC-5, the left and right ends of the bar
  it("holds the sidebar trigger, the search slot, the bell, and the user menu", () => {
    const { container } = renderTopBar();
    const bar = container.querySelector("header");
    expect(bar).not.toBeNull();

    expect(bar?.querySelector("[data-slot='sidebar-trigger']")).not.toBeNull();
    expect(screen.getByTitle("Search is not available yet")).toBeTruthy();
    expect(
      screen.getByTitle("Notifications arrive with reminders"),
    ).toBeTruthy();
    expect(screen.getByText("Not signed in")).toBeTruthy();
  });

  it("carries no account button and no brand lockup in the bar", () => {
    const { container } = renderTopBar();
    const bar = container.querySelector("header");

    expect(bar?.textContent).not.toContain("Account");
    expect(bar?.textContent).not.toContain("CEO PA");
    expect(bar?.querySelector("[data-slot='toggle-group']")).toBeNull();
  });

  it("keeps Profile and Logout disabled and carries the Appearance control", async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByText("Not signed in"));

    const menu = await screen.findByRole("menu");
    const profile = within(menu).getByRole("menuitem", { name: "Profile" });
    const logout = within(menu).getByRole("menuitem", { name: "Logout" });

    expect(profile.getAttribute("data-disabled")).not.toBeNull();
    expect(logout.getAttribute("data-disabled")).not.toBeNull();
    expect(within(menu).getByText("Appearance")).toBeTruthy();
    expect(within(menu).getAllByRole("button", { name: /theme/ })).toHaveLength(
      3,
    );
  });

  it("applies the theme picked from the control inside the menu", async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByText("Not signed in"));
    const menu = await screen.findByRole("menu");
    await user.click(within(menu).getByRole("button", { name: "Dark theme" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  // covers: AC-5, the left to right order of the bar
  it("lays the bar out as trigger, search, bell, then user menu", () => {
    const { container } = renderTopBar();
    const bar = container.querySelector("header");
    expect(bar).not.toBeNull();

    const [trigger, search, rest] = [...(bar?.children ?? [])];
    expect(
      within(trigger as HTMLElement).getByText("Toggle Sidebar"),
    ).toBeTruthy();
    expect(search.getAttribute("title")).toBe("Search is not available yet");
    expect(
      within(rest as HTMLElement).getByTitle(
        "Notifications arrive with reminders",
      ),
    ).toBeTruthy();
    expect(within(rest as HTMLElement).getByText("Not signed in")).toBeTruthy();
  });

  // covers: AC-5, the placeholders stay inert until features 12 and 6 build them
  it("keeps the search and bell placeholders out of the tab order and the menu", async () => {
    const user = userEvent.setup();
    renderTopBar();

    const search = screen.getByTitle("Search is not available yet");
    const bell = screen.getByTitle("Notifications arrive with reminders");

    for (const placeholder of [search, bell]) {
      expect(placeholder.getAttribute("aria-hidden")).toBe("true");
      expect(placeholder.hasAttribute("tabindex")).toBe(false);
    }

    document.body.focus();
    await user.click(search);
    await user.click(bell);

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });

  // covers: AC-4 and AC-5, the menu opens from the keyboard and hands focus back
  it("opens the menu with Enter and closes it with Escape, returning focus to the trigger", async () => {
    const user = userEvent.setup();
    renderTopBar();

    const trigger = screen.getByRole("button", { name: "Not signed in" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menu")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  // covers: AC-4, both icon led controls expose a name to a screen reader
  it("gives the sidebar trigger and the menu trigger accessible names", () => {
    renderTopBar();

    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Not signed in" })).toBeTruthy();
  });

  // covers: AC-6, the system leg of the three way toggle
  it("marks system as the picked theme and leaves a light system alone", async () => {
    const user = userEvent.setup();
    renderTopBar();

    await user.click(screen.getByText("Not signed in"));
    const menu = await screen.findByRole("menu");
    const system = within(menu).getByRole("button", { name: "System theme" });
    await user.click(system);

    expect(system.getAttribute("aria-pressed")).toBe("true");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
