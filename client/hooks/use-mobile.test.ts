// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

type ChangeCallback = () => void;

const originalMatchMedia = window.matchMedia;
let changeCallback: ChangeCallback | null = null;

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  changeCallback = null;
  setWidth(1024);
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: window.innerWidth < 768,
    media: query,
    addEventListener: (_event: string, callback: ChangeCallback) => {
      changeCallback = callback;
    },
    removeEventListener: () => {
      changeCallback = null;
    },
  }));
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  vi.restoreAllMocks();
});

const WIDTH_CASES: Array<[number, boolean]> = [
  [767, true],
  [768, false],
  [375, true],
  [1024, false],
];

describe("useIsMobile", () => {
  // covers: AC-5, the drawer side of the shell reads this hook
  it.each(WIDTH_CASES)("reads width %i as mobile=%s", (width, expected) => {
    setWidth(width);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(expected);
  });

  it("reflects a viewport change after the media query fires", () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(375);
      changeCallback?.();
    });

    expect(result.current).toBe(true);
  });

  it("removes its media query listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(changeCallback).not.toBeNull();
    unmount();
    expect(changeCallback).toBeNull();
  });

  it("renders false during server rendering so the shell can prerender", () => {
    function Probe() {
      return String(useIsMobile());
    }
    expect(renderToString(React.createElement(Probe))).toBe("false");
  });
});
