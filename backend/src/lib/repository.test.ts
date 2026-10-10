import { beforeEach, describe, expect, it, vi } from "vitest";
import { InvalidTokenError } from "./constants.js";

const mocks = vi.hoisted(() => ({
  activityCreate: vi.fn(),
}));

vi.mock("./prisma.js", () => ({
  prisma: { activity: { create: mocks.activityCreate } },
}));

import { createRow, updateRow } from "./repository.js";

const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

beforeEach(() => {
  mocks.activityCreate.mockReset().mockResolvedValue({});
});

describe("lib/repository createRow", () => {
  it("assigns a UUID v4 primary key and never lets the caller supply one", async () => {
    const create = vi.fn(async (data: { id: string; title: string }) => data);

    const row = await createRow({
      entityType: "meeting",
      actorId: "user-1",
      data: { title: "Board sync" },
      create,
    });

    expect(row.id).toMatch(uuidV4);
    expect(create).toHaveBeenCalledWith({
      id: expect.stringMatching(uuidV4),
      title: "Board sync",
    });
  });

  it("appends a created Activity row with the actor and the new row as payload", async () => {
    const create = vi.fn(async (data: { id: string; title: string }) => data);

    const row = await createRow({
      entityType: "meeting",
      actorId: "user-1",
      data: { title: "Board sync" },
      create,
    });

    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: {
        id: expect.stringMatching(uuidV4),
        entityType: "meeting",
        entityId: row.id,
        action: "created",
        actorId: "user-1",
        payload: { after: row },
      },
    });
  });

  it("rejects a status outside the constants module before anything is written", async () => {
    const create = vi.fn(async (data: { id: string }) => data);

    await expect(
      createRow({
        entityType: "task",
        actorId: "user-1",
        data: { title: "Send deck", status: "archived" },
        create,
      }),
    ).rejects.toThrow(InvalidTokenError);
    expect(create).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("rejects a priority outside the constants module", async () => {
    const create = vi.fn(async (data: { id: string }) => data);

    await expect(
      createRow({
        entityType: "task",
        actorId: "user-1",
        data: { title: "Send deck", priority: "asap" },
        create,
      }),
    ).rejects.toThrow(InvalidTokenError);
  });
});

describe("lib/repository updateRow", () => {
  it("logs only the keys that actually changed", async () => {
    const update = vi.fn(async (data: { status: string }) => data);

    await updateRow({
      entityType: "task",
      entityId: "task-1",
      actorId: "user-1",
      current: { status: "open", priority: "medium", title: "Send deck" },
      data: { status: "done" },
      update,
    });

    expect(mocks.activityCreate).toHaveBeenCalledWith({
      data: {
        id: expect.stringMatching(uuidV4),
        entityType: "task",
        entityId: "task-1",
        action: "updated",
        actorId: "user-1",
        payload: { before: { status: "open" }, after: { status: "done" } },
      },
    });
  });

  it("writes no Activity row when nothing changed", async () => {
    const update = vi.fn(async (data: { status: string }) => data);

    await updateRow({
      entityType: "task",
      entityId: "task-1",
      actorId: "user-1",
      current: { status: "open" },
      data: { status: "open" },
      update,
    });

    expect(update).toHaveBeenCalledWith({ status: "open" });
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid status before the update runs", async () => {
    const update = vi.fn(async (data: { status: string }) => data);

    await expect(
      updateRow({
        entityType: "task",
        entityId: "task-1",
        actorId: "user-1",
        current: { status: "open" },
        data: { status: "archived" },
        update,
      }),
    ).rejects.toThrow(InvalidTokenError);
    expect(update).not.toHaveBeenCalled();
  });
});
