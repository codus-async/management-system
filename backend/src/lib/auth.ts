import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { DEFAULT_USER_ROLE } from "./constants.js";
import { prisma } from "./prisma.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // let unexpected errors (db down, bugs) reach the express error handler instead of
  // becoming an empty 500; better-auth's own API errors still return their JSON body
  onAPIError: {
    throw: true,
  },
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: DEFAULT_USER_ROLE,
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
