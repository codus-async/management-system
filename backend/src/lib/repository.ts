import { randomUUID } from "node:crypto";
import type { Prisma } from "../generated/prisma/client.js";
import {
  ACTIVITY_ACTIONS,
  validateEntityTokens,
  type ActivityAction,
  type ActivityEntityType,
} from "./constants.js";
import { prisma } from "./prisma.js";

type CreateRowArgs<TData extends object, TResult extends { id: string }> = {
  entityType: ActivityEntityType;
  actorId: string;
  data: TData;
  create: (data: TData & { id: string }) => Promise<TResult>;
};

type UpdateRowArgs<TData extends object, TResult> = {
  entityType: ActivityEntityType;
  entityId: string;
  actorId: string;
  current: Record<string, unknown>;
  data: TData;
  update: (data: TData) => Promise<TResult>;
};

type ActivityInput = {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  actorId: string | null;
  payload: Prisma.InputJsonValue;
};

function audit(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function appendActivity(input: ActivityInput): Promise<void> {
  await prisma.activity.create({
    data: {
      id: randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      payload: input.payload,
    },
  });
}

export async function createRow<
  TData extends object,
  TResult extends { id: string },
>(args: CreateRowArgs<TData, TResult>): Promise<TResult> {
  validateEntityTokens(args.entityType, args.data as Record<string, unknown>);
  const row = await args.create({ ...args.data, id: randomUUID() });
  await appendActivity({
    entityType: args.entityType,
    entityId: row.id,
    action: ACTIVITY_ACTIONS.created,
    actorId: args.actorId,
    payload: { after: audit(row) },
  });
  return row;
}

export async function updateRow<TData extends object, TResult>(
  args: UpdateRowArgs<TData, TResult>,
): Promise<TResult> {
  validateEntityTokens(args.entityType, args.data as Record<string, unknown>);
  const patch = args.data as Record<string, unknown>;
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    if (args.current[key] !== patch[key]) {
      before[key] = args.current[key];
      after[key] = patch[key];
    }
  }
  const row = await args.update(args.data);
  if (Object.keys(after).length > 0) {
    await appendActivity({
      entityType: args.entityType,
      entityId: args.entityId,
      action: ACTIVITY_ACTIONS.updated,
      actorId: args.actorId,
      payload: { before: audit(before), after: audit(after) },
    });
  }
  return row;
}
