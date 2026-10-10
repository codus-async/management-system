// Query conventions (spec 0002): default reads filter deletedAt IS NULL, relation reads filter soft deleted parents, closed set columns validate against ./constants.js, ids come from ./repository.js.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "../config/env.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
