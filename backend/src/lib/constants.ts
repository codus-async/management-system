export const USER_ROLES = ["PA", "CEO"] as const;
export type UserRole = (typeof USER_ROLES)[number];
export const DEFAULT_USER_ROLE: UserRole = "PA";

export const MEETING_STATUSES = ["scheduled", "cancelled"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];
export const DEFAULT_MEETING_STATUS: MeetingStatus = "scheduled";

export const TASK_STATUSES = [
  "open",
  "in_progress",
  "done",
  "cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const DEFAULT_TASK_STATUS: TaskStatus = "open";

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const DEFAULT_TASK_PRIORITY: TaskPriority = "medium";

export const FOLLOW_UP_STATUSES = ["pending", "done", "dismissed"] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export const DEFAULT_FOLLOW_UP_STATUS: FollowUpStatus = "pending";

export const PENDING_DECISION_STATUSES = [
  "pending",
  "approved",
  "declined",
] as const;
export type PendingDecisionStatus = (typeof PENDING_DECISION_STATUSES)[number];
export const DEFAULT_PENDING_DECISION_STATUS: PendingDecisionStatus = "pending";

export const ACTIVITY_ACTIONS = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  restored: "restored",
} as const;
export type ActivityAction =
  (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export const ACTIVITY_ENTITY_TYPES = [
  "meeting",
  "contact",
  "task",
  "follow_up",
  "pending_decision",
  "attachment",
  "notification",
  "user",
] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export const ATTACHMENT_PARENT_TYPES = [
  "meeting",
  "task",
  "contact",
  "follow_up",
] as const;
export type AttachmentParentType = (typeof ATTACHMENT_PARENT_TYPES)[number];

export const ATTENDEE_ROLE_LABELS = ["required", "optional"] as const;
export type AttendeeRoleLabel = (typeof ATTENDEE_ROLE_LABELS)[number];

export const ENTITY_TOKENS: Partial<
  Record<ActivityEntityType, Record<string, readonly string[]>>
> = {
  meeting: { status: MEETING_STATUSES },
  task: { status: TASK_STATUSES, priority: TASK_PRIORITIES },
  follow_up: { status: FOLLOW_UP_STATUSES },
  pending_decision: { status: PENDING_DECISION_STATUSES },
  attachment: { parentType: ATTACHMENT_PARENT_TYPES },
};

export class InvalidTokenError extends Error {
  constructor(field: string, allowed: readonly string[], received: unknown) {
    super(
      `${field} must be one of ${allowed.join(", ")}; received ${JSON.stringify(received)}`,
    );
    this.name = "InvalidTokenError";
  }
}

export function token<const T extends string>(
  allowed: readonly T[],
  value: unknown,
  field: string,
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new InvalidTokenError(field, allowed, value);
  }
  return value as T;
}

export function validateEntityTokens(
  entityType: ActivityEntityType,
  data: Record<string, unknown>,
): void {
  const fields = ENTITY_TOKENS[entityType];
  if (!fields) return;
  for (const [field, allowed] of Object.entries(fields)) {
    if (data[field] !== undefined) {
      token(allowed, data[field], field);
    }
  }
}
