import { execFileSync } from "node:child_process";
import dns from "node:dns";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it, vi } from "vitest";
import pg from "pg";

dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamily(false);

vi.hoisted(() => {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile();
    } catch {
      /* no local .env to load */
    }
  }
  process.env.NODE_ENV ??= "test";
  process.env.PORT ??= "4000";
  process.env.LOG_LEVEL ??= "silent";
  process.env.DATABASE_URL ??= "postgresql://user:password@localhost:5432/test";
  process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-1234";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
  process.env.TIMEZONE ??= "UTC";
});

const backendRoot = fileURLToPath(new URL("../../", import.meta.url));
const baseUnpooled = process.env["DATABASE_URL_UNPOOLED"];
const scratchName = `data_model_test_${process.pid}`;
const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const connectionError =
  /ETIMEDOUT|ENETUNREACH|ECONNREFUSED|ECONNRESET|ETIMEOUT|getaddrinfo|socket hang up/i;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function connect(connectionString: string) {
  let last: unknown;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const client = new pg.Client({
      connectionString,
      connectionTimeoutMillis: 12_000,
    });
    try {
      await client.connect();
      return client;
    } catch (error) {
      last = error;
      await client.end().catch(() => {});
      await sleep(1200);
    }
  }
  throw last;
}

function scratchUrls() {
  const url = new URL(baseUnpooled as string);
  url.pathname = `/${scratchName}`;
  const value = url.toString();
  return { databaseUrl: value, unpooledUrl: value };
}

function run(command: string, args: string[], env: NodeJS.ProcessEnv) {
  execFileSync(command, args, {
    cwd: backendRoot,
    env,
    stdio: "pipe",
    timeout: 90_000,
  });
}

async function runWithRetry(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  attempts = 4,
) {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      run(command, args, env);
      return;
    } catch (error) {
      last = error;
      await sleep(1000);
    }
  }
  throw last;
}

async function dropScratch(admin: pg.Client) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${scratchName}"`);
      return;
    } catch {
      await sleep(600);
    }
  }
  await admin.query(`DROP DATABASE IF EXISTS "${scratchName}"`);
}

type RepositoryModule = typeof import("./repository.js");
type PrismaModule = typeof import("./prisma.js");

let admin: pg.Client | undefined;
let repository: RepositoryModule | undefined;
let client: PrismaModule["prisma"] | undefined;
let skipReason: string | undefined;

if (!baseUnpooled) {
  skipReason =
    "DATABASE_URL_UNPOOLED is not set, so there is no database to use";
} else {
  try {
    const { databaseUrl, unpooledUrl } = scratchUrls();
    admin = await connect(baseUnpooled);
    await dropScratch(admin);
    await admin.query(`CREATE DATABASE "${scratchName}"`);

    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_URL_UNPOOLED: unpooledUrl,
      SEED_PA_EMAIL: "pa@example.com",
      SEED_CEO_EMAIL: "ceo@example.com",
      SEED_PASSWORD: "local-dev-password",
      NODE_OPTIONS: "--dns-result-order=ipv4first",
    };
    await runWithRetry("npx", ["prisma", "migrate", "deploy"], childEnv);
    await runWithRetry("npx", ["tsx", "prisma/seed.ts"], childEnv);
    await runWithRetry("npx", ["tsx", "prisma/seed.ts"], childEnv);

    vi.resetModules();
    process.env.DATABASE_URL = databaseUrl;
    repository = await import("./repository.js");
    ({ prisma: client } = await import("./prisma.js"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!connectionError.test(`${message} ${String(error)}`)) {
      throw error;
    }
    skipReason = `database unreachable, skipped: ${message.slice(0, 160)}`;
    if (admin) {
      await dropScratch(admin).catch(() => {});
      await admin.end().catch(() => {});
    }
  }
}

if (skipReason) {
  console.warn(`[schema.test] ${skipReason}`);
}

describe.runIf(!skipReason)("data model on a fresh database", () => {
  afterAll(async () => {
    await client?.$disconnect().catch(() => {});
    if (admin) {
      await dropScratch(admin).catch(() => {});
      await admin.end().catch(() => {});
    }
  }, 120_000);

  it(
    "creates every domain table the data model names",
    { timeout: 60_000 },
    async () => {
      const result = await admin!.query(
        "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE'",
      );
      const tables = result.rows.map((row) => row.table_name);
      for (const table of [
        "Meeting",
        "MeetingAttendee",
        "Contact",
        "Task",
        "FollowUp",
        "PendingDecision",
        "Attachment",
        "Notification",
        "Activity",
      ]) {
        expect(tables).toContain(table);
      }
    },
  );

  it(
    "adds a PA defaulted role column that only accepts PA or CEO",
    { timeout: 60_000 },
    async () => {
      const column = await admin!.query(
        "select is_nullable, column_default from information_schema.columns where table_name = 'user' and column_name = 'role'",
      );
      expect(column.rows[0]?.is_nullable).toBe("NO");
      expect(String(column.rows[0]?.column_default)).toContain("PA");

      const check = await admin!.query(
        "select pg_get_constraintdef(oid) as def from pg_constraint where conrelid = '\"user\"'::regclass and contype = 'c'",
      );
      expect(check.rows).toHaveLength(1);
      expect(check.rows[0]?.def).toContain("PA");
      expect(check.rows[0]?.def).toContain("CEO");
    },
  );

  it(
    "stores naive wall clock times and gives no id a database default",
    { timeout: 60_000 },
    async () => {
      const timestamps = await admin!.query(
        "select data_type from information_schema.columns where table_name = 'Meeting' and column_name in ('startsAt', 'endsAt')",
      );
      expect(timestamps.rows).toHaveLength(2);
      for (const row of timestamps.rows) {
        expect(row.data_type).toBe("timestamp without time zone");
      }

      const defaults = await admin!.query(
        "select table_name from information_schema.columns where table_schema = 'public' and column_name = 'id' and column_default is null and table_name in ('Meeting', 'Contact', 'Task', 'FollowUp', 'PendingDecision', 'Attachment', 'Notification', 'Activity')",
      );
      expect(defaults.rows).toHaveLength(8);

      const attendeeKey = await admin!.query(
        "select column_name from information_schema.columns where table_name = 'MeetingAttendee' and column_name = 'id'",
      );
      expect(attendeeKey.rows).toHaveLength(0);
    },
  );

  it(
    "keeps the indexes the dashboard and list queries need",
    { timeout: 60_000 },
    async () => {
      const indexes = await admin!.query(
        "select tablename, indexname from pg_indexes where schemaname = 'public' and tablename in ('Meeting', 'Task', 'FollowUp', 'PendingDecision', 'Contact', 'Notification', 'Attachment', 'Activity')",
      );
      const found = new Set(
        indexes.rows.map((row) => `${row.tablename}.${row.indexname}`),
      );

      for (const index of [
        "Meeting.Meeting_startsAt_idx",
        "Task.Task_status_dueAt_idx",
        "FollowUp.FollowUp_dueAt_idx",
        "PendingDecision.PendingDecision_status_dueAt_idx",
        "Contact.Contact_name_idx",
        "Notification.Notification_userId_readAt_idx",
        "Attachment.Attachment_parentType_parentId_idx",
        "Activity.Activity_entityType_entityId_idx",
      ]) {
        expect(found).toContain(index);
      }
    },
  );

  it(
    "freezes the foreign key delete rules the spec decided",
    { timeout: 60_000 },
    async () => {
      const rules = await admin!.query(
        "select conname, confdeltype from pg_constraint where contype = 'f'",
      );
      const byName = new Map(
        rules.rows.map((row) => [
          row.conname as string,
          row.confdeltype as string,
        ]),
      );

      expect(byName.get("Meeting_createdById_fkey")).toBe("r");
      expect(byName.get("Task_assigneeId_fkey")).toBe("r");
      expect(byName.get("Activity_actorId_fkey")).toBe("r");
      expect(byName.get("MeetingAttendee_meetingId_fkey")).toBe("c");
      expect(byName.get("MeetingAttendee_contactId_fkey")).toBe("c");
      expect(byName.get("Task_relatedMeetingId_fkey")).toBe("n");
      expect(byName.get("PendingDecision_decidedById_fkey")).toBe("n");
    },
  );

  it(
    "gives MeetingAttendee a composite key and no surrogate id",
    { timeout: 60_000 },
    async () => {
      const key = await admin!.query(
        "select pg_get_constraintdef(oid) as def from pg_constraint where conrelid = '\"MeetingAttendee\"'::regclass and contype = 'p'",
      );
      expect(key.rows[0]?.def).toBe('PRIMARY KEY ("meetingId", "contactId")');
    },
  );

  it(
    "leaves exactly one user per role after seeding the same database twice",
    { timeout: 60_000 },
    async () => {
      const users = await client!.user.findMany({ orderBy: { role: "asc" } });

      expect(users.map((user) => user.role)).toEqual(["CEO", "PA"]);
      expect(users.map((user) => user.email).sort()).toEqual([
        "ceo@example.com",
        "pa@example.com",
      ]);
    },
  );

  it(
    "inserts domain rows with a UUID v4 from the repository and logs the activity",
    { timeout: 60_000 },
    async () => {
      const pa = await client!.user.findFirstOrThrow({ where: { role: "PA" } });

      const meeting = await repository!.createRow({
        entityType: "meeting",
        actorId: pa.id,
        data: {
          title: "Board sync",
          startsAt: new Date("2026-10-12T09:00:00.000Z"),
          endsAt: new Date("2026-10-12T10:00:00.000Z"),
          status: "scheduled",
          createdById: pa.id,
        },
        create: (data) => client!.meeting.create({ data }),
      });

      expect(meeting.id).toMatch(uuidV4);

      const activity = await client!.activity.findFirstOrThrow({
        where: { entityId: meeting.id },
      });
      expect(activity.entityType).toBe("meeting");
      expect(activity.action).toBe("created");
      expect(activity.actorId).toBe(pa.id);
    },
  );

  it(
    "round trips every field of a meeting with two attendees",
    { timeout: 60_000 },
    async () => {
      const pa = await client!.user.findFirstOrThrow({ where: { role: "PA" } });
      const ada = await repository!.createRow({
        entityType: "contact",
        actorId: pa.id,
        data: { name: "Ada Lovelace", createdById: pa.id },
        create: (data) => client!.contact.create({ data }),
      });
      const grace = await repository!.createRow({
        entityType: "contact",
        actorId: pa.id,
        data: { name: "Grace Hopper", createdById: pa.id },
        create: (data) => client!.contact.create({ data }),
      });
      const meeting = await repository!.createRow({
        entityType: "meeting",
        actorId: pa.id,
        data: {
          title: "Board sync",
          startsAt: new Date("2026-10-12T09:00:00.000Z"),
          endsAt: new Date("2026-10-12T10:00:00.000Z"),
          status: "scheduled",
          createdById: pa.id,
        },
        create: (data) => client!.meeting.create({ data }),
      });

      await client!.meetingAttendee.createMany({
        data: [
          { meetingId: meeting.id, contactId: ada.id, roleLabel: "required" },
          { meetingId: meeting.id, contactId: grace.id, roleLabel: "optional" },
        ],
      });

      const loaded = await client!.meeting.findUniqueOrThrow({
        where: { id: meeting.id },
        include: {
          attendees: true,
          createdBy: { select: { id: true } },
        },
      });

      expect(loaded.title).toBe("Board sync");
      expect(loaded.location).toBeNull();
      expect(loaded.notes).toBeNull();
      expect(loaded.deletedAt).toBeNull();
      expect(loaded.startsAt.toISOString()).toBe("2026-10-12T09:00:00.000Z");
      expect(loaded.createdBy.id).toBe(pa.id);
      expect(loaded.attendees).toHaveLength(2);
      expect(
        new Map(
          loaded.attendees.map((attendee) => [
            attendee.contactId,
            attendee.roleLabel,
          ]),
        ),
      ).toEqual(
        new Map([
          [ada.id, "required"],
          [grace.id, "optional"],
        ]),
      );
    },
  );

  it(
    "refuses a status that is not in the constants module before the write",
    { timeout: 60_000 },
    async () => {
      const pa = await client!.user.findFirstOrThrow({ where: { role: "PA" } });

      await expect(
        repository!.createRow({
          entityType: "task",
          actorId: pa.id,
          data: {
            title: "Send deck",
            status: "archived",
            priority: "medium",
            assigneeId: pa.id,
            createdById: pa.id,
          },
          create: (data) => client!.task.create({ data }),
        }),
      ).rejects.toThrow(/status must be one of/);

      const archived = await client!.task.count({
        where: { title: "Send deck" },
      });
      expect(archived).toBe(0);
    },
  );
});
