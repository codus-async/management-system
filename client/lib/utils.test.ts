import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins multiple class names with a space", () => {
    expect(cn("p-2", "mt-1")).toBe("p-2 mt-1");
  });

  it("drops falsy values so conditional classes stay safe", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });

  it("keeps only the object keys whose value is true", () => {
    expect(cn({ visible: true, hidden: false })).toBe("visible");
  });

  it("lets the last value win when two utilities conflict", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
