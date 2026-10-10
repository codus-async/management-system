import { describe, expect, it } from "vitest";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_ENTITY_TYPES,
  DEFAULT_FOLLOW_UP_STATUS,
  DEFAULT_MEETING_STATUS,
  DEFAULT_PENDING_DECISION_STATUS,
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  DEFAULT_USER_ROLE,
  FOLLOW_UP_STATUSES,
  InvalidTokenError,
  MEETING_STATUSES,
  PENDING_DECISION_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  USER_ROLES,
  token,
  validateEntityTokens,
} from "./constants.js";

describe("lib/constants", () => {
  it("keeps every default inside its own closed set", () => {
    expect(USER_ROLES).toContain(DEFAULT_USER_ROLE);
    expect(MEETING_STATUSES).toContain(DEFAULT_MEETING_STATUS);
    expect(TASK_STATUSES).toContain(DEFAULT_TASK_STATUS);
    expect(TASK_PRIORITIES).toContain(DEFAULT_TASK_PRIORITY);
    expect(FOLLOW_UP_STATUSES).toContain(DEFAULT_FOLLOW_UP_STATUS);
    expect(PENDING_DECISION_STATUSES).toContain(
      DEFAULT_PENDING_DECISION_STATUS,
    );
  });

  it("returns the value when it is inside the set", () => {
    expect(token(TASK_STATUSES, "in_progress", "status")).toBe("in_progress");
  });

  it("names the field and the allowed values when a token is rejected", () => {
    expect(() => token(TASK_STATUSES, "archived", "status")).toThrow(
      InvalidTokenError,
    );
    expect(() => token(TASK_STATUSES, "archived", "status")).toThrow(
      "status must be one of open, in_progress, done, cancelled",
    );
  });

  it("rejects a value that is not a string at all", () => {
    expect(() => token(TASK_STATUSES, 7, "status")).toThrow(InvalidTokenError);
  });

  it("validates the closed set columns on a task payload", () => {
    expect(() =>
      validateEntityTokens("task", { status: "open", priority: "urgent" }),
    ).not.toThrow();
    expect(() => validateEntityTokens("task", { status: "archived" })).toThrow(
      InvalidTokenError,
    );
    expect(() => validateEntityTokens("task", { priority: "asap" })).toThrow(
      InvalidTokenError,
    );
  });

  it("leaves fields that are not closed sets alone", () => {
    expect(() =>
      validateEntityTokens("contact", { name: "Ada", company: "Analytical" }),
    ).not.toThrow();
  });

  it("carries the tokens the data model spec names", () => {
    expect(ACTIVITY_ENTITY_TYPES).toEqual([
      "meeting",
      "contact",
      "task",
      "follow_up",
      "pending_decision",
      "attachment",
      "notification",
      "user",
    ]);
    expect(Object.values(ACTIVITY_ACTIONS)).toEqual([
      "created",
      "updated",
      "deleted",
      "restored",
    ]);
  });
});
