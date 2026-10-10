import { auth } from "../src/lib/auth.js";
import { prisma } from "../src/lib/prisma.js";

const paEmail = process.env["SEED_PA_EMAIL"] ?? "pa@example.com";
const ceoEmail = process.env["SEED_CEO_EMAIL"] ?? "ceo@example.com";
const password = process.env["SEED_PASSWORD"] ?? "local-dev-password";

const people = [
  { email: paEmail, name: "Personal Assistant" },
  { email: ceoEmail, name: "Chief Executive" },
];

async function seed() {
  for (const person of people) {
    const existing = await prisma.user.findUnique({
      where: { email: person.email },
    });
    if (existing) {
      console.log(`exists  ${person.email}`);
      continue;
    }
    await auth.api.signUpEmail({
      body: { email: person.email, name: person.name, password },
    });
    console.log(`created ${person.email}`);
  }

  console.log(`\nSign in as ${paEmail} or ${ceoEmail}`);
  console.log(`Password (SEED_PASSWORD): ${password}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
